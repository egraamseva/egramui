import React, { useState, useEffect, useMemo } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Checkbox } from '../ui/checkbox';
import { SectionTypeSelector } from './SectionTypeSelector';
import { LayoutTypeSelector } from './LayoutTypeSelector';
import { SectionContentEditor } from './SectionContentEditor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import type { PlatformSection, PanchayatWebsiteSection, PlatformSectionType, PanchayatSectionType, LayoutType } from '../../types';
import { mapOldSectionType, mapToBackendSectionType } from '../../utils/sectionTypeConfig';
import { panchayatWebsiteApi, platformLandingPageApi } from '../../routes/api';
import type { SectionSchema } from '../../utils/sectionSchemas';
import { HARDCODED_SCHEMAS, getSchemaByType, getRenderingHint } from '../../utils/sectionSchemas';
import { fileToDataURL, cleanContentBlobURLs, isBlobURL, isDataURL, validateImageFile } from '../../utils/imageUtils';

/** Optional API adapter for upload/update (e.g. admin panchayat website by id). When set, used instead of panchayatWebsiteApi. */
export type SectionEditorWebsiteApi = {
  uploadImage: (id: string | number, file: File, compressionQuality?: string) => Promise<{ imageUrl: string }>;
  uploadImageGeneric: (file: File, compressionQuality?: string) => Promise<{ imageUrl: string }>;
  updateSection: (id: string | number, payload: any) => Promise<any>;
};

