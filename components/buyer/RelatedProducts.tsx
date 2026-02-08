import Link from 'next/link'
import { Listing } from '@/types/listing'
import EnhancedProductCard from './product-display/EnhancedProductCard'
import { ArrowRight } from 'lucide-react'

interface RelatedProductsProps {
  products: Listing[]
  brandName?: string
}

export default function RelatedProducts({ products, brandName }: RelatedProductsProps) {
  if (products.length === 0) return null

  const displayProducts = products.slice(0, 8)
  const brandSlug = brandName?.toLowerCase().replace(/\s+/g, '-') || ''

  return (
    <div>
      {/* Section Header */}
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-2xl lg:text-3xl font-light tracking-widest uppercase flex items-center gap-3">
          <span className="w-1 h-8 bg-gradient-to-b from-[#8451E1] to-[#7240D0] rounded-full"></span>
          Related Products
        </h2>
        {brandName && (
          <Link 
            href={`/buyer/brand/${brandSlug}`}
            className="flex items-center gap-2 text-[#8451E1] hover:text-[#9665F5] text-xs font-semibold uppercase tracking-wider transition-colors group"
          >
            See all
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        )}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {displayProducts.map((product) => (
          <EnhancedProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  )
}