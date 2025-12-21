import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Loader2, Sparkles, Palette, Globe, Check, Layers, Image as ImageIcon, Users } from 'lucide-react';
import { toast } from 'sonner';
import { panchayatWebsiteApi, type SectionTemplate } from '../../routes/api';

interface TemplateSelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTemplateSelected: (section: any) => void;
  currentSectionsCount: number;
}

export function TemplateSelectionModal({
  isOpen,
  onClose,
  onTemplateSelected,
  currentSectionsCount,
}: TemplateSelectionModalProps) {
  const [templates, setTemplates] = useState<SectionTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [selectedTemplate, setSelectedTemplate] = useState<SectionTemplate | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen, selectedLanguage]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const data = await panchayatWebsiteApi.getTemplates(selectedLanguage);
      console.log('Fetched templates:', data);
      console.log('Page templates:', data.filter(t => t.isPageTemplate));
      setTemplates(data);
    } catch (error: any) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to load templates: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = async (template: SectionTemplate) => {
    if (creating) return;
    
    try {
      setCreating(true);
      setSelectedTemplate(template);
      
      if (template.isPageTemplate) {
        // Create full page from template (multiple sections)
        const sections = await panchayatWebsiteApi.createPageFromTemplate(template.id);
        toast.success(`Page created successfully with ${sections.length} sections!`);
        // Pass the first section to trigger refresh
        onTemplateSelected(sections[0] || sections);
      } else {
        // Create single section from template
        const section = await panchayatWebsiteApi.createSectionFromTemplate(
          template.id,
          currentSectionsCount,
          true
        );
        toast.success('Section created from template successfully!');
        onTemplateSelected(section);
      }
      onClose();
    } catch (error: any) {
      console.error('Error creating from template:', error);
      toast.error('Failed to create: ' + (error.message || 'Unknown error'));
    } finally {
      setCreating(false);
      setSelectedTemplate(null);
    }
  };

  const getColorThemeClass = (theme?: string) => {
    const themeMap: Record<string, string> = {
      'minimalist-blue': 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
      'minimalist-gray': 'bg-gradient-to-br from-gray-50 via-slate-50 to-gray-100',
      'minimalist-white': 'bg-white',
      'warm-orange': 'bg-gradient-to-br from-orange-50 via-amber-50 to-orange-100',
      'green-nature': 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100',
      'professional-blue': 'bg-gradient-to-br from-blue-50 via-indigo-50 to-blue-100',
      'forest-green': 'bg-gradient-to-br from-green-50 via-emerald-50 to-green-100',
      'deep-teal': 'bg-gradient-to-br from-teal-50 via-cyan-50 to-teal-100',
      'warm-pink': 'bg-gradient-to-br from-pink-50 via-rose-50 to-pink-100',
    };
    return themeMap[theme || 'minimalist-blue'] || 'bg-white';
  };

  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'hero':
        return <Sparkles className="h-5 w-5" />;
      case 'content':
        return <Palette className="h-5 w-5" />;
      case 'contact':
        return <Globe className="h-5 w-5" />;
      default:
        return <Sparkles className="h-5 w-5" />;
    }
  };

  const getSectionCount = (template: SectionTemplate): number => {
    try {
      if (template.templateData && typeof template.templateData === 'object') {
        const sections = template.templateData.sections;
        if (Array.isArray(sections)) {
          return sections.length;
        }
      }
    } catch (e) {
      console.warn('Failed to parse template data for section count', e);
    }
    return 0;
  };

  const getTemplateFeatures = (template: SectionTemplate): string[] => {
    const features: string[] = [];
    const sectionCount = getSectionCount(template);
    
    if (sectionCount > 0) {
      features.push(`${sectionCount} pre-configured sections`);
    }
    
    // Check if template has dummy data (most templates do)
    features.push('Dummy data included');
    
    // Check if template has image placeholders
    try {
      if (template.templateData && typeof template.templateData === 'object') {
        const sections = template.templateData.sections;
        if (Array.isArray(sections)) {
          const hasImages = sections.some((s: any) => {
            const content = s.content || {};
            return content.image || (content.items && content.items.some((item: any) => item.image));
          });
          if (hasImages) {
            features.push('Image placeholders');
          }
          
          // Check for social media section
          const hasSocialMedia = sections.some((s: any) => 
            s.sectionType === 'SOCIAL_MEDIA_LINKS' || 
            s.sectionType === 'CARD_SECTION' && s.title?.toLowerCase().includes('social')
          );
          if (hasSocialMedia) {
            features.push('Social media section');
          }
        }
      }
    } catch (e) {
      // Ignore errors
    }
    
    return features;
  };

  // Filter to show only page templates
  const pageTemplates = templates.filter(t => {
    const isPage = t.isPageTemplate === true;
    console.log(`Template ${t.id} (${t.name}): isPageTemplate=${t.isPageTemplate}, isPage=${isPage}`);
    return isPage;
  });
  
  console.log('Total templates:', templates.length);
  console.log('Page templates count:', pageTemplates.length);
  
  // Group templates by category
  const groupedTemplates = pageTemplates.reduce((acc, template) => {
    const category = template.category || 'Full Page';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(template);
    return acc;
  }, {} as Record<string, SectionTemplate[]>);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-[90vw] lg:max-w-6xl xl:max-w-7xl w-full max-h-[90vh] overflow-hidden flex flex-col p-0 bg-white rounded-xl border-0 shadow-2xl">
        <div className="px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 pb-5 sm:pb-6 border-b border-gray-200/80 bg-white">
          <DialogHeader className="text-left">
            <DialogTitle className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">Choose a Page Template</DialogTitle>
            <DialogDescription className="text-gray-600 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">
              Select a complete page template to create all sections at once. You can customize everything later.
            </DialogDescription>
          </DialogHeader>

          {/* Language Selector */}
          <div className="flex items-center gap-3 sm:gap-4 mt-5 sm:mt-6">
            <label className="text-sm font-semibold text-gray-700 flex items-center gap-2 whitespace-nowrap">
              <Globe className="h-4 w-4 text-gray-500" />
              Language:
            </label>
            <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
              <SelectTrigger className="w-[180px] sm:w-[220px] bg-white border-gray-300 shadow-sm hover:border-gray-400 transition-colors">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="hi">हिंदी (Hindi)</SelectItem>
                <SelectItem value="mr">मराठी (Marathi)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 bg-gray-50/30">

          {loading ? (
            <div className="flex items-center justify-center py-16 sm:py-20">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 animate-spin text-primary" />
                <span className="text-muted-foreground text-base sm:text-lg font-medium">Loading templates...</span>
              </div>
            </div>
          ) : pageTemplates.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-100 mb-4 sm:mb-6">
                <Sparkles className="h-8 w-8 sm:h-10 sm:w-10 text-gray-400" />
              </div>
              <p className="text-lg sm:text-xl font-semibold text-gray-800 mb-2">No page templates available for this language.</p>
              <p className="text-sm text-gray-600">Page templates create multiple sections at once.</p>
              {templates.length > 0 && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg max-w-2xl mx-auto">
                  <p className="text-sm text-yellow-800 font-medium">
                    Found {templates.length} template(s) but none are marked as page templates.
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Please ensure the database migration V6 has run successfully.
                  </p>
                  <details className="mt-3 text-xs text-yellow-700">
                    <summary className="cursor-pointer font-medium hover:text-yellow-900">Debug Info</summary>
                    <pre className="mt-2 text-left overflow-auto bg-yellow-100 p-2 rounded text-[10px]">
                      {JSON.stringify(templates.map(t => ({ id: t.id, name: t.name, isPageTemplate: t.isPageTemplate })), null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-8 sm:space-y-10">
              {Object.entries(groupedTemplates).map(([category, categoryTemplates]) => (
                <div key={category}>
                  <h3 className="text-xl sm:text-2xl font-bold mb-5 sm:mb-6 flex items-center gap-2 sm:gap-3 text-gray-900 pb-2 sm:pb-3 border-b border-gray-200">
                    <span className="text-primary">{getCategoryIcon(category)}</span>
                    <span>{category}</span>
                    <span className="text-xs sm:text-sm font-normal text-gray-500 ml-auto">
                      ({categoryTemplates.length} template{categoryTemplates.length !== 1 ? 's' : ''})
                    </span>
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                    {categoryTemplates.map((template) => {
                      const isSelected = selectedTemplate?.id === template.id;
                      const isCreating = creating && isSelected;
                      
                      return (
                        <Card
                          key={template.id}
                          className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.01] ${
                            isSelected ? 'ring-2 ring-primary ring-offset-2 shadow-lg' : 'shadow-sm'
                          } ${getColorThemeClass(template.colorTheme)} h-full flex flex-col border ${
                            isSelected ? 'border-primary' : 'border-gray-200 hover:border-gray-300'
                          } overflow-hidden rounded-lg`}
                          onClick={() => !isCreating && handleTemplateSelect(template)}
                        >
                          <CardHeader className="flex-1 p-0">
                            {template.previewImageUrl ? (
                              <div className="aspect-video w-full overflow-hidden bg-gray-100 relative">
                                <ImageWithFallback
                                  src={template.previewImageUrl}
                                  alt={template.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>
                            ) : (
                              <div className="aspect-video w-full bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 flex items-center justify-center">
                                <Sparkles className="h-12 w-12 text-gray-400" />
                              </div>
                            )}
                            <div className="p-4 sm:p-5">
                              <CardTitle className="text-lg sm:text-xl font-bold mb-2 text-gray-900 leading-tight line-clamp-2">{template.name}</CardTitle>
                              <CardDescription className="text-xs sm:text-sm text-gray-600 line-clamp-2 leading-relaxed mb-3">
                                {template.description}
                              </CardDescription>
                            
                              {/* Section Count and Features */}
                              <div className="space-y-2.5 mt-3">
                                <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-gray-800 bg-gray-50 px-2.5 py-1.5 rounded-md">
                                  <Layers className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary" />
                                  <span>{getSectionCount(template)} sections</span>
                                </div>
                                
                                <div className="flex flex-wrap gap-1.5">
                                  {getTemplateFeatures(template).slice(0, 3).map((feature, idx) => (
                                    <span
                                      key={idx}
                                      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[10px] sm:text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/50"
                                    >
                                      <Check className="h-3 w-3" />
                                      <span className="line-clamp-1">{feature}</span>
                                    </span>
                                  ))}
                                </div>
                                
                                {/* Color Theme Indicator */}
                                {template.colorTheme && (
                                  <div className="flex items-center gap-1.5 text-[10px] sm:text-xs text-gray-600 mt-2 pt-2 border-t border-gray-200">
                                    <Palette className="h-3 w-3 text-gray-500" />
                                    <span className="capitalize font-medium line-clamp-1">{template.colorTheme.replace(/-/g, ' ')}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0 px-4 sm:px-5 pb-4 sm:pb-5">
                            <Button
                              className="w-full font-semibold text-sm sm:text-base h-10 sm:h-11 shadow-sm hover:shadow transition-all duration-200"
                              disabled={isCreating}
                              size="lg"
                              onClick={(e) => {
                                e.stopPropagation();
                                if (!isCreating) {
                                  handleTemplateSelect(template);
                                }
                              }}
                            >
                              {isCreating ? (
                                <>
                                  <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                                  Creating...
                                </>
                              ) : (
                                <>
                                  <Sparkles className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-2" />
                                  Use Template
                                </>
                              )}
                            </Button>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-3 px-4 sm:px-6 lg:px-8 py-4 sm:py-5 border-t border-gray-200 bg-white">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={creating} 
            size="lg"
            className="min-w-[100px] sm:min-w-[120px] font-medium border-gray-300 hover:bg-gray-50 hover:border-gray-400 transition-all"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

