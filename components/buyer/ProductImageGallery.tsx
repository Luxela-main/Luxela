'use client'

import { Listing } from '@/types/listing'
import HorizontalImageScroller from '@/components/HorizontalImageScroller'

interface ProductImageGalleryProps {
  product: Listing
}

export default function ProductImageGallery({ product }: ProductImageGalleryProps) {
  // Parse multiple images from imagesJson if available
  const getImages = (): string[] => {
    try {
      if (product.imagesJson) {
        const parsed = JSON.parse(product.imagesJson)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.error('Failed to parse images:', e)
    }
    return product.image ? [product.image] : []
  }
  const images = getImages()

  return (
    <div className="space-y-6">
      {/* Limited Edition Badge */}
      {product.limited_edition_badge === 'show_badge' && (
        <div className="absolute top-6 left-6 z-20 bg-gradient-to-r from-[#8451E1] to-[#7240D0] px-4 py-2 rounded-full shadow-lg shadow-[#8451E1]/30">
          <span className="text-white text-xs font-bold uppercase tracking-wider">✨ Limited Edition</span>
        </div>
      )}

      {/* Horizontal Image Scroller - Desktop & Mobile Optimized */}
      <HorizontalImageScroller
        images={images}
        alt={product.title}
        showThumbnails={true}
        showDots={true}
        autoScroll={false}
        className="rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
      />
    </div>
  )
}