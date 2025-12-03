import React, { useEffect, useState } from 'react'
import { usePresignedUrlRefresh } from '@/hooks/usePresignedUrlRefresh'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Optional file key for presigned URL refresh. If provided, will use usePresignedUrlRefresh hook */
  fileKey?: string | null;
  /** If true, will use the legacy refresh mechanism with data attributes */
  useLegacyRefresh?: boolean;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { src, alt, style, className, fileKey, useLegacyRefresh, ...rest } = props

  // Use presigned URL refresh hook if fileKey is provided
  const { presignedUrl, isRefreshing: isHookRefreshing, handleImageError } = usePresignedUrlRefresh({
    fileKey: fileKey || null,
    initialPresignedUrl: !fileKey ? src : undefined,
  });

  const [didError, setDidError] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [attempts, setAttempts] = useState(0)
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(
    fileKey ? presignedUrl || undefined : src
  )

  const MAX_ATTEMPTS = 3

  // Update currentSrc when presignedUrl changes (from hook)
  useEffect(() => {
    if (fileKey && presignedUrl) {
      setCurrentSrc(presignedUrl)
      setDidError(false)
      setAttempts(0)
    } else if (!fileKey && src) {
      setCurrentSrc(src)
      setDidError(false)
      setAttempts(0)
    }
  }, [fileKey, presignedUrl, src])

  // Update isRefreshing based on hook state
  useEffect(() => {
    if (fileKey) {
      setIsRefreshing(isHookRefreshing)
    }
  }, [fileKey, isHookRefreshing])

  const handleLoad = () => {
    // reset on successful load
    setDidError(false)
    setIsRefreshing(false)
    setAttempts(0)
  }

  const handleError = async (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget
    console.error('Image load failed for', currentSrc)

    // If using hook with fileKey, let the hook handle the refresh
    if (fileKey && !useLegacyRefresh) {
      const newUrl = await handleImageError();
      if (newUrl) {
        setCurrentSrc(newUrl);
        return;
      }
      // If hook refresh failed, fall through to error state
      setDidError(true);
      return;
    }

    // Legacy refresh mechanism (for backward compatibility)
    if (attempts >= MAX_ATTEMPTS) {
      console.error('Max image refresh attempts reached')
      setDidError(true)
      return
    }

    // Try to detect 403 by fetching the image URL
    try {
      const resp = await fetch(String(currentSrc), { method: 'GET', mode: 'cors', cache: 'no-store' })
      if (resp.status !== 403) {
        console.error('Image fetch returned non-403 status:', resp.status)
        setDidError(true)
        return
      }
    } catch (err) {
      console.error('Error while checking image status', err)
      setDidError(true)
      return
    }

    // At this point we saw a 403 — attempt to refresh using legacy mechanism
    // This requires data attributes and specific API endpoints
    const attr = (props as any)['data-post-id'] || (props as any)['dataPostId']
      ? { key: 'post', id: (props as any)['data-post-id'] || (props as any)['dataPostId'] }
      : (props as any)['data-gallery-id'] || (props as any)['dataGalleryId']
      ? { key: 'gallery', id: (props as any)['data-gallery-id'] || (props as any)['dataGalleryId'] }
      : img.getAttribute('data-album-id')
      ? { key: 'album', id: img.getAttribute('data-album-id') }
      : null

    if (!attr || !attr.id) {
      console.error('No data-post-id/data-gallery-id/data-album-id attribute found on image; cannot refresh')
      // If we have a fileKey, try to extract it from the URL and use the hook
      if (currentSrc && (currentSrc.includes('/file/') || currentSrc.includes('.s3.'))) {
        console.log('Attempting to extract fileKey from URL and refresh via hook');
        let fileKeyFromUrl: string | null = null;
        
        // Handle Backblaze B2 file URLs
        if (currentSrc.includes('/file/')) {
          const extractedKey = currentSrc.substring(currentSrc.indexOf('/file/') + 6);
          const keyAfterBucket = extractedKey.substring(extractedKey.indexOf('/') + 1);
          fileKeyFromUrl = keyAfterBucket.split('?')[0];
        }
        // Handle S3 direct URLs
        else if (currentSrc.includes('.s3.')) {
          try {
            const urlObj = new URL(currentSrc);
            let path = urlObj.pathname;
            if (path.startsWith('/')) {
              path = path.substring(1);
            }
            fileKeyFromUrl = path.split('?')[0];
          } catch (e) {
            // Fallback: manual extraction
            const s3Index = currentSrc.indexOf('.s3.');
            if (s3Index !== -1) {
              const domainEnd = currentSrc.indexOf('/', s3Index);
              if (domainEnd !== -1) {
                fileKeyFromUrl = currentSrc.substring(domainEnd + 1).split('?')[0];
              }
            }
          }
        }
        
        if (fileKeyFromUrl) {
          // Try to refresh using the generic file refresh endpoint
          try {
            const token = localStorage.getItem('authToken');
            const headers: HeadersInit = {
              'Content-Type': 'application/json',
            };
            if (token) {
              headers['Authorization'] = `Bearer ${token}`;
            }
            
            // Construct API URL properly
            let apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
            apiBaseUrl = apiBaseUrl.replace(/\/$/, '');
            if (!apiBaseUrl.includes('/api/v1')) {
              apiBaseUrl = `${apiBaseUrl}/api/v1`;
            }
            
            const response = await fetch(
              `${apiBaseUrl}/files/refresh-url?fileKey=${encodeURIComponent(fileKeyFromUrl)}`,
              { method: 'GET', headers }
            );
            if (response.ok) {
              const data = await response.json();
              if (data.success && data.data?.presignedUrl) {
                setCurrentSrc(data.data.presignedUrl);
                setAttempts(0);
                return;
              }
            }
          } catch (err) {
            console.error('Failed to refresh via file endpoint:', err);
          }
        }
      }
      setDidError(true)
      return
    }

    setIsRefreshing(true)

    try {
      const delay = Math.pow(2, attempts) * 500
      await new Promise((r) => setTimeout(r, delay))

      const { postApi, albumApi, galleryApi } = await import('@/routes/api');
      let result: any
      if (attr.key === 'post') {
        result = await postApi.refreshImageUrl(attr.id)
      } else if (attr.key === 'gallery') {
        result = await galleryApi.refreshImageUrl(attr.id)
      } else if (attr.key === 'album') {
        result = await albumApi.refreshCoverImageUrl(attr.id)
      }

      const newUrl = result?.mediaUrl || result?.imageUrl || result?.coverImageUrl
      if (!newUrl) {
        throw new Error('Refresh endpoint did not return a usable URL')
      }

      console.info('Refreshed image URL for', attr.key, attr.id)
      setAttempts((a) => a + 1)
      setCurrentSrc(newUrl)
      // browser will automatically retry loading the updated src
    } catch (err) {
      console.error('Failed to refresh image URL for', attr?.key, attr?.id, err)
      setDidError(true)
      setIsRefreshing(false)
    }
  }

  if (didError) {
    return (
      <div className={`inline-block bg-[#F5F5F5] text-center align-middle ${className ?? ''}`} style={style}>
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt="Error loading image" {...rest} data-original-url={src} />
        </div>
      </div>
    )
  }

  return (
    <div className="relative inline-block" style={{ width: '100%', height: '100%' }}>
      <img
        src={currentSrc}
        alt={alt}
        className={className}
        style={style}
        {...rest}
        onError={handleError}
        onLoad={handleLoad}
        data-post-id={(props as any)['data-post-id'] || undefined}
      />
      {isRefreshing && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 rounded">
          <div className="flex flex-col items-center gap-2">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-white border-t-transparent"></div>
            <span className="text-xs text-white">Refreshing...</span>
          </div>
        </div>
      )}
    </div>
  )}
