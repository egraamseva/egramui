import React, { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Plus, Trash2, GripVertical, Image as ImageIcon, Video, FileText, HelpCircle, MapPin, MessageSquare, Clock, Star, ChevronDown, ChevronUp } from 'lucide-react';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Upload, X } from 'lucide-react';
import { Checkbox } from '../ui/checkbox';
import type { PlatformSectionType, PanchayatSectionType, LayoutType, ContentItem, BackgroundConfig, SpacingConfig, AnimationConfig, CTAConfig, FormField, SectionContent, CarouselConfig, CarouselLayoutType, CarouselIndicatorType } from '../../types';
import type { SectionSchema } from '../../utils/sectionSchemas';
import { SchemaFormBuilder } from './SchemaFormBuilder';
import { panchayatWebsiteApi, platformLandingPageApi } from '../../routes/api';
import { validateImageFile } from '../../utils/imageUtils';
import { toast } from 'sonner';

interface SectionContentEditorProps {
  sectionType: PlatformSectionType | PanchayatSectionType | '';
  content: any;
  layoutType: LayoutType;
  isPlatform: boolean;
  schema?: SectionSchema | null;
  onContentChange: (content: any) => void;
  onImageUpload: (file: File, itemIndex: number) => Promise<string | null>;
  onImageRemove: (itemIndex: number) => void;
}

