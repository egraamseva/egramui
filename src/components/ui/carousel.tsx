import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { cn } from './utils';

export type CarouselLayoutType = 
  | 'single'           // One item visible at a time
  | 'multi'            // Multiple items visible (configurable)
  | 'centered'          // Active item centered with partial prev/next visible
  | 'full-width'       // Slide occupies entire viewport width
  | 'thumbnail';        // Main carousel synced with thumbnail navigation

export type CarouselIndicatorType = 
  | 'dots'             // Dot indicators (default)
  | 'progress'          // Progress bar indicator
  | 'numbered'          // Numbered indicators (e.g., 1 / 5)
  | 'arrows-only';      // Arrow-only mode (no indicators)

export interface CarouselConfig {
  layoutType?: CarouselLayoutType;
  indicatorType?: CarouselIndicatorType;
  itemsPerView?: number;        // For multi layout: number of items visible
  itemsPerViewMobile?: number;  // Mobile override
  itemsPerViewTablet?: number;  // Tablet override
  autoPlay?: boolean;
  interval?: number;            // Auto-play interval in ms
  pauseOnHover?: boolean;
  loop?: boolean;                // Infinite loop
  showArrows?: boolean;
  showIndicators?: boolean;
  transitionDuration?: number;   // Transition duration in ms
  gap?: number;                  // Gap between items in pixels
  centeredSlides?: boolean;      // Center slides (for centered layout)
  partialVisible?: boolean;      // Show partial prev/next slides
}

export interface CarouselProps {
  items: React.ReactNode[];
  config?: CarouselConfig;
  renderItem?: (item: React.ReactNode, index: number, isActive: boolean) => React.ReactNode;
  className?: string;
  itemClassName?: string;
  onSlideChange?: (index: number) => void;
}

const DEFAULT_CONFIG: Required<CarouselConfig> = {
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
};

