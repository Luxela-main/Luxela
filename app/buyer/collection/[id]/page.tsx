'use client'

import { use } from 'react'
import { useListings } from '@/context/ListingsContext'
import Link from 'next/link'
import { ArrowLeft, Images, ShoppingCart, Package } from 'lucide-react'

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { getListingById, loading } = useListings()

  if (loading) return <div className="bg-black min-h-screen">Loading...</div>

  const collection = getListingById(id)
  
  if (!collection) return <div className="bg-black min-h-screen text-white p-8">Collection not found</div>

  let items: any[] = []
  try {
    items = collection.items_json ? JSON.parse(collection.items_json) : []
  } catch (e) {
    console.error('Error parsing items:', e)
  }

  const business = collection.sellers?.seller_business?.[0]

  return (
    <div className="bg-black min-h-screen px-6 py-8">
      {/* Back Button */}
      <Link href="/buyer/collections" className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to Collections
      </Link>

      {/* Collection Header */}
      <div className="mb-8">
        <p className="text-[#acacac] text-lg uppercase mb-2">{business?.brand_name}</p>
        <h1 className="text-4xl font-bold text-white mb-4">{collection.title}</h1>
        {collection.description && (
          <p className="text-gray-300 text-lg max-w-3xl">{collection.description}</p>
        )}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#9872DD]" />
            <span className="text-gray-400">{items.length} {items.length === 1 ? 'item' : 'items'}</span>
          </div>
          {collection.release_duration && (
            <span className="text-gray-400">• {collection.release_duration}</span>
          )}
        </div>
      </div>

      {collection.image && (
        <div className="relative w-full max-w-6xl h-80 rounded-xl overflow-hidden mb-12">
          <img 
            src={collection.image} 
            alt={collection.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {collection.limited_edition_badge === 'show_badge' && (
            <div className="absolute top-6 left-6 bg-[#9872DD] px-4 py-2 rounded-lg">
              <span className="text-white text-sm font-bold uppercase tracking-wider">
                Limited Edition
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">Items in this Collection</h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {items.map((item: any, index: number) => (
          <CollectionItemCard
            key={index}
            item={item}
            collectionId={collection.id}
            productId={collection.product_id}
            brandName={business?.brand_name}
            index={index}
          />
        ))}
      </div>


    </div>
  )
}

function CollectionItemCard({ 
  item, 
  collectionId,
  productId,
  brandName,
  index
}: { 
  item: any
  collectionId: string
  productId?: string | null
  brandName?: string
  index: number
}) {
  let colors: Array<{ colorName: string; colorHex: string }> = []
  try {
    if (item.colors_available) {
      colors = typeof item.colors_available === 'string' 
        ? JSON.parse(item.colors_available) 
        : item.colors_available
    }
  } catch (e) {
  }

  const isValidImage =
    typeof item.image === 'string' &&
    item.image.length > 0 &&
    item.image !== 'https://via.placeholder.com/400'

  const CardWrapper = productId 
    ? ({ children }: { children: React.ReactNode }) => (
        <Link href={`/buyer/product/${productId}`}>{children}</Link>
      )
    : ({ children }: { children: React.ReactNode }) => <div>{children}</div>

  return (
    <CardWrapper>
      <div className={`group bg-[#161616] rounded-lg overflow-hidden ${productId ? 'hover:ring-2 hover:ring-[#9872DD]/50 cursor-pointer' : ''} transition-all`}>
        <div className="h-96 bg-[#858585] p-5 flex relative">
          {isValidImage ? (
            <img
              src={item.image}
              alt={item.title || item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-3">
              <Images className="w-12 h-12 text-gray-600" />
              <span className="text-gray-500 text-sm">Item {index + 1}</span>
            </div>
          )}

          {/* Item Number Badge */}
          <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm px-2.5 py-1 rounded">
            <span className="text-white text-xs font-medium">#{index + 1}</span>
          </div>
        </div>

        <div className="p bg-black py-4">
          <p className="text-[#acacac] text-lg uppercase mb-1">
            {brandName}
          </p>

          <div className="flex items-center justify-between gap-3 mb-3 min-h-5">
            <h3 className="text-[#f2f2f2] capitalize font-medium text-base line-clamp-2 leading-snug min-h-10">
              {item.title || item.name || `Item ${index + 1}`}
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

          {/* Price */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[#f2f2f2] text-sm">
                {item.currency || 'NGN'} {((item.priceCents || item.price_cents || 0) / 100).toLocaleString()}
              </div>
            </div>

            {productId && (
              <div className="">
                 <button className="bg-purple-600 hover:bg-gray-100 p-2.5 shadow-lg">
                <ShoppingCart className="w-4 h-4 text-[#f2f2f2]" />
              </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </CardWrapper>
  )
}