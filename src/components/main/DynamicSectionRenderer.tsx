import React, { useState, useEffect } from 'react';
import type { PlatformSection, PanchayatWebsiteSection, LayoutType, ContentItem, BackgroundConfig, AnimationConfig, CTAConfig, FormField, CarouselConfig } from '../../types';
import { Carousel } from '../ui/carousel';
import { mapOldSectionType } from '../../utils/sectionTypeConfig';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { ImageWithFallback } from '../figma/ImageWithFallback';
import { processSectionContent, isBlobURL } from '../../utils/imageUtils';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Checkbox } from '../ui/checkbox';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '../ui/accordion';
import { 
  ChevronLeft, ChevronRight, Star, MapPin, Phone, Mail, 
  Calendar, Users, Building2, TrendingUp, Award, Clock,
  Play, ExternalLink
} from 'lucide-react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { LatLngExpression } from 'leaflet';
import 'leaflet/dist/leaflet.css';

interface DynamicSectionRendererProps {
  section: PlatformSection | PanchayatWebsiteSection;
  children?: React.ReactNode;
}

export function DynamicSectionRenderer({ section, children }: DynamicSectionRendererProps) {
  // Process section to clean any blob URLs
  // IMPORTANT: processSectionContent handles JSON string parsing and preserves valid server URLs
  const processedContent = processSectionContent(section.content);
  
  const processedSection = {
    ...section,
    content: processedContent,
    // Clean section-level imageUrl if it's a blob URL
    imageUrl: section.imageUrl && !isBlobURL(section.imageUrl) 
      ? section.imageUrl 
      : null,
  };
  
  // Use imageUrl directly - Cloudflare public URLs don't expire
  const imageUrl = processedSection.imageUrl || null;

  // Ensure content is an object (processSectionContent should handle this, but double-check)
  const content = typeof processedContent === 'object' && processedContent !== null 
    ? processedContent 
    : (typeof processedContent === 'string' && processedContent.trim().startsWith('{'))
      ? (() => {
          try {
            return JSON.parse(processedContent);
          } catch {
            return {};
          }
        })()
      : {};
  const background = content.background || { type: 'color', value: section.backgroundColor || '#ffffff' };
  const spacing = content.spacing || {};
  const animation = content.animation || { type: 'none' };

  // Build section style
  const sectionStyle: React.CSSProperties = {
    backgroundColor: background.type === 'color' ? background.value : undefined,
    backgroundImage: background.type === 'gradient' ? background.value : 
                     background.type === 'image' ? `url(${background.value})` : undefined,
    backgroundSize: background.type === 'image' ? 'cover' : undefined,
    backgroundPosition: background.type === 'image' ? 'center' : undefined,
    backgroundAttachment: background.parallax ? 'fixed' : undefined,
    color: section.textColor || undefined,
    paddingTop: spacing.top || spacing.padding ? `${spacing.top || spacing.padding}px` : undefined,
    paddingBottom: spacing.bottom || spacing.padding ? `${spacing.bottom || spacing.padding}px` : undefined,
    paddingLeft: spacing.left ? `${spacing.left}px` : undefined,
    paddingRight: spacing.right ? `${spacing.right}px` : undefined,
    marginTop: spacing.margin ? `${spacing.margin}px` : undefined,
    marginBottom: spacing.margin ? `${spacing.margin}px` : undefined,
  };

  // Animation classes
  const animationClass = animation.type === 'fade-in' ? 'animate-fade-in' :
                         animation.type === 'slide-in' ? 'animate-slide-in' :
                         animation.type === 'zoom' ? 'animate-zoom' : '';

  const renderContent = () => {
    if (children) {
      return children;
    }

    // Map old section types to new professional types for backward compatibility
    const mappedSectionType = mapOldSectionType(section.sectionType);

    // Render based on section type first, then layout
    switch (mappedSectionType) {
      // Hero & Banner Sections
      case 'HERO_BANNER':
      case 'HERO': // Backward compatibility
        return renderHeroSection(content);
      
      // Content Sections
      case 'PARAGRAPH_CONTENT':
      case 'CONTENT_SECTION': // Alias for PARAGRAPH_CONTENT
      case 'RICH_TEXT': // Backward compatibility
        return renderRichTextSection(content);
      
      case 'IMAGE_WITH_TEXT':
      case 'SPLIT_CONTENT':
        return renderSplitContentSection(content);
      
      // Media Sections
      case 'IMAGE_GALLERY':
      case 'GALLERY': // Backward compatibility
        return renderByLayout(content, section.layoutType, mappedSectionType);
      
      case 'VIDEO_SECTION':
      case 'VIDEO': // Backward compatibility
        return renderVideoSection(content);
      
      // Card & Grid Sections
      case 'CARD_SECTION':
      case 'CARD_GRID': // Enhanced card grid with styling options
      case 'CARDS': // Backward compatibility
        return renderByLayout(content, section.layoutType, mappedSectionType);
      
      case 'FEATURES_GRID':
      case 'FEATURES': // Backward compatibility
        return renderByLayout(content, section.layoutType, mappedSectionType);
      
      case 'STATISTICS_SECTION':
      case 'STATS': // Backward compatibility
        return renderStatsSection(content, section.layoutType);
      
      case 'TEAM_MEMBERS':
      case 'MEMBERS': // Backward compatibility
        return renderByLayout(content, section.layoutType, mappedSectionType);
      
      case 'ACTIVE_PANCHAYATS_GRID':
      case 'ACTIVE_PANCHAYATS': // Backward compatibility
        return renderByLayout(content, section.layoutType, mappedSectionType);
      
      // Interactive Sections
      case 'FAQ_SECTION':
      case 'FAQ': // Backward compatibility
        return renderFAQSection(content);
      
      case 'FORM_SECTION':
      case 'FORM': // Backward compatibility
        return renderFormSection(content);
      
      case 'TESTIMONIALS_SECTION':
      case 'TESTIMONIALS': // Backward compatibility
        return renderTestimonialsSection(content, section.layoutType);
      
      case 'TIMELINE_SECTION':
      case 'TIMELINE': // Backward compatibility
        return renderTimelineSection(content);
      
      // Specialized Sections
      case 'NEWS_FEED':
      case 'NEWS': // Backward compatibility
      case 'ANNOUNCEMENTS': // Backward compatibility
        return renderByLayout(content, section.layoutType, mappedSectionType);
      
      case 'SCHEMES_LIST':
      case 'SCHEMES': // Backward compatibility
        return renderByLayout(content, section.layoutType, mappedSectionType);
      
      case 'CONTACT_INFO':
      case 'CONTACT': // Backward compatibility
        return renderContactInfoSection(content);
      
      case 'MAP_SECTION':
      case 'MAP': // Backward compatibility
        return renderMapSection(content);
      
      case 'CALL_TO_ACTION':
      case 'CTA': // Backward compatibility
        return renderCTASection(content);
      
      case 'SOCIAL_MEDIA_LINKS':
        return renderSocialMediaSection(content);
      
      default:
        // Use layout-based rendering for other types
        return renderByLayout(content, section.layoutType, mappedSectionType);
    }
  };

  const renderHeroSection = (content: any) => {
    const cta = content.cta || { text: 'Learn More', link: '#', style: 'primary', size: 'md' };
    return (
      <div className="relative min-h-[400px] flex items-center justify-center text-center">
        {background.overlay && (
          <div 
            className="absolute inset-0 z-0"
            style={{ backgroundColor: background.overlay }}
          />
        )}
        <div className="relative z-10 max-w-4xl mx-auto px-4">
          {section.title && <h1 className="text-4xl md:text-6xl font-bold mb-4">{section.title}</h1>}
          {section.subtitle && <p className="text-xl md:text-2xl mb-8 opacity-90">{section.subtitle}</p>}
          {cta && (
            <Button
              size={cta.size as any}
              variant={cta.style === 'primary' ? 'default' : cta.style === 'secondary' ? 'secondary' : 'outline'}
              onClick={() => window.location.href = cta.link}
            >
              {cta.text}
              {cta.icon && <ExternalLink className="ml-2 h-4 w-4" />}
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderStatsSection = (content: any, layoutType: LayoutType) => {
    const items = content.items || [];
    
    if (layoutType === 'GRID') {
      const columns = content.columns || 4;
      return (
        <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`}>
          {items.map((item: ContentItem, index: number) => (
            <Card key={index} className="text-center">
              <CardContent className="p-6">
                {item.icon && <div className="text-4xl mb-4">{getIconComponent(item.icon)}</div>}
                <div className="text-4xl font-bold mb-2">{item.value || '0'}</div>
                <div className="text-sm opacity-80">{item.label || item.title}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      );
    }
    
    return renderByLayout(content, layoutType, 'STATS');
  };

  const renderFAQSection = (content: any) => {
    const items = content.items || [];
    return (
      <Accordion type="single" collapsible className="w-full">
        {items.map((item: ContentItem, index: number) => (
          <AccordionItem key={index} value={`item-${index}`}>
            <AccordionTrigger className="text-left">{item.title || 'Question'}</AccordionTrigger>
            <AccordionContent>
              <p className="text-muted-foreground">{item.description || 'Answer'}</p>
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    );
  };

  const renderFormSection = (content: any) => {
    const fields = content.formFields || [];
    const [formData, setFormData] = useState<Record<string, any>>({});

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      // Form submission logic would go here
      console.log('Form submitted:', formData);
    };

    return (
      <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl mx-auto">
        {fields.map((field: FormField) => (
          <div key={field.id} className="space-y-2">
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            {field.type === 'textarea' ? (
              <Textarea
                id={field.id}
                placeholder={field.placeholder}
                required={field.required}
                value={formData[field.id] || ''}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              />
            ) : field.type === 'select' ? (
              <Select
                value={formData[field.id] || ''}
                onValueChange={(value) => setFormData({ ...formData, [field.id]: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder={field.placeholder} />
                </SelectTrigger>
                <SelectContent>
                  {field.options?.map((option) => (
                    <SelectItem key={option} value={option}>{option}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'checkbox' ? (
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={field.id}
                  checked={formData[field.id] || false}
                  onCheckedChange={(checked) => setFormData({ ...formData, [field.id]: checked })}
                />
                <Label htmlFor={field.id} className="cursor-pointer">{field.label}</Label>
              </div>
            ) : (
              <Input
                id={field.id}
                type={field.type === 'email' ? 'email' : field.type === 'phone' ? 'tel' : field.type === 'date' ? 'date' : 'text'}
                placeholder={field.placeholder}
                required={field.required}
                value={formData[field.id] || ''}
                onChange={(e) => setFormData({ ...formData, [field.id]: e.target.value })}
              />
            )}
          </div>
        ))}
        <Button type="submit" className="w-full">Submit</Button>
      </form>
    );
  };

  const renderVideoSection = (content: any) => {
    const media = content.media || {};
    const videoUrl = media.url || '';
    
    if (!videoUrl) return null;

    // Extract video ID from YouTube/Vimeo URLs
    const getVideoEmbedUrl = (url: string) => {
      if (url.includes('youtube.com/watch') || url.includes('youtu.be/')) {
        const videoId = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1];
        return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
      }
      if (url.includes('vimeo.com/')) {
        const videoId = url.match(/vimeo\.com\/(\d+)/)?.[1];
        return videoId ? `https://player.vimeo.com/video/${videoId}` : null;
      }
      return url; // Direct video URL
    };

    const embedUrl = getVideoEmbedUrl(videoUrl);
    if (!embedUrl) return null;

    // Determine if it's an embedded video (YouTube/Vimeo) or direct video
    const isEmbedded = embedUrl.includes('youtube.com/embed') || embedUrl.includes('vimeo.com');

    return (
      <div className="flex justify-center">
        <div className="relative w-full max-w-5xl mx-auto px-4">
          <div className="relative aspect-video w-full max-h-[450px] md:max-h-[500px] bg-black rounded-xl overflow-hidden shadow-2xl">
            {isEmbedded ? (
              <iframe
                src={embedUrl}
                className="absolute inset-0 w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                title="Video player"
              />
            ) : (
              <video
                src={embedUrl}
                className="w-full h-full object-contain"
                controls={media.controls !== false}
                autoPlay={media.autoplay}
                loop={media.loop}
                playsInline
              >
                Your browser does not support the video tag.
              </video>
            )}
            {/* Optional thumbnail overlay for direct videos */}
            {!isEmbedded && media.thumbnail && (
              <div 
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${media.thumbnail})` }}
              />
            )}
          </div>
          {/* Video metadata display (optional) */}
          {(media.title || media.description) && (
            <div className="mt-4 text-center space-y-2">
              {media.title && (
                <h3 className="text-lg md:text-xl font-semibold text-foreground">{media.title}</h3>
              )}
              {media.description && (
                <p className="text-sm md:text-base text-muted-foreground max-w-2xl mx-auto">
                  {media.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTimelineSection = (content: any) => {
    const items = content.items || [];
    return (
      <div className="relative">
        <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-0.5 bg-border transform md:-translate-x-1/2" />
        <div className="space-y-8">
          {items.map((item: ContentItem, index: number) => (
            <div key={index} className="relative flex items-start gap-4">
              <div className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-white" />
              </div>
              <div className="flex-1 pb-8">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{item.title || 'Event'}</CardTitle>
                      {item.subtitle && (
                        <Badge variant="secondary">{item.subtitle}</Badge>
                      )}
                    </div>
                  </CardHeader>
                  {item.description && (
                    <CardContent>
                      <p className="text-muted-foreground">{item.description}</p>
                    </CardContent>
                  )}
                </Card>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderTestimonialsSection = (content: any, layoutType: LayoutType) => {
    const items = content.items || [];
    
    if (layoutType === 'CAROUSEL') {
      return renderCarouselLayout(content, 'TESTIMONIALS');
    }

    const columns = content.columns || 3;
    return (
      <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`}>
        {items.map((item: ContentItem, index: number) => (
          <Card key={index}>
            <CardHeader>
              <div className="flex items-center gap-1 mb-2">
                {Array.from({ length: parseInt(item.value || '5') }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <CardDescription className="text-base">{item.description || 'Testimonial text'}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-3">
                {item.image && (
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title || ''}
                    className="w-12 h-12 rounded-full"
                  />
                )}
                <div>
                  <div className="font-semibold">{item.title || 'Citizen'}</div>
                  {item.subtitle && <div className="text-sm text-muted-foreground">{item.subtitle}</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderRichTextSection = (content: any) => {
    const items = content.items || [];
    const richText = content.richText || '';
    
    // If richText exists, render it (and items if they exist)
    if (richText) {
      return (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
          <div 
            className="prose prose-lg max-w-none"
            dangerouslySetInnerHTML={{ __html: richText }}
          />
          {/* Render items after richText if they exist */}
          {items.length > 0 && (
            <div className="space-y-6 mt-8 ">
              {items.map((item: ContentItem, index: number) => (
                <div key={index} className="prose prose-lg max-w-none">
                  {item.title && (
                    <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
                  )}
                  {item.subtitle && (
                    <p className="text-lg text-muted-foreground mb-4">{item.subtitle}</p>
                  )}
                  {item.description && (
                    <div 
                      className="text-base leading-relaxed whitespace-pre-line"
                      dangerouslySetInnerHTML={{ __html: item.description.replace(/\n/g, '<br />') }}
                    />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    
    // If items exist, render them as content blocks
    if (items.length > 0) {
      return (
        <div className="space-y-6">
          {items.map((item: ContentItem, index: number) => (
            <div key={item.id || index} className="prose prose-lg max-w-none">
              {item.title && (
                <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              )}
              {item.subtitle && (
                <p className="text-lg text-muted-foreground mb-4">{item.subtitle}</p>
              )}
              {item.description && (
                <div 
                  className="text-base leading-relaxed whitespace-pre-line"
                  dangerouslySetInnerHTML={{ __html: item.description.replace(/\n/g, '<br />') }}
                />
              )}
            </div>
          ))}
        </div>
      );
    }
    
    // Fallback: render a message if neither richText nor items exist
    return (
      <div className="text-center text-muted-foreground py-8">
        <p>No content available for this section.</p>
      </div>
    );
  };

  // Helper function to parse coordinates
  const parseCoordinates = (coordString: string): [number, number] => {
    if (!coordString) return [22.9734, 78.6569];
    const [latStr, lngStr] = coordString.split(',');
    const lat = Number(latStr.trim());
    const lng = Number(lngStr.trim());
    if (isNaN(lat) || isNaN(lng)) return [22.9734, 78.6569];
    return [lat, lng];
  };

  const renderMapSection = (content: any) => {
    const coordinates = content.customSettings?.coordinates || '';
    const zoom = content.customSettings?.zoom || 15;

    if (!coordinates) return null;

    const coords = parseCoordinates(coordinates);

    return (
      <div className="h-96 w-full rounded-lg overflow-hidden border">
        <MapContainer
          center={coords as LatLngExpression}
          zoom={zoom}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          <Marker position={coords}>
            <Popup>
              <strong>{section.title || 'Location'}</strong>
            </Popup>
          </Marker>
        </MapContainer>
      </div>
    );
  };

  const renderSplitContentSection = (content: any) => {
    const items = content.items || [];
    // For IMAGE_WITH_TEXT, check content.image first, then section.imageUrl, then items
    // Ensure content.image is properly extracted (handle both string and object content)
    let imageUrl = null;
    
    // Try to extract image from content object
    if (content && typeof content === 'object') {
      imageUrl = content.image || null;
      // Handle case where image might be stored as empty string or "null" string
      if (imageUrl && (imageUrl === '' || imageUrl === 'null' || imageUrl === 'undefined')) {
        imageUrl = null;
      }
    }
    
    // Fallback to section.imageUrl if content.image is not available
    if (!imageUrl) {
      imageUrl = section.imageUrl || null;
    }
    
    const imagePosition = content?.imagePosition || 'left';
    
    // Debug logging for production issues (only in development or when image is missing)
    if (section.sectionType === 'IMAGE_WITH_TEXT' && (!imageUrl || import.meta.env.DEV)) {
      console.log('IMAGE_WITH_TEXT render debug:', {
        sectionType: section.sectionType,
        sectionId: section.id,
        hasContent: !!content,
        contentType: typeof content,
        contentKeys: content && typeof content === 'object' ? Object.keys(content) : [],
        contentImage: content?.image,
        contentImageType: typeof content?.image,
        sectionImageUrl: section.imageUrl,
        finalImageUrl: imageUrl,
        itemsLength: items.length,
        imagePosition,
        rawContent: typeof section.content === 'string' ? section.content.substring(0, 200) : 'not a string'
      });
    }
    
    if (items.length === 0 && imageUrl) {
      // Single image with text layout (IMAGE_WITH_TEXT)
      const imageElement = (
        <div>
          <ImageWithFallback
            src={imageUrl}
            alt={section.title || content.title || 'Section image'}
            className="w-full h-auto rounded-lg"
          />
        </div>
      );
      
      const textElement = (
        <div>
          {(section.title || content.title) && (
            <h3 className="text-2xl font-bold mb-4">{section.title || content.title}</h3>
          )}
          {section.subtitle && <p className="text-muted-foreground mb-4">{section.subtitle}</p>}
          {content.content && (
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content.content }}
            />
          )}
          {content.richText && (
            <div 
              className="prose prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: content.richText }}
            />
          )}
          {content.cta && (
            <Button
              size={content.cta.size as any}
              variant={content.cta.style === 'primary' ? 'default' : content.cta.style === 'secondary' ? 'secondary' : 'outline'}
              onClick={() => window.location.href = content.cta.link}
              className="mt-4"
            >
              {content.cta.text}
              {content.cta.icon && <ExternalLink className="ml-2 h-4 w-4" />}
            </Button>
          )}
        </div>
      );
      
      // Render based on image position
      if (imagePosition === 'right') {
        return (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {textElement}
            {imageElement}
          </div>
        );
      } else if (imagePosition === 'top') {
        return (
          <div className="space-y-8">
            {imageElement}
            {textElement}
          </div>
        );
      } else if (imagePosition === 'bottom') {
        return (
          <div className="space-y-8">
            {textElement}
            {imageElement}
          </div>
        );
      } else {
        // Default: left
        return (
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {imageElement}
            {textElement}
          </div>
        );
      }
    }
    // Use layout-based rendering
    return renderByLayout(content, section.layoutType, 'SPLIT_CONTENT');
  };

  const renderContactInfoSection = (content: any) => {
    const items = content.items || [];
    return (
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          {items.map((item: ContentItem, index: number) => (
            <Card key={index}>
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  {item.icon && (
                    <div className="p-3 bg-primary/10 rounded-lg">
                      {getIconComponent(item.icon)}
                    </div>
                  )}
                  <div className="flex-1">
                    {item.title && <h4 className="font-semibold mb-1">{item.title}</h4>}
                    {item.description && <p className="text-muted-foreground">{item.description}</p>}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        {content.customSettings?.coordinates && (
          <div className="h-96 w-full rounded-lg overflow-hidden border">
            <MapContainer
              center={parseCoordinates(content.customSettings.coordinates) as LatLngExpression}
              zoom={content.customSettings.zoom || 15}
              style={{ height: '100%', width: '100%' }}
              scrollWheelZoom={false}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              />
              <Marker position={parseCoordinates(content.customSettings.coordinates)}>
                <Popup>
                  <strong>{section.title || 'Location'}</strong>
                </Popup>
              </Marker>
            </MapContainer>
          </div>
        )}
      </div>
    );
  };

  const renderCTASection = (content: any) => {
    const cta = content.cta || { text: 'Get Started', link: '#', style: 'primary', size: 'lg' };
    return (
      <div className="text-center py-12">
        {section.title && <h2 className="text-3xl md:text-4xl font-bold mb-4">{section.title}</h2>}
        {section.subtitle && <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">{section.subtitle}</p>}
        {content.richText && (
          <div 
            className="prose prose-lg max-w-none mb-8"
            dangerouslySetInnerHTML={{ __html: content.richText }}
          />
        )}
        {cta && (
          <Button
            size={cta.size as any}
            variant={cta.style === 'primary' ? 'default' : cta.style === 'secondary' ? 'secondary' : 'outline'}
            onClick={() => window.location.href = cta.link}
            className="text-lg px-8 py-6"
          >
            {cta.text}
            {cta.icon && <ExternalLink className="ml-2 h-4 w-4" />}
          </Button>
        )}
      </div>
    );
  };

  const renderSocialMediaSection = (content: any) => {
    const items = content.items || [];
    const columns = content.columns || 4;
    
    return (
      <div className={`grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-${Math.min(columns, 4)} justify-center`}>
        {items.map((item: ContentItem, index: number) => (
          <a
            key={index}
            href={item.link || '#'}
            target="_blank"
            rel="noopener noreferrer"
            className="flex flex-col items-center gap-2 p-4 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors border border-gray-200 dark:border-gray-700"
          >
            {item.image ? (
              <ImageWithFallback
                src={item.image}
                alt={item.title || ''}
                className="w-16 h-16 object-contain"
              />
            ) : item.icon ? (
              <div className="w-16 h-16 flex items-center justify-center text-4xl">
                {getIconComponent(item.icon)}
              </div>
            ) : null}
            <span className="font-medium text-center">{item.title}</span>
            {item.description && (
              <span className="text-sm text-muted-foreground text-center">{item.description}</span>
            )}
          </a>
        ))}
      </div>
    );
  };

  const renderByLayout = (content: any, layoutType: LayoutType, sectionType?: string) => {
    const items = content.items || [];
    
    switch (layoutType) {
      case 'GRID':
        return renderGridLayout(content, sectionType);
      case 'ROW':
        return renderRowLayout(content, sectionType);
      case 'SCROLLING_ROW':
        return renderScrollingRowLayout(content, sectionType);
      case 'CAROUSEL':
        return renderCarouselLayout(content, sectionType);
      case 'MASONRY':
        return renderMasonryLayout(content, sectionType);
      case 'LIST':
        return renderListLayout(content, sectionType);
      case 'SPLIT':
        return renderSplitLayout(content, sectionType);
      case 'FULL_WIDTH':
        return renderFullWidthLayout(content, sectionType);
      case 'CONTAINED':
        return renderContainedLayout(content, sectionType);
      default:
        return renderDefaultLayout(content);
    }
  };

  const renderGridLayout = (content: any, sectionType?: string) => {
    const items = content.items || [];
    const columns = content.columns || 3;
    
    return (
      <div className={`grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-${columns}`}>
        {items.map((item: ContentItem, index: number) => renderItemCard(item, index, sectionType))}
      </div>
    );
  };

  const renderRowLayout = (content: any, sectionType?: string) => {
    const items = content.items || [];
    
    return (
      <div className="flex flex-wrap gap-6">
        {items.map((item: ContentItem, index: number) => (
          <div key={index} className="flex-1 min-w-[200px]">
            {renderItemCard(item, index, sectionType)}
          </div>
        ))}
      </div>
    );
  };

  const renderScrollingRowLayout = (content: any, sectionType?: string) => {
    const items = content.items || [];
    
    return (
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
        {items.map((item: ContentItem, index: number) => (
          <div key={index} className="flex-shrink-0 w-[300px]">
            {renderItemCard(item, index, sectionType)}
          </div>
        ))}
      </div>
    );
  };

  const renderCarouselLayout = (content: any, sectionType?: string) => {
    const items = content.items || [];
    if (items.length === 0) return null;

    // Get carousel config from content, with fallback to legacy autoPlay/interval
    const carouselConfig: CarouselConfig = content.carouselConfig || {
      layoutType: 'single',
      indicatorType: 'dots',
      itemsPerView: 1,
      itemsPerViewMobile: 1,
      itemsPerViewTablet: 2,
      autoPlay: content.autoPlay || false,
      interval: content.interval || 5000,
      pauseOnHover: true,
      loop: true,
      showArrows: true,
      showIndicators: true,
      transitionDuration: 500,
      gap: 16,
      centeredSlides: false,
      partialVisible: false,
    };

    // Render carousel items
    const carouselItems = items.map((item: ContentItem, index: number) => {
      if (sectionType === 'TESTIMONIALS') {
        return (
          <Card key={index} className="h-full max-h-[400px]">
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-1 mb-4">
                {Array.from({ length: parseInt(item.value || '5') }).map((_, i) => (
                  <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              <p className="text-lg mb-4">{item.description}</p>
              <div className="flex items-center gap-3">
                {item.image && (
                  <ImageWithFallback src={item.image} alt={item.title || ''} className="w-12 h-12 rounded-full" />
                )}
                <div>
                  <div className="font-semibold">{item.title}</div>
                  {item.subtitle && <div className="text-sm text-muted-foreground">{item.subtitle}</div>}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      } else if (item.image) {
        return (
          <div key={index} className="aspect-[16/9] w-full max-h-[450px] md:max-h-[500px] relative">
            <ImageWithFallback
              src={item.image}
              alt={item.title || ''}
              className="h-full w-full object-cover rounded-lg"
              style={{ objectFit: item.imageFit || 'cover' }}
            />
            {/* Overlay with title/description if available */}
            {(item.title || item.description) && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/75 via-black/50 to-transparent p-4 md:p-6 rounded-b-lg">
                {item.title && (
                  <h3 className="text-white text-base md:text-lg lg:text-xl font-semibold mb-1 drop-shadow-lg">{item.title}</h3>
                )}
                {item.description && (
                  <p className="text-white/95 text-sm md:text-base line-clamp-2 drop-shadow-md">{item.description}</p>
                )}
              </div>
            )}
          </div>
        );
      } else {
        return (
          <Card key={index} className="h-full max-h-[400px]">
            <CardContent className="p-6 md:p-8">
              {item.title && <h3 className="text-xl md:text-2xl font-bold mb-2">{item.title}</h3>}
              {item.description && <p className="text-base">{item.description}</p>}
            </CardContent>
          </Card>
        );
      }
    });

    return (
      <div className="relative max-w-5xl mx-auto px-4">
        <Carousel
          items={carouselItems}
          config={carouselConfig}
          className="w-full"
        />
      </div>
    );
  };

  const renderMasonryLayout = (content: any, sectionType?: string) => {
    const items = content.items || [];
    // Simple masonry using CSS columns
    return (
      <div className="columns-1 md:columns-2 lg:columns-3 gap-6">
        {items.map((item: ContentItem, index: number) => (
          <div key={index} className="break-inside-avoid mb-6">
            {renderItemCard(item, index, sectionType)}
          </div>
        ))}
      </div>
    );
  };

  const renderListLayout = (content: any, sectionType?: string) => {
    const items = content.items || [];
    return (
      <div className="space-y-4">
        {items.map((item: ContentItem, index: number) => (
          <Card key={index}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                {item.image && (
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title || ''}
                    className="w-20 h-20 rounded"
                    style={{ objectFit: item.imageFit || 'cover' }}
                  />
                )}
                <div className="flex-1">
                  {item.title && <h3 className="font-semibold mb-1">{item.title}</h3>}
                  {item.subtitle && <p className="text-sm text-muted-foreground mb-2">{item.subtitle}</p>}
                  {item.description && <p className="text-sm">{item.description}</p>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  };

  const renderSplitLayout = (content: any, sectionType?: string) => {
    const items = content.items || [];
    if (items.length === 0) return null;
    
    const firstItem = items[0];
    return (
      <div className="grid md:grid-cols-2 gap-8 items-center">
        <div>
          {firstItem.image && (
            <ImageWithFallback
              src={firstItem.image}
              alt={firstItem.title || ''}
              className="w-full h-auto rounded-lg"
            />
          )}
        </div>
        <div>
          {firstItem.title && <h3 className="text-2xl font-bold mb-4">{firstItem.title}</h3>}
          {firstItem.description && <p className="text-muted-foreground mb-4">{firstItem.description}</p>}
          {firstItem.link && (
            <Button asChild>
              <a href={firstItem.link}>Learn More</a>
            </Button>
          )}
        </div>
      </div>
    );
  };

  const renderFullWidthLayout = (content: any, sectionType?: string) => {
    const items = content.items || [];
    return (
      <div className="w-full">
        {items.map((item: ContentItem, index: number) => renderItemCard(item, index, sectionType))}
      </div>
    );
  };

  const renderContainedLayout = (content: any, sectionType?: string) => {
    const items = content.items || [];
    return (
      <div className="max-w-4xl px-4 sm:px-6 lg:px-8 mx-auto">
        {items.map((item: ContentItem, index: number) => renderItemCard(item, index, sectionType))}
      </div>
    );
  };

  const renderItemCard = (item: ContentItem, index: number, sectionType?: string) => {
    const ItemImage = ({ src, alt, imageFit }: { src: string; alt: string; imageFit?: string }) => {
      // ImageWithFallback will handle placeholder URLs automatically
      if (!src) return null;
      return <ImageWithFallback src={src} alt={alt} className="h-full w-full" style={{ objectFit: imageFit || 'cover' }} />;
    };

    if (sectionType === 'STATS') {
      return (
        <Card key={index} className="text-center">
          <CardContent className="p-6">
            {item.icon && <div className="text-4xl mb-4">{getIconComponent(item.icon)}</div>}
            <div className="text-4xl font-bold mb-2">{item.value || '0'}</div>
            <div className="text-sm opacity-80">{item.label || item.title}</div>
          </CardContent>
        </Card>
      );
    }

    return (
      <Card key={index} className="h-full transition-all hover:shadow-lg">
        {item.image && (
          <div className="aspect-video w-full overflow-hidden rounded-t-lg">
            <ItemImage src={item.image} alt={item.title || ''} imageFit={item.imageFit} />
          </div>
        )}
        <CardHeader>
          {item.title && <CardTitle>{item.title}</CardTitle>}
          {item.subtitle && <CardDescription>{item.subtitle}</CardDescription>}
        </CardHeader>
        {item.description && (
          <CardContent>
            <p>{item.description}</p>
            {item.link && (
              <Button variant="link" className="mt-4 p-0" asChild>
                <a href={item.link}>Learn More <ExternalLink className="ml-1 h-3 w-3" /></a>
              </Button>
            )}
          </CardContent>
        )}
      </Card>
    );
  };

  const renderDefaultLayout = (content: any) => {
    return (
      <div>
        {content.html && (
          <div dangerouslySetInnerHTML={{ __html: content.html }} />
        )}
        {content.text && <p>{content.text}</p>}
        {!content.html && !content.text && content.items && (
          <div className="space-y-4">
            {content.items.map((item: any, index: number) => (
              <div key={index}>
                {item.title && <h3>{item.title}</h3>}
                {item.description && <p>{item.description}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
      'users': Users,
      'building': Building2,
      'trending-up': TrendingUp,
      'award': Award,
      'calendar': Calendar,
      'map-pin': MapPin,
      'phone': Phone,
      'mail': Mail,
      'clock': Clock,
    };
    const Icon = iconMap[iconName.toLowerCase()] || TrendingUp;
    return <Icon className="h-8 w-8" />;
  };

  const containerClass = section.layoutType === 'FULL_WIDTH' ? 'w-full' : 
                         section.layoutType === 'CONTAINED' ? 'max-w-4xl mx-auto px-4 sm:px-6 lg:px-8' : 
                         'container mx-auto px-4';

  const renderedContent = renderContent();
  
  // Don't render section if there's no content, title, subtitle, or image
  // But always render if there's a title or subtitle (even if content is empty)
  if (!renderedContent && !section.title && !section.subtitle && !imageUrl) {
    return null;
  }

  return (
    <section
      className={`py-12 ${animationClass} ${section.backgroundColor ? '' : 'bg-white'}`}
      style={sectionStyle}
    >
      <div className={containerClass}>
        {(section.title || section.subtitle) && (
          <div className="mb-8 text-center">
            {section.title && (
              <h2 className="text-3xl font-bold mb-4">{section.title}</h2>
            )}
            {section.subtitle && (
              <p className="text-lg opacity-90">{section.subtitle}</p>
            )}
          </div>
        )}
        
        {imageUrl && !section.content?.items && (
          <div className="mb-8">
            <ImageWithFallback
              src={imageUrl}
              alt={section.title || 'Section image'}
              className="w-full h-auto rounded-lg"
              style={{ objectFit: section.imageFit || 'cover' }}
            />
          </div>
        )}

        {renderedContent}
      </div>
    </section>
  );
}