interface SectionEditorProps {
  section?: PlatformSection | PanchayatWebsiteSection | null;
  isPlatform?: boolean;
  onSave: (section: any) => Promise<PlatformSection | PanchayatWebsiteSection>;
  onCancel: () => void;
  isOpen: boolean;
  /** When provided (e.g. admin managing a panchayat website), used for uploads and post-save updates instead of panchayatWebsiteApi */
  websiteApi?: SectionEditorWebsiteApi;
}
export  function SectionEditor({ 
  section, 
  isPlatform = false, 
  onSave, 
  onCancel,
  isOpen,
  websiteApi: websiteApiOverride,
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
    imageFit: (section?.imageFit || 'cover') as 'cover' | 'contain' | 'fill' | 'none' | 'scale-down',
    metadata: section?.metadata || {},
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [contentItemImages, setContentItemImages] = useState<Map<number, File>>(new Map());
  const [saving, setSaving] = useState(false);
  const [schema, setSchema] = useState<SectionSchema | null>(null);

  // Load schema when section type changes
  useEffect(() => {
    if (formData.sectionType) {
      // TODO: Load from API when available
      const foundSchema = getSchemaByType(HARDCODED_SCHEMAS, formData.sectionType);
      if (foundSchema) {
        console.log('Schema found for section type:', formData.sectionType, foundSchema);
        setSchema(foundSchema);
        // Set default layout from schema if not set
        if (!formData.layoutType || formData.layoutType === 'GRID') {
          setFormData(prev => ({ ...prev, layoutType: foundSchema.defaultLayout as LayoutType }));
        }
      } else {
        console.warn('No schema found for section type:', formData.sectionType);
        setSchema(null);
      }
    } else {
      setSchema(null);
    }
  }, [formData.sectionType]);

  // Create section config from schema rendering hints
  const sectionConfig = useMemo(() => {
    if (!schema) return null;
    
    return {
      supportsTitle: getRenderingHint(schema, 'supportsTitle'),
      supportsSubtitle: getRenderingHint(schema, 'supportsSubtitle'),
      supportsRichText: getRenderingHint(schema, 'supportsRichText'),
      supportsItems: getRenderingHint(schema, 'supportsItems'),
      supportsSingleImage: getRenderingHint(schema, 'supportsSingleImage'),
      supportsMultipleImages: getRenderingHint(schema, 'supportsMultipleImages'),
      supportedLayouts: schema.supportedLayouts,
      defaultLayout: schema.defaultLayout,
      supportsCTA: getRenderingHint(schema, 'supportsCTA'),
      supportsForm: getRenderingHint(schema, 'supportsForm'),
      supportsVideo: getRenderingHint(schema, 'supportsVideo'),
      supportsMap: getRenderingHint(schema, 'supportsMap'),
      supportsStatistics: getRenderingHint(schema, 'supportsStatistics'),
      supportsTimeline: getRenderingHint(schema, 'supportsTimeline'),
      supportsFAQ: getRenderingHint(schema, 'supportsFAQ'),
      supportsTestimonials: getRenderingHint(schema, 'supportsTestimonials'),
      supportsBackground: getRenderingHint(schema, 'supportsBackground'),
      supportsSpacing: getRenderingHint(schema, 'supportsSpacing'),
      supportsAnimation: getRenderingHint(schema, 'supportsAnimation'),
      itemSupportsImage: getRenderingHint(schema, 'itemSupportsImage'),
      itemSupportsLink: getRenderingHint(schema, 'itemSupportsLink'),
      itemSupportsIcon: getRenderingHint(schema, 'itemSupportsIcon'),
      itemSupportsValue: getRenderingHint(schema, 'itemSupportsValue'),
      itemSupportsRating: getRenderingHint(schema, 'itemSupportsRating'),
    };
  }, [schema]);

  useEffect(() => {
    if (section) {
      console.log('Loading section data for editing:', {
        id: section.id,
        sectionType: section.sectionType,
        hasContent: !!section.content,
        contentType: typeof section.content,
      });
      
      // Parse content if it's a string
      let parsedContent = section.content || {};
      if (typeof parsedContent === 'string') {
        try {
          parsedContent = JSON.parse(parsedContent);
          console.log('Parsed content from string:', parsedContent);
        } catch (e) {
          console.warn('Failed to parse section content:', e);
          parsedContent = {};
        }
      }
      
      // Parse metadata if it's a string
      //parse
      let parsedMetadata = section.metadata || {};
      if (typeof parsedMetadata === 'string') {
        try {
          parsedMetadata = JSON.parse(parsedMetadata);
        } catch (e) {
          console.warn('Failed to parse section metadata:', e);
          parsedMetadata = {};
        }
      }
      
      const mappedSectionType = mapOldSectionType(section.sectionType);
      console.log('Mapped section type:', section.sectionType, '->', mappedSectionType);
      
      const newFormData = {
        sectionType: mappedSectionType as any,
        title: section.title || '',
        subtitle: section.subtitle || '',
        content: parsedContent,
        layoutType: section.layoutType || 'GRID',
        displayOrder: section.displayOrder ?? 0,
        isVisible: section.isVisible !== undefined ? section.isVisible : true,
        backgroundColor: section.backgroundColor || '',
        textColor: section.textColor || '',
        imageUrl: section.imageUrl || '',
        imageKey: section.imageKey || '',
        imageFit: (section.imageFit || 'cover') as 'cover' | 'contain' | 'fill' | 'none' | 'scale-down',
        metadata: parsedMetadata,
      };
      
      console.log('Setting form data:', newFormData);
      setFormData(newFormData);
      setImagePreview(section.imageUrl || null);
      
      if (parsedContent && typeof parsedContent === 'object' && Array.isArray(parsedContent.items)) {
        const itemsWithImages = parsedContent.items.filter((item: any) => item.image);
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
        imageFit: 'cover' as 'cover' | 'contain' | 'fill' | 'none' | 'scale-down',
        metadata: {},
      });
      setImagePreview(null);
      setImagePreviews([]);
    }
    setImageFile(null);
    setImageFiles([]);
    console.log('🔄 Resetting contentItemImages Map (section or isOpen changed)', { sectionId: section?.id, isOpen });
    setContentItemImages(new Map());
  }, [section, isOpen]);

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Validate the image file before accepting it
        await validateImageFile(file);
        setImageFile(file);
        const reader = new FileReader();
        reader.onloadend = () => {
          setImagePreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } catch (error: any) {
        console.error('Image validation failed:', error);
        toast.error(error.message || 'Invalid image file. Please select a valid image.');
        // Reset the input
        e.target.value = '';
      }
    }
  };

  const handleMultipleImagesChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validFiles: File[] = [];
    const errors: string[] = [];

    // Validate each file
    for (const file of files) {
      try {
        await validateImageFile(file);
        validFiles.push(file);
      } catch (error: any) {
        console.error(`Validation failed for ${file.name}:`, error);
        errors.push(`${file.name}: ${error.message || 'Invalid image file'}`);
      }
    }

    if (errors.length > 0) {
      toast.error(`Some files were rejected:\n${errors.join('\n')}`);
    }

    if (validFiles.length === 0) {
      toast.error('No valid image files selected. Please select valid image files.');
      e.target.value = '';
      return;
    }

    if (validFiles.length < files.length) {
      toast.warning(`${validFiles.length} of ${files.length} files were accepted.`);
    }

    setImageFiles(prev => [...prev, ...validFiles]);
    
    validFiles.forEach(file => {
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

    // Log contentItemImages Map state at the start of submit
    console.log('🚀 handleSubmit called - contentItemImages Map state:', {
      size: contentItemImages.size,
      entries: Array.from(contentItemImages.entries()).map(([idx, file]) => ({
        itemIndex: idx,
        fileName: file.name,
        fileSize: file.size
      }))
    });

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
      // Don't store data URLs in content - they will be replaced with server URLs after upload
      if (imageFiles.length > 0) {
        if (!parsedContent.items || !Array.isArray(parsedContent.items)) {
          parsedContent.items = [];
        }
        // Add new items for each uploaded image (without image URL - will be set after upload)
        imageFiles.forEach((file, index) => {
          parsedContent.items.push({
            id: `item-${Date.now()}-${index}`,
            title: `Image ${parsedContent.items.length + 1}`,
            description: '',
            // Don't store data URL - will be replaced with server URL after upload
            image: null,
          });
        });
      }

      // Log contentItemImages BEFORE cleaning content
      console.log('Before cleaning - contentItemImages Map:', {
        size: contentItemImages.size,
        entries: Array.from(contentItemImages.entries()).map(([idx, file]) => ({
          itemIndex: idx,
          fileName: file.name,
          fileSize: file.size
        })),
        contentItems: parsedContent?.items?.map((item: any, idx: number) => ({
          index: idx,
          hasImage: !!item.image,
          image: item.image?.substring(0, 50) || null
        })) || []
      });

      // Clean any blob/data URLs from content before saving
      // IMPORTANT: For IMAGE_WITH_TEXT, preserve content.image if it's a valid server URL
      const beforeClean = JSON.stringify(parsedContent);
      parsedContent = cleanContentBlobURLs(parsedContent);
      const afterClean = JSON.stringify(parsedContent);
      
      // Log after cleaning - especially important for IMAGE_WITH_TEXT
      if (formData.sectionType === 'IMAGE_WITH_TEXT') {
        console.log('IMAGE_WITH_TEXT content cleaning:', {
          beforeCleanImage: JSON.parse(beforeClean)?.image,
          afterCleanImage: parsedContent?.image,
          imagePreserved: !!parsedContent?.image,
          contentType: typeof parsedContent,
          contentKeys: parsedContent && typeof parsedContent === 'object' ? Object.keys(parsedContent) : []
        });
      }
      
      console.log('After cleaning - content items:', {
        items: parsedContent?.items?.map((item: any, idx: number) => ({
          index: idx,
          hasImage: !!item.image,
          image: item.image
        })) || []
      });

      let parsedMetadata: any = formData.metadata || {};
      if (typeof parsedMetadata === 'string') {
        try {
          parsedMetadata = JSON.parse(parsedMetadata);
        } catch (e) {
          parsedMetadata = {};
        }
      }

      // Use section type directly (database constraint now supports both legacy and new types)
      // For updates, include all fields to ensure nothing is lost
      const sectionData: any = {
        sectionType: formData.sectionType || (section?.sectionType as any),
        layoutType: formData.layoutType || (section?.layoutType as any) || 'GRID',
        content: parsedContent,
        displayOrder: formData.displayOrder ?? (section?.displayOrder ?? 0),
        isVisible: formData.isVisible !== undefined ? formData.isVisible : (section?.isVisible ?? true),
        metadata: parsedMetadata,
      };
      
      // Handle optional string fields - include them even if empty (to allow clearing)
      if (formData.title !== undefined) {
        sectionData.title = formData.title || null; // Allow empty string or null
      } else if (section?.title !== undefined) {
        sectionData.title = section.title;
      }
      
      if (formData.subtitle !== undefined) {
        sectionData.subtitle = formData.subtitle || null;
      } else if (section?.subtitle !== undefined) {
        sectionData.subtitle = section.subtitle;
      }
      
      if (formData.backgroundColor !== undefined) {
        sectionData.backgroundColor = formData.backgroundColor || null;
      } else if (section?.backgroundColor !== undefined) {
        sectionData.backgroundColor = section.backgroundColor;
      }
      
      if (formData.textColor !== undefined) {
        sectionData.textColor = formData.textColor || null;
      } else if (section?.textColor !== undefined) {
        sectionData.textColor = section.textColor;
      }
      
      // Handle section main image upload
      if (imageFile) {
        sectionData.imageFile = imageFile;
        sectionData.compressionQuality = 'HIGH';
        // Clear imageUrl/imageKey when uploading new file - backend will set them
        sectionData.imageUrl = undefined;
        sectionData.imageKey = undefined;
      } else if (formData.imageUrl !== undefined) {
        // User provided imageUrl directly
        sectionData.imageUrl = formData.imageUrl || null;
        sectionData.imageKey = formData.imageKey || null;
      } else if (section) {
        // Preserve existing image data for updates
        sectionData.imageUrl = section.imageUrl || null;
        sectionData.imageKey = section.imageKey || null;
      }
      
      // Include imageFit in section data
      if (formData.imageFit !== undefined) {
        sectionData.imageFit = formData.imageFit;
      } else if (section?.imageFit !== undefined) {
        sectionData.imageFit = section.imageFit;
      }

      // Add contentItemImages to sectionData - convert Map to array in order
      // IMPORTANT: Only send images for items that have null/empty image in content
      // Backend matches images to items with null images in order
      if (contentItemImages.size > 0) {
        console.log(`Processing ${contentItemImages.size} contentItemImages from Map`);
        const contentItemImageArray: File[] = [];
        const sortedEntries = Array.from(contentItemImages.entries()).sort((a, b) => a[0] - b[0]);
        
        // Filter to only include images for items that actually have null/empty image in content (after cleaning)
        const items = parsedContent?.items || [];
        console.log(`Checking ${items.length} items for null images`);
        
        sortedEntries.forEach(([itemIndex, file]) => {
          const item = items[itemIndex];
          const hasNullImage = !item || !item.image || item.image === null || item.image === '' || item.image === 'null';
          
          console.log(`Item ${itemIndex}: hasNullImage=${hasNullImage}, image=${item?.image || 'null'}, fileName=${file.name}`);
          
          if (hasNullImage) {
            contentItemImageArray.push(file);
            console.log(`✓ Including image for item ${itemIndex}`);
          } else {
            console.log(`✗ Skipping image for item ${itemIndex} (already has image: ${item?.image})`);
          }
        });
        
        if (contentItemImageArray.length > 0) {
          sectionData.contentItemImages = contentItemImageArray;
          sectionData.compressionQuality = 'HIGH'; // Ensure compressionQuality is set when sending images
          console.log(`✅ Sending ${contentItemImageArray.length} contentItemImages to backend with compressionQuality: HIGH`);
        } else {
          console.warn('⚠️ No contentItemImages to send (all items already have images or Map is empty)');
        }
      } else {
        console.warn('⚠️ contentItemImages Map is empty (size=0)');
      }

      // Log section data for debugging
      console.log('Saving section:', {
        isUpdate: !!section,
        sectionId: section?.id,
        sectionType: sectionData.sectionType,
        hasContent: !!sectionData.content,
        contentItemsCount: sectionData.content?.items?.length || 0,
        hasImageFile: !!imageFile,
        hasImageUrl: !!sectionData.imageUrl,
        contentItemImagesCount: contentItemImages.size,
        contentItemImagesToSend: sectionData.contentItemImages?.length || 0,
        contentItems: parsedContent?.items?.map((item: any, idx: number) => ({
          index: idx,
          hasImage: !!item.image,
          image: item.image
        })) || [],
        // For IMAGE_WITH_TEXT, log content.image specifically
        ...(sectionData.sectionType === 'IMAGE_WITH_TEXT' ? {
          contentImage: sectionData.content?.image,
          contentImageType: typeof sectionData.content?.image,
          contentStringified: typeof sectionData.content === 'object' ? JSON.stringify(sectionData.content).substring(0, 200) : sectionData.content?.substring(0, 200)
        } : {})
      });
      
      // Save section with contentItemImages - backend will upload and update content
      // Note: contentItemImages are sent in multipart form data and backend handles upload
      const savedSection = await onSave(sectionData);
      
      console.log('Section saved successfully:', {
        sectionId: savedSection.id,
        hasContent: !!savedSection.content,
      });
      
      // Handle imageFiles (multiple images) - these create new items
      // We still need to upload these separately since they create new items
      if (imageFiles.length > 0 && savedSection) {
        const uploadToastId = toast.loading(`Uploading ${imageFiles.length} image(s)...`);
        try {
          const uploadApi = websiteApiOverride ?? (isPlatform ? platformLandingPageApi : panchayatWebsiteApi);
          const updateApi = websiteApiOverride ?? (isPlatform ? platformLandingPageApi : panchayatWebsiteApi);
          
          // Save original section imageUrl to restore it later (since uploadImage overwrites it)
          const originalImageUrl = savedSection.imageUrl;
          const originalImageKey = savedSection.imageKey;
          
          // Track uploaded image URLs
          const uploadedUrls: Array<{ index: number, imageUrl: string }> = [];
          
          // Upload multiple images
          const uploadPromises = imageFiles.map(async (file, index) => {
            try {
              const result = await uploadApi.uploadImage(savedSection.id, file);
              const imageUrl = result?.imageUrl;
              if (!imageUrl) {
                throw new Error(`Image upload failed: No imageUrl returned for image ${index + 1}`);
              }
              console.log(`Uploaded image ${index + 1}, URL:`, imageUrl);
              uploadedUrls.push({ index, imageUrl });
            } catch (error) {
              console.error(`Error uploading image ${index + 1}:`, error);
              throw error;
            }
          });
          await Promise.all(uploadPromises);
          
          // Restore the original section image if it was overwritten
          if (originalImageUrl && originalImageUrl !== null) {
            try {
              await updateApi.updateSection(savedSection.id, {
                imageUrl: originalImageUrl,
                imageKey: originalImageKey || undefined,
              });
              console.log('Restored original section image after multiple image uploads');
            } catch (error) {
              console.warn('Failed to restore original section image after multiple image uploads:', error);
            }
          } else {
            // Clear the section's image after uploading multiple images
            try {
              await updateApi.updateSection(savedSection.id, {
                imageUrl: undefined,
                imageKey: undefined,
              });
              console.log('Cleared section image after multiple image uploads');
            } catch (error) {
              console.warn('Failed to clear section image after multiple image uploads:', error);
            }
          }
          
          // Update content with uploaded server URLs for multiple images
          if (!parsedContent.items) parsedContent.items = [];
          
          // Find items that need images (the ones we just created with image: null)
          let multipleImageStartIndex = parsedContent.items.length - imageFiles.length;
          
          uploadedUrls.forEach(({ index, imageUrl }) => {
            if (!imageUrl) {
              console.warn(`Skipping null imageUrl for multiple image at index ${index}`);
              return;
            }
            
            const itemIndex = multipleImageStartIndex + index;
            if (itemIndex >= 0 && itemIndex < parsedContent.items.length && parsedContent.items[itemIndex]) {
              console.log(`Setting image for multiple item at index ${itemIndex}:`, imageUrl);
              parsedContent.items[itemIndex].image = imageUrl;
            } else {
              console.warn(`Item at index ${itemIndex} not found for multiple image ${index}. Total items: ${parsedContent.items.length}`);
            }
          });
          
          // Clean content and update section
          const contentToUpdate = cleanContentBlobURLs({
            ...parsedContent,
            items: parsedContent.items || []
          });
          
          // Ensure all uploaded image URLs are properly set
          uploadedUrls.forEach(({ index, imageUrl }) => {
            if (!imageUrl) return;
            const itemIndex = multipleImageStartIndex + index;
            if (itemIndex >= 0 && itemIndex < contentToUpdate.items.length) {
              contentToUpdate.items[itemIndex].image = imageUrl;
            }
          });
          
          // Update section with final content
          await updateApi.updateSection(savedSection.id, {
            content: contentToUpdate,
          });
          
          toast.dismiss(uploadToastId);
          toast.success(`Successfully uploaded ${imageFiles.length} image(s)`);
        } catch (error: any) {
          toast.dismiss(uploadToastId);
          console.error('Error uploading images:', error);
          toast.error(`Failed to upload images: ${error.message || 'Unknown error'}`);
        }
      } else {
        // No new images to upload, but ensure content is cleaned if it was modified
        // The onSave already handled the update, but we should verify content is clean
        if (section) {
          // For updates, ensure content doesn't have blob/data URLs
          const cleanedContent = cleanContentBlobURLs(parsedContent);
          // Only update if content was actually cleaned (had blob/data URLs)
          const contentChanged = JSON.stringify(cleanedContent) !== JSON.stringify(parsedContent);
          if (contentChanged) {
            try {
              const updateApi = websiteApiOverride ?? (isPlatform ? platformLandingPageApi : panchayatWebsiteApi);
              await updateApi.updateSection(section.id, {
                content: cleanedContent,
              });
            } catch (error) {
              console.warn('Failed to clean content on update:', error);
            }
          }
        }
        toast.success(section ? 'Section updated' : 'Section created');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to save section');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) {
    console.log('SectionEditor: isOpen is false, not rendering');
    return null;
  }

  console.log('SectionEditor: Rendering form', {
    hasSection: !!section,
    sectionType: formData.sectionType,
    hasSchema: !!schema,
    hasSectionConfig: !!sectionConfig,
  });

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-white rounded-lg">
      {/* Debug info - remove in production */}
      {process.env.NODE_ENV === 'development' && (
        <div className="mb-4 p-3 bg-gray-100 rounded text-xs font-mono">
          <div>Section ID: {section?.id || 'NEW'}</div>
          <div>Section Type: {formData.sectionType || 'NONE'}</div>
          <div>Has Schema: {schema ? 'YES' : 'NO'}</div>
          <div>Has Content: {formData.content ? 'YES' : 'NO'}</div>
          <div>Content Items: {formData.content?.items?.length || 0}</div>
        </div>
      )}
      
      <SectionTypeSelector
        value={formData.sectionType}
        onValueChange={(value: string) => {
          console.log('Section type changed to:', value);
          setFormData({ ...formData, sectionType: value });
        }}
        isPlatform={isPlatform}
      />

      {/* Title and Subtitle - Always show for editing, or if schema supports it */}
      {(section || (sectionConfig && (sectionConfig.supportsTitle || sectionConfig.supportsSubtitle))) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          {(section || (sectionConfig && sectionConfig.supportsTitle)) && (
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

          {(section || (sectionConfig && sectionConfig.supportsSubtitle)) && (
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

      {schema && schema.supportedLayouts.length > 1 && (
        <LayoutTypeSelector
          value={formData.layoutType}
          onValueChange={(value: string) => setFormData({ ...formData, layoutType: value as LayoutType })}
          supportedLayouts={schema.supportedLayouts}
        />
      )}

      {/* Carousel settings are now configured in SectionContentEditor under Settings tab */}

      <div className="space-y-2">
        <Label>Content</Label>
        {formData.sectionType ? (
          schema ? (
            <div className="border rounded-lg p-4 bg-gray-50">
              <SectionContentEditor
                sectionType={formData.sectionType}
                content={formData.content}
                layoutType={formData.layoutType}
                isPlatform={isPlatform}
                schema={schema}
                onContentChange={(newContent: any) => setFormData({ ...formData, content: newContent })}
                onImageUpload={async (file: File, itemIndex: number) => {
                  try {
                    console.log(`📸 onImageUpload called for item ${itemIndex}:`, {
                      fileName: file.name,
                      fileSize: file.size,
                      fileType: file.type
                    });
                    
                    // Validate the image file before accepting it
                    await validateImageFile(file);
                    
                    // Store file temporarily for upload on save
                    setContentItemImages(prev => {
                      const newMap = new Map(prev);
                      newMap.set(itemIndex, file);
                      console.log(`✅ Stored file in Map for item ${itemIndex}. Map size now: ${newMap.size}`, {
                        mapEntries: Array.from(newMap.entries()).map(([idx, f]) => ({ itemIndex: idx, fileName: f.name }))
                      });
                      return newMap;
                    });
                    
                    // Convert to data URL for persistent preview (doesn't expire like blob URLs)
                    const previewUrl = await fileToDataURL(file);
                    console.log(`✅ Generated preview URL for item ${itemIndex}`);
                    return previewUrl;
                  } catch (error: any) {
                    console.error('❌ Error preparing image upload:', error);
                    toast.error(error.message || 'Invalid image file. Please select a valid image.');
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
            <div className="border rounded-lg p-4 bg-yellow-50 border-yellow-200">
              <p className="text-sm text-yellow-800 mb-2">
                ⚠️ No schema found for section type: <strong>{formData.sectionType}</strong>
              </p>
              <p className="text-xs text-yellow-700 mb-4">
                The section type exists but no schema configuration is available. 
                You can still edit the content manually below.
              </p>
              <div className="mt-4 border rounded-lg p-4 bg-white">
                <SectionContentEditor
                  sectionType={formData.sectionType}
                  content={formData.content}
                  layoutType={formData.layoutType}
                  isPlatform={isPlatform}
                  schema={null}
                  onContentChange={(newContent: any) => setFormData({ ...formData, content: newContent })}
                  onImageUpload={async (file: File, itemIndex: number) => {
                    try {
                      console.log(`📸 onImageUpload called for item ${itemIndex}:`, {
                        fileName: file.name,
                        fileSize: file.size,
                        fileType: file.type
                      });
                      
                      // Validate the image file before accepting it
                      await validateImageFile(file);
                      
                      setContentItemImages(prev => {
                        const newMap = new Map(prev);
                        newMap.set(itemIndex, file);
                        console.log(`✅ Stored file in Map for item ${itemIndex}. Map size now: ${newMap.size}`, {
                          mapEntries: Array.from(newMap.entries()).map(([idx, f]) => ({ itemIndex: idx, fileName: f.name }))
                        });
                        return newMap;
                      });
                      const previewUrl = await fileToDataURL(file);
                      console.log(`✅ Generated preview URL for item ${itemIndex}`);
                      return previewUrl;
                    } catch (error: any) {
                      console.error('❌ Error preparing image upload:', error);
                      toast.error(error.message || 'Invalid image file. Please select a valid image.');
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
            </div>
          )
        ) : (
          <div className="border rounded-lg p-4 text-center text-gray-500">
            <p className="mb-2">Please select a section type above</p>
            <p className="text-xs text-gray-400">Once you select a section type, the content editor will appear here</p>
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
              <div className="space-y-3">
                <div className="relative">
                  <ImageWithFallback
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-48 rounded-lg"
                    style={{ objectFit: formData.imageFit }}
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
                <div className="space-y-2">
                  <Label htmlFor="image-fit">Image Display Style</Label>
                  <Select
                    value={formData.imageFit}
                    onValueChange={(value) => setFormData({ ...formData, imageFit: value as any })}
                  >
                    <SelectTrigger id="image-fit">
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
            ) : (
              <div className="space-y-3">
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
                <div className="space-y-2">
                  <Label htmlFor="image-fit-default">Image Display Style (applied after upload)</Label>
                  <Select
                    value={formData.imageFit}
                    onValueChange={(value) => setFormData({ ...formData, imageFit: value as any })}
                  >
                    <SelectTrigger id="image-fit-default">
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