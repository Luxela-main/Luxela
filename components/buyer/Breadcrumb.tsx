import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { Listing } from '@/types/listing'

interface BreadcrumbProps {
  product: Listing
  business: any
}

export default function Breadcrumb({ product, business }: BreadcrumbProps) {
  const brandSlug = business?.brand_name?.toLowerCase().replace(/\s+/g, '-') || ''

  return (
    <nav className="flex items-center gap-2 text-xs mb-8 py-3 px-4 rounded-lg bg-[#0a0a0a] border border-[#1a1a1a]">
      <Link href="/buyer/brands" className="text-gray-400 hover:text-white transition-colors">
        Brands
      </Link>
      <ChevronRight className="w-4 h-4 text-gray-600" />
      <Link 
        href={`/buyer/brand/${brandSlug}`}
        className="text-gray-400 hover:text-white transition-colors"
      >
        {business?.brand_name || 'Brand'}
      </Link>
      <ChevronRight className="w-4 h-4 text-gray-600" />
      {product.type === 'collection' && (
        <>
          <Link href="/buyer/collections" className="text-gray-400 hover:text-white transition-colors">
            Collections
          </Link>
          <ChevronRight className="w-4 h-4 text-gray-600" />
        </>
      )}
      <span className="text-white truncate max-w-[200px]">{product.title}</span>
    </nav>
  )
}