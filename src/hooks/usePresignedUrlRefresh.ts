/**
 * usePresignedUrlRefresh Hook
 * Automatically refreshes presigned URLs when they expire
 */

import { useState, useEffect, useCallback } from 'react';

interface UsePresignedUrlRefreshOptions {
  fileKey?: string | null;
  initialPresignedUrl?: string | null;
  onError?: (error: Error) => void;
}

interface PresignedUrlResponse {
  fileKey: string;
  presignedUrl: string;
  expiresIn: number;
}

/**
 * Hook to manage presigned URL refresh
 * 
 * @param fileKey - The S3 file key (e.g., "images/timestamp-uuid.ext") or full presigned URL
 * @param initialPresignedUrl - Initial presigned URL (optional, will be extracted from fileKey if it's a URL)
 * @param onError - Error callback
 * @returns Object with current presigned URL and refresh function
 */
export function usePresignedUrlRefresh({
  fileKey,
  initialPresignedUrl,
  onError,
}: UsePresignedUrlRefreshOptions) {
  const [presignedUrl, setPresignedUrl] = useState<string | null>(initialPresignedUrl || null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Extract file key from URL if needed
  const extractFileKey = useCallback((urlOrKey: string): string | null => {
    if (!urlOrKey) return null;
    
    // If it doesn't contain "/file/", assume it's already a file key
    if (!urlOrKey.includes('/file/')) {
      return urlOrKey;
    }

    try {
      const fileIndex = urlOrKey.indexOf('/file/');
      if (fileIndex === -1) return null;

      const bucketStart = fileIndex + 6; // "/file/" length
      const bucketEnd = urlOrKey.indexOf('/', bucketStart);
      if (bucketEnd === -1) return null;

      // Extract file key (everything after bucket-name/)
      let fileKey = urlOrKey.substring(bucketEnd + 1);

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

  // Refresh presigned URL
  const refresh = useCallback(async (): Promise<string | null> => {
    if (!fileKey) {
      setError(new Error('No file key provided'));
      return null;
    }

    setIsRefreshing(true);
    setError(null);

    try {
      // Extract file key if a full URL was provided
      const actualFileKey = extractFileKey(fileKey);
      if (!actualFileKey) {
        throw new Error('Could not extract file key');
      }

      const token = localStorage.getItem('authToken');
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'}/api/v1/files/refresh-url?fileKey=${encodeURIComponent(actualFileKey)}`,
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
      setIsRefreshing(false);
      return newUrl;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      setError(error);
      setIsRefreshing(false);
      if (onError) {
        onError(error);
      }
      return null;
    }
  }, [fileKey, extractFileKey, onError]);

  // Initialize with fileKey or initialPresignedUrl
  useEffect(() => {
    if (fileKey) {
      // If fileKey is a URL, use it directly; otherwise we'll need to fetch
      if (fileKey.includes('http://') || fileKey.includes('https://')) {
        setPresignedUrl(fileKey);
      } else {
        // If it's just a file key, we need to fetch the presigned URL
        // But we don't have an endpoint to get initial URL from key, so we'll refresh
        refresh();
      }
    } else if (initialPresignedUrl) {
      setPresignedUrl(initialPresignedUrl);
    }
  }, [fileKey, initialPresignedUrl, refresh]);

  // Handle image load error - automatically refresh
  const handleImageError = useCallback(async (): Promise<string | null> => {
    if (presignedUrl && !isRefreshing) {
      return await refresh();
    }
    return null;
  }, [presignedUrl, isRefreshing, refresh]);

  return {
    presignedUrl,
    isRefreshing,
    error,
    refresh,
    handleImageError,
  };
}

