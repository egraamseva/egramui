/**
 * usePresignedUrlRefresh Hook
 * Automatically refreshes presigned URLs when they expire
 * Proactively refreshes URLs before expiration and reactively on errors
 */

import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePresignedUrlRefreshOptions {
  fileKey?: string | null;
  initialPresignedUrl?: string | null;
  onError?: (error: Error) => void;
  /** Refresh URL this many milliseconds before expiration (default: 1 hour) */
  refreshBeforeExpirationMs?: number;
  /** Optional: Entity type for database update (post, gallery, album, newsletter) */
  entityType?: string | null;
  /** Optional: Entity ID for database update */
  entityId?: string | number | null;
}

interface PresignedUrlResponse {
  fileKey: string;
  presignedUrl: string;
  expiresIn: number;
}

/**
 * Parse expiration time from presigned URL
 * AWS S3 presigned URLs contain X-Amz-Expires and X-Amz-Date parameters
 * @param presignedUrl The presigned URL
 * @returns Expiration timestamp in milliseconds, or null if cannot parse
 */
function parseExpirationTime(presignedUrl: string): number | null {
  try {
    const url = new URL(presignedUrl);
    const params = url.searchParams;
    
    // Try to get X-Amz-Expires (duration in seconds)
    const expiresIn = params.get('X-Amz-Expires');
    // Try to get X-Amz-Date (ISO 8601 format: YYYYMMDDTHHMMSSZ)
    const amzDate = params.get('X-Amz-Date');
    
    if (expiresIn && amzDate) {
      // Parse X-Amz-Date: YYYYMMDDTHHMMSSZ
      const year = parseInt(amzDate.substring(0, 4));
      const month = parseInt(amzDate.substring(4, 6)) - 1; // Month is 0-indexed
      const day = parseInt(amzDate.substring(6, 8));
      const hour = parseInt(amzDate.substring(9, 11));
      const minute = parseInt(amzDate.substring(11, 13));
      const second = parseInt(amzDate.substring(13, 15));
      
      const startTime = new Date(Date.UTC(year, month, day, hour, minute, second));
      const expiresInSeconds = parseInt(expiresIn, 10);
      const expirationTime = startTime.getTime() + (expiresInSeconds * 1000);
      
      return expirationTime;
    }
    
    // Fallback: if we can't parse, assume 7 days from now (matching backend default)
    // This is a safe fallback that ensures we refresh proactively
    console.warn('Could not parse expiration from presigned URL, assuming 7 days:', presignedUrl);
    return Date.now() + (7 * 24 * 60 * 60 * 1000);
  } catch (e) {
    console.warn('Error parsing expiration time from URL:', presignedUrl, e);
    // Fallback: assume 7 days from now (matching backend default)
    return Date.now() + (7 * 24 * 60 * 60 * 1000);
  }
}

/**
 * Hook to manage presigned URL refresh
 * 
 * @param fileKey - The S3 file key (e.g., "images/timestamp-uuid.ext") or full presigned URL
 * @param initialPresignedUrl - Initial presigned URL (optional, will be extracted from fileKey if it's a URL)
 * @param onError - Error callback
 * @param refreshBeforeExpirationMs - Refresh URL this many milliseconds before expiration (default: 1 hour)
 * @returns Object with current presigned URL and refresh function
 */
