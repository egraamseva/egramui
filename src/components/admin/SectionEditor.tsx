import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { SectionTypeSelector } from './SectionTypeSelector';
import { LayoutTypeSelector } from './LayoutTypeSelector';
import { SectionContentEditor } from './SectionContentEditor';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PlatformSection, PanchayatWebsiteSection, PlatformSectionType, PanchayatSectionType, LayoutType } from '../../types';
import { getSectionTypeConfig, mapOldSectionType, mapToBackendSectionType } from '../../utils/sectionTypeConfig';
import { panchayatWebsiteApi } from '../../routes/api';

interface SectionEditorProps {
  section?: PlatformSection | PanchayatWebsiteSection | null;
  isPlatform?: boolean;
  onSave: (section: any) => Promise<PlatformSection | PanchayatWebsiteSection>;
  onCancel: () => void;
  isOpen: boolean;
}
export  function SectionEditor({ 
  section, 
  isPlatform = false, 
  onSave, 
  onCancel,
  isOpen 
}: SectionEditorProps) {
  const [formData, setFormData] = useState({
    sectionType: (section?.sectionType || '') as PlatformSectionType | PanchayatSectionType,
    title: section?.title || '',
    subtitle: section?.subtitle || '',
    content: section?.content || {},
    layoutType: (section?.layoutType || 'GRID') as LayoutType,
    displayOrder: section?.displayOrder || 0,
    isVisible: section?.isVisible !== undefined ? section.isVisible : true,
    backgroundColor: section?.backgroundColor || '',
    textColor: section?.textColor || '',
    imageUrl: section?.imageUrl || '',
    imageKey: section?.imageKey || '',
    metadata: section?.metadata || {},
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [contentItemImages, setContentItemImages] = useState<Map<number, File>>(new Map());
  const [saving, setSaving] = useState(false);

  const sectionConfig = useMemo(() => {
    if (!formData.sectionType) return null;
    const mappedType = mapOldSectionType(formData.sectionType);
    return getSectionTypeConfig(mappedType);
  }, [formData.sectionType]);

  useEffect(() => {
    if (section) {
      const mappedSectionType = mapOldSectionType(section.sectionType);
      setFormData({
        sectionType: mappedSectionType as any,
        title: section.title || '',
        subtitle: section.subtitle || '',
        content: section.content || {},
        layoutType: section.layoutType,
        displayOrder: section.displayOrder,
        isVisible: section.isVisible,
        backgroundColor: section.backgroundColor || '',
        textColor: section.textColor || '',
        imageUrl: section.imageUrl || '',
        imageKey: section.imageKey || '',
        metadata: section.metadata || {},
      });
      setImagePreview(section.imageUrl || null);
      
      if (section.content && typeof section.content === 'object' && Array.isArray(section.content.items)) {
        const itemsWithImages = section.content.items.filter((item: any) => item.image);
        setImagePreviews(itemsWithImages.map((item: any) => item.image));
      } else {
        setImagePreviews([]);
      }
    } else {
      setFormData({
        sectionType: '' as any,
        title: '',
        subtitle: '',
        content: {},
        layoutType: 'GRID',
        displayOrder: 0,
        isVisible: true,
        backgroundColor: '',
        textColor: '',
        imageUrl: '',
        imageKey: '',
        metadata: {},
      });
      setImagePreview(null);
      setImagePreviews([]);
    }
    setImageFile(null);
    setImageFiles([]);
    setContentItemImages(new Map());
  }, [section, isOpen]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMultipleImagesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const imageFilesList = files.filter(file => file.type.startsWith('image/'));
    if (imageFilesList.length !== files.length) {
      toast.error('Some files are not images and were skipped');
    }

    setImageFiles(prev => [...prev, ...imageFilesList]);
    
    imageFilesList.forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreviews(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData({ ...formData, imageUrl: '', imageKey: '' });
  };

  const handleRemoveMultipleImage = (index: number) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleClearAllImages = () => {
    setImageFiles([]);
    setImagePreviews([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.sectionType) {
      toast.error('Please select a section type');
      return;
    }

    setSaving(true);
    try {
      let parsedContent: any = formData.content || {};
      if (typeof parsedContent === 'string') {
        try {
          parsedContent = JSON.parse(parsedContent);
        } catch (e) {
          parsedContent = {};
        }
      }

      // Handle multiple images uploaded via the "Multiple Images" section
      // These create new items automatically
      if (imageFiles.length > 0) {
        if (!parsedContent.items || !Array.isArray(parsedContent.items)) {
          parsedContent.items = [];
        }
        // Add new items for each uploaded image
        imageFiles.forEach((file, index) => {
          const previewUrl = imagePreviews[index];
          parsedContent.items.push({
            id: `item-${Date.now()}-${index}`,
            title: `Image ${parsedContent.items.length + 1}`,
            description: '',
            image: previewUrl, // Use preview URL temporarily, will be replaced with actual URL after upload
          });
        });
      }

      let parsedMetadata: any = formData.metadata || {};
      if (typeof parsedMetadata === 'string') {
        try {
          parsedMetadata = JSON.parse(parsedMetadata);
        } catch (e) {
          parsedMetadata = {};
        }
      }

      // Use section type directly (database constraint now supports both legacy and new types)
      const sectionData: any = {
        sectionType: formData.sectionType || (section?.sectionType as any),
        layoutType: formData.layoutType || (section?.layoutType as any),
        title: formData.title || undefined,
        subtitle: formData.subtitle || undefined,
        content: parsedContent,
        displayOrder: formData.displayOrder,
        isVisible: formData.isVisible,
        backgroundColor: formData.backgroundColor || undefined,
        textColor: formData.textColor || undefined,
        metadata: parsedMetadata,
      };

      if (imageFile) {
        sectionData.imageFile = imageFile;
        sectionData.compressionQuality = 'HIGH';
      } else if (formData.imageUrl) {
        sectionData.imageUrl = formData.imageUrl;
        sectionData.imageKey = formData.imageKey;
      }

      const savedSection = await onSave(sectionData);
      
      // Upload multiple images (from "Multiple Images" section) if any
      const totalImagesToUpload = imageFiles.length + contentItemImages.size;
      if (totalImagesToUpload > 0 && savedSection) {
        const uploadToastId = toast.loading(`Uploading ${totalImagesToUpload} image(s)...`);
        try {
          // Upload multiple images and create items for them
          if (imageFiles.length > 0) {
            const uploadPromises = imageFiles.map(async (file, index) => {
              try {
                const result = await panchayatWebsiteApi.uploadImage(savedSection.id, file);
                // Update the corresponding item's image URL
                if (parsedContent.items && parsedContent.items[parsedContent.items.length - imageFiles.length + index]) {
                  parsedContent.items[parsedContent.items.length - imageFiles.length + index].image = result.imageUrl;
                }
              } catch (error) {
                console.error(`Error uploading image ${index + 1}:`, error);
                throw error;
              }
            });
            await Promise.all(uploadPromises);
          }
          
          // Upload content item images
          if (contentItemImages.size > 0) {
            const uploadPromises: Promise<void>[] = [];
            contentItemImages.forEach((file, itemIndex) => {
              const uploadPromise = (async () => {
                try {
                  const result = await panchayatWebsiteApi.uploadImage(savedSection.id, file);
                  // Update the item's image URL in the content
                  if (parsedContent.items && parsedContent.items[itemIndex]) {
                    parsedContent.items[itemIndex].image = result.imageUrl;
                  }
                } catch (error) {
                  console.error(`Error uploading image for item ${itemIndex}:`, error);
                  throw error;
                }
              })();
              uploadPromises.push(uploadPromise);
            });
            await Promise.all(uploadPromises);
          }
          
          // Update section with final image URLs
          if (imageFiles.length > 0 || contentItemImages.size > 0) {
            await panchayatWebsiteApi.updateSection(savedSection.id, {
              content: parsedContent,
            });
          }
          
          toast.dismiss(uploadToastId);
          toast.success(`Successfully uploaded ${totalImagesToUpload} image(s)`);
        } catch (error: any) {
          toast.dismiss(uploadToastId);
          console.error('Error uploading images:', error);
          toast.error(`Failed to upload images: ${error.message || 'Unknown error'}`);
        }
      } else {
        toast.success(section ? 'Section updated' : 'Section created');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg">
      <SectionTypeSelector
        value={formData.sectionType}
        onValueChange={(value: string) => setFormData({ ...formData, sectionType: value })}
        isPlatform={isPlatform}
      />

      {sectionConfig && (sectionConfig.supportsTitle || sectionConfig.supportsSubtitle) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {sectionConfig.supportsTitle && (
            <div className="space-y-2">
              <Label htmlFor="title">Section Title</Label>
              <Input
                id="title"
                placeholder="Section Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full"
              />
            </div>
          )}

          {sectionConfig.supportsSubtitle && (
            <div className="space-y-2">
              <Label htmlFor="subtitle">Section Subtitle</Label>
              <Input
                id="subtitle"
                placeholder="Section Subtitle"
                value={formData.subtitle}
                onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                className="w-full"
              />
            </div>
          )}
        </div>
      )}

      {sectionConfig && sectionConfig.supportedLayouts.length > 1 && (
        <LayoutTypeSelector
          value={formData.layoutType}
          onValueChange={(value: string) => setFormData({ ...formData, layoutType: value as LayoutType })}
          supportedLayouts={sectionConfig.supportedLayouts}
        />
      )}

      <div className="space-y-2">
        <Label>Content</Label>
        {formData.sectionType ? (
          <div className="border rounded-lg p-4 bg-gray-50">
            <SectionContentEditor
              sectionType={formData.sectionType}
              content={formData.content}
              layoutType={formData.layoutType}
              isPlatform={isPlatform}
              onContentChange={(newContent: any) => setFormData({ ...formData, content: newContent })}
              onImageUpload={async (file: File, itemIndex: number) => {
                try {
                  // Store file temporarily for upload on save
                  setContentItemImages(prev => {
                    const newMap = new Map(prev);
                    newMap.set(itemIndex, file);
                    return newMap;
                  });
                  
                  // Create a preview URL for immediate display
                  const previewUrl = URL.createObjectURL(file);
                  return previewUrl;
                } catch (error) {
                  console.error('Error preparing image upload:', error);
                  return null;
                }
              }}
              onImageRemove={(itemIndex: number) => {
                setContentItemImages(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(itemIndex);
                  return newMap;
                });
              }}
            />
          </div>
        ) : (
          <div className="border rounded-lg p-4 text-center text-gray-500">
            Please select a section type
          </div>
        )}
      </div>

      {sectionConfig && sectionConfig.supportsBackground && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="space-y-2">
            <Label htmlFor="background-color">Background Color</Label>
            <div className="flex gap-2">
              <Input
                id="background-color"
                type="color"
                value={formData.backgroundColor || '#ffffff'}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                placeholder="#ffffff or CSS color"
                value={formData.backgroundColor}
                onChange={(e) => setFormData({ ...formData, backgroundColor: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="text-color">Text Color</Label>
            <div className="flex gap-2">
              <Input
                id="text-color"
                type="color"
                value={formData.textColor || '#000000'}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
                className="w-20 h-10"
              />
              <Input
                placeholder="#000000 or CSS color"
                value={formData.textColor}
                onChange={(e) => setFormData({ ...formData, textColor: e.target.value })}
              />
            </div>
          </div>
        </div>
      )}

      {sectionConfig && sectionConfig.supportsSingleImage && (
        <div className="space-y-4">
          <div>
            <Label>Section Image</Label>
            <p className="text-xs text-gray-500 mb-2">
              Upload a single image for the section header/background
            </p>
            {imagePreview ? (
              <div className="relative">
                <ImageWithFallback
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="absolute top-2 right-2"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="border-2 border-dashed rounded-lg p-6 text-center">
                <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                <Label htmlFor="image-upload" className="cursor-pointer">
                  <span className="text-sm text-gray-500">Click to upload image</span>
                  <Input
                    id="image-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </Label>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Multiple Images section - Only show for sections that support it but don't have item-level image uploads */}
      {sectionConfig && sectionConfig.supportsMultipleImages && 
       formData.sectionType !== 'IMAGE_GALLERY' && 
       formData.sectionType !== 'GALLERY' && (
        <div>
          <Label>Multiple Images (for Content Items)</Label>
          <p className="text-xs text-gray-500 mb-2">
            Upload multiple images for content items. These will be added as new items.
          </p>
          {imagePreviews.length > 0 && (
            <div className="mb-4">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <ImageWithFallback
                      src={preview}
                      alt={`Preview ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0"
                      onClick={() => handleRemoveMultipleImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleClearAllImages}
                className="mb-2"
              >
                Clear All Images
              </Button>
            </div>
          )}
          <div className="border-2 border-dashed rounded-lg p-6 text-center">
            <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
            <Label htmlFor="multiple-image-upload" className="cursor-pointer">
              <span className="text-sm text-gray-500">
                {imagePreviews.length > 0 
                  ? `Add more images (${imagePreviews.length} selected)`
                  : 'Click to upload multiple images'}
              </span>
              <Input
                id="multiple-image-upload"
                type="file"
                accept="image/*"
                multiple
                onChange={handleMultipleImagesChange}
                className="hidden"
              />
            </Label>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="metadata">Metadata (Advanced)</Label>
        <Textarea
          id="metadata"
          placeholder='{"columns": 3, "autoPlay": true}'
          value={typeof formData.metadata === 'string' ? formData.metadata : JSON.stringify(formData.metadata, null, 2)}
          onChange={(e) => {
            try {
              const parsed = JSON.parse(e.target.value);
              setFormData({ ...formData, metadata: parsed });
            } catch {
              setFormData({ ...formData, metadata: e.target.value as any });
            }
          }}
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-gray-500">
          Optional JSON for advanced configuration
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="display-order">Display Order</Label>
          <Input
            id="display-order"
            type="number"
            value={formData.displayOrder}
            onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) || 0 })}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="is-visible">Visibility</Label>
          <select
            id="is-visible"
            value={formData.isVisible ? 'true' : 'false'}
            onChange={(e) => setFormData({ ...formData, isVisible: e.target.value === 'true' })}
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
          >
            <option value="true">Visible</option>
            <option value="false">Hidden</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? 'Saving...' : section ? 'Update' : 'Create'}
        </Button>
      </div>
    </form>
  );
}