export function SectionContentEditor({
  sectionType,
  content,
  layoutType,
  isPlatform,
  schema,
  onContentChange,
  onImageUpload,
  onImageRemove,
}: SectionContentEditorProps) {
  const [activeTab, setActiveTab] = useState('content');
  const [items, setItems] = useState<ContentItem[]>(content?.items || []);
  const [columns, setColumns] = useState<number>(content?.columns || 3);
  const [autoPlay, setAutoPlay] = useState(content?.autoPlay || false);
  const [interval, setInterval] = useState(content?.interval || 5000);
  const [richText, setRichText] = useState(content?.richText || '');
  const [background, setBackground] = useState<BackgroundConfig>(content?.background || { type: 'color', value: '#ffffff' });
  const [spacing, setSpacing] = useState<SpacingConfig>(content?.spacing || {});
  const [animation, setAnimation] = useState<AnimationConfig>(content?.animation || { type: 'none' });
  const [cta, setCta] = useState<CTAConfig>(content?.cta || { text: 'Learn More', link: '#', style: 'primary', size: 'md' });
  const [formFields, setFormFields] = useState<FormField[]>(content?.formFields || []);
  const [expandedItems, setExpandedItems] = useState<Set<number>>(new Set());
  const [carouselConfig, setCarouselConfig] = useState<CarouselConfig>(content?.carouselConfig || {
    layoutType: 'single',
    indicatorType: 'dots',
    itemsPerView: 1,
    itemsPerViewMobile: 1,
    itemsPerViewTablet: 2,
    autoPlay: false,
    interval: 5000,
    pauseOnHover: true,
    loop: true,
    showArrows: true,
    showIndicators: true,
    transitionDuration: 500,
    gap: 16,
    centeredSlides: false,
    partialVisible: false,
  });

  useEffect(() => {
    // Ensure content is an object, not a string
    let parsedContent = content;
    if (typeof content === 'string') {
      try {
        parsedContent = JSON.parse(content);
      } catch (e) {
        console.warn('Failed to parse content in SectionContentEditor:', e);
        parsedContent = {};
      }
    }
    
    const currentItems = parsedContent?.items || [];
    setItems(currentItems);
    setColumns(parsedContent?.columns || 3);
    setAutoPlay(parsedContent?.autoPlay || false);
    setInterval(parsedContent?.interval || 5000);
    setRichText(parsedContent?.richText || '');
    setBackground(parsedContent?.background || { type: 'color', value: '#ffffff' });
    setSpacing(parsedContent?.spacing || {});
    setAnimation(parsedContent?.animation || { type: 'none' });
    setCta(parsedContent?.cta || { text: 'Learn More', link: '#', style: 'primary', size: 'md' });
    setFormFields(parsedContent?.formFields || []);
    setCarouselConfig(parsedContent?.carouselConfig || {
      layoutType: 'single',
      indicatorType: 'dots',
      itemsPerView: 1,
      itemsPerViewMobile: 1,
      itemsPerViewTablet: 2,
      autoPlay: false,
      interval: 5000,
      pauseOnHover: true,
      loop: true,
      showArrows: true,
      showIndicators: true,
      transitionDuration: 500,
      gap: 16,
      centeredSlides: false,
      partialVisible: false,
    });
  }, [content]);

  const updateContent = (updates: Partial<SectionContent>) => {
    // Ensure we're working with an object, not a string
    let baseContent = content;
    if (typeof content === 'string') {
      try {
        baseContent = JSON.parse(content);
      } catch (e) {
        console.warn('Failed to parse content in updateContent:', e);
        baseContent = {};
      }
    }
    
    const newContent = {
      ...baseContent,
      items,
      columns,
      autoPlay,
      interval,
      richText,
      background,
      spacing,
      animation,
      cta,
      formFields,
      carouselConfig,
      ...updates,
    };
    onContentChange(newContent);
  };

  const addItem = () => {
    const newItem = getDefaultItemForSectionType(sectionType);
    const newItems = [...items, { ...newItem, id: `item-${Date.now()}` }];
    setItems(newItems);
    updateContent({ items: newItems });
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems);
    updateContent({ items: newItems });
    onImageRemove(index);
  };

  const updateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
    updateContent({ items: newItems });
  };

  const moveItem = (fromIndex: number, toIndex: number) => {
    const newItems = [...items];
    const [movedItem] = newItems.splice(fromIndex, 1);
    newItems.splice(toIndex, 0, movedItem);
    setItems(newItems);
    updateContent({ items: newItems });
  };

  const toggleItemExpanded = (index: number) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedItems(newExpanded);
  };

  // Carousel settings - show if layout is CAROUSEL or if schema supports CAROUSEL layout
  const showCarouselSettings = layoutType === 'CAROUSEL' || 
    (schema && schema.supportedLayouts && schema.supportedLayouts.includes('CAROUSEL'));

  // If schema is provided, use schema-based form builder with tabs
  if (schema && schema.fieldDefinitions && schema.fieldDefinitions.length > 0) {
    console.log('SectionContentEditor: Using schema-based form builder', {
      schemaType: schema.schemaType,
      fieldsCount: schema.fieldDefinitions.length,
      hasContent: !!content,
      showCarouselSettings,
    });
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="content" className="space-y-4">
          <SchemaFormBuilder
            fields={schema.fieldDefinitions}
            content={content || {}}
            onChange={onContentChange}
            onImageUpload={async (file: File, fieldName: string) => {
              // Parse fieldName to extract item index if it's in format "items[0].image"
              // Otherwise, it's a direct field and we upload immediately
              let itemIndex = -1;
              
              // Check if fieldName contains array index pattern: "fieldName[index].nestedField"
              const arrayIndexMatch = fieldName.match(/^(\w+)\[(\d+)\]\.(.+)$/);
              if (arrayIndexMatch) {
                const arrayFieldName = arrayIndexMatch[1]; // e.g., "items"
                itemIndex = parseInt(arrayIndexMatch[2], 10); // e.g., 0
                const nestedFieldName = arrayIndexMatch[3]; // e.g., "image"
                
                console.log(`📸 Parsed array field: arrayField=${arrayFieldName}, itemIndex=${itemIndex}, nestedField=${nestedFieldName}`);
                
                // Call the parent onImageUpload with the item index
                if (itemIndex >= 0 && onImageUpload) {
                  return await onImageUpload(file, itemIndex);
                }
              } else {
                // Not an array field - this is a direct field (e.g., IMAGE_WITH_TEXT's "image" field)
                console.log(`📸 Direct field upload: fieldName=${fieldName}`);
                
                try {
                  // Validate the image file
                  await validateImageFile(file);
                  
                  // Upload immediately using the generic upload endpoint
                  const uploadApi = isPlatform ? platformLandingPageApi : panchayatWebsiteApi;
                  console.log(`📤 Uploading image for direct field "${fieldName}" using generic upload endpoint`);
                  
                  const result = await uploadApi.uploadImageGeneric(file, 'HIGH');
                  if (result?.imageUrl) {
                    console.log(`✅ Image uploaded successfully for field "${fieldName}":`, result.imageUrl);
                    return result.imageUrl;
                  } else {
                    console.error('❌ Image upload failed: No imageUrl returned');
                    throw new Error('Image upload failed: No URL returned');
                  }
                } catch (error: any) {
                  console.error('❌ Error uploading image for direct field:', error);
                  toast.error(error.message || 'Failed to upload image');
                  return null;
                }
              }
              
              return null;
            }}
            isPlatform={isPlatform}
            sectionType={sectionType}
          />
        </TabsContent>

        <TabsContent value="design" className="space-y-4">
          <BackgroundEditor background={background} onChange={(bg) => { setBackground(bg); updateContent({ background: bg }); }} />
          <SpacingEditor spacing={spacing} onChange={(sp) => { setSpacing(sp); updateContent({ spacing: sp }); }} />
          <AnimationEditor animation={animation} onChange={(anim) => { setAnimation(anim); updateContent({ animation: anim }); }} />
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          {showCarouselSettings && (
            <>
              {layoutType !== 'CAROUSEL' && (
                <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> Carousel settings are available. Switch to <strong>CAROUSEL</strong> layout type above to use these settings.
                  </p>
                </div>
              )}
              <CarouselConfigEditor 
                config={carouselConfig} 
                onChange={(newConfig) => {
                  setCarouselConfig(newConfig);
                  updateContent({ carouselConfig: newConfig });
                }}
              />
            </>
          )}
          <CTAEditor cta={cta} onChange={(newCta) => { setCta(newCta); updateContent({ cta: newCta }); }} />
        </TabsContent>
      </Tabs>
    );
  }
  
  // No schema - use fallback editor
  console.log('SectionContentEditor: No schema, using fallback editor', {
    sectionType,
    hasContent: !!content,
    itemsCount: content?.items?.length || 0,
  });

  const handleItemImageChange = async (e: React.ChangeEvent<HTMLInputElement>, itemIndex: number) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Validate the image file before accepting it
        await validateImageFile(file);
        
        // Get preview URL (data URL) for display, but don't store it in content yet
        // The actual server URL will be set after upload in SectionEditor
        const previewUrl = await onImageUpload(file, itemIndex);
        if (previewUrl) {
          // Store preview URL temporarily for display only
          // The actual server URL will replace this when the section is saved
          updateItem(itemIndex, 'image', previewUrl);
        }
      } catch (error: any) {
        console.error('Error preparing item image:', error);
        // Reset the input
        e.target.value = '';
        // Show error message if available (toast is handled in SectionEditor)
        if (error.message) {
          console.error('Image validation error:', error.message);
        }
      }
    }
  };

  const getDefaultItemForSectionType = (type: string): ContentItem => {
    switch (type) {
      case 'STATS':
        return { type: 'stat', title: 'Stat Title', value: '0', label: 'Label', icon: 'trending-up' };
      case 'FEATURES':
      case 'SCHEMES':
      case 'CARDS':
        return { type: 'card', title: 'Card Title', description: 'Card description', icon: 'star' };
      case 'NEWS':
      case 'ANNOUNCEMENTS':
        return { type: 'card', title: 'News Title', subtitle: 'Date', description: 'News description' };
      case 'GALLERY':
      case 'IMAGE_GALLERY':
        return { type: 'gallery_item', title: 'Image Title', description: 'Image description' };
      case 'MEMBERS':
        return { type: 'card', title: 'Member Name', subtitle: 'Position', description: 'Member bio' };
      case 'CTA':
        return { type: 'card', title: 'CTA Title', description: 'CTA description', link: '#' };
      case 'CONTACT':
        return { type: 'card', title: 'Contact Method', subtitle: 'Label', description: 'Contact information' };
      case 'FAQ':
        return { type: 'accordion_item', title: 'Question', description: 'Answer' };
      case 'TESTIMONIALS':
        return { type: 'testimonial', title: 'Citizen Name', subtitle: 'Role', description: 'Testimonial text', value: '5' };
      case 'TIMELINE':
        return { type: 'timeline_item', title: 'Event Title', subtitle: 'Date', description: 'Event description' };
      default:
        return { type: 'card', title: 'Item Title', subtitle: 'Subtitle', description: 'Description' };
    }
  };

  const addFormField = () => {
    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false,
    };
    setFormFields([...formFields, newField]);
    updateContent({ formFields: [...formFields, newField] });
  };

  const updateFormField = (index: number, field: Partial<FormField>) => {
    const newFields = [...formFields];
    newFields[index] = { ...newFields[index], ...field };
    setFormFields(newFields);
    updateContent({ formFields: newFields });
  };

  const removeFormField = (index: number) => {
    const newFields = formFields.filter((_, i) => i !== index);
    setFormFields(newFields);
    updateContent({ formFields: newFields });
  };

  // Render item editor based on section type
  const renderItemEditor = (item: ContentItem, index: number) => {
    const isExpanded = expandedItems.has(index);
    
    return (
      <Card key={index} className="border-[#E5E5E5]">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1">
              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => toggleItemExpanded(index)}
                className="flex-1 justify-start"
              >
                <span className="font-semibold">Item {index + 1}</span>
                {item.title && <span className="text-muted-foreground ml-2">- {item.title}</span>}
                {isExpanded ? <ChevronUp className="h-4 w-4 ml-auto" /> : <ChevronDown className="h-4 w-4 ml-auto" />}
              </Button>
            </div>
            <div className="flex items-center gap-1">
              {index > 0 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, index - 1)}
                  title="Move up"
                >
                  ↑
                </Button>
              )}
              {index < items.length - 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => moveItem(index, index + 1)}
                  title="Move down"
                >
                  ↓
                </Button>
              )}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeItem(index)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        {isExpanded && (
          <CardContent className="space-y-4">
            {/* Common fields for most types */}
            {(sectionType !== 'STATS' && sectionType !== 'FAQ') && (
              <>
                <div className="space-y-2">
                  <Label>Title</Label>
                  <Input
                    value={item.title || ''}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    placeholder="Item title"
                  />
                </div>
                {(sectionType === 'NEWS' || sectionType === 'ANNOUNCEMENTS' || sectionType === 'MEMBERS' || 
                  sectionType === 'CONTACT' || sectionType === 'TESTIMONIALS' || sectionType === 'TIMELINE') && (
                  <div className="space-y-2">
                    <Label>Subtitle</Label>
                    <Input
                      value={item.subtitle || ''}
                      onChange={(e) => updateItem(index, 'subtitle', e.target.value)}
                      placeholder="Subtitle (e.g., date, position, role)"
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={item.description || ''}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Item description"
                    rows={3}
                  />
                </div>
              </>
            )}

            {/* STATS specific */}
            {sectionType === 'STATS' && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      value={item.value || ''}
                      onChange={(e) => updateItem(index, 'value', e.target.value)}
                      placeholder="500+"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={item.label || ''}
                      onChange={(e) => updateItem(index, 'label', e.target.value)}
                      placeholder="Active Panchayats"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Icon Name</Label>
                  <Input
                    value={item.icon || ''}
                    onChange={(e) => updateItem(index, 'icon', e.target.value)}
                    placeholder="trending-up, users, building, etc."
                  />
                </div>
              </>
            )}

            {/* FAQ specific */}
            {sectionType === 'FAQ' && (
              <>
                <div className="space-y-2">
                  <Label>Question</Label>
                  <Input
                    value={item.title || ''}
                    onChange={(e) => updateItem(index, 'title', e.target.value)}
                    placeholder="Frequently asked question"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Answer</Label>
                  <Textarea
                    value={item.description || ''}
                    onChange={(e) => updateItem(index, 'description', e.target.value)}
                    placeholder="Answer to the question"
                    rows={4}
                  />
                </div>
              </>
            )}

            {/* TESTIMONIALS specific */}
            {sectionType === 'TESTIMONIALS' && (
              <div className="space-y-2">
                <Label>Rating (1-5)</Label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={item.value || '5'}
                  onChange={(e) => updateItem(index, 'value', e.target.value)}
                />
              </div>
            )}

            {/* Link field for CTA and cards */}
            {(sectionType === 'CTA' || sectionType === 'CARDS' || sectionType === 'FEATURES' || sectionType === 'SCHEMES') && (
              <div className="space-y-2">
                <Label>Link URL</Label>
                <Input
                  value={item.link || ''}
                  onChange={(e) => updateItem(index, 'link', e.target.value)}
                  placeholder="/registration or https://..."
                />
              </div>
            )}

            {/* Image upload for items that support images */}
            {(sectionType === 'FEATURES' || sectionType === 'NEWS' || sectionType === 'ANNOUNCEMENTS' ||
              sectionType === 'SCHEMES' || sectionType === 'GALLERY' || sectionType === 'IMAGE_GALLERY' || 
              sectionType === 'MEMBERS' || sectionType === 'CARDS' || sectionType === 'TESTIMONIALS' || 
              sectionType === 'TIMELINE' || (!sectionType)) && 
              sectionType !== 'CONTACT' && sectionType !== 'STATS' && sectionType !== 'FAQ' && (
              <div className="space-y-2">
                <Label>Image</Label>
                {item.image ? (
                  <div className="space-y-3">
                    <div className="relative">
                      <ImageWithFallback
                        src={item.image}
                        alt={item.title || 'Preview'}
                        className="w-full h-32 rounded-lg"
                        style={{ objectFit: item.imageFit || 'cover' }}
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          updateItem(index, 'image', '');
                          onImageRemove(index);
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-image-fit-${index}`} className="text-xs">Image Display Style</Label>
                      <Select
                        value={item.imageFit || 'cover'}
                        onValueChange={(value) => updateItem(index, 'imageFit', value)}
                      >
                        <SelectTrigger id={`item-image-fit-${index}`} className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover - Fill container, may crop</SelectItem>
                          <SelectItem value="contain">Contain - Fit entire image, may have gaps</SelectItem>
                          <SelectItem value="fill">Fill - Stretch to fill container</SelectItem>
                          <SelectItem value="none">None - Original size</SelectItem>
                          <SelectItem value="scale-down">Scale Down - Like none or contain, whichever is smaller</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="border-2 border-dashed rounded-lg p-4 text-center">
                      <Upload className="h-6 w-6 mx-auto mb-2 text-muted-foreground" />
                      <Label htmlFor={`item-image-${index}`} className="cursor-pointer text-sm">
                        <span className="text-muted-foreground">Click to upload</span>
                        <Input
                          id={`item-image-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleItemImageChange(e, index)}
                          className="hidden"
                        />
                      </Label>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={`item-image-fit-default-${index}`} className="text-xs">Image Display Style (applied after upload)</Label>
                      <Select
                        value={item.imageFit || 'cover'}
                        onValueChange={(value) => updateItem(index, 'imageFit', value)}
                      >
                        <SelectTrigger id={`item-image-fit-default-${index}`} className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cover">Cover - Fill container, may crop</SelectItem>
                          <SelectItem value="contain">Contain - Fit entire image, may have gaps</SelectItem>
                          <SelectItem value="fill">Fill - Stretch to fill container</SelectItem>
                          <SelectItem value="none">None - Original size</SelectItem>
                          <SelectItem value="scale-down">Scale Down - Like none or contain, whichever is smaller</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        Choose how the image should be displayed within its container
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  // Special sections that don't use items array
  if (sectionType === 'HERO') {
    return (
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="content">Content</TabsTrigger>
          <TabsTrigger value="design">Design</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>
        <TabsContent value="content" className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Hero sections use the section title, subtitle, and background image fields above.
            You can add additional content items below if needed.
          </p>
          {items.length > 0 && (
            <div className="space-y-4">
              {items.map((item, index) => renderItemEditor(item, index))}
            </div>
          )}
          <Button type="button" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Hero Item
          </Button>
        </TabsContent>
        <TabsContent value="design" className="space-y-4">
          <BackgroundEditor background={background} onChange={(bg) => { setBackground(bg); updateContent({ background: bg }); }} />
          <SpacingEditor spacing={spacing} onChange={(sp) => { setSpacing(sp); updateContent({ spacing: sp }); }} />
        </TabsContent>
        <TabsContent value="advanced" className="space-y-4">
          <AnimationEditor animation={animation} onChange={(anim) => { setAnimation(anim); updateContent({ animation: anim }); }} />
          <CTAEditor cta={cta} onChange={(newCta) => { setCta(newCta); updateContent({ cta: newCta }); }} />
        </TabsContent>
      </Tabs>
    );
  }

  if (sectionType === 'RICH_TEXT') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Rich Text Content (HTML)</Label>
          <Textarea
            value={richText}
            onChange={(e) => {
              setRichText(e.target.value);
              updateContent({ richText: e.target.value });
            }}
            placeholder="Enter HTML content or formatted text..."
            rows={10}
            className="font-mono text-sm"
          />
          <p className="text-xs text-muted-foreground">
            You can use HTML tags for formatting. For example: &lt;p&gt;Paragraph&lt;/p&gt;, &lt;h2&gt;Heading&lt;/h2&gt;, &lt;ul&gt;&lt;li&gt;List item&lt;/li&gt;&lt;/ul&gt;
          </p>
        </div>
      </div>
    );
  }

  if (sectionType === 'FORM') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Form Fields</Label>
          <div className="space-y-4">
            {formFields.map((field, index) => (
              <Card key={field.id} className="p-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Field {index + 1}</Label>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFormField(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Field Type</Label>
                      <Select
                        value={field.type}
                        onValueChange={(value) => updateFormField(index, { type: value as any })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="text">Text</SelectItem>
                          <SelectItem value="email">Email</SelectItem>
                          <SelectItem value="phone">Phone</SelectItem>
                          <SelectItem value="textarea">Textarea</SelectItem>
                          <SelectItem value="select">Select</SelectItem>
                          <SelectItem value="checkbox">Checkbox</SelectItem>
                          <SelectItem value="radio">Radio</SelectItem>
                          <SelectItem value="date">Date</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Label</Label>
                      <Input
                        value={field.label}
                        onChange={(e) => updateFormField(index, { label: e.target.value })}
                        placeholder="Field label"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Placeholder</Label>
                    <Input
                      value={field.placeholder || ''}
                      onChange={(e) => updateFormField(index, { placeholder: e.target.value })}
                      placeholder="Placeholder text"
                    />
                  </div>
                  {(field.type === 'select' || field.type === 'radio') && (
                    <div className="space-y-2">
                      <Label>Options (comma-separated)</Label>
                      <Input
                        value={field.options?.join(', ') || ''}
                        onChange={(e) => updateFormField(index, { options: e.target.value.split(',').map(o => o.trim()) })}
                        placeholder="Option 1, Option 2, Option 3"
                      />
                    </div>
                  )}
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id={`required-${field.id}`}
                      checked={field.required}
                      onCheckedChange={(checked) => updateFormField(index, { required: checked as boolean })}
                    />
                    <Label htmlFor={`required-${field.id}`} className="cursor-pointer">Required field</Label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Button type="button" variant="outline" onClick={addFormField}>
            <Plus className="h-4 w-4 mr-2" />
            Add Form Field
          </Button>
        </div>
      </div>
    );
  }

  if (sectionType === 'VIDEO' || sectionType === 'VIDEO_SECTION') {
    // Helper function to validate and format video URLs
    const validateVideoUrl = (url: string): { isValid: boolean; type: 'youtube' | 'vimeo' | 'direct' | 'invalid'; message?: string } => {
      if (!url.trim()) {
        return { isValid: false, type: 'invalid', message: 'Please enter a video URL' };
      }
      
      // YouTube URL patterns
      if (url.includes('youtube.com/watch') || url.includes('youtu.be/') || url.includes('youtube.com/embed/')) {
        const videoId = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&\n?#]+)/)?.[1];
        if (videoId) {
          return { isValid: true, type: 'youtube' };
        }
        return { isValid: false, type: 'invalid', message: 'Invalid YouTube URL format' };
      }
      
      // Vimeo URL patterns
      if (url.includes('vimeo.com/')) {
        const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
        if (videoId) {
          return { isValid: true, type: 'vimeo' };
        }
        return { isValid: false, type: 'invalid', message: 'Invalid Vimeo URL format' };
      }
      
      // Direct video URL (mp4, webm, etc.)
      if (url.match(/\.(mp4|webm|ogg|mov)(\?.*)?$/i)) {
        return { isValid: true, type: 'direct' };
      }
      
      // Check if it's a valid URL
      try {
        new URL(url);
        return { isValid: true, type: 'direct' };
      } catch {
        return { isValid: false, type: 'invalid', message: 'Invalid URL format' };
      }
    };

    const videoUrl = content?.media?.url || '';
    const validation = validateVideoUrl(videoUrl);
    
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="video-url">Video URL *</Label>
          <Input
            id="video-url"
            value={videoUrl}
            onChange={(e) => {
              const newUrl = e.target.value;
              updateContent({ 
                media: { 
                  ...content?.media, 
                  url: newUrl, 
                  type: 'video' 
                } 
              });
            }}
            placeholder="https://www.youtube.com/watch?v=... or https://vimeo.com/... or https://example.com/video.mp4"
            className={validation.isValid === false && videoUrl ? 'border-red-500' : ''}
          />
          {videoUrl && (
            <div className="text-xs space-y-1">
              {validation.isValid ? (
                <p className="text-green-600 flex items-center gap-1">
                  <span>✓</span> Valid {validation.type === 'youtube' ? 'YouTube' : validation.type === 'vimeo' ? 'Vimeo' : 'video'} URL
                </p>
              ) : (
                <p className="text-red-600 flex items-center gap-1">
                  <span>✗</span> {validation.message || 'Invalid video URL'}
                </p>
              )}
              <p className="text-muted-foreground">
                Supported: YouTube (watch or embed URLs), Vimeo, or direct video links (.mp4, .webm, etc.)
              </p>
            </div>
          )}
        </div>
        
        {validation.isValid && validation.type !== 'direct' && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <strong>Preview:</strong> Your {validation.type === 'youtube' ? 'YouTube' : 'Vimeo'} video will be embedded automatically.
            </p>
          </div>
        )}
        
        <div className="space-y-2">
          <Label htmlFor="video-thumbnail">Thumbnail Image URL (optional)</Label>
          <Input
            id="video-thumbnail"
            value={content?.media?.thumbnail || ''}
            onChange={(e) => updateContent({ media: { ...content?.media, thumbnail: e.target.value } })}
            placeholder="https://example.com/thumbnail.jpg"
          />
          <p className="text-xs text-muted-foreground">
            Custom thumbnail image (only used for direct video URLs)
          </p>
        </div>
        
        <div className="space-y-3">
          <Label>Video Settings</Label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Checkbox
                id="autoplay"
                checked={content?.media?.autoplay || false}
                onCheckedChange={(checked) => updateContent({ media: { ...content?.media, autoplay: checked as boolean } })}
              />
              <Label htmlFor="autoplay" className="cursor-pointer text-sm">Autoplay</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Checkbox
                id="loop"
                checked={content?.media?.loop || false}
                onCheckedChange={(checked) => updateContent({ media: { ...content?.media, loop: checked as boolean } })}
              />
              <Label htmlFor="loop" className="cursor-pointer text-sm">Loop</Label>
            </div>
            <div className="flex items-center space-x-2 p-3 border rounded-lg">
              <Checkbox
                id="controls"
                checked={content?.media?.controls !== false}
                onCheckedChange={(checked) => updateContent({ media: { ...content?.media, controls: checked as boolean } })}
              />
              <Label htmlFor="controls" className="cursor-pointer text-sm">Show Controls</Label>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (sectionType === 'MAP') {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Map Coordinates (latitude, longitude)</Label>
          <Input
            value={content?.customSettings?.coordinates || ''}
            onChange={(e) => updateContent({ customSettings: { ...content?.customSettings, coordinates: e.target.value } })}
            placeholder="22.9734, 78.6569"
          />
          <p className="text-xs text-muted-foreground">Enter coordinates in format: latitude, longitude</p>
        </div>
        <div className="space-y-2">
          <Label>Zoom Level</Label>
          <Input
            type="number"
            min="1"
            max="20"
            value={content?.customSettings?.zoom || 15}
            onChange={(e) => updateContent({ customSettings: { ...content?.customSettings, zoom: parseInt(e.target.value) || 15 } })}
          />
        </div>
      </div>
    );
  }

  // Grid layout columns selector
  const showColumnsSelector = layoutType === 'GRID' && (
    sectionType === 'FEATURES' || sectionType === 'SCHEMES' || sectionType === 'GALLERY' || 
    sectionType === 'CARDS' || sectionType === 'STATS' || !sectionType
  );

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="content">Content</TabsTrigger>
        <TabsTrigger value="design">Design</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      
      <TabsContent value="content" className="space-y-4">
        {showColumnsSelector && (
          <div className="space-y-2">
            <Label>Grid Columns</Label>
            <Input
              type="number"
              min="1"
              max="6"
              value={columns}
              onChange={(e) => {
                const newColumns = parseInt(e.target.value) || 3;
                setColumns(newColumns);
                updateContent({ columns: newColumns });
              }}
            />
            <p className="text-xs text-muted-foreground">Number of columns in the grid layout (1-6)</p>
          </div>
        )}

        <div className="space-y-4">
          {items.map((item, index) => renderItemEditor(item, index))}
        </div>

        <Button type="button" variant="outline" onClick={addItem}>
          <Plus className="h-4 w-4 mr-2" />
          Add {sectionType === 'STATS' ? 'Stat' : 
                sectionType === 'FEATURES' ? 'Feature' : 
                sectionType === 'NEWS' ? 'News Item' : 
                sectionType === 'ANNOUNCEMENTS' ? 'Announcement' : 
                sectionType === 'SCHEMES' ? 'Scheme' : 
                sectionType === 'GALLERY' ? 'Gallery Item' : 
                sectionType === 'MEMBERS' ? 'Member' : 
                sectionType === 'CARDS' ? 'Card' :
                sectionType === 'FAQ' ? 'FAQ Item' :
                sectionType === 'TESTIMONIALS' ? 'Testimonial' :
                sectionType === 'TIMELINE' ? 'Timeline Item' :
                sectionType === 'CTA' ? 'CTA Item' : 
                sectionType === 'CONTACT' ? 'Contact Method' : 'Item'}
        </Button>
      </TabsContent>

      <TabsContent value="design" className="space-y-4">
        <BackgroundEditor background={background} onChange={(bg) => { setBackground(bg); updateContent({ background: bg }); }} />
        <SpacingEditor spacing={spacing} onChange={(sp) => { setSpacing(sp); updateContent({ spacing: sp }); }} />
        <AnimationEditor animation={animation} onChange={(anim) => { setAnimation(anim); updateContent({ animation: anim }); }} />
      </TabsContent>

      <TabsContent value="settings" className="space-y-4">
        {showCarouselSettings && (
          <>
            {layoutType !== 'CAROUSEL' && (
              <div className="p-3 border rounded-lg bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Carousel settings are available. Switch to <strong>CAROUSEL</strong> layout type above to use these settings.
                </p>
              </div>
            )}
            <CarouselConfigEditor 
              config={carouselConfig} 
              onChange={(newConfig) => {
                setCarouselConfig(newConfig);
                updateContent({ carouselConfig: newConfig });
              }}
            />
          </>
        )}
        <CTAEditor cta={cta} onChange={(newCta) => { setCta(newCta); updateContent({ cta: newCta }); }} />
      </TabsContent>
    </Tabs>
  );
}

// Background Editor Component
function BackgroundEditor({ background, onChange }: { background: BackgroundConfig; onChange: (bg: BackgroundConfig) => void }) {
  return (
    <div className="space-y-4">
      <Label>Background</Label>
      <Select
        value={background.type}
        onValueChange={(value) => onChange({ ...background, type: value as any })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="color">Solid Color</SelectItem>
          <SelectItem value="gradient">Gradient</SelectItem>
          <SelectItem value="image">Image</SelectItem>
          <SelectItem value="video">Video</SelectItem>
        </SelectContent>
      </Select>
      <div className="space-y-2">
        <Label>Value</Label>
        {background.type === 'color' && (
          <div className="flex gap-2">
            <Input
              type="color"
              value={background.value || '#ffffff'}
              onChange={(e) => onChange({ ...background, value: e.target.value })}
              className="w-20 h-10"
            />
            <Input
              value={background.value || '#ffffff'}
              onChange={(e) => onChange({ ...background, value: e.target.value })}
              placeholder="#ffffff"
            />
          </div>
        )}
        {(background.type === 'gradient' || background.type === 'image' || background.type === 'video') && (
          <Input
            value={background.value || ''}
            onChange={(e) => onChange({ ...background, value: e.target.value })}
            placeholder={background.type === 'gradient' ? 'linear-gradient(to right, #ff0000, #0000ff)' : 'URL'}
          />
        )}
      </div>
      {background.type === 'image' && (
        <div className="flex items-center space-x-2">
          <Checkbox
            id="parallax"
            checked={background.parallax}
            onCheckedChange={(checked) => onChange({ ...background, parallax: checked as boolean })}
          />
          <Label htmlFor="parallax" className="cursor-pointer">Parallax Effect</Label>
        </div>
      )}
      {background.overlay && (
        <div className="space-y-2">
          <Label>Overlay Color</Label>
          <div className="flex gap-2">
            <Input
              type="color"
              value={background.overlay.split(',')[0] || '#000000'}
              onChange={(e) => onChange({ ...background, overlay: `${e.target.value}, 0.5` })}
              className="w-20 h-10"
            />
            <Input
              type="text"
              value={background.overlay}
              onChange={(e) => onChange({ ...background, overlay: e.target.value })}
              placeholder="rgba(0,0,0,0.5)"
            />
          </div>
        </div>
      )}
    </div>
  );
}

// Spacing Editor Component
function SpacingEditor({ spacing, onChange }: { spacing: SpacingConfig; onChange: (sp: SpacingConfig) => void }) {
  return (
    <div className="space-y-4">
      <Label>Spacing</Label>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Padding</Label>
          <Input
            type="number"
            value={spacing.padding || 0}
            onChange={(e) => onChange({ ...spacing, padding: parseInt(e.target.value) || 0 })}
          />
        </div>
        <div className="space-y-2">
          <Label>Margin</Label>
          <Input
            type="number"
            value={spacing.margin || 0}
            onChange={(e) => onChange({ ...spacing, margin: parseInt(e.target.value) || 0 })}
          />
        </div>
      </div>
    </div>
  );
}

// Animation Editor Component
function AnimationEditor({ animation, onChange }: { animation: AnimationConfig; onChange: (anim: AnimationConfig) => void }) {
  return (
    <div className="space-y-4">
      <Label>Animation</Label>
      <Select
        value={animation.type || 'none'}
        onValueChange={(value) => onChange({ ...animation, type: value as any })}
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">None</SelectItem>
          <SelectItem value="fade-in">Fade In</SelectItem>
          <SelectItem value="slide-in">Slide In</SelectItem>
          <SelectItem value="zoom">Zoom</SelectItem>
        </SelectContent>
      </Select>
      {animation.type !== 'none' && (
        <>
          <div className="space-y-2">
            <Label>Delay (ms)</Label>
            <Input
              type="number"
              value={animation.delay || 0}
              onChange={(e) => onChange({ ...animation, delay: parseInt(e.target.value) || 0 })}
            />
          </div>
          <div className="space-y-2">
            <Label>Duration (ms)</Label>
            <Input
              type="number"
              value={animation.duration || 500}
              onChange={(e) => onChange({ ...animation, duration: parseInt(e.target.value) || 500 })}
            />
          </div>
        </>
      )}
    </div>
  );
}

// Carousel Config Editor Component
function CarouselConfigEditor({ config, onChange }: { config: CarouselConfig; onChange: (config: CarouselConfig) => void }) {
  return (
    <div className="space-y-6 p-4 border rounded-lg bg-blue-50 border-blue-200">
      <div className="space-y-2">
        <Label className="text-base font-semibold">Carousel Configuration</Label>
        <p className="text-xs text-muted-foreground">
          Configure carousel layout, indicators, and behavior
        </p>
      </div>

      {/* Layout Type */}
      <div className="space-y-2">
        <Label htmlFor="carousel-layout-type">Layout Type</Label>
        <Select
          value={config.layoutType || 'single'}
          onValueChange={(value) => onChange({ ...config, layoutType: value as CarouselLayoutType })}
        >
          <SelectTrigger id="carousel-layout-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="single">Single - One item visible at a time</SelectItem>
            <SelectItem value="multi">Multi - Multiple items visible (configurable)</SelectItem>
            <SelectItem value="centered">Centered - Active item centered with partial prev/next</SelectItem>
            <SelectItem value="full-width">Full Width - Slide occupies entire viewport</SelectItem>
            <SelectItem value="thumbnail">Thumbnail - Main carousel with thumbnail navigation</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Items Per View (for multi layout) */}
      {(config.layoutType === 'multi' || config.layoutType === 'centered') && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="items-per-view-desktop">Items Per View (Desktop)</Label>
            <Input
              id="items-per-view-desktop"
              type="number"
              min="1"
              max="6"
              value={config.itemsPerView || 1}
              onChange={(e) => onChange({ ...config, itemsPerView: parseInt(e.target.value) || 1 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="items-per-view-tablet">Items Per View (Tablet)</Label>
            <Input
              id="items-per-view-tablet"
              type="number"
              min="1"
              max="4"
              value={config.itemsPerViewTablet || 2}
              onChange={(e) => onChange({ ...config, itemsPerViewTablet: parseInt(e.target.value) || 2 })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="items-per-view-mobile">Items Per View (Mobile)</Label>
            <Input
              id="items-per-view-mobile"
              type="number"
              min="1"
              max="2"
              value={config.itemsPerViewMobile || 1}
              onChange={(e) => onChange({ ...config, itemsPerViewMobile: parseInt(e.target.value) || 1 })}
            />
          </div>
        </div>
      )}

      {/* Indicator Type */}
      <div className="space-y-2">
        <Label htmlFor="carousel-indicator-type">Indicator Type</Label>
        <Select
          value={config.indicatorType || 'dots'}
          onValueChange={(value) => onChange({ ...config, indicatorType: value as CarouselIndicatorType })}
        >
          <SelectTrigger id="carousel-indicator-type">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dots">Dots - Dot indicators (default)</SelectItem>
            <SelectItem value="progress">Progress - Progress bar indicator</SelectItem>
            <SelectItem value="numbered">Numbered - Numbered indicators (e.g., 1 / 5)</SelectItem>
            <SelectItem value="arrows-only">Arrows Only - No indicators, arrows only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Auto-play Settings */}
      <div className="space-y-4 p-3 border rounded-lg bg-white">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="carousel-autoplay"
            checked={config.autoPlay || false}
            onCheckedChange={(checked) => onChange({ ...config, autoPlay: checked as boolean })}
          />
          <Label htmlFor="carousel-autoplay" className="cursor-pointer font-medium">
            Enable Auto-Play
          </Label>
        </div>
        
        {config.autoPlay && (
          <div className="space-y-2 pl-6">
            <Label htmlFor="carousel-interval">Auto-Play Interval (milliseconds)</Label>
            <Input
              id="carousel-interval"
              type="number"
              min="1000"
              step="500"
              value={config.interval || 5000}
              onChange={(e) => onChange({ ...config, interval: parseInt(e.target.value) || 5000 })}
            />
            <p className="text-xs text-muted-foreground">
              Time between automatic slides (minimum: 1000ms). Current: {config.interval || 5000}ms
            </p>
            
            <div className="flex items-center space-x-2 mt-2">
              <Checkbox
                id="carousel-pause-on-hover"
                checked={config.pauseOnHover !== false}
                onCheckedChange={(checked) => onChange({ ...config, pauseOnHover: checked as boolean })}
              />
              <Label htmlFor="carousel-pause-on-hover" className="cursor-pointer text-sm">
                Pause on Hover
              </Label>
            </div>
          </div>
        )}
      </div>

      {/* Navigation Settings */}
      <div className="space-y-4 p-3 border rounded-lg bg-white">
        <Label className="text-sm font-semibold">Navigation Settings</Label>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="carousel-show-arrows"
            checked={config.showArrows !== false}
            onCheckedChange={(checked) => onChange({ ...config, showArrows: checked as boolean })}
          />
          <Label htmlFor="carousel-show-arrows" className="cursor-pointer text-sm">
            Show Navigation Arrows
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="carousel-show-indicators"
            checked={config.showIndicators !== false}
            onCheckedChange={(checked) => onChange({ ...config, showIndicators: checked as boolean })}
          />
          <Label htmlFor="carousel-show-indicators" className="cursor-pointer text-sm">
            Show Indicators
          </Label>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="carousel-loop"
            checked={config.loop !== false}
            onCheckedChange={(checked) => onChange({ ...config, loop: checked as boolean })}
          />
          <Label htmlFor="carousel-loop" className="cursor-pointer text-sm">
            Infinite Loop
          </Label>
        </div>
      </div>

      {/* Advanced Settings */}
      <div className="space-y-4 p-3 border rounded-lg bg-white">
        <Label className="text-sm font-semibold">Advanced Settings</Label>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="carousel-transition-duration">Transition Duration (ms)</Label>
            <Input
              id="carousel-transition-duration"
              type="number"
              min="100"
              max="2000"
              step="100"
              value={config.transitionDuration || 500}
              onChange={(e) => onChange({ ...config, transitionDuration: parseInt(e.target.value) || 500 })}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="carousel-gap">Gap Between Items (px)</Label>
            <Input
              id="carousel-gap"
              type="number"
              min="0"
              max="48"
              step="4"
              value={config.gap || 16}
              onChange={(e) => onChange({ ...config, gap: parseInt(e.target.value) || 16 })}
            />
          </div>
        </div>

        {config.layoutType === 'centered' && (
          <>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="carousel-centered-slides"
                checked={config.centeredSlides || false}
                onCheckedChange={(checked) => onChange({ ...config, centeredSlides: checked as boolean })}
              />
              <Label htmlFor="carousel-centered-slides" className="cursor-pointer text-sm">
                Center Slides
              </Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="carousel-partial-visible"
                checked={config.partialVisible || false}
                onCheckedChange={(checked) => onChange({ ...config, partialVisible: checked as boolean })}
              />
              <Label htmlFor="carousel-partial-visible" className="cursor-pointer text-sm">
                Show Partial Previous/Next Slides
              </Label>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// CTA Editor Component
function CTAEditor({ cta, onChange }: { cta: CTAConfig; onChange: (cta: CTAConfig) => void }) {
  return (
    <div className="space-y-4">
      <Label>Call-to-Action</Label>
      <div className="space-y-2">
        <Label>Button Text</Label>
        <Input
          value={cta.text}
          onChange={(e) => onChange({ ...cta, text: e.target.value })}
          placeholder="Learn More"
        />
      </div>
      <div className="space-y-2">
        <Label>Link URL</Label>
        <Input
          value={cta.link}
          onChange={(e) => onChange({ ...cta, link: e.target.value })}
          placeholder="/registration or https://..."
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Style</Label>
          <Select
            value={cta.style}
            onValueChange={(value) => onChange({ ...cta, style: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="primary">Primary</SelectItem>
              <SelectItem value="secondary">Secondary</SelectItem>
              <SelectItem value="outline">Outline</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Size</Label>
          <Select
            value={cta.size}
            onValueChange={(value) => onChange({ ...cta, size: value as any })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sm">Small</SelectItem>
              <SelectItem value="md">Medium</SelectItem>
              <SelectItem value="lg">Large</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Icon (optional)</Label>
        <Input
          value={cta.icon || ''}
          onChange={(e) => onChange({ ...cta, icon: e.target.value })}
          placeholder="arrow-right, check, etc."
        />
      </div>
    </div>
  );
}
