'use client'

import { useState } from 'react'
import { Listing } from '@/types/listing'

interface ProductImageGalleryProps {
  product: Listing
}

export default function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const images = [product.image, product.image, product.image, product.image]
  const [selectedImage, setSelectedImage] = useState(0)

  return (
    <div className="space-y-4">
      {/* Main Image */}
      <div className="relative aspect-square bg-[#0a0a0a] rounded-2xl overflow-hidden">
        <img 
          src={images[selectedImage]} 
          alt={product.title}
          className="w-full h-full object-cover"
        />
        
        {product.limited_edition_badge === 'show_badge' && (
          <div className="absolute top-4 left-4 bg-[#9872DD] px-3 py-1.5 rounded-lg">
            <span className="text-white text-xs font-bold uppercase">Limited Edition</span>
          </div>
        )}
      </div>

      {/* Thumbnail Gallery */}
    <div className="flex gap-3">
  {images.map((img, index) => (
    <button
      key={index}
      onClick={() => setSelectedImage(index)}
      className={`w-28 h-28 rounded-xl p-4 overflow-hidden transition-all ${
        selectedImage === index 
          ? 'ring-2 ring-purple-500' 
          : 'ring-1 ring-black hover:ring-gray-600'
      }`}
    >
      <img 
        src={img} 
        alt={`${product.title} ${index + 1}`}
        className="w-full h-full object-cover"
      />
    </button>
  ))}
</div>
    </div>
  )
}