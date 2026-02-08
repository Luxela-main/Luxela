
import { useCollectionProducts } from '../queries/useCollectionProducts';

/**
 * Enhanced Collection Page Component
 * Combines existing collection detail view with full product data
 */
export function EnhancedCollectionPageExample({ collectionId }: { collectionId: string }) {
  const {
    data,
    products,
    listings,
    isLoading,
    error,
    refetch,
  } = useCollectionProducts({ collectionId });

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-purple-500 mx-auto mb-3" />
          <p className="text-[#acacac]">Loading collection with all products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 font-semibold mb-3">{error}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-[#8451E1] text-white rounded-lg hover:bg-purple-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const collection = data;
  if (!collection) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <p className="text-[#acacac]">Collection not found</p>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen">
      {/* Collection Header */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-5xl font-bold text-white mb-4">{collection.name}</h1>
          <p className="text-[#acacac] mb-8">{collection.description}</p>

          {/* Statistics from hook */}
          <div className="grid grid-cols-4 gap-4 mb-12">
            <div className="bg-[#0f0f0f] p-4 rounded-lg border border-[#222]">
              <p className="text-[#666] text-xs uppercase mb-2">Total Products</p>
              <p className="text-2xl font-bold text-white">{collection?.products.length || 0}</p>
            </div>
            <div className="bg-[#0f0f0f] p-4 rounded-lg border border-[#222]">
              <p className="text-[#666] text-xs uppercase mb-2">Average Price</p>
              <p className="text-2xl font-bold text-[#8451E1]">
                {collection && collection.products.length > 0
                  ? (collection.products.reduce((sum, p) => sum + (p.price || 0), 0) / collection.products.length).toLocaleString()
                  : '0'}
              </p>
            </div>
            <div className="bg-[#0f0f0f] p-4 rounded-lg border border-[#222]">
              <p className="text-[#666] text-xs uppercase mb-2">Total Variants</p>
              <p className="text-2xl font-bold text-white">
                {collection?.products.reduce((sum, p) => sum + (p.variants?.length || 0), 0) || 0}
              </p>
            </div>
            <div className="bg-[#0f0f0f] p-4 rounded-lg border border-[#222]">
              <p className="text-[#666] text-xs uppercase mb-2">Total Images</p>
              <p className="text-2xl font-bold text-white">
                {collection?.products.reduce((sum, p) => sum + (p.images?.length || 0), 0) || 0}
              </p>
            </div>
          </div>

          {/* Products Grid */}
          <h2 className="text-2xl font-bold text-white mb-8">Products & Listings</h2>
          <div className="grid grid-cols-4 gap-5">
            {listings.map((listing) => {
              const product = products.find((p) => p.id === listing.productId);
              if (!product) return null;

              return (
                <div
                  key={listing.id}
                  className="bg-[#0f0f0f] rounded-xl overflow-hidden border border-[#222] hover:border-[#8451E1]/50 transition-all"
                >
                  {/* Primary Image */}
                  <div className="h-64 bg-[#1a1a1a] overflow-hidden relative">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0].imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-600">
                        No Image
                      </div>
                    )}

                    {/* Image Count Badge */}
                    {product.images && product.images.length > 1 && (
                      <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-white text-xs">
                        +{product.images.length - 1} more
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <h3 className="font-semibold text-white mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Price */}
                    <div className="text-[#8451E1] font-bold text-lg mb-3">
                      {listing.currency || 'NGN'} {(listing.priceCents / 100).toLocaleString()}
                    </div>

                    {/* Variants Info */}
                    {product.variants && product.variants.length > 0 && (
                      <div className="text-[#666] text-xs mb-2">
                        {product.variants.length} variants available
                      </div>
                    )}

                    {/* Inventory */}
                    <div className="text-sm mb-3">
                      <span
                        className={
                          product && product.inStock
                            ? 'text-green-500'
                            : 'text-red-500'
                        }
                      >
                        {product && product.inStock
                          ? 'In Stock'
                          : 'Sold Out'}
                      </span>
                    </div>

                    {/* Shipping Info */}
                    {product && product.shipsIn && (
                      <div className="text-[#666] text-xs mb-3 border-t border-[#222] pt-2">
                        Ships in {product.shipsIn}
                      </div>
                    )}

                    {/* Action Button */}
                    <button className="w-full bg-[#8451E1] text-white py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}