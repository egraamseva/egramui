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
  const platformTypes: { value: PlatformSectionType; label: string; description: string }[] = [
    { value: 'HERO', label: 'Hero', description: 'Hero section with title, subtitle, CTA buttons, background image' },
    { value: 'STATS', label: 'Statistics', description: 'Statistics cards with icons and animated counters' },
    { value: 'FEATURES', label: 'Features', description: 'Feature cards grid with icons and descriptions' },
    { value: 'ACTIVE_PANCHAYATS', label: 'Active Panchayats', description: 'Panchayat cards grid' },
    { value: 'NEWS', label: 'News', description: 'News cards grid' },
    { value: 'CTA', label: 'Call to Action', description: 'Call-to-action section with buttons' },
    { value: 'GALLERY', label: 'Gallery', description: 'Photo gallery with grid, masonry, or carousel layout' },
    { value: 'CARDS', label: 'Cards', description: 'Generic card-based content section' },
    { value: 'FAQ', label: 'FAQ/Accordion', description: 'Expandable FAQ section with questions and answers' },
    { value: 'FORM', label: 'Form', description: 'Contact or feedback form with custom fields' },
    { value: 'VIDEO', label: 'Video', description: 'Embedded video section (YouTube, Vimeo, or direct)' },
    { value: 'TIMELINE', label: 'Timeline', description: 'Event timeline or development milestones' },
    { value: 'TESTIMONIALS', label: 'Testimonials', description: 'Citizen testimonials with ratings' },
    { value: 'RICH_TEXT', label: 'Rich Text', description: 'Formatted text content with HTML support' },
    { value: 'MAP', label: 'Map', description: 'Interactive map showing location' },
  ];

  const panchayatTypes: { value: PanchayatSectionType; label: string; description: string }[] = [
    { value: 'HERO', label: 'Hero', description: 'Hero section with panchayat branding' },
    { value: 'STATS', label: 'Statistics', description: 'Panchayat statistics (population, area, wards, etc.)' },
    { value: 'ANNOUNCEMENTS', label: 'Announcements', description: 'Latest announcements' },
    { value: 'SCHEMES', label: 'Schemes', description: 'Active schemes grid' },
    { value: 'GALLERY', label: 'Gallery', description: 'Photo gallery grid/carousel' },
    { value: 'MEMBERS', label: 'Members', description: 'Team members grid' },
    { value: 'CONTACT', label: 'Contact', description: 'Contact information and map' },
    { value: 'CARDS', label: 'Cards', description: 'Generic card-based content section' },
    { value: 'FAQ', label: 'FAQ/Accordion', description: 'Expandable FAQ section with questions and answers' },
    { value: 'FORM', label: 'Form', description: 'Contact or feedback form with custom fields' },
    { value: 'VIDEO', label: 'Video', description: 'Embedded video section (YouTube, Vimeo, or direct)' },
    { value: 'TIMELINE', label: 'Timeline', description: 'Event timeline or development milestones' },
    { value: 'TESTIMONIALS', label: 'Testimonials', description: 'Citizen testimonials with ratings' },
    { value: 'RICH_TEXT', label: 'Rich Text', description: 'Formatted text content with HTML support' },
    { value: 'MAP', label: 'Map', description: 'Interactive map showing panchayat location' },
  ];

  const types = isPlatform ? platformTypes : panchayatTypes;

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
        <SelectContent className="max-h-[300px]">
          {types.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div>
                <div className="font-medium">{getSectionTypeLabel(type.value)}</div>
                <div className="text-xs text-muted-foreground">{type.description}</div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

