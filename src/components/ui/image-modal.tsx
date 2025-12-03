"use client";

import * as React from "react";
import { X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Dialog, DialogContent } from "./dialog";
import { Button } from "./button";
import { cn } from "./utils";

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  alt?: string;
  images?: string[]; // For carousel support
  currentIndex?: number;
  onIndexChange?: (index: number) => void;
}

export function ImageModal({
  isOpen,
  onClose,
  imageUrl,
  alt = "Image",
  images,
  currentIndex = 0,
  onIndexChange,
}: ImageModalProps) {
  const [scale, setScale] = React.useState(1);
  const [position, setPosition] = React.useState({ x: 0, y: 0 });
  const [rotation, setRotation] = React.useState(0);
  const [isDragging, setIsDragging] = React.useState(false);
  const [dragStart, setDragStart] = React.useState({ x: 0, y: 0 });
  const [lastPinchDistance, setLastPinchDistance] = React.useState<number | null>(null);
  const [lastPinchCenter, setLastPinchCenter] = React.useState<{ x: number; y: number } | null>(null);
  const imageRef = React.useRef<HTMLImageElement>(null);
  const containerRef = React.useRef<HTMLDivElement>(null);

  const MIN_SCALE = 1;
  const MAX_SCALE = 5;
  const SCALE_STEP = 0.5;

  // Reset state when modal opens/closes or image changes
  React.useEffect(() => {
    if (isOpen) {
      setScale(1);
      setPosition({ x: 0, y: 0 });
      setRotation(0);
      setLastPinchDistance(null);
      setLastPinchCenter(null);
    }
  }, [isOpen, imageUrl]);

  // Handle zoom in
  const handleZoomIn = () => {
    setScale((prev) => Math.min(prev + SCALE_STEP, MAX_SCALE));
  };

  // Handle zoom out
  const handleZoomOut = () => {
    setScale((prev) => {
      const newScale = Math.max(prev - SCALE_STEP, MIN_SCALE);
      if (newScale === MIN_SCALE) {
        setPosition({ x: 0, y: 0 });
      }
      return newScale;
    });
  };

  // Handle reset
  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
    setRotation(0);
  };

  // Handle rotation
  const handleRotate = () => {
    setRotation((prev) => (prev + 90) % 360);
  };

  // Calculate distance between two touches
  const getDistance = (touch1: Touch, touch2: Touch): number => {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Calculate center point between two touches
  const getCenter = (touch1: Touch, touch2: Touch): { x: number; y: number } => {
    return {
      x: (touch1.clientX + touch2.clientX) / 2,
      y: (touch1.clientY + touch2.clientY) / 2,
    };
  };

  // Get container bounds
  const getContainerBounds = () => {
    if (!containerRef.current) return { width: 0, height: 0, left: 0, top: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      width: rect.width,
      height: rect.height,
      left: rect.left,
      top: rect.top,
    };
  };

  // Constrain position to keep image within bounds
  const constrainPosition = (newPosition: { x: number; y: number }, currentScale: number) => {
    if (!imageRef.current || !containerRef.current) return newPosition;

    const containerBounds = getContainerBounds();
    const img = imageRef.current;
    const imgWidth = img.naturalWidth * currentScale;
    const imgHeight = img.naturalHeight * currentScale;

    const maxX = Math.max(0, (imgWidth - containerBounds.width) / 2);
    const maxY = Math.max(0, (imgHeight - containerBounds.height) / 2);

    return {
      x: Math.max(-maxX, Math.min(maxX, newPosition.x)),
      y: Math.max(-maxY, Math.min(maxY, newPosition.y)),
    };
  };

  // Handle touch start
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      // Single touch - prepare for drag
      setIsDragging(true);
      setDragStart({
        x: e.touches[0].clientX - position.x,
        y: e.touches[0].clientY - position.y,
      });
    } else if (e.touches.length === 2) {
      // Two touches - prepare for pinch
      setIsDragging(false);
      const distance = getDistance(e.touches[0], e.touches[1]);
      const center = getCenter(e.touches[0], e.touches[1]);
      setLastPinchDistance(distance);
      setLastPinchCenter(center);
    }
  };

  // Handle touch move
  const handleTouchMove = (e: React.TouchEvent) => {
    e.preventDefault();

    if (e.touches.length === 1 && isDragging && scale > MIN_SCALE) {
      // Single touch drag
      const newPosition = {
        x: e.touches[0].clientX - dragStart.x,
        y: e.touches[0].clientY - dragStart.y,
      };
      setPosition(constrainPosition(newPosition, scale));
    } else if (e.touches.length === 2) {
      // Pinch to zoom
      const distance = getDistance(e.touches[0], e.touches[1]);
      const center = getCenter(e.touches[0], e.touches[1]);

      if (lastPinchDistance !== null && lastPinchCenter) {
        const scaleChange = distance / lastPinchDistance;
        const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale * scaleChange));

        // Calculate new position to keep pinch center in place
        const containerBounds = getContainerBounds();
        const relativeX = center.x - containerBounds.left - containerBounds.width / 2;
        const relativeY = center.y - containerBounds.top - containerBounds.height / 2;

        const newPosition = {
          x: position.x - (relativeX * (scaleChange - 1)),
          y: position.y - (relativeY * (scaleChange - 1)),
        };

        setScale(newScale);
        setPosition(constrainPosition(newPosition, newScale));
      }

      setLastPinchDistance(distance);
      setLastPinchCenter(center);
    }
  };

  // Handle touch end
  const handleTouchEnd = () => {
    setIsDragging(false);
    setLastPinchDistance(null);
    setLastPinchCenter(null);
  };

  // Handle mouse wheel zoom
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      const delta = e.deltaY > 0 ? -SCALE_STEP : SCALE_STEP;
      const newScale = Math.max(MIN_SCALE, Math.min(MAX_SCALE, scale + delta));
      setScale(newScale);
      if (newScale === MIN_SCALE) {
        setPosition({ x: 0, y: 0 });
      }
    }
  };

  // Handle double click zoom
  const handleDoubleClick = () => {
    if (scale > MIN_SCALE) {
      handleReset();
    } else {
      setScale(2);
    }
  };

  // Handle keyboard navigation for carousel
  React.useEffect(() => {
    if (!isOpen || !images || images.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft" && currentIndex > 0) {
        onIndexChange?.(currentIndex - 1);
      } else if (e.key === "ArrowRight" && currentIndex < images.length - 1) {
        onIndexChange?.(currentIndex + 1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, images, currentIndex, onIndexChange]);

  const currentImage = images ? images[currentIndex] : imageUrl;
  const hasMultipleImages = images && images.length > 1;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-[95vw] max-h-[95vh] w-full h-full p-0 bg-black/95 border-none"
        onInteractOutside={(e) => {
          // Prevent closing on touch interactions
          if (scale > MIN_SCALE) {
            e.preventDefault();
          }
        }}
      >
        <div
          ref={containerRef}
          className="relative w-full h-full flex items-center justify-center overflow-hidden touch-none"
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Close button */}
          <Button
            variant="ghost"
            size="icon"
            className="absolute top-2 right-2 sm:top-4 sm:right-4 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
            onClick={onClose}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>

          {/* Controls */}
          <div className="absolute top-2 left-2 sm:top-4 sm:left-4 z-50 flex flex-col gap-2 sm:flex-row">
            <div className="flex gap-1 sm:gap-2 bg-black/50 rounded-lg p-1">
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleZoomOut}
                disabled={scale <= MIN_SCALE}
              >
                <ZoomOut className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleZoomIn}
                disabled={scale >= MAX_SCALE}
              >
                <ZoomIn className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8"
                onClick={handleRotate}
              >
                <RotateCw className="h-3 w-3 sm:h-4 sm:w-4" />
              </Button>
              {scale > MIN_SCALE && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/20 h-7 w-7 sm:h-8 sm:w-8 text-xs sm:text-sm"
                  onClick={handleReset}
                >
                  <span className="text-xs">Reset</span>
                </Button>
              )}
            </div>
          </div>

          {/* Image */}
          <img
            ref={imageRef}
            src={currentImage}
            alt={alt}
            className={cn(
              "max-w-full max-h-full object-contain select-none",
              scale > MIN_SCALE && "cursor-move"
            )}
            style={{
              transform: `translate(${position.x}px, ${position.y}px) scale(${scale}) rotate(${rotation}deg)`,
              transition: isDragging || lastPinchDistance !== null ? "none" : "transform 0.1s ease-out",
            }}
            onDoubleClick={handleDoubleClick}
            draggable={false}
          />

          {/* Carousel navigation */}
          {hasMultipleImages && (
            <>
              {currentIndex > 0 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
                  onClick={() => onIndexChange?.(currentIndex - 1)}
                >
                  <span className="text-base sm:text-lg">←</span>
                </Button>
              )}
              {currentIndex < images.length - 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-50 bg-black/50 hover:bg-black/70 text-white rounded-full h-8 w-8 sm:h-10 sm:w-10"
                  onClick={() => onIndexChange?.(currentIndex + 1)}
                >
                  <span className="text-base sm:text-lg">→</span>
                </Button>
              )}
              <div className="absolute bottom-2 sm:bottom-4 left-1/2 -translate-x-1/2 z-50 bg-black/50 rounded-full px-2 py-1 sm:px-3 sm:py-1 text-white text-xs sm:text-sm">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          )}

          {/* Zoom indicator */}
          {scale > MIN_SCALE && (
            <div className="absolute bottom-2 sm:bottom-4 right-2 sm:right-4 z-50 bg-black/50 rounded-full px-2 py-1 sm:px-3 sm:py-1 text-white text-xs sm:text-sm">
              {Math.round(scale * 100)}%
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

