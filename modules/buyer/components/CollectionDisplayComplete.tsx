import { useCollectionProductIntegration } from '@/modules/buyer/hooks/useCollectionProductIntegration';
import { CollectionProductCardWithGallery } from './CollectionProductCardWithGallery';
import { ProductDetailModalWithGallery } from './ProductDetailModalWithGallery';
import { Loader2, ArrowUpDown, Palette, AlertCircle, Truck, Package } from 'lucide-react';

interface CollectionDisplayCompleteProps {
  collectionId: string;
  showCollectionInfo?: boolean;
  columns?: { mobile: number; tablet: number; desktop: number };
}

export function CollectionDisplayComplete({
  collectionId,
  showCollectionInfo = true,
  columns = { mobile: 2, tablet: 3, desktop: 4 },
}: CollectionDisplayCompleteProps) {
  const {
    collection,
    products,
    sortedAndFilteredProducts,
    selectedProduct,
    allColors,
    allSizes,
    sortBy,
    filterColor,
    showProductDetail,
    isLoading,
    error,
    setSortBy,
    setFilterColor,
    selectProduct,
    closeProductDetail,
    addToCart,
    toggleFavorite,
    shareProduct,
    filteredCount,
    averagePrice,
  } = useCollectionProductIntegration(collectionId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading collection...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-[#acacac]">Failed to load collection</p>
          <p className="text-[#666] text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-[#333] mx-auto mb-4" />
          <p className="text-[#acacac]">No products in this collection</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Collection Info Card */}
      {showCollectionInfo && collection && (
        <div className="bg-[#0f0f0f] rounded-xl border border-[#222] p-8 space-y-6">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {collection.name || collection.title}
            </h2>
            {collection.description && (
              <p className="text-[#acacac] text-base leading-relaxed">{collection.description}</p>
            )}
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-[#222]">
            <div>
              <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-2">
                Total Products
              </p>
              <p className="text-3xl font-bold text-white">{products.length}</p>
            </div>

            <div>
              <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-2">
                Average Price
              </p>
              <p className="text-2xl font-bold text-[#8451E1]">
                {collection.currency || 'NGN'} {averagePrice.toLocaleString()}
              </p>
            </div>

            {collection.release_duration && (
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-2">
                  Release Duration
                </p>
                <p className="text-sm text-white font-medium">{collection.release_duration}</p>
              </div>
            )}

            {(collection.eta_domestic || collection.eta_international) && (
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider font-semibold mb-2">
                  Shipping
                </p>
                <p className="text-sm text-[#acacac] flex items-center gap-1">
                  <Truck className="w-3.5 h-3.5" />
                  {collection.eta_domestic || collection.eta_international || 'Info'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Filters & Sorting Bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 pb-6 border-b border-[#222]">
        <div>
          <h3 className="text-lg font-semibold text-white">Products</h3>
          <p className="text-xs text-[#666] mt-1">{filteredCount} items available</p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full md:w-auto">
          {/* Color Filter */}
          {allColors.length > 0 && (
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Palette className="w-4 h-4 text-[#666] flex-shrink-0" />
              <select
                value={filterColor || ''}
                onChange={(e) => setFilterColor(e.target.value || null)}
                className="flex-1 sm:flex-none bg-[#0f0f0f] border border-[#222] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#8451E1] transition-colors cursor-pointer"
              >
                <option value="">All Colors ({allColors.length})</option>
                {allColors.map((color) => (
                  <option key={color.colorHex} value={color.colorHex}>
                    {color.colorName}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <ArrowUpDown className="w-4 h-4 text-[#666] flex-shrink-0" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-low' | 'price-high')}
              className="flex-1 sm:flex-none bg-[#0f0f0f] border border-[#222] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#8451E1] transition-colors cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {sortedAndFilteredProducts.length === 0 ? (
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-[#333] mx-auto mb-4" />
            <p className="text-[#acacac]">No products match your filters</p>
            <button
              onClick={() => {
                setFilterColor(null);
                setSortBy('newest');
              }}
              className="mt-4 px-4 py-2 bg-[#8451E1] hover:bg-[#7240D0] text-white rounded-lg transition-colors text-sm font-medium"
            >
              Clear Filters
            </button>
          </div>
        </div>
      ) : (
        <div
          className={`grid gap-5 ${
            columns.desktop === 4
              ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
              : columns.desktop === 3
                ? 'grid-cols-2 md:grid-cols-3'
                : 'grid-cols-1 md:grid-cols-2'
          }`}
        >
          {sortedAndFilteredProducts.map((product, index) => (
            <CollectionProductCardWithGallery
              key={product.id}
              productId={product.id}
              title={product.name}
              price={product.price_cents || 0}
              currency={product.currency}
              images={product.images || []}
              image={product.image}
              colors={product.variants || []}
              sizes={product.variant_options?.sizes || []}
              material={product.description}
              quantity={product.stock?.quantity || 0}
              brandName={collection?.name}
              itemNumber={index + 1}
              onAddToCart={async (id) => {
                const result = await addToCart(id, 1);
                if (!result.success) {
                  throw new Error(result.error || 'Failed to add to cart');
                }
              }}
              onSelect={selectProduct}
            />
          ))}
        </div>
      )}

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductDetailModalWithGallery
          isOpen={showProductDetail}
          onClose={closeProductDetail}
          product={{
            id: selectedProduct.id,
            title: selectedProduct.title,
            price: selectedProduct.price,
            currency: selectedProduct.currency,
            images: selectedProduct.images || [],
            image: selectedProduct.image,
            colors: selectedProduct.colors || [],
            sizes: selectedProduct.sizes || [],
            material: selectedProduct.material,
            quantity: selectedProduct.quantity,
            brandName: collection?.name,
            items_json: selectedProduct.items_json,
            description: selectedProduct.description,
          }}
          onAddToCart={async (id) => {
            const result = await addToCart(id, 1);
            if (!result.success) {
              throw new Error(result.error || 'Failed to add to cart');
            }
          }}
        />
      )}
    </div>
  );
}