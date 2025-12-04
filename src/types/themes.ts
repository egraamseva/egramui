/**
 * Website Theme Configuration
 * Defines color schemes and styling for panchayat websites
 */

export interface WebsiteTheme {
  id: string;
  name: string;
  description: string;
  colors: {
    primary: string;        // Main brand color
    secondary: string;      // Secondary/accent color
    background: string;     // Background color
    surface: string;        // Card/surface color
    text: string;          // Primary text color
    textSecondary: string; // Secondary text color
    border: string;        // Border color
    accent: string;        // Accent/highlight color
    success?: string;      // Success color
    warning?: string;      // Warning color
    error?: string;        // Error color
  };
  hero: {
    backgroundGradient?: string; // Gradient for hero section
    overlay?: string;            // Overlay color for hero
    textColor?: string;          // Hero text color
  };
}

/**
 * Predefined themes
 */
export const PREDEFINED_THEMES: WebsiteTheme[] = [
  {
    id: 'default',
    name: 'Default Theme',
    description: 'Original design with red and blue colors',
    colors: {
      primary: '#E31E24',      // Red
      secondary: '#1B2B5E',    // Dark blue
      background: '#FFFFFF',
      surface: '#F5F5F5',
      text: '#1B2B5E',
      textSecondary: '#666666',
      border: '#E5E5E5',
      accent: '#FF9933',       // Orange
      success: '#138808',      // Green
      warning: '#FF9933',
      error: '#E31E24',
    },
    hero: {
      backgroundGradient: 'linear-gradient(to bottom right, #1B2B5E, #2A3F6F, #6C5CE7)',
      overlay: 'rgba(0, 0, 0, 0.2)',
      textColor: '#FFFFFF',
    },
  },
  {
    id: 'modern-blue',
    name: 'Modern Blue',
    description: 'Clean and professional blue theme',
    colors: {
      primary: '#2563EB',
      secondary: '#1E40AF',
      background: '#FFFFFF',
      surface: '#F8FAFC',
      text: '#1E293B',
      textSecondary: '#64748B',
      border: '#E2E8F0',
      accent: '#3B82F6',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    hero: {
      backgroundGradient: 'linear-gradient(135deg, #667EEA 0%, #764BA2 100%)',
      overlay: 'rgba(0, 0, 0, 0.15)',
      textColor: '#FFFFFF',
    },
  },
  {
    id: 'green-nature',
    name: 'Green Nature',
    description: 'Fresh and natural green theme',
    colors: {
      primary: '#059669',
      secondary: '#047857',
      background: '#FFFFFF',
      surface: '#F0FDF4',
      text: '#064E3B',
      textSecondary: '#6B7280',
      border: '#D1FAE5',
      accent: '#10B981',
      success: '#059669',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    hero: {
      backgroundGradient: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
      overlay: 'rgba(0, 0, 0, 0.1)',
      textColor: '#FFFFFF',
    },
  },
  {
    id: 'warm-orange',
    name: 'Warm Orange',
    description: 'Energetic and warm orange theme',
    colors: {
      primary: '#F97316',
      secondary: '#EA580C',
      background: '#FFFFFF',
      surface: '#FFF7ED',
      text: '#7C2D12',
      textSecondary: '#78716C',
      border: '#FED7AA',
      accent: '#FB923C',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    hero: {
      backgroundGradient: 'linear-gradient(135deg, #F97316 0%, #EA580C 100%)',
      overlay: 'rgba(0, 0, 0, 0.15)',
      textColor: '#FFFFFF',
    },
  },
  {
    id: 'elegant-purple',
    name: 'Elegant Purple',
    description: 'Sophisticated purple theme',
    colors: {
      primary: '#7C3AED',
      secondary: '#6D28D9',
      background: '#FFFFFF',
      surface: '#FAF5FF',
      text: '#4C1D95',
      textSecondary: '#6B7280',
      border: '#E9D5FF',
      accent: '#A78BFA',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    hero: {
      backgroundGradient: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)',
      overlay: 'rgba(0, 0, 0, 0.2)',
      textColor: '#FFFFFF',
    },
  },
  {
    id: 'minimal-gray',
    name: 'Minimal Gray',
    description: 'Clean and minimal gray theme',
    colors: {
      primary: '#374151',
      secondary: '#1F2937',
      background: '#FFFFFF',
      surface: '#F9FAFB',
      text: '#111827',
      textSecondary: '#6B7280',
      border: '#E5E7EB',
      accent: '#6366F1',
      success: '#10B981',
      warning: '#F59E0B',
      error: '#EF4444',
    },
    hero: {
      backgroundGradient: 'linear-gradient(135deg, #374151 0%, #1F2937 100%)',
      overlay: 'rgba(0, 0, 0, 0.1)',
      textColor: '#FFFFFF',
    },
  },
];

/**
 * Get theme by ID
 */
export function getThemeById(id: string): WebsiteTheme {
  return PREDEFINED_THEMES.find(theme => theme.id === id) || PREDEFINED_THEMES[0];
}

/**
 * Apply theme CSS variables to document
 */
export function applyTheme(theme: WebsiteTheme) {
  const root = document.documentElement;
  root.style.setProperty('--theme-primary', theme.colors.primary);
  root.style.setProperty('--theme-secondary', theme.colors.secondary);
  root.style.setProperty('--theme-background', theme.colors.background);
  root.style.setProperty('--theme-surface', theme.colors.surface);
  root.style.setProperty('--theme-text', theme.colors.text);
  root.style.setProperty('--theme-text-secondary', theme.colors.textSecondary);
  root.style.setProperty('--theme-border', theme.colors.border);
  root.style.setProperty('--theme-accent', theme.colors.accent);
  if (theme.colors.success) {
    root.style.setProperty('--theme-success', theme.colors.success);
  }
  if (theme.colors.warning) {
    root.style.setProperty('--theme-warning', theme.colors.warning);
  }
  if (theme.colors.error) {
    root.style.setProperty('--theme-error', theme.colors.error);
  }
}

