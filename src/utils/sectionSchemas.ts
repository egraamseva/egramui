/**
 * Section Schema Utilities
 * Handles parsing and working with section schemas from the database
 */

export interface FieldDefinition {
  id: string;
  name: string;
  type: 'TEXT' | 'RICHTEXT' | 'NUMBER' | 'BOOLEAN' | 'URL' | 'IMAGE' | 'DATE' | 'SELECT' | 'ARRAY' | 'GROUP';
  label: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
  displayOrder?: number;
  validationRules?: Array<{
    ruleType: string;
    ruleValue: string;
    errorMessage?: string;
  }>;
  options?: Array<{ label: string; value: string }>;
  isRepeatable?: boolean;
  nestedFields?: FieldDefinition[];
  conditionalLogic?: Array<{
    value: string;
    action: string;
    operator: string;
    controllingField: string;
  }>;
}

export interface SectionSchema {
  id: number;
  schemaType: string;
  name: string;
  description: string;
  category: string;
  version: number;
  isActive: boolean;
  isSystem: boolean;
  panchayatId?: string | null;
  fieldDefinitions: FieldDefinition[];
  supportedLayouts: string[];
  defaultLayout: string;
  renderingHints: Record<string, any>;
  config: Record<string, any>;
  i18n: Record<string, any>;
}

/**
 * Parse field definitions from JSON string
 */
export function parseFieldDefinitions(fieldDefsJson: string): FieldDefinition[] {
  try {
    if (!fieldDefsJson || fieldDefsJson === '[]') return [];
    const parsed = typeof fieldDefsJson === 'string' ? JSON.parse(fieldDefsJson) : fieldDefsJson;
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error parsing field definitions:', error);
    return [];
  }
}

/**
 * Parse supported layouts from JSON string
 */
export function parseSupportedLayouts(layoutsJson: string): string[] {
  try {
    if (!layoutsJson || layoutsJson === '[]') return ['GRID'];
    const parsed = typeof layoutsJson === 'string' ? JSON.parse(layoutsJson) : layoutsJson;
    return Array.isArray(parsed) ? parsed : ['GRID'];
  } catch (error) {
    console.error('Error parsing supported layouts:', error);
    return ['GRID'];
  }
}

/**
 * Parse rendering hints from JSON string
 */
export function parseRenderingHints(hintsJson: string): Record<string, any> {
  try {
    if (!hintsJson || hintsJson === '{}') return {};
    const parsed = typeof hintsJson === 'string' ? JSON.parse(hintsJson) : hintsJson;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.error('Error parsing rendering hints:', error);
    return {};
  }
}

/**
 * Parse config from JSON string
 */
export function parseConfig(configJson: string): Record<string, any> {
  try {
    if (!configJson || configJson === '{}') return {};
    const parsed = typeof configJson === 'string' ? JSON.parse(configJson) : configJson;
    return typeof parsed === 'object' && parsed !== null ? parsed : {};
  } catch (error) {
    console.error('Error parsing config:', error);
    return {};
  }
}

/**
 * Create a SectionSchema from raw database data
 */
export function createSectionSchema(data: any): SectionSchema {
  return {
    id: data.id || 0,
    schemaType: data.schema_type || data.schemaType || '',
    name: data.name || '',
    description: data.description || '',
    category: data.category || 'Other',
    version: data.version || 1,
    isActive: data.is_active !== undefined ? data.is_active : data.isActive !== undefined ? data.isActive : true,
    isSystem: data.is_system !== undefined ? data.is_system : data.isSystem !== undefined ? data.isSystem : false,
    panchayatId: data.panchayat_id || data.panchayatId || null,
    fieldDefinitions: parseFieldDefinitions(data.field_definitions || data.fieldDefinitions || '[]'),
    supportedLayouts: parseSupportedLayouts(data.supported_layouts || data.supportedLayouts || '[]'),
    defaultLayout: data.default_layout || data.defaultLayout || 'GRID',
    renderingHints: parseRenderingHints(data.rendering_hints || data.renderingHints || '{}'),
    config: parseConfig(data.config || '{}'),
    i18n: typeof data.i18n === 'string' ? JSON.parse(data.i18n || '{}') : (data.i18n || {}),
  };
}

/**
 * Get field value from content using field name path (supports nested paths like "media.url")
 */
export function getFieldValue(content: any, fieldName: string): any {
  if (!content || !fieldName) return undefined;
  
  const parts = fieldName.split('.');
  let value = content;
  
  for (const part of parts) {
    if (value === null || value === undefined) return undefined;
    value = value[part];
  }
  
  return value;
}

/**
 * Set field value in content using field name path (supports nested paths)
 */
export function setFieldValue(content: any, fieldName: string, value: any): any {
  if (!fieldName) return content;
  
  const parts = fieldName.split('.');
  const newContent = { ...content };
  let current = newContent;
  
  for (let i = 0; i < parts.length - 1; i++) {
    const part = parts[i];
    if (!current[part] || typeof current[part] !== 'object') {
      current[part] = {};
    } else {
      current[part] = { ...current[part] };
    }
    current = current[part];
  }
  
  current[parts[parts.length - 1]] = value;
  return newContent;
}

/**
 * Get default value for a field
 */
export function getFieldDefaultValue(field: FieldDefinition): any {
  if (field.defaultValue !== undefined && field.defaultValue !== null) {
    // Try to parse as appropriate type
    if (field.type === 'NUMBER') {
      return parseFloat(String(field.defaultValue)) || 0;
    }
    if (field.type === 'BOOLEAN') {
      const strValue = String(field.defaultValue).toLowerCase();
      return strValue === 'true' || strValue === '1';
    }
    return field.defaultValue;
  }
  
  // Return type-specific defaults
  switch (field.type) {
    case 'NUMBER':
      return 0;
    case 'BOOLEAN':
      return false;
    case 'ARRAY':
      return [];
    case 'GROUP':
      return {};
    default:
      return '';
  }
}

