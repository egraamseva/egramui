import React from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import type { LayoutType } from '../../types';
import { Grid3x3, Rows, Scroll, Images, LayoutGrid, List, Split, Maximize2, Container } from 'lucide-react';

interface LayoutTypeSelectorProps {
  value: LayoutType;
  onValueChange: (value: LayoutType) => void;
  label?: string;
  supportedLayouts?: string[];
}

const layoutTypes: { value: LayoutType; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { value: 'GRID', label: 'Grid', description: 'CSS Grid layout with configurable columns', icon: Grid3x3 },
  { value: 'ROW', label: 'Row', description: 'Horizontal flex layout', icon: Rows },
  { value: 'SCROLLING_ROW', label: 'Scrolling Row', description: 'Horizontal scrollable container', icon: Scroll },
  { value: 'CAROUSEL', label: 'Carousel', description: 'Image/content carousel with navigation', icon: Images },
  { value: 'MASONRY', label: 'Masonry', description: 'Pinterest-style irregular grid layout', icon: LayoutGrid },
  { value: 'LIST', label: 'List', description: 'Vertical stacked items list', icon: List },
  { value: 'SPLIT', label: 'Split', description: 'Left-right split with image and content', icon: Split },
  { value: 'FULL_WIDTH', label: 'Full Width', description: 'Edge-to-edge content', icon: Maximize2 },
  { value: 'CONTAINED', label: 'Contained', description: 'Centered with max-width container', icon: Container },
];

export function LayoutTypeSelector({ 
  value, 
  onValueChange, 
  label,
  supportedLayouts
}: LayoutTypeSelectorProps) {
  const { t } = useTranslation();
  const defaultLabel = label || t('sectionManagement.layoutType');

  const getLayoutTypeLabel = (type: string) => {
    const key = type.toLowerCase().replace(/_/g, '');
    return t(`sectionManagement.layoutTypes.${key}`, { defaultValue: type });
  };

  // Filter layouts if supportedLayouts is provided
  const availableLayouts = supportedLayouts 
    ? layoutTypes.filter(type => supportedLayouts.includes(type.value))
    : layoutTypes;

  return (
    <div className="space-y-2">
      <Label htmlFor="layout-type">{defaultLabel} *</Label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="layout-type" className="w-full">
          <SelectValue placeholder={t('sectionManagement.selectLayoutType')} />
        </SelectTrigger>
        <SelectContent className="max-h-[300px]">
          {availableLayouts.map((type) => {
            const Icon = type.icon;
            return (
              <SelectItem key={type.value} value={type.value}>
                <div className="flex items-center gap-2">
                  <Icon className="h-4 w-4 flex-shrink-0" />
                  <div className="min-w-0">
                    <div className="font-medium">{getLayoutTypeLabel(type.value)}</div>
                    <div className="text-xs text-muted-foreground">{type.description}</div>
                  </div>
                </div>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}

