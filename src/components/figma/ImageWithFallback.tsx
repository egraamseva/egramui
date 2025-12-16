import React, { useEffect, useState } from 'react'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL - Cloudflare public URL that doesn't expire */
  src?: string | null;
}

export function ImageWithFallback(props: ImageWithFallbackProps) {
  const { src, alt, style, className, ...rest } = props

  const [didError, setDidError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src || undefined)
  const [retryCount, setRetryCount] = useState(0)

  const MAX_RETRIES = 2 // Reduced retries since URLs don't expire

  // Update currentSrc when src prop changes
  useEffect(() => {
    if (src) {
      setCurrentSrc(src)
      setDidError(false)
      setRetryCount(0)
    } else {
      setCurrentSrc(undefined)
    }
  }, [src])

  const handleLoad = () => {
    // Reset error state on successful load
    setDidError(false)
    setRetryCount(0)
  }

  const handleError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    const img = e.currentTarget
    const failedUrl = currentSrc || ''

    // If we've already tried retrying, show error state
    if (retryCount >= MAX_RETRIES) {
      console.error('Image load failed after retries:', failedUrl)
      setDidError(true)
      return
    }

    // For 404 errors, the image likely doesn't exist - don't retry
    // For other errors (network issues), retry once
    console.warn(`Image load error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, failedUrl)

    // Retry with a small delay for network errors
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1)
        // Force reload by updating src with a cache-busting parameter
        if (currentSrc) {
          const separator = currentSrc.includes('?') ? '&' : '?'
          setCurrentSrc(`${currentSrc}${separator}_retry=${Date.now()}`)
        }
      }, 1000 * (retryCount + 1)) // Exponential backoff: 1s, 2s
    } else {
      setDidError(true)
    }
  }

  if (didError || !currentSrc) {
    return (
      <div className={`inline-block bg-[#F5F5F5] text-center align-middle ${className ?? ''}`} style={style}>
        <div className="flex items-center justify-center w-full h-full">
          <img src={ERROR_IMG_SRC} alt={alt || "Error loading image"} {...rest} />
        </div>
      </div>
    )
  }

  return (
    <img
      src={currentSrc}
      alt={alt}
      className={className}
      style={style}
      {...rest}
      onError={handleError}
      onLoad={handleLoad}
    />
  )
}
