import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Label } from '../ui/label';
import type { PlatformSectionType, PanchayatSectionType } from '../../types';
import type { SectionSchema } from '../../utils/sectionSchemas';
import { HARDCODED_SCHEMAS, isSchemaAvailable, getCategories, getSchemasByCategory } from '../../utils/sectionSchemas';

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
  const [schemas, setSchemas] = useState<SectionSchema[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // TODO: Load schemas from API when available
    // For now, use hardcoded schemas
    // In production: const data = await sectionSchemaApi.getSchemas();
    const availableSchemas = HARDCODED_SCHEMAS.filter(schema => 
      isSchemaAvailable(schema, isPlatform) && schema.isActive
    );
    setSchemas(availableSchemas);
    setLoading(false);
  }, [isPlatform]);

  // Filter schemas based on platform availability
  const availableSchemas = schemas.filter(schema => 
    isSchemaAvailable(schema, isPlatform) && schema.isActive
  );

  // Group schemas by category
  const categories = getCategories(availableSchemas);
  const groupedSchemas = categories.reduce((acc, category) => {
    acc[category] = getSchemasByCategory(availableSchemas, category);
    return acc;
  }, {} as Record<string, SectionSchema[]>);

  // Debug logging
  useEffect(() => {
    console.log('SectionTypeSelector:', {
      value,
      availableSchemasCount: availableSchemas.length,
      categoriesCount: categories.length,
      groupedSchemasKeys: Object.keys(groupedSchemas),
      hasValue: !!value,
      valueInSchemas: availableSchemas.some(s => s.schemaType === value),
    });
  }, [value, availableSchemas, categories, groupedSchemas]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Label htmlFor="section-type">{defaultLabel} *</Label>
        <Select disabled>
          <SelectTrigger id="section-type" className="w-full">
            <SelectValue placeholder="Loading section types..." />
          </SelectTrigger>
        </Select>
      </div>
    );
  }

  // If value exists but not in available schemas, show it as selected but with a warning
  const valueSchema = availableSchemas.find(s => s.schemaType === value);
  const hasValueButNotInSchemas = value && !valueSchema;

  return (
    <div className="space-y-2">
      <Label htmlFor="section-type">{defaultLabel} *</Label>
      {hasValueButNotInSchemas && (
        <div className="mb-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
          ⚠️ Current section type "{value}" is not in available schemas. You can still edit the content below.
        </div>
      )}
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger id="section-type" className="w-full">
          <SelectValue placeholder={t('sectionManagement.selectSectionType')}>
            {valueSchema ? valueSchema.name : value || t('sectionManagement.selectSectionType')}
          </SelectValue>
        </SelectTrigger>
        <SelectContent 
          className="max-h-[400px] min-w-[var(--radix-select-trigger-width)] max-w-[min(500px,90vw)]"
          position="popper"
        >
          <div className="p-1">
            {Object.keys(groupedSchemas).length === 0 ? (
              <div className="px-3 py-4 text-center text-sm text-muted-foreground">
                No section types available
              </div>
            ) : (
              Object.entries(groupedSchemas).map(([category, categorySchemas]) => (
                <div key={category} className="mb-1 last:mb-0">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider bg-muted/50 rounded-sm mb-1 sticky top-0 z-10 backdrop-blur-sm">
                    {category}
                  </div>
                  <div className="space-y-0.5">
                    {categorySchemas.map((schema) => (
                      <SelectItem 
                        key={schema.schemaType} 
                        value={schema.schemaType}
                        className="py-2.5 px-3 cursor-pointer rounded-md hover:bg-accent/80 transition-colors min-h-[60px]"
                      >
                        <div className="flex flex-col gap-1 w-full pr-6">
                          <div className="font-medium text-sm leading-tight text-foreground">{schema.name}</div>
                          <div className="text-xs text-muted-foreground leading-relaxed line-clamp-2 break-words">
                            {schema.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </SelectContent>
      </Select>
    </div>
  );
}