/**
 * Validate field value against validation rules
 */
export function validateField(field: FieldDefinition, value: any): { isValid: boolean; error?: string } {
  if (field.required && (value === undefined || value === null || value === '')) {
    return { isValid: false, error: `${field.label} is required` };
  }
  
  if (!field.validationRules || value === undefined || value === null || value === '') {
    return { isValid: true };
  }
  
  for (const rule of field.validationRules) {
    switch (rule.ruleType) {
      case 'MIN_LENGTH':
        if (typeof value === 'string' && value.length < parseInt(rule.ruleValue)) {
          return { isValid: false, error: rule.errorMessage || `${field.label} must be at least ${rule.ruleValue} characters` };
        }
        break;
      case 'MAX_LENGTH':
        if (typeof value === 'string' && value.length > parseInt(rule.ruleValue)) {
          return { isValid: false, error: rule.errorMessage || `${field.label} cannot exceed ${rule.ruleValue} characters` };
        }
        break;
      case 'MIN':
        if (typeof value === 'number' && value < parseFloat(rule.ruleValue)) {
          return { isValid: false, error: rule.errorMessage || `${field.label} must be at least ${rule.ruleValue}` };
        }
        break;
      case 'MAX':
        if (typeof value === 'number' && value > parseFloat(rule.ruleValue)) {
          return { isValid: false, error: rule.errorMessage || `${field.label} cannot exceed ${rule.ruleValue}` };
        }
        break;
      case 'REGEX':
        const regex = new RegExp(rule.ruleValue);
        if (typeof value === 'string' && !regex.test(value)) {
          return { isValid: false, error: rule.errorMessage || `${field.label} format is invalid` };
        }
        break;
    }
  }
  
  return { isValid: true };
}

/**
 * Check if a field should be visible based on conditional logic
 */
export function shouldShowField(field: FieldDefinition, content: any): boolean {
  if (!field.conditionalLogic || field.conditionalLogic.length === 0) {
    return true;
  }
  
  for (const condition of field.conditionalLogic) {
    const controllingValue = getFieldValue(content, condition.controllingField);
    const conditionMet = condition.operator === 'EQUALS' 
      ? String(controllingValue) === condition.value
      : String(controllingValue) !== condition.value;
    
    if (conditionMet && condition.action === 'SHOW') {
      return true;
    }
    if (conditionMet && condition.action === 'HIDE') {
      return false;
    }
  }
  
  return true;
}

/**
 * Get rendering hint value
 */
export function getRenderingHint(schema: SectionSchema, hint: string): boolean {
  return schema.renderingHints[hint] === true;
}

/**
 * Check if schema is available for platform or panchayat
 */
export function isSchemaAvailable(schema: SectionSchema, isPlatform: boolean): boolean {
  const config = schema.config || {};
  if (isPlatform) {
    return config.availableForPlatform !== false;
  } else {
    return config.availableForPanchayat !== false;
  }
}

/**
 * Hardcoded schemas based on CSV data (temporary until API is ready)
 * In production, these should be loaded from the API endpoint: GET /api/v1/section-schemas
 * 
 * TODO: Replace with API call:
 * const response = await http.get<SectionSchema[]>('/section-schemas');
 * return response.map(createSectionSchema);
 */
