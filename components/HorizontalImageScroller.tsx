'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HorizontalImageScrollerProps {
  images: string[];
  alt: string;
  onImageChange?: (index: number) => void;
  className?: string;
  showThumbnails?: boolean;
  showDots?: boolean;
  autoScroll?: boolean;
  autoScrollInterval?: number;
}

export default function HorizontalImageScroller({
  images,
  alt,
  onImageChange,
  className = '',
  showThumbnails = true,
  showDots = true,
  autoScroll = false,
  autoScrollInterval = 5000,
}: HorizontalImageScrollerProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);
  const autoScrollTimeout = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const thumbnailScrollRef = useRef<HTMLDivElement>(null);

  if (!images || images.length === 0) {
    return null;
  }

  // Filter out any empty image URLs
  const validImages = images.filter((img) => img && typeof img === 'string' && img.trim().length > 0);
  if (validImages.length === 0) {
    return null;
  }

  // Handle image change
  const handleImageChange = useCallback(
    (index: number) => {
      if (index >= 0 && index < validImages.length) {
        setCurrentIndex(index);
        onImageChange?.(index);
        clearAutoScroll();
      }
    },
    [validImages.length, onImageChange]
  );

  // Clear and reset auto scroll
  const clearAutoScroll = useCallback(() => {
    if (autoScrollTimeout.current) {
      clearTimeout(autoScrollTimeout.current);
    }
  }, []);

  // Auto scroll effect
  useEffect(() => {
    if (!autoScroll || isHovering || validImages.length <= 1) return;

    clearAutoScroll();
    autoScrollTimeout.current = setTimeout(() => {
      handleImageChange((currentIndex + 1) % validImages.length);
    }, autoScrollInterval);

    return () => clearAutoScroll();
  }, [currentIndex, autoScroll, isHovering, validImages.length, autoScrollInterval, handleImageChange, clearAutoScroll]);

  // Next/Previous handlers
  const goToNext = useCallback(() => {
    handleImageChange((currentIndex + 1) % validImages.length);
  }, [currentIndex, validImages.length, handleImageChange]);

  const goToPrevious = useCallback(() => {
    handleImageChange((currentIndex - 1 + validImages.length) % validImages.length);
  }, [currentIndex, validImages.length, handleImageChange]);

  // Touch handlers for swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.changedTouches[0].screenX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    touchEndX.current = e.changedTouches[0].screenX;
    handleSwipe();
  };

  const handleSwipe = () => {
    const swipeThreshold = 50;
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) > swipeThreshold) {
      if (diff > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        goToPrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [goToNext, goToPrevious]);

  // Scroll thumbnails into view
  useEffect(() => {
    if (!showThumbnails || !thumbnailScrollRef.current) return;

    const thumbnail = thumbnailScrollRef.current.children[currentIndex] as HTMLElement;
    if (thumbnail) {
      const container = thumbnailScrollRef.current;
      const scrollLeft = thumbnail.offsetLeft - container.clientWidth / 2 + thumbnail.clientWidth / 2;
      container.scrollTo({
        left: Math.max(0, scrollLeft),
        behavior: 'smooth',
      });
    }
  }, [currentIndex, showThumbnails]);

  return (
    <div className={`w-full ${className}`}>
      {/* Main Image Container */}
      <div
        className="relative w-full bg-gray-100 overflow-hidden"
        style={{ aspectRatio: '1 / 1' }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Main Image */}
        <div className="relative w-full h-full">
          {validImages[currentIndex] && (
            <Image
              src={validImages[currentIndex]}
              alt={`${alt} - Image ${currentIndex + 1}`}
              fill
              className="object-cover"
              priority={currentIndex === 0}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 90vw, 50vw"
            />
          )}
        </div>

        {/* Left Arrow Button - Desktop */}
        {validImages.length > 1 && (
          <button
            onClick={goToPrevious}
            className="hidden sm:flex absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Right Arrow Button - Desktop */}
        {validImages.length > 1 && (
          <button
            onClick={goToNext}
            className="hidden sm:flex absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/50 hover:bg-black/70 text-white rounded-full p-2 transition-all"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
        )}

        {/* Dot Indicators */}
        {showDots && validImages.length > 1 && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex gap-2">
            {validImages.map((_, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`rounded-full transition-all ${
                  index === currentIndex ? 'bg-white w-2 h-2' : 'bg-white/50 w-1.5 h-1.5 hover:bg-white/70'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}

        {/* Mobile Swipe Hint */}
        {!isHovering && validImages.length > 1 && (
          <div className="sm:hidden absolute top-3 right-3 z-10 bg-black/50 text-white text-xs px-2 py-1 rounded">
            Swipe to browse
          </div>
        )}

        {/* Image Counter - Mobile */}
        {validImages.length > 1 && (
          <div className="absolute top-3 left-3 z-10 bg-black/50 text-white text-xs sm:text-sm px-2 py-1 rounded">
            {currentIndex + 1} / {validImages.length}
          </div>
        )}
      </div>

      {/* Thumbnail Scrollbar */}
      {showThumbnails && validImages.length > 1 && (
        <div className="mt-3 sm:mt-4">
          <div
            ref={thumbnailScrollRef}
            className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scroll-smooth"
            style={{
              scrollBehavior: 'smooth',
            }}
          >
            {validImages.map((image, index) => (
              <button
                key={index}
                onClick={() => handleImageChange(index)}
                className={`flex-shrink-0 relative rounded border-2 transition-all ${
                  index === currentIndex
                    ? 'border-blue-500 ring-2 ring-blue-400'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                style={{
                  width: '60px',
                  height: '60px',
                }}
                aria-label={`Select image ${index + 1}`}
              >
                <Image
                  src={image}
                  alt={`${alt} thumbnail ${index + 1}`}
                  fill
                  className="object-cover rounded"
                  sizes="60px"
                />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mobile Arrow Buttons */}
      {validImages.length > 1 && (
        <div className="sm:hidden flex gap-2 mt-3 justify-center">
          <button
            onClick={goToPrevious}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-all"
            aria-label="Previous image"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goToNext}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 transition-all"
            aria-label="Next image"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}
    </div>
  );
}