export function Carousel({
  items,
  config = {},
  renderItem,
  className,
  itemClassName,
  onSlideChange,
}: CarouselProps) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const {
    layoutType,
    indicatorType,
    itemsPerView,
    itemsPerViewMobile,
    itemsPerViewTablet,
    autoPlay,
    interval,
    pauseOnHover,
    loop,
    showArrows,
    showIndicators,
    transitionDuration,
    gap,
    centeredSlides,
    partialVisible,
  } = mergedConfig;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [viewportWidth, setViewportWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024);
  const carouselRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const autoPlayTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Responsive items per view
  const getItemsPerView = useCallback(() => {
    if (viewportWidth < 768) return itemsPerViewMobile;
    if (viewportWidth < 1024) return itemsPerViewTablet;
    return itemsPerView;
  }, [viewportWidth, itemsPerView, itemsPerViewMobile, itemsPerViewTablet]);

  const effectiveItemsPerView = getItemsPerView();
  const totalSlides = Math.ceil(items.length / effectiveItemsPerView);

  // Define navigation functions first (before useEffects that use them)
  const goToSlide = useCallback((index: number, skipTransition = false) => {
    if (isTransitioning && !skipTransition) return;
    
    let targetIndex = index;
    if (loop) {
      if (targetIndex < 0) targetIndex = totalSlides - 1;
      if (targetIndex >= totalSlides) targetIndex = 0;
    } else {
      targetIndex = Math.max(0, Math.min(totalSlides - 1, targetIndex));
    }

    if (targetIndex !== currentIndex) {
      setIsTransitioning(true);
      setCurrentIndex(targetIndex);
      onSlideChange?.(targetIndex);
      
      setTimeout(() => {
        setIsTransitioning(false);
      }, transitionDuration);
    }
  }, [currentIndex, totalSlides, loop, isTransitioning, transitionDuration, onSlideChange, effectiveItemsPerView]);

  const goToNext = useCallback(() => {
    if (!isTransitioning) {
      goToSlide(currentIndex + 1);
    }
  }, [currentIndex, goToSlide, isTransitioning]);

  const goToPrev = useCallback(() => {
    if (!isTransitioning) {
      goToSlide(currentIndex - 1);
    }
  }, [currentIndex, goToSlide, isTransitioning]);

  const goToSlideIndex = useCallback((index: number) => {
    goToSlide(index);
  }, [goToSlide]);

  // Handle viewport resize
  useEffect(() => {
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Auto-play logic (now goToNext is defined)
  useEffect(() => {
    if (autoPlay && !isPaused && items.length > effectiveItemsPerView && !isTransitioning) {
      autoPlayTimerRef.current = setInterval(() => {
        goToNext();
      }, interval);
      return () => {
        if (autoPlayTimerRef.current) {
          clearInterval(autoPlayTimerRef.current);
        }
      };
    } else {
      if (autoPlayTimerRef.current) {
        clearInterval(autoPlayTimerRef.current);
        autoPlayTimerRef.current = null;
      }
    }
  }, [autoPlay, isPaused, items.length, effectiveItemsPerView, interval, isTransitioning, goToNext]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (carouselRef.current?.contains(document.activeElement) || 
          document.activeElement === carouselRef.current) {
        if (e.key === 'ArrowLeft') {
          e.preventDefault();
          goToPrev();
        } else if (e.key === 'ArrowRight') {
          e.preventDefault();
          goToNext();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrev]);

  // Touch/swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(distance) > minSwipeDistance) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrev();
      }
    }

    touchStartX.current = null;
    touchEndX.current = null;
  };

  // Mouse drag handlers
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const dragOffset = useRef(0);

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    carouselRef.current?.style.setProperty('cursor', 'grabbing');
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    dragOffset.current = e.clientX - dragStartX.current;
  };

  const handleMouseUp = () => {
    if (!isDragging.current) return;
    isDragging.current = false;
    carouselRef.current?.style.setProperty('cursor', 'grab');

    const minDragDistance = 50;
    if (Math.abs(dragOffset.current) > minDragDistance) {
      if (dragOffset.current > 0) {
        goToPrev();
      } else {
        goToNext();
      }
    }
    dragOffset.current = 0;
  };

  // Calculate transform based on layout type
  const getTransform = () => {
    if (effectiveItemsPerView >= items.length) {
      return 'translateX(0%)';
    }
    
    const slideWidth = 100 / effectiveItemsPerView;
    let offset = -currentIndex * slideWidth;

    if (layoutType === 'centered' && centeredSlides) {
      offset = -currentIndex * slideWidth + (100 - slideWidth * effectiveItemsPerView) / 2;
    }

    return `translateX(${offset}%)`;
  };

  // Render indicators
  const renderIndicators = () => {
    if (!showIndicators || indicatorType === 'arrows-only') return null;

    switch (indicatorType) {
      case 'dots':
        return (
          <div className="flex justify-center items-center gap-2 mt-4" role="tablist" aria-label="Carousel navigation">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                type="button"
                role="tab"
                aria-label={`Go to slide ${index + 1}`}
                aria-selected={index === currentIndex}
                tabIndex={index === currentIndex ? 0 : -1}
                onClick={() => goToSlideIndex(index)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    goToSlideIndex(index);
                  }
                }}
                className={cn(
                  "h-2.5 w-2.5 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2",
                  index === currentIndex
                    ? "bg-primary w-8"
                    : "bg-gray-300 hover:bg-gray-400"
                )}
              />
            ))}
          </div>
        );

      case 'progress':
        const progress = ((currentIndex + 1) / totalSlides) * 100;
        return (
          <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5 overflow-hidden" role="progressbar" aria-valuenow={currentIndex + 1} aria-valuemin={1} aria-valuemax={totalSlides}>
            <div
              className="h-full bg-primary transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        );

      case 'numbered':
        return (
          <div className="flex justify-center items-center gap-2 mt-4 text-sm text-muted-foreground" role="status" aria-live="polite">
            <span className="font-medium">{currentIndex + 1}</span>
            <span>/</span>
            <span>{totalSlides}</span>
          </div>
        );

      default:
        return null;
    }
  };

  // Render thumbnail strip (for thumbnail layout)
  const renderThumbnails = () => {
    if (layoutType !== 'thumbnail') return null;

    return (
      <div className="flex gap-2 mt-4 overflow-x-auto pb-2 scrollbar-thin">
        {items.map((item, index) => {
          const slideIndex = Math.floor(index / effectiveItemsPerView);
          const isActive = slideIndex === currentIndex;

  return (
            <button
              key={index}
              type="button"
              onClick={() => goToSlideIndex(slideIndex)}
              className={cn(
                "flex-shrink-0 w-20 h-20 rounded-lg overflow-hidden border-2 transition-all",
                isActive
                  ? "border-primary scale-105"
                  : "border-gray-200 hover:border-gray-300 opacity-70 hover:opacity-100"
              )}
              aria-label={`Go to slide ${slideIndex + 1}`}
            >
              {item}
            </button>
          );
        })}
      </div>
    );
  };

  if (items.length === 0) return null;

  const containerClass = cn(
    "relative w-full",
    className
  );

  const trackClass = cn(
    "flex transition-transform ease-in-out",
    isTransitioning ? "transition-transform" : "",
    pauseOnHover && "hover:pause-animation"
  );

  const itemBaseClass = cn(
    "flex-shrink-0",
    itemClassName
  );

  return (
    <div
      ref={carouselRef}
      className={containerClass}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      role="region"
      aria-label="Carousel"
      tabIndex={0}
    >
      {/* Main carousel track */}
      <div className="relative overflow-hidden rounded-lg">
        <div
          className={trackClass}
          style={{
            transform: getTransform(),
            transitionDuration: `${transitionDuration}ms`,
            gap: `${gap}px`,
          }}
        >
          {items.map((item, index) => {
            const slideIndex = Math.floor(index / effectiveItemsPerView);
            const isActive = slideIndex === currentIndex;
            const itemStyle: React.CSSProperties = {
              width: `${100 / effectiveItemsPerView}%`,
              paddingLeft: index % effectiveItemsPerView === 0 ? 0 : `${gap / 2}px`,
              paddingRight: index % effectiveItemsPerView === effectiveItemsPerView - 1 ? 0 : `${gap / 2}px`,
            };

            // Apply centered/partial visible styles
            if (layoutType === 'centered' && partialVisible) {
              const distanceFromCenter = Math.abs(slideIndex - currentIndex);
              if (distanceFromCenter > 1) {
                itemStyle.opacity = 0;
                itemStyle.pointerEvents = 'none';
              } else if (distanceFromCenter === 1) {
                itemStyle.opacity = 0.5;
                itemStyle.transform = 'scale(0.9)';
              }
            }

  return (
    <div
                key={index}
                className={itemBaseClass}
                style={itemStyle}
              >
                {renderItem ? renderItem(item, index, isActive) : item}
              </div>
            );
          })}
        </div>

        {/* Navigation arrows */}
        {showArrows && items.length > effectiveItemsPerView && (
          <>
    <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
              onClick={goToPrev}
              aria-label="Previous slide"
              disabled={!loop && currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
    </Button>
    <Button
              type="button"
              variant="outline"
              size="icon"
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white shadow-lg"
              onClick={goToNext}
              aria-label="Next slide"
              disabled={!loop && currentIndex === totalSlides - 1}
            >
              <ChevronRight className="h-4 w-4" />
    </Button>
          </>
        )}
      </div>

      {/* Indicators */}
      {renderIndicators()}

      {/* Thumbnail strip */}
      {renderThumbnails()}
    </div>
  );
}