export const HARDCODED_SCHEMAS: SectionSchema[] = [
  {
    id: 11,
    schemaType: 'HERO_BANNER',
    name: 'Hero Banner',
    description: 'Full-width hero section with title, subtitle, background image, and call-to-action buttons',
    category: 'Hero & Banners',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      { id: 'title', name: 'title', type: 'TEXT', label: 'Title', required: true, placeholder: 'Enter main heading', displayOrder: 1, validationRules: [{ ruleType: 'MIN_LENGTH', ruleValue: '3', errorMessage: 'Title must be at least 3 characters' }, { ruleType: 'MAX_LENGTH', ruleValue: '200', errorMessage: 'Title cannot exceed 200 characters' }] },
      { id: 'subtitle', name: 'subtitle', type: 'TEXT', label: 'Subtitle', required: false, placeholder: 'Enter supporting text', displayOrder: 2, validationRules: [{ ruleType: 'MAX_LENGTH', ruleValue: '500', errorMessage: 'Subtitle cannot exceed 500 characters' }] },
      { id: 'backgroundImage', name: 'backgroundImage', type: 'IMAGE', label: 'Background Image', required: false, placeholder: 'Upload background image', displayOrder: 3 },
      {
        id: 'ctaPrimary',
        name: 'ctaPrimary',
        type: 'GROUP',
        label: 'Primary Call-to-Action',
        required: false,
        displayOrder: 4,
        nestedFields: [
          { id: 'ctaPrimaryText', name: 'text', type: 'TEXT', label: 'Button Text', required: false, placeholder: 'Get Started', displayOrder: 1 },
          { id: 'ctaPrimaryLink', name: 'link', type: 'URL', label: 'Button Link', required: false, placeholder: '/page or https://...', displayOrder: 2 },
          {
            id: 'ctaPrimaryStyle',
            name: 'style',
            type: 'SELECT',
            label: 'Button Style',
            options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }, { label: 'Outline', value: 'outline' }],
            required: false,
            defaultValue: 'primary',
            displayOrder: 3,
          },
        ],
      },
      {
        id: 'ctaSecondary',
        name: 'ctaSecondary',
        type: 'GROUP',
        label: 'Secondary Call-to-Action',
        required: false,
        displayOrder: 5,
        nestedFields: [
          { id: 'ctaSecondaryText', name: 'text', type: 'TEXT', label: 'Button Text', required: false, placeholder: 'Learn More', displayOrder: 1 },
          { id: 'ctaSecondaryLink', name: 'link', type: 'URL', label: 'Button Link', required: false, placeholder: '/page or https://...', displayOrder: 2 },
        ],
      },
    ],
    supportedLayouts: ['FULL_WIDTH', 'CONTAINED'],
    defaultLayout: 'FULL_WIDTH',
    renderingHints: {
      component: 'HeroBanner',
      supportsCTA: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsSubtitle: true,
      supportsAnimation: true,
      supportsBackground: true,
      supportsSingleImage: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 2,
    schemaType: 'CARD_SECTION',
    name: 'Card Section',
    description: 'Flexible card-based content section with customizable card layouts',
    category: 'Cards & Grids',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'Cards',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          { id: 'itemTitle', name: 'title', type: 'TEXT', label: 'Card Title', required: true, displayOrder: 1 },
          { id: 'itemDescription', name: 'description', type: 'RICHTEXT', label: 'Card Description', required: false, displayOrder: 2 },
          { id: 'itemImage', name: 'image', type: 'IMAGE', label: 'Card Image', required: false, displayOrder: 3 },
          { id: 'itemLink', name: 'link', type: 'URL', label: 'Card Link', required: false, displayOrder: 4 },
        ],
      },
      { id: 'columns', name: 'columns', type: 'NUMBER', label: 'Number of Columns', required: false, defaultValue: '3', displayOrder: 2 },
    ],
    supportedLayouts: ['GRID', 'ROW', 'CAROUSEL', 'MASONRY'],
    defaultLayout: 'GRID',
    renderingHints: {
      component: 'CardSection',
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsSubtitle: true,
      supportsBackground: true,
      supportsMultipleImages: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 6,
    schemaType: 'PARAGRAPH_CONTENT',
    name: 'Paragraph Content',
    description: 'Rich text content section with HTML formatting support for paragraphs, headings, lists, and more',
    category: 'Content',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      { id: 'richText', name: 'richText', type: 'RICHTEXT', label: 'Content', required: false, placeholder: 'Enter your content here...', displayOrder: 1 },
    ],
    supportedLayouts: ['FULL_WIDTH', 'CONTAINED'],
    defaultLayout: 'CONTAINED',
    renderingHints: {
      component: 'RichTextSection',
      supportsTitle: true,
      supportsSpacing: true,
      supportsRichText: true,
      supportsSubtitle: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 10,
    schemaType: 'FEATURES_GRID',
    name: 'Features Grid',
    description: 'Grid layout for displaying features, services, or key highlights with icons',
    category: 'Cards & Grids',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'Features',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          { id: 'itemTitle', name: 'title', type: 'TEXT', label: 'Feature Title', required: true, displayOrder: 1 },
          { id: 'itemDescription', name: 'description', type: 'RICHTEXT', label: 'Feature Description', required: false, displayOrder: 2 },
          { id: 'itemIcon', name: 'icon', type: 'TEXT', label: 'Icon Name', required: false, placeholder: 'star, check, arrow-right', displayOrder: 3 },
          { id: 'itemImage', name: 'image', type: 'IMAGE', label: 'Feature Image', required: false, displayOrder: 4 },
          { id: 'itemLink', name: 'link', type: 'URL', label: 'Feature Link', required: false, displayOrder: 5 },
        ],
      },
      { id: 'columns', name: 'columns', type: 'NUMBER', label: 'Number of Columns', required: false, defaultValue: '3', displayOrder: 2 },
    ],
    supportedLayouts: ['GRID', 'ROW', 'CAROUSEL'],
    defaultLayout: 'GRID',
    renderingHints: {
      component: 'FeaturesGrid',
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsSubtitle: true,
      supportsBackground: true,
      supportsMultipleImages: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 12,
    schemaType: 'CONTENT_SECTION',
    name: 'Content Section',
    description: 'Rich text content section with HTML formatting support for paragraphs, headings, lists, and more',
    category: 'Content',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      { id: 'richText', name: 'richText', type: 'RICHTEXT', label: 'Content', required: true, placeholder: 'Enter your content here...', displayOrder: 1 },
      {
        id: 'textAlignment',
        name: 'textAlignment',
        type: 'SELECT',
        label: 'Text Alignment',
        options: [{ label: 'Left', value: 'left' }, { label: 'Center', value: 'center' }, { label: 'Right', value: 'right' }, { label: 'Justify', value: 'justify' }],
        required: false,
        defaultValue: 'left',
        displayOrder: 2,
      },
      {
        id: 'maxWidth',
        name: 'maxWidth',
        type: 'SELECT',
        label: 'Content Width',
        options: [{ label: 'Full Width', value: 'full' }, { label: 'Contained', value: 'contained' }, { label: 'Narrow', value: 'narrow' }],
        required: false,
        defaultValue: 'contained',
        displayOrder: 3,
      },
    ],
    supportedLayouts: ['FULL_WIDTH', 'CONTAINED'],
    defaultLayout: 'CONTAINED',
    renderingHints: {
      component: 'ContentSection',
      supportsTitle: true,
      supportsSpacing: true,
      supportsRichText: true,
      supportsSubtitle: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 13,
    schemaType: 'IMAGE_WITH_TEXT',
    name: 'Image with Text',
    description: 'Section with image and accompanying text content, perfect for feature highlights',
    category: 'Content',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      { id: 'image', name: 'image', type: 'IMAGE', label: 'Image', required: true, displayOrder: 1 },
      {
        id: 'imagePosition',
        name: 'imagePosition',
        type: 'SELECT',
        label: 'Image Position',
        options: [{ label: 'Left', value: 'left' }, { label: 'Right', value: 'right' }, { label: 'Top', value: 'top' }, { label: 'Bottom', value: 'bottom' }],
        required: false,
        defaultValue: 'left',
        displayOrder: 2,
      },
      { id: 'title', name: 'title', type: 'TEXT', label: 'Title', required: false, placeholder: 'Enter title', displayOrder: 3 },
      { id: 'content', name: 'content', type: 'RICHTEXT', label: 'Content', required: false, placeholder: 'Enter content...', displayOrder: 4 },
      {
        id: 'cta',
        name: 'cta',
        type: 'GROUP',
        label: 'Call-to-Action',
        required: false,
        displayOrder: 5,
        nestedFields: [
          { id: 'ctaText', name: 'text', type: 'TEXT', label: 'Button Text', required: false, displayOrder: 1 },
          { id: 'ctaLink', name: 'link', type: 'URL', label: 'Button Link', required: false, displayOrder: 2 },
        ],
      },
    ],
    supportedLayouts: ['SPLIT', 'FULL_WIDTH', 'CONTAINED'],
    defaultLayout: 'SPLIT',
    renderingHints: {
      component: 'ImageWithText',
      supportsCTA: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsRichText: true,
      supportsSubtitle: true,
      supportsBackground: true,
      supportsSingleImage: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 14,
    schemaType: 'IMAGE_GALLERY',
    name: 'Image Gallery',
    description: 'Photo gallery with grid, masonry, or carousel layout options',
    category: 'Media',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'Gallery Items',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          { id: 'itemImage', name: 'image', type: 'IMAGE', label: 'Image', required: true, displayOrder: 1 },
          { id: 'itemTitle', name: 'title', type: 'TEXT', label: 'Title', required: false, placeholder: 'Image title', displayOrder: 2 },
          { id: 'itemDescription', name: 'description', type: 'TEXT', label: 'Description', required: false, placeholder: 'Image description', displayOrder: 3 },
          { id: 'itemLink', name: 'link', type: 'URL', label: 'Link', required: false, placeholder: 'Optional link URL', displayOrder: 4 },
        ],
      },
      { id: 'columns', name: 'columns', type: 'NUMBER', label: 'Number of Columns', required: false, defaultValue: '3', displayOrder: 2, validationRules: [{ ruleType: 'MIN', ruleValue: '1' }, { ruleType: 'MAX', ruleValue: '6' }] },
      {
        id: 'imageSpacing',
        name: 'imageSpacing',
        type: 'SELECT',
        label: 'Image Spacing',
        options: [{ label: 'None', value: 'none' }, { label: 'Small', value: 'small' }, { label: 'Medium', value: 'medium' }, { label: 'Large', value: 'large' }],
        required: false,
        defaultValue: 'medium',
        displayOrder: 3,
      },
      { id: 'enableLightbox', name: 'enableLightbox', type: 'BOOLEAN', label: 'Enable Lightbox', required: false, defaultValue: 'true', displayOrder: 4 },
    ],
    supportedLayouts: ['GRID', 'MASONRY', 'CAROUSEL'],
    defaultLayout: 'GRID',
    renderingHints: {
      component: 'ImageGallery',
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsSubtitle: true,
      supportsBackground: true,
      supportsMultipleImages: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 15,
    schemaType: 'VIDEO_SECTION',
    name: 'Video Section',
    description: 'Embedded video section supporting YouTube, Vimeo, or direct video URLs',
    category: 'Media',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      { id: 'videoUrl', name: 'videoUrl', type: 'URL', label: 'Video URL', required: true, placeholder: 'https://www.youtube.com/watch?v=... or https://vimeo.com/... or direct video URL', displayOrder: 1, validationRules: [{ ruleType: 'REGEX', ruleValue: '^(https?:\\/\\/)?(www\\.)?(youtube\\.com|youtu\\.be|vimeo\\.com|.*\\.(mp4|webm|ogg|mov))', errorMessage: 'Please enter a valid video URL (YouTube, Vimeo, or direct video link)' }] },
      { id: 'thumbnailImage', name: 'thumbnailImage', type: 'IMAGE', label: 'Thumbnail Image', required: false, placeholder: 'Custom thumbnail (optional, only for direct video URLs)', displayOrder: 2 },
      {
        id: 'videoSettings',
        name: 'videoSettings',
        type: 'GROUP',
        label: 'Video Settings',
        required: false,
        displayOrder: 3,
        nestedFields: [
          { id: 'autoplay', name: 'autoplay', type: 'BOOLEAN', label: 'Autoplay', required: false, defaultValue: 'false', displayOrder: 1 },
          { id: 'loop', name: 'loop', type: 'BOOLEAN', label: 'Loop', required: false, defaultValue: 'false', displayOrder: 2 },
          { id: 'showControls', name: 'showControls', type: 'BOOLEAN', label: 'Show Controls', required: false, defaultValue: 'true', displayOrder: 3 },
          { id: 'muted', name: 'muted', type: 'BOOLEAN', label: 'Muted', required: false, defaultValue: 'false', displayOrder: 4 },
        ],
      },
      { id: 'title', name: 'title', type: 'TEXT', label: 'Title', required: false, placeholder: 'Video title', displayOrder: 4 },
      { id: 'description', name: 'description', type: 'TEXT', label: 'Description', required: false, placeholder: 'Video description', displayOrder: 5 },
    ],
    supportedLayouts: ['FULL_WIDTH', 'CONTAINED'],
    defaultLayout: 'CONTAINED',
    renderingHints: {
      component: 'VideoSection',
      supportsTitle: true,
      supportsVideo: true,
      supportsSpacing: true,
      supportsSubtitle: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 16,
    schemaType: 'CARD_GRID',
    name: 'Card Grid',
    description: 'Flexible card-based content section with customizable card layouts',
    category: 'Cards & Grids',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'Cards',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          { id: 'itemTitle', name: 'title', type: 'TEXT', label: 'Card Title', required: true, displayOrder: 1, validationRules: [{ ruleType: 'MIN_LENGTH', ruleValue: '1', errorMessage: 'Title is required' }] },
          { id: 'itemSubtitle', name: 'subtitle', type: 'TEXT', label: 'Card Subtitle', required: false, displayOrder: 2 },
          { id: 'itemDescription', name: 'description', type: 'RICHTEXT', label: 'Card Description', required: false, displayOrder: 3 },
          { id: 'itemImage', name: 'image', type: 'IMAGE', label: 'Card Image', required: false, displayOrder: 4 },
          { id: 'itemIcon', name: 'icon', type: 'TEXT', label: 'Icon Name', required: false, placeholder: 'Icon identifier (e.g., star, user, building)', displayOrder: 5 },
          { id: 'itemLink', name: 'link', type: 'URL', label: 'Card Link', required: false, displayOrder: 6 },
          { id: 'itemMetadata', name: 'metadata', type: 'TEXT', label: 'Additional Metadata', required: false, placeholder: 'Optional JSON metadata', displayOrder: 7 },
        ],
      },
      { id: 'columns', name: 'columns', type: 'NUMBER', label: 'Number of Columns', required: false, defaultValue: '3', displayOrder: 2, validationRules: [{ ruleType: 'MIN', ruleValue: '1' }, { ruleType: 'MAX', ruleValue: '6' }] },
      {
        id: 'cardStyle',
        name: 'cardStyle',
        type: 'SELECT',
        label: 'Card Style',
        options: [{ label: 'Default', value: 'default' }, { label: 'Elevated', value: 'elevated' }, { label: 'Outlined', value: 'outlined' }, { label: 'Minimal', value: 'minimal' }],
        required: false,
        defaultValue: 'default',
        displayOrder: 3,
      },
    ],
    supportedLayouts: ['GRID', 'ROW', 'CAROUSEL', 'MASONRY'],
    defaultLayout: 'GRID',
    renderingHints: {
      component: 'CardGrid',
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      itemSupportsIcon: true,
      itemSupportsLink: true,
      supportsSubtitle: true,
      itemSupportsImage: true,
      supportsBackground: true,
      supportsMultipleImages: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 17,
    schemaType: 'STATISTICS_SECTION',
    name: 'Statistics Section',
    description: 'Display statistics and metrics with icons and animated counters',
    category: 'Cards & Grids',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'Statistics',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          { id: 'statValue', name: 'value', type: 'TEXT', label: 'Value', required: true, placeholder: '500+', displayOrder: 1 },
          { id: 'statLabel', name: 'label', type: 'TEXT', label: 'Label', required: true, placeholder: 'Active Users', displayOrder: 2 },
          { id: 'statIcon', name: 'icon', type: 'TEXT', label: 'Icon Name', required: false, placeholder: 'trending-up, users, building, etc.', displayOrder: 3 },
          { id: 'statDescription', name: 'description', type: 'TEXT', label: 'Description', required: false, placeholder: 'Optional description', displayOrder: 4 },
        ],
      },
      { id: 'columns', name: 'columns', type: 'NUMBER', label: 'Number of Columns', required: false, defaultValue: '4', displayOrder: 2, validationRules: [{ ruleType: 'MIN', ruleValue: '1' }, { ruleType: 'MAX', ruleValue: '6' }] },
      { id: 'enableAnimation', name: 'enableAnimation', type: 'BOOLEAN', label: 'Enable Counter Animation', required: false, defaultValue: 'true', displayOrder: 3 },
    ],
    supportedLayouts: ['GRID', 'ROW'],
    defaultLayout: 'GRID',
    renderingHints: {
      component: 'StatisticsSection',
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      itemSupportsIcon: true,
      supportsSubtitle: true,
      itemSupportsValue: true,
      supportsAnimation: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 18,
    schemaType: 'FAQ_SECTION',
    name: 'FAQ Section',
    description: 'Expandable FAQ section with questions and answers in accordion format',
    category: 'Interactive',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'FAQ Items',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          { id: 'faqQuestion', name: 'question', type: 'TEXT', label: 'Question', required: true, placeholder: 'Frequently asked question', displayOrder: 1, validationRules: [{ ruleType: 'MIN_LENGTH', ruleValue: '5', errorMessage: 'Question must be at least 5 characters' }] },
          { id: 'faqAnswer', name: 'answer', type: 'RICHTEXT', label: 'Answer', required: true, placeholder: 'Answer to the question', displayOrder: 2 },
          { id: 'faqCategory', name: 'category', type: 'TEXT', label: 'Category', required: false, placeholder: 'Optional category', displayOrder: 3 },
        ],
      },
      { id: 'allowMultipleOpen', name: 'allowMultipleOpen', type: 'BOOLEAN', label: 'Allow Multiple Items Open', required: false, defaultValue: 'false', displayOrder: 2 },
      { id: 'defaultOpenFirst', name: 'defaultOpenFirst', type: 'BOOLEAN', label: 'Open First Item by Default', required: false, defaultValue: 'false', displayOrder: 3 },
    ],
    supportedLayouts: ['LIST', 'GRID'],
    defaultLayout: 'LIST',
    renderingHints: {
      component: 'FAQSection',
      supportsFAQ: true,
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsSubtitle: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 19,
    schemaType: 'FORM_SECTION',
    name: 'Form Section',
    description: 'Contact or feedback form with customizable fields and validation',
    category: 'Interactive',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'formFields',
        name: 'formFields',
        type: 'ARRAY',
        label: 'Form Fields',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          {
            id: 'fieldType',
            name: 'type',
            type: 'SELECT',
            label: 'Field Type',
            options: [
              { label: 'Text', value: 'text' },
              { label: 'Email', value: 'email' },
              { label: 'Phone', value: 'phone' },
              { label: 'Textarea', value: 'textarea' },
              { label: 'Select', value: 'select' },
              { label: 'Checkbox', value: 'checkbox' },
              { label: 'Radio', value: 'radio' },
              { label: 'Date', value: 'date' },
              { label: 'Number', value: 'number' },
            ],
            required: true,
            displayOrder: 1,
          },
          { id: 'fieldLabel', name: 'label', type: 'TEXT', label: 'Field Label', required: true, displayOrder: 2 },
          { id: 'fieldPlaceholder', name: 'placeholder', type: 'TEXT', label: 'Placeholder', required: false, displayOrder: 3 },
          { id: 'fieldRequired', name: 'required', type: 'BOOLEAN', label: 'Required', required: false, defaultValue: 'false', displayOrder: 4 },
          { id: 'fieldOptions', name: 'options', type: 'TEXT', label: 'Options (comma-separated, for select/radio)', required: false, placeholder: 'Option 1, Option 2, Option 3', displayOrder: 5 },
        ],
      },
      { id: 'submitButtonText', name: 'submitButtonText', type: 'TEXT', label: 'Submit Button Text', required: false, defaultValue: 'Submit', displayOrder: 2 },
      { id: 'formAction', name: 'formAction', type: 'URL', label: 'Form Action URL', required: false, placeholder: '/api/submit-form or https://...', displayOrder: 3 },
      { id: 'successMessage', name: 'successMessage', type: 'TEXT', label: 'Success Message', required: false, defaultValue: 'Thank you! Your submission has been received.', displayOrder: 4 },
    ],
    supportedLayouts: ['CONTAINED', 'FULL_WIDTH'],
    defaultLayout: 'CONTAINED',
    renderingHints: {
      component: 'FormSection',
      supportsForm: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsSubtitle: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 20,
    schemaType: 'TESTIMONIALS_SECTION',
    name: 'Testimonials Section',
    description: 'Customer testimonials and reviews with ratings and author information',
    category: 'Interactive',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'Testimonials',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          { id: 'testimonialText', name: 'text', type: 'RICHTEXT', label: 'Testimonial Text', required: true, displayOrder: 1 },
          { id: 'testimonialAuthor', name: 'author', type: 'TEXT', label: 'Author Name', required: true, displayOrder: 2 },
          { id: 'testimonialRole', name: 'role', type: 'TEXT', label: 'Author Role/Title', required: false, displayOrder: 3 },
          { id: 'testimonialImage', name: 'image', type: 'IMAGE', label: 'Author Image', required: false, displayOrder: 4 },
          { id: 'testimonialRating', name: 'rating', type: 'NUMBER', label: 'Rating (1-5)', required: false, defaultValue: '5', displayOrder: 5, validationRules: [{ ruleType: 'MIN', ruleValue: '1' }, { ruleType: 'MAX', ruleValue: '5' }] },
          { id: 'testimonialCompany', name: 'company', type: 'TEXT', label: 'Company/Organization', required: false, displayOrder: 6 },
        ],
      },
      { id: 'columns', name: 'columns', type: 'NUMBER', label: 'Number of Columns', required: false, defaultValue: '3', displayOrder: 2, validationRules: [{ ruleType: 'MIN', ruleValue: '1' }, { ruleType: 'MAX', ruleValue: '4' }] },
      { id: 'showRatings', name: 'showRatings', type: 'BOOLEAN', label: 'Show Star Ratings', required: false, defaultValue: 'true', displayOrder: 3 },
    ],
    supportedLayouts: ['GRID', 'CAROUSEL', 'ROW'],
    defaultLayout: 'GRID',
    renderingHints: {
      component: 'TestimonialsSection',
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsSubtitle: true,
      itemSupportsImage: true,
      itemSupportsRating: true,
      supportsBackground: true,
      supportsTestimonials: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 21,
    schemaType: 'TIMELINE_SECTION',
    name: 'Timeline Section',
    description: 'Chronological timeline displaying events, milestones, or development history',
    category: 'Interactive',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'Timeline Items',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          { id: 'timelineTitle', name: 'title', type: 'TEXT', label: 'Event Title', required: true, displayOrder: 1 },
          { id: 'timelineDate', name: 'date', type: 'DATE', label: 'Date', required: false, displayOrder: 2 },
          { id: 'timelineDescription', name: 'description', type: 'RICHTEXT', label: 'Description', required: false, displayOrder: 3 },
          { id: 'timelineImage', name: 'image', type: 'IMAGE', label: 'Image', required: false, displayOrder: 4 },
          { id: 'timelineIcon', name: 'icon', type: 'TEXT', label: 'Icon Name', required: false, placeholder: 'calendar, clock, check, etc.', displayOrder: 5 },
        ],
      },
      {
        id: 'timelineOrientation',
        name: 'timelineOrientation',
        type: 'SELECT',
        label: 'Timeline Orientation',
        options: [{ label: 'Vertical', value: 'vertical' }, { label: 'Horizontal', value: 'horizontal' }],
        required: false,
        defaultValue: 'vertical',
        displayOrder: 2,
      },
      { id: 'showDates', name: 'showDates', type: 'BOOLEAN', label: 'Show Dates', required: false, defaultValue: 'true', displayOrder: 3 },
    ],
    supportedLayouts: ['LIST', 'FULL_WIDTH'],
    defaultLayout: 'LIST',
    renderingHints: {
      component: 'TimelineSection',
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      itemSupportsIcon: true,
      supportsSubtitle: true,
      supportsTimeline: true,
      itemSupportsImage: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 22,
    schemaType: 'CALL_TO_ACTION',
    name: 'Call to Action',
    description: 'Prominent call-to-action section with buttons and compelling messaging',
    category: 'Specialized',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      { id: 'title', name: 'title', type: 'TEXT', label: 'Title', required: true, placeholder: 'Compelling headline', displayOrder: 1 },
      { id: 'subtitle', name: 'subtitle', type: 'TEXT', label: 'Subtitle', required: false, placeholder: 'Supporting text', displayOrder: 2 },
      { id: 'content', name: 'content', type: 'RICHTEXT', label: 'Content', required: false, placeholder: 'Additional content', displayOrder: 3 },
      {
        id: 'primaryCTA',
        name: 'primaryCTA',
        type: 'GROUP',
        label: 'Primary Button',
        required: true,
        displayOrder: 4,
        nestedFields: [
          { id: 'primaryCTAText', name: 'text', type: 'TEXT', label: 'Button Text', required: true, displayOrder: 1 },
          { id: 'primaryCTALink', name: 'link', type: 'URL', label: 'Button Link', required: true, displayOrder: 2 },
          {
            id: 'primaryCTAStyle',
            name: 'style',
            type: 'SELECT',
            label: 'Button Style',
            options: [{ label: 'Primary', value: 'primary' }, { label: 'Secondary', value: 'secondary' }, { label: 'Outline', value: 'outline' }],
            required: false,
            defaultValue: 'primary',
            displayOrder: 3,
          },
        ],
      },
      {
        id: 'secondaryCTA',
        name: 'secondaryCTA',
        type: 'GROUP',
        label: 'Secondary Button',
        required: false,
        displayOrder: 5,
        nestedFields: [
          { id: 'secondaryCTAText', name: 'text', type: 'TEXT', label: 'Button Text', required: false, displayOrder: 1 },
          { id: 'secondaryCTALink', name: 'link', type: 'URL', label: 'Button Link', required: false, displayOrder: 2 },
        ],
      },
    ],
    supportedLayouts: ['FULL_WIDTH', 'CONTAINED'],
    defaultLayout: 'CONTAINED',
    renderingHints: {
      component: 'CallToAction',
      supportsCTA: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsRichText: true,
      supportsSubtitle: true,
      supportsAnimation: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 23,
    schemaType: 'CONTACT_INFO',
    name: 'Contact Information',
    description: 'Contact details section with address, phone, email, and office hours',
    category: 'Specialized',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'Contact Methods',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          {
            id: 'contactType',
            name: 'type',
            type: 'SELECT',
            label: 'Contact Type',
            options: [
              { label: 'Phone', value: 'phone' },
              { label: 'Email', value: 'email' },
              { label: 'Address', value: 'address' },
              { label: 'Office Hours', value: 'hours' },
              { label: 'Social Media', value: 'social' },
              { label: 'Other', value: 'other' },
            ],
            required: true,
            displayOrder: 1,
          },
          { id: 'contactLabel', name: 'label', type: 'TEXT', label: 'Label', required: true, placeholder: 'Phone, Email, Address, etc.', displayOrder: 2 },
          { id: 'contactValue', name: 'value', type: 'TEXT', label: 'Value', required: true, placeholder: 'Contact information', displayOrder: 3 },
          { id: 'contactIcon', name: 'icon', type: 'TEXT', label: 'Icon Name', required: false, placeholder: 'phone, mail, map-pin, clock, etc.', displayOrder: 4 },
          { id: 'contactLink', name: 'link', type: 'URL', label: 'Link', required: false, placeholder: 'Optional link URL', displayOrder: 5 },
        ],
      },
      { id: 'showMap', name: 'showMap', type: 'BOOLEAN', label: 'Show Map', required: false, defaultValue: 'false', displayOrder: 2 },
      { id: 'mapCoordinates', name: 'mapCoordinates', type: 'TEXT', label: 'Map Coordinates (latitude, longitude)', required: false, placeholder: '22.9734, 78.6569', displayOrder: 3, conditionalLogic: [{ value: 'true', action: 'SHOW', operator: 'EQUALS', controllingField: 'showMap' }] },
    ],
    supportedLayouts: ['GRID', 'ROW', 'SPLIT'],
    defaultLayout: 'GRID',
    renderingHints: {
      component: 'ContactInfo',
      supportsMap: true,
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      itemSupportsIcon: true,
      itemSupportsLink: true,
      supportsSubtitle: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 24,
    schemaType: 'MAP_SECTION',
    name: 'Map Section',
    description: 'Interactive map showing location with custom markers and zoom controls',
    category: 'Specialized',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      { id: 'coordinates', name: 'coordinates', type: 'TEXT', label: 'Coordinates (latitude, longitude)', required: true, placeholder: '22.9734, 78.6569', displayOrder: 1, validationRules: [{ ruleType: 'REGEX', ruleValue: '^(-?\\d+\\.?\\d*),\\s*(-?\\d+\\.?\\d*)$', errorMessage: 'Please enter coordinates in format: latitude, longitude' }] },
      { id: 'zoomLevel', name: 'zoomLevel', type: 'NUMBER', label: 'Zoom Level', required: false, defaultValue: '15', displayOrder: 2, validationRules: [{ ruleType: 'MIN', ruleValue: '1' }, { ruleType: 'MAX', ruleValue: '20' }] },
      { id: 'markerTitle', name: 'markerTitle', type: 'TEXT', label: 'Marker Title', required: false, placeholder: 'Location name', displayOrder: 3 },
      { id: 'markerDescription', name: 'markerDescription', type: 'TEXT', label: 'Marker Description', required: false, placeholder: 'Location description', displayOrder: 4 },
      { id: 'mapHeight', name: 'mapHeight', type: 'NUMBER', label: 'Map Height (pixels)', required: false, defaultValue: '400', displayOrder: 5, validationRules: [{ ruleType: 'MIN', ruleValue: '200' }, { ruleType: 'MAX', ruleValue: '800' }] },
      { id: 'enableScrollWheel', name: 'enableScrollWheel', type: 'BOOLEAN', label: 'Enable Scroll Wheel Zoom', required: false, defaultValue: 'false', displayOrder: 6 },
    ],
    supportedLayouts: ['FULL_WIDTH', 'CONTAINED'],
    defaultLayout: 'FULL_WIDTH',
    renderingHints: {
      component: 'MapSection',
      supportsMap: true,
      supportsTitle: true,
      supportsSpacing: true,
      supportsSubtitle: true,
      supportsBackground: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  {
    id: 25,
    schemaType: 'NEWS_FEED',
    name: 'News Feed',
    description: 'News articles, announcements, or blog posts in a feed layout',
    category: 'Specialized',
    version: 1,
    isActive: true,
    isSystem: true,
    panchayatId: null,
    fieldDefinitions: [
      {
        id: 'items',
        name: 'items',
        type: 'ARRAY',
        label: 'News Items',
        required: false,
        displayOrder: 1,
        isRepeatable: true,
        nestedFields: [
          { id: 'newsTitle', name: 'title', type: 'TEXT', label: 'Title', required: true, displayOrder: 1 },
          { id: 'newsDate', name: 'date', type: 'DATE', label: 'Date', required: false, displayOrder: 2 },
          { id: 'newsAuthor', name: 'author', type: 'TEXT', label: 'Author', required: false, displayOrder: 3 },
          { id: 'newsSummary', name: 'summary', type: 'TEXT', label: 'Summary', required: false, placeholder: 'Brief summary', displayOrder: 4 },
          { id: 'newsContent', name: 'content', type: 'RICHTEXT', label: 'Content', required: false, displayOrder: 5 },
          { id: 'newsImage', name: 'image', type: 'IMAGE', label: 'Featured Image', required: false, displayOrder: 6 },
          { id: 'newsLink', name: 'link', type: 'URL', label: 'Read More Link', required: false, displayOrder: 7 },
          { id: 'newsCategory', name: 'category', type: 'TEXT', label: 'Category', required: false, displayOrder: 8 },
        ],
      },
      { id: 'itemsPerPage', name: 'itemsPerPage', type: 'NUMBER', label: 'Items Per Page', required: false, defaultValue: '6', displayOrder: 2, validationRules: [{ ruleType: 'MIN', ruleValue: '1' }, { ruleType: 'MAX', ruleValue: '24' }] },
      { id: 'enablePagination', name: 'enablePagination', type: 'BOOLEAN', label: 'Enable Pagination', required: false, defaultValue: 'true', displayOrder: 3 },
      {
        id: 'sortOrder',
        name: 'sortOrder',
        type: 'SELECT',
        label: 'Sort Order',
        options: [{ label: 'Newest First', value: 'newest' }, { label: 'Oldest First', value: 'oldest' }, { label: 'Alphabetical', value: 'alphabetical' }],
        required: false,
        defaultValue: 'newest',
        displayOrder: 4,
      },
    ],
    supportedLayouts: ['GRID', 'LIST', 'CAROUSEL'],
    defaultLayout: 'GRID',
    renderingHints: {
      component: 'NewsFeed',
      supportsItems: true,
      supportsTitle: true,
      supportsSpacing: true,
      itemSupportsLink: true,
      supportsSubtitle: true,
      itemSupportsImage: true,
      supportsBackground: true,
      supportsMultipleImages: true,
    },
    config: { requiresAuth: false, availableForPlatform: true, availableForPanchayat: true },
    i18n: {},
  },
  // Note: More schemas should be loaded from API in production
  // The CSV contains 94 schemas total - this includes all schemas with field definitions (rows 1-25)
];

/**
 * Get schema by type
 */
export function getSchemaByType(schemas: SectionSchema[], schemaType: string): SectionSchema | undefined {
  return schemas.find(s => s.schemaType === schemaType && s.isActive);
}

/**
 * Get schemas by category
 */
export function getSchemasByCategory(schemas: SectionSchema[], category: string): SectionSchema[] {
  return schemas.filter(s => s.category === category && s.isActive);
}

/**
 * Get all unique categories from schemas
 */
export function getCategories(schemas: SectionSchema[]): string[] {
  return Array.from(new Set(schemas.filter(s => s.isActive).map(s => s.category))).sort();
}

