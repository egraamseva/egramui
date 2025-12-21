import React, { useEffect, useState } from 'react'
import { isBlobURL } from '../../utils/imageUtils'

const ERROR_IMG_SRC =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iODgiIGhlaWdodD0iODgiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyIgc3Ryb2tlPSIjMDAwIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBvcGFjaXR5PSIuMyIgZmlsbD0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIzLjciPjxyZWN0IHg9IjE2IiB5PSIxNiIgd2lkdGg9IjU2IiBoZWlnaHQ9IjU2IiByeD0iNiIvPjxwYXRoIGQ9Im0xNiA1OCAxNi0xOCAzMiAzMiIvPjxjaXJjbGUgY3g9IjUzIiBjeT0iMzUiIHI9IjciLz48L3N2Zz4KCg=='

/**
 * Check if URL is a placeholder service URL that might fail
 * Also handles URLs with retry parameters
 */
function isPlaceholderService(url: string): boolean {
  if (!url) return false
  // Remove retry parameters for detection
  const cleanUrl = url.split('&_retry=')[0].split('?retry=')[0]
  return cleanUrl.includes('via.placeholder.com') || 
         cleanUrl.includes('placeholder.com') ||
         cleanUrl.includes('placehold.it') ||
         cleanUrl.includes('placehold.co')
}

/**
 * Generate a local SVG placeholder based on dimensions and text from URL
 */
function generateLocalPlaceholder(url: string): string {
  try {
    // Remove retry parameters before parsing
    const cleanUrl = url.split('&_retry=')[0].split('?retry=')[0]
    // Parse dimensions and text from via.placeholder.com URL
    // Format: https://via.placeholder.com/WIDTHxHEIGHT/BGCOLOR/TEXTCOLOR?text=TEXT
    const urlObj = new URL(cleanUrl)
    const pathParts = urlObj.pathname.split('/').filter(Boolean)
    
    // Extract dimensions (e.g., "400x300" or "300")
    let width = 400
    let height = 300
    let bgColor = '#e5e7eb'
    let textColor = '#9ca3af'
    let text = 'Image'
    
    if (pathParts.length > 0) {
      const dims = pathParts[0].split('x')
      width = parseInt(dims[0]) || 400
      height = parseInt(dims[1]) || dims[0] ? parseInt(dims[0]) : 300
    }
    
    // Extract colors (e.g., "1e3a8a/ffffff")
    if (pathParts.length > 1) {
      const colors = pathParts[1].split('/')
      if (colors[0]) bgColor = '#' + colors[0]
      if (colors[1]) textColor = '#' + colors[1]
    }
    
    // Extract text from query params
    const textParam = urlObj.searchParams.get('text')
    if (textParam) {
      text = decodeURIComponent(textParam.replace(/\+/g, ' '))
    }
    
    // Generate SVG placeholder
    // Escape XML special characters in text
    const escapeXml = (str: string) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;')
    }
    
    const escapedText = escapeXml(text)
    const fontSize = Math.max(12, Math.min(width, height) / Math.max(text.length / 10, 8))
    
    const svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="${bgColor}"/><text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${fontSize}" fill="${textColor}" text-anchor="middle" dominant-baseline="middle" font-weight="500">${escapedText}</text></svg>`
    
    // Use encodeURIComponent for proper encoding instead of btoa for Unicode support
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  } catch (e) {
    // Fallback to simple placeholder
    return ERROR_IMG_SRC
  }
}

interface ImageWithFallbackProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Image source URL - Cloudflare public URL, data URL, or blob URL (blob URLs may expire) */
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
    // Don't set blob URLs - they will expire
    if (src && !isBlobURL(src)) {
      // If it's a placeholder service URL, pre-generate local placeholder to avoid network calls
      if (isPlaceholderService(src)) {
        const localPlaceholder = generateLocalPlaceholder(src)
        setCurrentSrc(localPlaceholder)
        setDidError(false)
        setRetryCount(0)
      } else {
        setCurrentSrc(src)
        setDidError(false)
        setRetryCount(0)
      }
    } else if (src && isBlobURL(src)) {
      // If a blob URL is passed, don't use it - it will expire
      console.warn('Blob URL detected in ImageWithFallback, ignoring:', src)
      setCurrentSrc(undefined)
      setDidError(true)
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
    
    // Get original URL from src prop if available (before retry params)
    const originalUrl = src || failedUrl

    // If it's a blob URL that failed, it's likely been revoked/garbage collected
    // Don't retry blob URLs as they can't be recovered
    if (isBlobURL(failedUrl)) {
      console.warn('Blob URL expired or revoked:', failedUrl)
      setDidError(true)
      return
    }

    // If it's a placeholder service URL that failed, generate local placeholder immediately
    if (isPlaceholderService(failedUrl) || isPlaceholderService(originalUrl)) {
      const urlToUse = isPlaceholderService(originalUrl) ? originalUrl : failedUrl
      console.warn('Placeholder service failed, generating local placeholder:', urlToUse)
      const localPlaceholder = generateLocalPlaceholder(urlToUse)
      setCurrentSrc(localPlaceholder)
      setDidError(false)
      setRetryCount(0)
      return
    }

    // If we've already tried retrying, show error state
    if (retryCount >= MAX_RETRIES) {
      console.error('Image load failed after retries:', failedUrl)
      setDidError(true)
      return
    }

    // For 404 errors, the image likely doesn't exist - don't retry
    // For other errors (network issues), retry once
    console.warn(`Image load error (attempt ${retryCount + 1}/${MAX_RETRIES + 1}):`, failedUrl)

    // Retry with a small delay for network errors (only for non-blob URLs)
    if (retryCount < MAX_RETRIES) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1)
        // Force reload by updating src with a cache-busting parameter
        // Don't add cache-busting to data URLs as it breaks them
        if (currentSrc && !currentSrc.startsWith('data:')) {
          const separator = currentSrc.includes('?') ? '&' : '?'
          setCurrentSrc(`${currentSrc}${separator}_retry=${Date.now()}`)
        } else {
          // For data URLs, just retry with the same URL
          setCurrentSrc(currentSrc)
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
