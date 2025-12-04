import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import type { PlatformSectionType, PanchayatSectionType } from '../../types';

interface SectionTypeSelectorProps {
  value: PlatformSectionType | PanchayatSectionType | '';
  onValueChange: (value: PlatformSectionType | PanchayatSectionType) => void;
  isPlatform?: boolean;
  label?: string;
}

export function SectionTypeSelector({ 
  value, 
  onValueChange, 
  isPlatform = false,
  label
}: SectionTypeSelectorProps) {
  const { t } = useTranslation();
  const defaultLabel = label || t('sectionManagement.sectionType');
  
  // Professional generic section types - organized by category
  const allSectionTypes: { value: PlatformSectionType | PanchayatSectionType; label: string; description: string; category: string }[] = [
    // Hero & Banner Sections
    { value: 'HERO_BANNER', label: 'Hero Banner', description: 'Full-width hero section with title, subtitle, background image, and call-to-action buttons', category: 'Hero & Banners' },
    
    // Content Sections
    { value: 'PARAGRAPH_CONTENT', label: 'Paragraph Content', description: 'Rich text content section with HTML formatting support for paragraphs, headings, lists, and more', category: 'Content' },
    { value: 'IMAGE_WITH_TEXT', label: 'Image with Text', description: 'Section with image and accompanying text content, perfect for feature highlights', category: 'Content' },
    { value: 'SPLIT_CONTENT', label: 'Split Content', description: 'Two-column layout with image on one side and text content on the other', category: 'Content' },
    
    // Media Sections
    { value: 'IMAGE_GALLERY', label: 'Image Gallery', description: 'Photo gallery with grid, masonry, or carousel layout options', category: 'Media' },
    { value: 'VIDEO_SECTION', label: 'Video Section', description: 'Embedded video section supporting YouTube, Vimeo, or direct video URLs', category: 'Media' },
    
    // Card & Grid Sections
    { value: 'CARD_SECTION', label: 'Card Section', description: 'Flexible card-based content section with customizable card layouts', category: 'Cards & Grids' },
    { value: 'FEATURES_GRID', label: 'Features Grid', description: 'Grid layout for displaying features, services, or key highlights with icons', category: 'Cards & Grids' },
    { value: 'STATISTICS_SECTION', label: 'Statistics Section', description: 'Display statistics and metrics with icons and animated counters', category: 'Cards & Grids' },
    { value: 'TEAM_MEMBERS', label: 'Team Members', description: 'Grid section for displaying team members or staff with photos and details', category: 'Cards & Grids' },
    
    // Interactive Sections
    { value: 'FAQ_SECTION', label: 'FAQ Section', description: 'Expandable FAQ section with questions and answers in accordion format', category: 'Interactive' },
    { value: 'FORM_SECTION', label: 'Form Section', description: 'Contact or feedback form with customizable fields and validation', category: 'Interactive' },
    { value: 'TESTIMONIALS_SECTION', label: 'Testimonials Section', description: 'Customer testimonials and reviews with ratings and author information', category: 'Interactive' },
    { value: 'TIMELINE_SECTION', label: 'Timeline Section', description: 'Chronological timeline displaying events, milestones, or development history', category: 'Interactive' },
    
    // Specialized Sections
    { value: 'NEWS_FEED', label: 'News Feed', description: 'News articles, announcements, or blog posts in a feed layout', category: 'Specialized' },
    { value: 'SCHEMES_LIST', label: 'Schemes List', description: 'List or grid of schemes, programs, or initiatives with progress indicators', category: 'Specialized' },
    { value: 'CONTACT_INFO', label: 'Contact Information', description: 'Contact details section with address, phone, email, and office hours', category: 'Specialized' },
    { value: 'MAP_SECTION', label: 'Map Section', description: 'Interactive map showing location with custom markers and zoom controls', category: 'Specialized' },
    { value: 'CALL_TO_ACTION', label: 'Call to Action', description: 'Prominent call-to-action section with buttons and compelling messaging', category: 'Specialized' },
    
    // Platform-specific
    { value: 'ACTIVE_PANCHAYATS_GRID', label: 'Active Panchayats Grid', description: 'Grid display of active panchayats (Platform only)', category: 'Platform Specific' },
  ];

  // Filter types based on platform
  const types = isPlatform 
    ? allSectionTypes 
    : allSectionTypes.filter(t => t.value !== 'ACTIVE_PANCHAYATS_GRID');

  // Group types by category
  const groupedTypes = types.reduce((acc, type) => {
    if (!acc[type.category]) {
      acc[type.category] = [];
    }
    acc[type.category].push(type);
    return acc;
  }, {} as Record<string, typeof types>);

  const getSectionTypeLabel = (type: string) => {
    const key = type.toLowerCase().replace(/_/g, '');
    return t(`sectionManagement.sectionTypes.${key}`, { defaultValue: type });
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="section-type">{defaultLabel} *</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="section-type" className="w-full">
          <SelectValue placeholder={t('sectionManagement.selectSectionType')} />
        </SelectTrigger>
        <SelectContent className="max-h-[500px]">
          {Object.entries(groupedTypes).map(([category, categoryTypes]) => (
            <div key={category}>
              <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                {category}
              </div>
              {categoryTypes.map((type) => (
                <SelectItem key={type.value} value={type.value}>
                  <div>
                    <div className="font-medium">{type.label}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </SelectItem>
              ))}
            </div>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

