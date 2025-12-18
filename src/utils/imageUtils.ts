/**
 * Image utility functions for handling file uploads and previews
 */

/**
 * Convert a File to a data URL (base64) for persistent previews
 * Data URLs don't expire like blob URLs
 */
export async function fileToDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to data URL'));
      }
    };
    reader.onerror = () => {
      reject(new Error('Error reading file'));
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Check if a URL is a blob URL
 */
export function isBlobURL(url: string): boolean {
  return url && typeof url === 'string' && url.startsWith('blob:');
}

/**
 * Check if a URL is a data URL
 */
export function isDataURL(url: string): boolean {
  return url && typeof url === 'string' && url.startsWith('data:');
}

/**
 * Check if a URL is likely to expire (blob URL)
 */
export function isTemporaryURL(url: string): boolean {
  return isBlobURL(url);
}

/**
 * Check if a URL is a valid server URL (not blob or data URL)
 */
export function isValidServerURL(url: string): boolean {
  if (!url || typeof url !== 'string') return false;
  return (url.startsWith('http://') || url.startsWith('https://')) && !isBlobURL(url);
}

/**
 * Recursively clean content object by removing blob URLs
 * This prevents expired blob URLs from causing image loading errors
 */
export function cleanContentBlobURLs(content: any): any {
  if (!content) return content;

  // Handle arrays
  if (Array.isArray(content)) {
    return content.map(item => cleanContentBlobURLs(item));
  }

  // Handle objects
  if (typeof content === 'object') {
    const cleaned: any = {};
    for (const key in content) {
      if (content.hasOwnProperty(key)) {
        const value = content[key];
        
        // Check if this is an image URL field
        if ((key === 'image' || key === 'imageUrl' || key === 'backgroundImage' || 
             key === 'coverImage' || key === 'logoUrl' || key === 'heroImage' ||
             key === 'src' || key === 'url') && typeof value === 'string') {
          // Remove blob URLs and data URLs - they should not be stored in database
          // Only server URLs (http/https) should be stored
          if (isBlobURL(value) || isDataURL(value)) {
            console.warn(`Removed temporary URL (blob/data) from ${key}:`, value.substring(0, 50) + '...');
            cleaned[key] = null; // Set to null so ImageWithFallback can handle it
          } else if (isValidServerURL(value)) {
            // Only store valid server URLs
            cleaned[key] = value;
          } else {
            // Invalid URL format - set to null
            console.warn(`Invalid URL format in ${key}, setting to null:`, value.substring(0, 50));
            cleaned[key] = null;
          }
        } else {
          // Recursively clean nested objects/arrays
          cleaned[key] = cleanContentBlobURLs(value);
        }
      }
    }
    return cleaned;
  }

  // Return primitives as-is
  return content;
}

/**
 * Process section content to ensure all image URLs are valid
 */
export function processSectionContent(content: any): any {
  if (!content) return content;
  
  // First, clean any blob URLs
  const cleaned = cleanContentBlobURLs(content);
  
  // If content has items array, ensure all image URLs are valid
  if (cleaned.items && Array.isArray(cleaned.items)) {
    cleaned.items = cleaned.items.map((item: any) => {
      if (item && typeof item === 'object') {
        // Remove blob/data URLs from item images - only server URLs should be stored
        if (item.image && (isBlobURL(item.image) || isDataURL(item.image))) {
          console.warn('Removed temporary URL from item image:', item.image.substring(0, 50) + '...');
          item.image = null;
        } else if (item.image && !isValidServerURL(item.image)) {
          // Invalid URL format
          console.warn('Invalid URL format in item image, setting to null:', item.image.substring(0, 50));
          item.image = null;
        }
        // Clean nested structures
        return cleanContentBlobURLs(item);
      }
      return item;
    });
  }
  
  return cleaned;
}

/**
 * Validate an image file before upload
 * Checks file type, size, and attempts to load the image to verify it's not corrupted
 * @param file The file to validate
 * @param maxSizeBytes Maximum file size in bytes (default: 10MB)
 * @returns Promise that resolves if valid, rejects with error message if invalid
 */
export async function validateImageFile(
  file: File,
  maxSizeBytes: number = 10 * 1024 * 1024
): Promise<void> {
  return new Promise((resolve, reject) => {
    // Check if file exists
    if (!file) {
      reject(new Error('No file provided'));
      return;
    }

    // Check file type
    if (!file.type || !file.type.startsWith('image/')) {
      reject(new Error(`Invalid file type: ${file.type || 'unknown'}. Please select an image file (JPEG, PNG, GIF, or WebP).`));
      return;
    }

    // Check file size
    if (file.size === 0) {
      reject(new Error('File is empty. Please select a valid image file.'));
      return;
    }

    if (file.size > maxSizeBytes) {
      const maxSizeMB = (maxSizeBytes / (1024 * 1024)).toFixed(1);
      reject(new Error(`File size (${(file.size / (1024 * 1024)).toFixed(1)}MB) exceeds maximum allowed size of ${maxSizeMB}MB.`));
      return;
    }

    // Validate file extension matches MIME type
    const fileName = file.name.toLowerCase();
    const extension = fileName.substring(fileName.lastIndexOf('.') + 1);
    const mimeType = file.type.toLowerCase();

    const validExtensions: Record<string, string[]> = {
      'image/jpeg': ['jpg', 'jpeg'],
      'image/png': ['png'],
      'image/gif': ['gif'],
      'image/webp': ['webp'],
    };

    const validExts = validExtensions[mimeType];
    if (validExts && !validExts.includes(extension)) {
      console.warn(`File extension (${extension}) doesn't match MIME type (${mimeType}). This may cause issues.`);
    }

    // Try to load the image to verify it's not corrupted
    const reader = new FileReader();
    const img = new Image();

    let imageLoaded = false;
    let readerLoaded = false;

    const checkComplete = () => {
      if (imageLoaded && readerLoaded) {
        if (img.width > 0 && img.height > 0) {
          console.log(`✅ Image validation passed: ${file.name} (${img.width}x${img.height}, ${file.size} bytes)`);
          resolve();
        } else {
          reject(new Error('Image appears to be corrupted or invalid. Please select a different image file.'));
        }
      }
    };

    // Load image from file
    reader.onload = (e) => {
      readerLoaded = true;
      if (e.target?.result) {
        img.onload = () => {
          imageLoaded = true;
          checkComplete();
        };
        img.onerror = () => {
          reject(new Error('Failed to load image. The file may be corrupted or in an unsupported format. Please try a different image file.'));
        };
        img.src = e.target.result as string;
      } else {
        reject(new Error('Failed to read file. Please try again.'));
      }
    };

    reader.onerror = () => {
      reject(new Error('Error reading file. Please try again.'));
    };

    // Start reading the file
    reader.readAsDataURL(file);

    // Timeout after 10 seconds
    setTimeout(() => {
      if (!imageLoaded || !readerLoaded) {
        reject(new Error('Image validation timed out. The file may be too large or corrupted.'));
      }
    }, 10000);
  });
}

