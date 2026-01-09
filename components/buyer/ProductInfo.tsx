'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Listing } from '@/types/listing'
import { Minus, Plus, ShoppingCart } from 'lucide-react'

interface ProductInfoProps {
  product: Listing
  business: any
}

export default function ProductInfo({ product, business }: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null)
  const [selectedColor, setSelectedColor] = useState<number>(0)
  const [quantity, setQuantity] = useState(1)
  const [addingToCart, setAddingToCart] = useState(false)
  const [addedToCart, setAddedToCart] = useState(false)

  const sizes = product.sizes_json ? JSON.parse(product.sizes_json) : []
  const colors = product.colors_available ? JSON.parse(product.colors_available) : []

  const handleAddToCart = async () => {
    if (sizes.length > 0 && !selectedSize) {
      alert('Please select a size')
      return
    }

    setAddingToCart(true)
    
    await new Promise(resolve => setTimeout(resolve, 800))
        
    setAddingToCart(false)
    setAddedToCart(true)
    
    setTimeout(() => setAddedToCart(false), 2000)
  }

  const incrementQuantity = () => {
    if (quantity < product.quantity_available) {
      setQuantity(quantity + 1)
    }
  }

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1)
    }
  }

  return (
    <div className="space-y-6">
      {/* Title*/}
      <div>
        <h1 className="text-xl font-medium mb-2">{product.title} <span className='text-sm'>by</span></h1>
        <Link 
          href={`/buyer/brand/${business?.brand_name?.toLowerCase().replace(/\s+/g, '-')}`}
          className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors"
        >
          {business?.brand_name}
        </Link>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-bold">{(product.price_cents / 100).toFixed(2)}</span>
        <span className="text-sm text-gray-400">{product.currency}</span>
      </div>

      <div className="flex gap-3">
        {product.limited_edition_badge === 'show_badge' && (
          <span className="px-3 py-1.5 bg-[#9872DD]/20 text-[#9872DD] text-xs font-medium rounded-full">
            Limited Edition
          </span>
        )}
        {product.quantity_available <= 10 && (
          <span className="px-3 py-1.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full">
            Only {product.quantity_available} left
          </span>
        )}
        {product.category && (
          <span className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs font-medium rounded-full">
            {product.category.replace(/_/g, ' ')}
          </span>
        )}
      </div>

      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Color: {colors[selectedColor]?.colorName || 'Grey'}</h3>
          <div className="flex gap-3">
            {colors.map((color: any, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedColor(index)}
                className={`relative w-12 h-12 rounded-full border-2 transition-all ${
                  selectedColor === index 
                    ? 'border-[#9872DD] scale-110' 
                    : 'border-gray-700 hover:border-gray-500'
                }`}
                title={color.colorName}
              >
                <div 
                  className="w-full h-full rounded-full"
                  style={{ backgroundColor: color.colorHex || '#6b7280' }}
                />
                {selectedColor === index && (
                  <div className="absolute inset-0 rounded-full bg-white/20" />
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Size Selection */}
      {sizes.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3">Select size</h3>
          <div className="grid grid-cols-5 gap-3">
            {sizes.map((size: string) => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                  selectedSize === size
                    ? 'bg-black text-white border-purple-600'
                    : 'border-gray-700 text-gray-300 hover:border-gray-500'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div>
        <h3 className="text-sm font-medium mb-3">Quantity</h3>
        <div className="flex items-center gap-4 bg-[#161616] rounded-lg p-2 w-fit">
          <button 
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1f1f1f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center font-medium">{quantity}</span>
          <button 
            onClick={incrementQuantity}
            disabled={quantity >= product.quantity_available}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1f1f1f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between gap-3 pt-4">
        <button 
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="w-full text-sm  bg-purple-500 hover:bg-[#8451E1] text-white py-4 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {addingToCart ? (
            'Adding...'
          ) : addedToCart ? (
            '✓ Added to Cart'
          ) : (
            <>
              Buy now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>
        
        <button 
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="w-full px-6 py-4 bg-[#161616] hover:bg-[#1f1f1f] rounded-xl transition-colors border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
        <span className=' text-sm text-purple-500'>Add to Cart</span>  <ShoppingCart className="w-5 h-5 ml-2 text-purple-500" />
        </button>
      </div>

      {/* Additional Info */}
      <div className="pt-6 space-y-3 text-sm border-t border-gray-800">
        {product.material_composition && (
          <div className="flex justify-between">
            <span className="text-gray-400">Material:</span>
            <span className="text-white capitalize">{product.material_composition}</span>
          </div>
        )}
        {product.shipping_option && (
          <div className="flex justify-between">
            <span className="text-gray-400">Shipping:</span>
            <span className="text-white capitalize">{product.shipping_option.replace(/_/g, ' ')}</span>
          </div>
        )}
        {product.eta_domestic && (
          <div className="flex justify-between">
            <span className="text-gray-400">Delivery (Domestic):</span>
            <span className="text-white">{product.eta_domestic}</span>
          </div>
        )}
        {product.eta_international && (
          <div className="flex justify-between">
            <span className="text-gray-400">Delivery (International):</span>
            <span className="text-white">{product.eta_international.replace(/_/g, ' ')}</span>
          </div>
        )}
      </div>
    </div>
  )
}