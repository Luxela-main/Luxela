'use client'

import { Listing } from '@/types/listing'
import HorizontalImageScroller from '@/components/HorizontalImageScroller'

interface ProductImageGalleryProps {
  product: Listing
}

export default function ProductImageGallery({ product }: ProductImageGalleryProps) {
  // Parse multiple images from imagesJson if available
  const getImages = (): string[] => {
    const imageUrls: string[] = []
    
    console.log('[ProductImageGallery] getImages called for product:', product.id, {
      hasImagesJson: !!product.imagesJson,
      imagesJsonLength: product.imagesJson?.length || 0,
      imagesJsonRaw: product.imagesJson?.substring(0, 100),
      hasImage: !!product.image,
    })
    
    try {
      if (product.imagesJson) {
        const parsed = JSON.parse(product.imagesJson)
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Handle different image formats:
          // 1. Direct string URLs: ['url1', 'url2']
          // 2. Objects with imageUrl property: [{imageUrl: 'url1'}, {imageUrl: 'url2'}]
          // 3. Objects with url property: [{url: 'url1'}, {url: 'url2'}]
          const validImages = parsed
            .map((img) => {
              if (typeof img === 'string') {
                return img
              } else if (typeof img === 'object' && img !== null) {
                return img.imageUrl || img.url || img.image
              }
              return null
            })
            .filter((url): url is string => {
              return typeof url === 'string' && Boolean(url?.trim().length)
            })
          
          if (validImages.length > 0) {
            imageUrls.push(...validImages)
            console.log('[ProductImageGallery] Extracted images from imagesJson:', {
              count: imageUrls.length,
              parsedArrayLength: parsed.length,
              sample: validImages.slice(0, 2),
            })
          } else {
            console.warn('[ProductImageGallery] validImages is empty after parsing', {
              parsedLength: parsed.length,
              parsed: parsed,
            })
          }
        }
      }
    } catch (e) {
      console.error('[ProductImageGallery] Failed to parse imagesJson:', e, {
        imagesJson: product.imagesJson?.substring(0, 200),
      })
    }
    
    console.log('[ProductImageGallery] Before adding primary image:', { count: imageUrls.length })
    
    // Always include primary image if available
    if (product.image && product.image.trim().length > 0) {
      // Check if primary image is already in the list
      if (!imageUrls.includes(product.image)) {
        imageUrls.unshift(product.image) // Add as first image
      }
    }
    
    console.log('[ProductImageGallery] Final image count:', imageUrls.length)
    return imageUrls
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