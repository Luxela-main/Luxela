
'use client'

import { useListings } from '@/context/ListingsContext'
import Link from 'next/link'
import { ChevronRight, Images, ShoppingCart } from 'lucide-react'




function ProductCard({ 
  item, 
  collectionId, 
  brandName 
}: { 
  item: any
  collectionId: string
  brandName?: string 
}) {
  let colors: Array<{ colorName: string; colorHex: string }> = []
  try {
    colors = item.colors_available ? JSON.parse(item.colors_available) : []
  } catch (e) {
    console.error('Error parsing colors:', e)
  }

  let sizes: string[] = []
  try {
    sizes = item.sizes_json ? JSON.parse(item.sizes_json) : []
  } catch (e) {
    console.error('Error parsing sizes:', e)
  }

  const isValidImage =
    typeof item.image === 'string' &&
    item.image.length > 0 &&
    item.image !== 'https://via.placeholder.com/400'

  return (
    <Link href={`/buyer/collection/${collectionId}`}>
      <div className="group bg-[#161616] rounded-lg overflow-hidden hover:ring-2 hover:ring-[#9872DD]/50 transition-all min-w-[280px] w-[280px] flex-shrink-0">
        <div className="h-96 bg-[#858585] p-5 flex relative">
          {isValidImage ? (
            <img
              src={item.image}
              alt={item.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Images className="w-12 h-12 text-gray-600" />
            </div>
          )}

          {/* Limited Edition Badge */}
          {item.limited_edition_badge === 'show_badge' && (
            <div className="absolute top-3 left-3 bg-purple-600 px-2.5 py-1 rounded">
              <span className="text-[#f2f2f2] text-sm font-bold uppercase">
                Limited
              </span>
            </div>
          )}
        </div>

        <div className="p bg-black py-4">
          <p className="text-[#acacac] text-lg uppercase mb-1">
            {brandName}
          </p>

          <div className="flex items-center justify-between gap-3 mb-3 min-h-5">
            <h3 className="text-[#f2f2f2] capitalize font-medium text-base line-clamp-2 leading-snug min-h-10">
              {item.title}
            </h3>
            {/* Color */}
            {colors.length > 0 && (
              <div className="flex gap-1.5">
                {colors.slice(0, 4).map((color, i) => (
                  <div
                    key={i}
                    className="w-4 h-4 relative rounded-full border border-gray-700"
                    style={{
                      backgroundColor: color.colorHex || '#666',
                    }}
                    title={color.colorName}
                  />
                ))}
                {colors.length > 4 && (
                  <span className="text-gray-500 text-xs">
                    +{colors.length - 4}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Price & Cart */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#f2f2f2] text-sm">
                {item.currency || 'D'} {((item.price_cents || 0) / 100).toLocaleString()}
              </div>
              {item.quantity_available <= 5 && item.quantity_available > 0 && (
                <p className="text-orange-500 text-[10px] mt-0.5">
                  Only {item.quantity_available} left
                </p>
              )}
            </div>

            <div className="bottom-3 right-3">
              <button className="bg-purple-600 hover:bg-gray-100 p-2.5 shadow-lg">
                <ShoppingCart className="w-4 h-4 text-[#f2f2f2]" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}


export default function CollectionsPage() {
  const { listings, loading } = useListings()

  const collections = listings.filter(listing => listing.type === 'collection')

  if (loading) return <div className="bg-black min-h-screen">Loading...</div>

  return (
    <div className="bg-black min-h-screen px-6 py-8">
      {collections.map((collection) => {
        let items: any[] = []
        try {
          items = collection.items_json ? JSON.parse(collection.items_json) : []
        } catch (e) {
          console.error('Error parsing items_json:', e)
        }

        if (items.length === 0) return null

        const business = collection.sellers?.seller_business?.[0]

        return (
          <div key={collection.id} className="mb-12">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-white text-xl capitalize font-semibold">{collection.title}</h2>
              <Link 
                href={`/buyer/collection/${collection.id}`}
                className="flex items-center gap-1 text-[#9872DD] text-sm hover:underline"
              >
                See all <ChevronRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 pb-4">
                {items.slice(0, 4).map((item, index) => (
                  <ProductCard 
                    key={`${collection.id}-${index}`} 
                    item={item} 
                    collectionId={collection.id}
                    brandName={business?.brand_name}
                  />
                ))}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

