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
      imagesJsonType: typeof product.imagesJson,
    })
    
    try {
      if (product.imagesJson) {
        let parsed: any
        
        // Try to parse if it's a string, otherwise use as-is
        if (typeof product.imagesJson === 'string') {
          try {
            parsed = JSON.parse(product.imagesJson)
          } catch (parseError) {
            console.warn('[ProductImageGallery] Failed to JSON.parse imagesJson, treating as single URL')
            // If it's not valid JSON, treat it as a single URL string
            parsed = [product.imagesJson]
          }
        } else {
          parsed = product.imagesJson
        }
        
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Handle different image formats:
          // 1. Direct string URLs: ['url1', 'url2']
          // 2. Objects with imageUrl property: [{imageUrl: 'url1'}, {imageUrl: 'url2'}]
          // 3. Objects with url property: [{url: 'url1'}, {url: 'url2'}]
          const validImages = parsed
            .map((img: any) => {
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
              count: validImages.length,
              parsedArrayLength: parsed.length,
              sample: validImages.slice(0, 2),
            })
          } else {
            console.warn('[ProductImageGallery] validImages is empty after parsing', {
              parsedLength: parsed.length,
              parsedSample: parsed.slice(0, 1),
            })
          }
        } else {
          console.warn('[ProductImageGallery] parsed is not an array or is empty', {
            parsedType: typeof parsed,
            isArray: Array.isArray(parsed),
          })
        }
      }
    } catch (e) {
      console.error('[ProductImageGallery] Failed to process imagesJson:', e, {
        imagesJsonSample: product.imagesJson?.substring?.(0, 200),
      })
    }
    
    console.log('[ProductImageGallery] Before adding primary image:', { count: imageUrls.length, hasImage: !!product.image })
    
    // Always include primary image if available
    if (product.image && typeof product.image === 'string' && product.image.trim().length > 0) {
      // Check if primary image is already in the list
      if (!imageUrls.includes(product.image)) {
        imageUrls.unshift(product.image) // Add as first image
      }
    }
    
    // If no images found at all, use the primary image or a fallback
    if (imageUrls.length === 0) {
      console.warn('[ProductImageGallery] No images found in imagesJson or image field, using placeholder')
      if (product.image) {
        imageUrls.push(product.image)
      } else {
        imageUrls.push('https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=400&fit=crop')
      }
    }
    
    console.log('[ProductImageGallery] Final image count:', imageUrls.length, { images: imageUrls })
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
      {images && images.length > 0 ? (
        <HorizontalImageScroller
          images={images}
          alt={product.title}
          showThumbnails={true}
          showDots={true}
          autoScroll={false}
          className="rounded-3xl overflow-hidden shadow-2xl shadow-black/50"
        />
      ) : (
        <div className="bg-gray-900 rounded-3xl aspect-square flex items-center justify-center">
          <p className="text-gray-400">No images available</p>
        </div>
      )}
    </div>
  )
}