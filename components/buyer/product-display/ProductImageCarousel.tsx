'use client';

import HorizontalImageScroller from '@/components/HorizontalImageScroller';

interface ProductImageCarouselProps {
  images: string[];
  alt?: string;
  onImageChange?: (index: number) => void;
}

export default function ProductImageCarousel({
  images,
  alt = 'Product',
  onImageChange,
}: ProductImageCarouselProps) {
  if (!images || images.length === 0) return null;

  return (
    <HorizontalImageScroller
      images={images}
      alt={alt}
      showThumbnails={images.length > 1}
      showDots={images.length > 1}
      autoScroll={false}
      onImageChange={onImageChange}
      className="rounded-lg overflow-hidden"
    />
  );
}