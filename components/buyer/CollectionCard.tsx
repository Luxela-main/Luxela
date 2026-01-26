import { Listing } from '@/types/listing'
import ProductCard from './ProductCard'

interface CollectionCardProps {
  collection: any
}

export default function CollectionCard({ collection }: CollectionCardProps) {
  let collectionItems: Listing[] = []
  try {
    collectionItems = collection.items_json ? JSON.parse(collection.items_json) : []
  } catch (e) {
    console.error('Error parsing items_json:', e)
  }

  if (collectionItems.length === 0) return null

  return (
    <div className="col-span-full mb-12">
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-white text-xl capitalize font-bold tracking-tight">
            {collection.title}
          </h2>
          {collection.description && (
            <p className="text-gray-500 capitalize text-sm mt-1">{collection.description}</p>
          )}
        </div>
        
        <button className="text-[#8451E1] text-sm font-medium hover:underline">
          View All
        </button>
      </div>

      {/* Nested Grid of Products */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {collectionItems.map((item: any) => (
          <ProductCard key={item.title} product={item} />
        ))}
      </div>
    </div>
  )
}