import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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

interface SectionEditorProps {
  section?: PlatformSection | PanchayatWebsiteSection | null;
  isPlatform?: boolean;
  onSave: (section: any) => Promise<PlatformSection | PanchayatWebsiteSection>;
  onCancel: () => void;
  isOpen: boolean;
}

export function SectionEditor({ 
  section, 
  isPlatform = false, 
  onSave, 
  onCancel,
  isOpen 
}: SectionEditorProps) {
  const { t } = useTranslation();
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

  useEffect(() => {
    if (section) {
      setFormData({
        sectionType: section.sectionType as any,
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
      // Initialize multiple images from content if available
      if (section.content && typeof section.content === 'object' && Array.isArray(section.content.items)) {
        const itemsWithImages = section.content.items.filter((item: any) => item.image);
        setImagePreviews(itemsWithImages.map((item: any) => item.image));
      } else {
        setImagePreviews([]);
      }
    } else {
      // Reset form for new section
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

    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    if (imageFiles.length !== files.length) {
      toast.error('Some files are not images and were skipped');
    }

    setImageFiles(prev => [...prev, ...imageFiles]);
    
    // Create previews for new images
    imageFiles.forEach(file => {
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
      toast.error(t('sectionManagement.selectSectionType'));
      return;
    }

    setSaving(true);
    try {
      // Content is now an object, not a JSON string
      let parsedContent: any = formData.content || {};
      if (typeof parsedContent === 'string') {
        try {
          parsedContent = JSON.parse(parsedContent);
        } catch (e) {
          parsedContent = {};
        }
      }

      // If multiple images are selected and content has items array, add images to items
      if (imageFiles.length > 0) {
        if (!parsedContent.items || !Array.isArray(parsedContent.items)) {
          parsedContent.items = [];
        }
        // Add new items for each image (they will be uploaded and URLs will be set by backend)
        imageFiles.forEach((_, index) => {
          const existingItem = parsedContent.items[index];
          if (!existingItem) {
            parsedContent.items.push({
              title: `Item ${parsedContent.items.length + 1}`,
              description: '',
              image: null, // Will be set by backend after upload
            });
          }
        });
      }

      // Metadata is now an object, not a JSON string
      let parsedMetadata: any = formData.metadata || {};
      if (typeof parsedMetadata === 'string') {
        try {
          parsedMetadata = JSON.parse(parsedMetadata);
        } catch (e) {
          parsedMetadata = {};
        }
      }

      const sectionData: any = {
        // Always include sectionType and layoutType (required fields)
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

      // Handle single image (for backward compatibility)
      if (imageFile) {
        sectionData.imageFile = imageFile;
        sectionData.compressionQuality = 'HIGH';
      } else if (formData.imageUrl) {
        sectionData.imageUrl = formData.imageUrl;
        sectionData.imageKey = formData.imageKey;
      }

      // Save section first (with or without single image)
      const savedSection = await onSave(sectionData);
      
      // Handle multiple images and content item images - upload them sequentially after section is saved
      const totalImagesToUpload = imageFiles.length + contentItemImages.size;
      if (totalImagesToUpload > 0 && savedSection) {
        const uploadToastId = toast.loading(`Uploading ${totalImagesToUpload} image(s)... Please wait, this may take a while.`);
        try {
          // Import the API based on platform type
          const { platformLandingPageApi, panchayatWebsiteApi } = await import('../../routes/api');
          const api = isPlatform ? platformLandingPageApi : panchayatWebsiteApi;
          
          // Ensure content.items array exists
          if (!parsedContent.items || !Array.isArray(parsedContent.items)) {
            parsedContent.items = [];
          }
          
          // Upload images from content items first
          const updatedContent = { ...parsedContent };
          let uploadedCount = 0;
          let currentIndex = 0;
          
          for (const [itemIndex, file] of contentItemImages.entries()) {
            currentIndex++;
            toast.loading(
              `Uploading image ${currentIndex} of ${totalImagesToUpload}... (${file.name})`,
              { id: uploadToastId }
            );
            try {
              const uploadResult = await api.uploadImage(savedSection.id, file, 'HIGH');
              if (updatedContent.items[itemIndex]) {
                updatedContent.items[itemIndex].image = uploadResult.imageUrl;
              }
              uploadedCount++;
            } catch (uploadError: any) {
              console.error(`Failed to upload image ${currentIndex}:`, uploadError);
              // Show error but continue with next image
              const errorMsg = uploadError.message || 'Unknown error';
              if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
                toast.error(`Upload timeout for ${file.name}. The file may be too large. Please try a smaller image.`, { id: uploadToastId });
              } else {
                toast.error(`Failed to upload ${file.name}: ${errorMsg}`, { id: uploadToastId });
              }
              // Continue with next image
            }
          }
          
          // Upload multiple images from the main image upload section
          for (let i = 0; i < imageFiles.length; i++) {
            const file = imageFiles[i];
            currentIndex++;
            toast.loading(
              `Uploading image ${currentIndex} of ${totalImagesToUpload}... (${file.name})`,
              { id: uploadToastId }
            );
            try {
              const uploadResult = await api.uploadImage(savedSection.id, file, 'HIGH');
              const itemIndex = updatedContent.items.length;
              updatedContent.items.push({
                title: `Item ${itemIndex + 1}`,
                description: '',
                image: uploadResult.imageUrl,
              });
              uploadedCount++;
            } catch (uploadError: any) {
              console.error(`Failed to upload image ${currentIndex}:`, uploadError);
              const errorMsg = uploadError.message || 'Unknown error';
              if (errorMsg.includes('timeout') || errorMsg.includes('Timeout')) {
                toast.error(`Upload timeout for ${file.name}. The file may be too large. Please try a smaller image.`, { id: uploadToastId });
              } else {
                toast.error(`Failed to upload ${file.name}: ${errorMsg}`, { id: uploadToastId });
              }
              // Continue with next image
            }
          }
          
          // Update section with content containing image URLs
          if (contentItemImages.size > 0 || imageFiles.length > 0) {
            toast.loading('Saving section with uploaded images...', { id: uploadToastId });
            await api.updateSection(savedSection.id, { 
              content: updatedContent,
              imageUrl: imageFile ? undefined : '', // Keep main image if single image was selected
              imageKey: imageFile ? undefined : '',
            });
          }
          
          toast.success(`Successfully uploaded ${uploadedCount} of ${totalImagesToUpload} image(s)`, { id: uploadToastId });
        } catch (error: any) {
          console.error('Error uploading multiple images:', error);
          toast.error(`Failed to upload images: ${error.message || 'Unknown error'}. Please try again.`, { id: uploadToastId });
        }
      } else {
        toast.success(section ? t('sectionManagement.sectionUpdated') : t('sectionManagement.sectionCreated'));
      }
    } catch (error: any) {
      toast.error(error.message || t('sectionManagement.save', { defaultValue: 'Failed to save section' }));
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <SectionTypeSelector
        value={formData.sectionType}
        onValueChange={(value) => setFormData({ ...formData, sectionType: value })}
        isPlatform={isPlatform}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
        <div className="space-y-2">
          <Label htmlFor="title">{t('sectionManagement.sectionTitle')}</Label>
          <Input
            id="title"
            placeholder={t('sectionManagement.sectionTitle')}
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="w-full"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="subtitle">{t('sectionManagement.sectionSubtitle')}</Label>
          <Input
            id="subtitle"
            placeholder={t('sectionManagement.sectionSubtitle')}
            value={formData.subtitle}
            onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
            className="w-full"
          />
        </div>
      </div>

      <LayoutTypeSelector
        value={formData.layoutType}
        onValueChange={(value) => setFormData({ ...formData, layoutType: value })}
      />

      <div className="space-y-2">
        <Label>Content</Label>
        {formData.sectionType ? (
          <div className="border rounded-lg p-4 bg-gray-50">
            <SectionContentEditor
              sectionType={formData.sectionType}
              content={formData.content}
              layoutType={formData.layoutType}
              isPlatform={isPlatform}
              onContentChange={(newContent) => setFormData({ ...formData, content: newContent })}
              onImageUpload={async (file, itemIndex) => {
                // Store file for upload after section save
                setContentItemImages(prev => {
                  const newMap = new Map(prev);
                  newMap.set(itemIndex, file);
                  return newMap;
                });
                // Return null for now, actual upload happens after section save
                return null;
              }}
              onImageRemove={(itemIndex) => {
                setContentItemImages(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(itemIndex);
                  return newMap;
                });
              }}
            />
          </div>
        ) : (
          <div className="border rounded-lg p-4 text-center text-muted-foreground">
            {t('sectionManagement.selectSectionType')}
          </div>
        )}
      </div>

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

      <div className="space-y-4">
        <div>
          <Label>Section Image (Single)</Label>
          <p className="text-xs text-muted-foreground mb-2">
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
              <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
              <Label htmlFor="image-upload" className="cursor-pointer">
                <span className="text-sm text-muted-foreground">Click to upload image</span>
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

        <div>
          <Label>Multiple Images (for Content Items)</Label>
          <p className="text-xs text-muted-foreground mb-2">
            Upload multiple images that will be added to content items. These images will be included in the JSON content structure.
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
            <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
            <Label htmlFor="multiple-image-upload" className="cursor-pointer">
              <span className="text-sm text-muted-foreground">
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
      </div>

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
              // Invalid JSON, store as string temporarily
              setFormData({ ...formData, metadata: e.target.value as any });
            }
          }}
          rows={4}
          className="font-mono text-sm"
        />
        <p className="text-xs text-muted-foreground">
          Optional JSON for advanced section-specific configuration (e.g., carousel autoplay, animation settings).
          Most settings are handled by the content editor above.
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
          {t('sectionManagement.cancel')}
        </Button>
        <Button type="submit" disabled={saving} className="w-full sm:w-auto">
          {saving ? t('sectionManagement.saving') : section ? t('sectionManagement.update') : t('sectionManagement.create')}
        </Button>
      </div>
    </form>
  );
}

