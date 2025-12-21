/**
 * Image Placeholder Utilities
 * Provides placeholder images for sections that support images
 */

export const PLACEHOLDER_IMAGES = {
  // Hero/Banner placeholders
  hero: 'https://images.unsplash.com/photo-1551434678-e076c223a692?w=1200&h=600&fit=crop&auto=format',
  banner: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=1200&h=400&fit=crop&auto=format',
  
  // Content placeholders
  feature: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=600&h=400&fit=crop&auto=format',
  card: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=600&h=400&fit=crop&auto=format',
  gallery: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=600&h=400&fit=crop&auto=format',
  
  // People/Team placeholders
  team: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=400&h=400&fit=crop&auto=format',
  member: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&auto=format',
  
  // Statistics/Info placeholders
  stats: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&h=400&fit=crop&auto=format',
  info: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=600&h=400&fit=crop&auto=format',
  
  // Generic placeholders
  default: 'https://images.unsplash.com/photo-1557683316-973673baf926?w=600&h=400&fit=crop&auto=format',
  landscape: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&h=600&fit=crop&auto=format',
  square: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=600&h=600&fit=crop&auto=format',
};

/**
 * Get placeholder image URL based on section type and context
 */
export function getPlaceholderImage(
  sectionType?: string,
  context: 'hero' | 'item' | 'gallery' = 'item'
): string {
  if (context === 'hero') {
    return PLACEHOLDER_IMAGES.hero;
  }

  switch (sectionType) {
    case 'HERO_BANNER':
    case 'HERO':
      return PLACEHOLDER_IMAGES.hero;
    case 'FEATURES_GRID':
    case 'FEATURES':
      return PLACEHOLDER_IMAGES.feature;
    case 'CARD_SECTION':
    case 'CARD_GRID':
    case 'CARDS':
      return PLACEHOLDER_IMAGES.card;
    case 'IMAGE_GALLERY':
    case 'GALLERY':
      return PLACEHOLDER_IMAGES.gallery;
    case 'TEAM_MEMBERS':
    case 'MEMBERS':
      return PLACEHOLDER_IMAGES.member;
    case 'STATISTICS_SECTION':
    case 'STATS':
      return PLACEHOLDER_IMAGES.stats;
    case 'CONTACT_INFO':
    case 'CONTACT':
      return PLACEHOLDER_IMAGES.info;
    default:
      return PLACEHOLDER_IMAGES.default;
  }
}

/**
 * Check if an image URL is a placeholder
 */
export function isPlaceholderImage(url: string): boolean {
  return Object.values(PLACEHOLDER_IMAGES).includes(url);
}

/**
 * Generate a data URL placeholder (for when external URLs are not available)
 */
export function generateDataURLPlaceholder(
  width: number = 600,
  height: number = 400,
  text: string = 'Image Placeholder',
  bgColor: string = '#f3f4f6',
  textColor: string = '#9ca3af'
): string {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    return '';
  }
  
  // Draw background
  ctx.fillStyle = bgColor;
  ctx.fillRect(0, 0, width, height);
  
  // Draw text
  ctx.fillStyle = textColor;
  ctx.font = '16px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, width / 2, height / 2);
  
  return canvas.toDataURL();
}