export function usePresignedUrlRefresh({
  fileKey,
  initialPresignedUrl,
  onError,
  refreshBeforeExpirationMs = 60 * 60 * 1000, // Default: 1 hour before expiration
  entityType,
  entityId,
}: UsePresignedUrlRefreshOptions) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(initialPresignedUrl || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const refreshTimerRef = useRef<NodeJS.Timeout | null>(null);
  const refreshAttemptsRef = useRef<number>(0);
  const lastRefreshTimeRef = useRef<number>(0);
  const isRefreshingRef = useRef<boolean>(false);
  const MAX_RETRY_ATTEMPTS = 3;
  const MIN_REFRESH_INTERVAL_MS = 2000; // Minimum 2 seconds between refresh attempts

  const currentFileKeyRef = useRef<string | null>(null);

  // Extract file key from URL if needed
  const extractFileKey = useCallback((urlOrKey: string): string | null => {
    if (!urlOrKey) return null;
    
    // If it's not a URL (doesn't start with http:// or https://), assume it's already a file key
    if (!urlOrKey.startsWith('http://') && !urlOrKey.startsWith('https://')) {
      return urlOrKey;
    }

    try {
      let fileKey: string | null = null;

      // Handle Backblaze B2 file URLs: https://f001.backblazeb2.com/file/bucket-name/images/...
      if (urlOrKey.includes('/file/')) {
        const fileIndex = urlOrKey.indexOf('/file/');
        const bucketStart = fileIndex + 6; // "/file/" length
        const bucketEnd = urlOrKey.indexOf('/', bucketStart);
        if (bucketEnd !== -1) {
          fileKey = urlOrKey.substring(bucketEnd + 1);
        }
      }
      // Handle S3 direct URLs: https://bucket.s3.region.backblazeb2.com/images/...
      // or https://egramseva.s3.us-east-005.backblazeb2.com/images/...
      else if (urlOrKey.includes('.s3.') && urlOrKey.includes('.backblazeb2.com')) {
        try {
          const urlObj = new URL(urlOrKey);
          fileKey = urlObj.pathname;
          // Remove leading slash if present
          if (fileKey.startsWith('/')) {
            fileKey = fileKey.substring(1);
          }
        } catch (e) {
          // Fallback: try to extract manually
          const s3Index = urlOrKey.indexOf('.s3.');
          if (s3Index !== -1) {
            const domainEnd = urlOrKey.indexOf('/', s3Index);
            if (domainEnd !== -1) {
              fileKey = urlOrKey.substring(domainEnd + 1);
            }
          }
        }
      }
      // Handle generic S3 URLs: https://bucket.s3.amazonaws.com/images/...
      else if (urlOrKey.includes('.s3.') || urlOrKey.includes('s3.amazonaws.com')) {
        try {
          const urlObj = new URL(urlOrKey);
          fileKey = urlObj.pathname;
          // Remove leading slash if present
          if (fileKey.startsWith('/')) {
            fileKey = fileKey.substring(1);
          }
        } catch (e) {
          console.warn('Failed to parse S3 URL:', urlOrKey, e);
        }
      }

      if (!fileKey) {
        return null;
      }

      // Remove query parameters if present
      const queryIndex = fileKey.indexOf('?');
      if (queryIndex !== -1) {
        fileKey = fileKey.substring(0, queryIndex);
      }

      return fileKey;
    } catch (e) {
      console.warn('Failed to extract file key from URL:', urlOrKey, e);
      return null;
    }
  }, []);

  // Schedule proactive refresh with explicit expiration time
  // This needs to be defined before refresh since refresh uses it
  const scheduleProactiveRefreshWithExpiration = useCallback((_url: string, fileKey: string, expirationTime: number, refreshFn: () => Promise<string | null>) => {
    // Clear any existing timer
    if (refreshTimerRef.current) {
      clearTimeout(refreshTimerRef.current);
      refreshTimerRef.current = null;
    }

    const now = Date.now();
    const timeUntilExpiration = expirationTime - now;
    const refreshTime = timeUntilExpiration - refreshBeforeExpirationMs;

    if (refreshTime <= 0) {
      // URL is already expired or about to expire, refresh immediately
      console.warn('Presigned URL is expired or about to expire, refreshing immediately');
      refreshFn();
      return;
    }

    // Schedule refresh
    refreshTimerRef.current = setTimeout(() => {
      console.log('Proactively refreshing presigned URL before expiration:', fileKey);
      refreshFn();
    }, refreshTime);

    console.log(`Scheduled proactive refresh for ${fileKey} in ${Math.round(refreshTime / 1000 / 60)} minutes`);
  }, [refreshBeforeExpirationMs]);

  // Refresh presigned URL
  const refresh = useCallback(async (): Promise<string | null> => {
    // Prevent multiple simultaneous refresh calls
    if (isRefreshingRef.current) {
      console.log('Refresh already in progress, skipping duplicate call');
      return presignedUrl;
    }

    // Check if we've exceeded max retry attempts
    if (refreshAttemptsRef.current >= MAX_RETRY_ATTEMPTS) {
      const error = new Error(`Max refresh attempts (${MAX_RETRY_ATTEMPTS}) exceeded`);
      setError(error);
      if (onError) {
        onError(error);
      }
      return null;
    }

    // Debounce: prevent too frequent refresh calls
    const now = Date.now();
    const timeSinceLastRefresh = now - lastRefreshTimeRef.current;
    if (timeSinceLastRefresh < MIN_REFRESH_INTERVAL_MS) {
      console.log(`Refresh debounced: only ${timeSinceLastRefresh}ms since last refresh`);
      return presignedUrl;
    }

    // Determine the actual file key to use
    let actualFileKey: string | null = null;
    
    if (fileKey) {
      actualFileKey = extractFileKey(fileKey);
    } else if (presignedUrl) {
      // Try to extract from current presigned URL
      actualFileKey = extractFileKey(presignedUrl);
    }
    
    if (!actualFileKey) {
      const error = new Error('No file key available for refresh');
      setError(error);
      if (onError) {
        onError(error);
      }
      return null;
    }

    // Mark as refreshing and increment attempts
    isRefreshingRef.current = true;
    setIsRefreshing(true);
    setError(null);
    refreshAttemptsRef.current += 1;
    lastRefreshTimeRef.current = now;

    try {
      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // Construct API URL - handle both cases where base URL includes /api/v1 or not
      let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
      // Remove trailing slash
      apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
      // Add /api/v1 if not already present
      if (!apiBaseUrl.includes('/api/v1')) {
        apiBaseUrl = `${apiBaseUrl}/api/v1`;
      }
      
      // Build query parameters
      const params = new URLSearchParams();
      params.append('fileKey', actualFileKey);
      if (entityType && entityId) {
        params.append('entityType', entityType);
        params.append('entityId', String(entityId));
      }
      
      const response = await fetch(
        `${apiBaseUrl}/files/refresh-url?${params.toString()}`,
        {
          method: 'GET',
          headers,
        }
      );

      if (!response.ok) {
        throw new Error(`Failed to refresh URL: ${response.statusText}`);
      }

      const data: { success: boolean; data: PresignedUrlResponse; message?: string } = await response.json();
      
      if (!data.success || !data.data?.presignedUrl) {
        throw new Error(data.message || 'Invalid response from server');
      }

      const newUrl = data.data.presignedUrl;
      setPresignedUrl(newUrl);
      currentFileKeyRef.current = actualFileKey;
      
      // Reset retry attempts on successful refresh
      refreshAttemptsRef.current = 0;
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      
      console.log(`Successfully refreshed presigned URL for ${actualFileKey}${entityType && entityId ? ` (${entityType}:${entityId})` : ''}`);
      
      // Schedule next refresh based on expiration time (use expiresIn from response if available)
      const expiresInSeconds = data.data.expiresIn || (7 * 24 * 60 * 60); // Default to 7 days
      const expirationTime = Date.now() + (expiresInSeconds * 1000);
      scheduleProactiveRefreshWithExpiration(newUrl, actualFileKey, expirationTime, refresh);
      
      return newUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      isRefreshingRef.current = false;
      setIsRefreshing(false);
      
      console.error(`Failed to refresh presigned URL (attempt ${refreshAttemptsRef.current}/${MAX_RETRY_ATTEMPTS}):`, error.message);
      
      // If we've exceeded max attempts, don't retry
      if (refreshAttemptsRef.current >= MAX_RETRY_ATTEMPTS) {
        console.error('Max refresh attempts reached, giving up');
        if (onError) {
          onError(error);
        }
      }
      
      return null;
    }
  }, [fileKey, presignedUrl, extractFileKey, onError, entityType, entityId, scheduleProactiveRefreshWithExpiration]);

  // Schedule proactive refresh before URL expires
  const scheduleProactiveRefresh = useCallback((url: string, fileKey: string, refreshFn: () => Promise<string | null>) => {
    const expirationTime = parseExpirationTime(url);
    if (!expirationTime) {
      console.warn('Could not schedule proactive refresh: unable to parse expiration time');
      return;
    }
    scheduleProactiveRefreshWithExpiration(url, fileKey, expirationTime, refreshFn);
  }, [scheduleProactiveRefreshWithExpiration]);

  // Initialize with fileKey or initialPresignedUrl
  useEffect(() => {
    // Reset retry attempts when fileKey or initialPresignedUrl changes
    refreshAttemptsRef.current = 0;
    lastRefreshTimeRef.current = 0;
    
    if (fileKey) {
      // If fileKey is a URL, use it directly and extract the key
      if (fileKey.includes('http://') || fileKey.includes('https://')) {
        setPresignedUrl(fileKey);
        const extractedKey = extractFileKey(fileKey);
        if (extractedKey) {
          currentFileKeyRef.current = extractedKey;
          scheduleProactiveRefresh(fileKey, extractedKey, refresh);
        }
      } else {
        // If it's just a file key, we need to fetch the presigned URL
        currentFileKeyRef.current = fileKey;
        refresh();
      }
    } else if (initialPresignedUrl) {
      setPresignedUrl(initialPresignedUrl);
      const extractedKey = extractFileKey(initialPresignedUrl);
      if (extractedKey) {
        currentFileKeyRef.current = extractedKey;
        scheduleProactiveRefresh(initialPresignedUrl, extractedKey, refresh);
      }
    }
  }, [fileKey, initialPresignedUrl, extractFileKey, refresh, scheduleProactiveRefresh]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (refreshTimerRef.current) {
        clearTimeout(refreshTimerRef.current);
      }
    };
  }, []);

  // Handle image load error - automatically refresh
  const handleImageError = useCallback(async (): Promise<string | null> => {
    // Prevent multiple simultaneous error handlers
    if (isRefreshingRef.current) {
      console.log('Refresh already in progress from previous error, skipping');
      return null; // Return null to indicate no refresh happened
    }

    // Check retry limit BEFORE attempting refresh
    if (refreshAttemptsRef.current >= MAX_RETRY_ATTEMPTS) {
      console.error(`Max refresh attempts (${MAX_RETRY_ATTEMPTS}) already reached, not retrying on image error`);
      return null;
    }

    // Additional check: if we've already tried refreshing this URL recently, don't retry immediately
    const now = Date.now();
    if (now - lastRefreshTimeRef.current < MIN_REFRESH_INTERVAL_MS) {
      console.log('Too soon since last refresh attempt, skipping');
      return null;
    }

    console.log(`Image load error detected (attempt ${refreshAttemptsRef.current + 1}/${MAX_RETRY_ATTEMPTS}), refreshing presigned URL`);
    const result = await refresh();
    
    // If refresh failed and we've exceeded max attempts, return null
    if (!result && refreshAttemptsRef.current >= MAX_RETRY_ATTEMPTS) {
      console.error('Refresh failed and max attempts reached');
      return null;
    }
    
    return result;
  }, [refresh]);

  return {
    presignedUrl,
    isRefreshing,
    error,
    refresh,
    handleImageError,
  };
}

