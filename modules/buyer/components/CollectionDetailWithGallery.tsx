import { useMemo, useState } from 'react';
import { useCollectionProducts } from '@/modules/buyer/queries/useCollectionProducts';
import { CollectionProductCardWithGallery } from './CollectionProductCardWithGallery';
import { Loader2, ArrowUpDown, Palette, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface CollectionDetailWithGalleryProps {
  collectionId: string;
  onProductSelect?: (product: any) => void;
  onAddToCart?: (productId: string) => Promise<void>;
}

export function CollectionDetailWithGallery({
  collectionId,
  onProductSelect,
  onAddToCart,
}: CollectionDetailWithGalleryProps) {
  const { data: collection, products, isLoading, error } = useCollectionProducts({ collectionId });
  const [sortBy, setSortBy] = useState<'newest' | 'price-low' | 'price-high'>('newest');
  const [filterColor, setFilterColor] = useState<string | null>(null);

  const allColors = useMemo(() => {
    const colorMap = new Map<string, { colorName: string; colorHex: string }>();

    products?.forEach((product) => {
      if (product.variants && Array.isArray(product.variants)) {
        product.variants.forEach((variant: any) => {
          const key = variant.colorHex || variant.color_hex;
          if (key && !colorMap.has(key)) {
            colorMap.set(key, {
              colorName: variant.colorName || variant.color_name,
              colorHex: key,
            });
          }
        });
      }
    });

    return Array.from(colorMap.values());
  }, [products]);

  const sortedAndFilteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = products.filter((product) => {
      if (!filterColor) return true;

      if (product.variants && Array.isArray(product.variants)) {
        return product.variants.some((v: any) => (v.colorHex || v.color_hex) === filterColor);
      }

      return true;
    });

    let sorted = [...filtered];

    switch (sortBy) {
      case 'price-low':
        sorted.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-high':
        sorted.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'newest':
      default:
        // Keep original order
        break;
    }

    return sorted;
  }, [products, sortBy, filterColor]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading collection products...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-[#acacac]">Failed to load products</p>
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
          <p className="text-[#acacac]">No products found in this collection</p>
        </div>
      </div>
    );
  }

  const avgPrice =
    products.length > 0
      ? products.reduce((sum, p) => sum + (p.price || 0), 0) / products.length
      : 0;

  return (
    <div className="space-y-8">
      {/* Collection Info */}
      {collection && (
        <div className="bg-[#0f0f0f] rounded-xl border border-[#222] p-8 space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">
              {collection.name}
            </h2>
            {collection.description && (
              <p className="text-[#acacac] text-sm">{collection.description}</p>
            )}
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-[#222]">
            <div>
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1">Total Items</p>
              <p className="text-2xl font-bold text-white">{products.length}</p>
            </div>
            <div>
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1">Avg Price</p>
              <p className="text-2xl font-bold text-[#8451E1]">
                NGN {avgPrice.toLocaleString()}
              </p>
            </div>
            {/* Duration and shipping info from products/listings */}
          </div>
        </div>
      )}

      {/* Filters & Sorting */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-6 border-b border-[#222]">
        <h3 className="text-lg font-semibold text-white">Products</h3>

        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
          {allColors.length > 0 && (
            <div className="flex items-center gap-2">
              <Palette className="w-4 h-4 text-[#666]" />
              <select
                value={filterColor || ''}
                onChange={(e) => setFilterColor(e.target.value || null)}
                className="bg-[#0f0f0f] border border-[#222] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#8451E1] transition-colors"
              >
                <option value="">All Colors</option>
                {allColors.map((color) => (
                  <option key={color.colorHex} value={color.colorHex}>
                    {color.colorName}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2">
            <ArrowUpDown className="w-4 h-4 text-[#666]" />
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'price-low' | 'price-high')}
              className="bg-[#0f0f0f] border border-[#222] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#8451E1] transition-colors"
            >
              <option value="newest">Newest</option>
              <option value="price-low">Price: Low to High</option>
              <option value="price-high">Price: High to Low</option>
            </select>
          </div>

          <span className="text-[#666] text-sm">{sortedAndFilteredProducts.length} items</span>
        </div>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {sortedAndFilteredProducts.map((product, index) => (
          <CollectionProductCardWithGallery
            key={product.id}
            productId={product.id}
            title={product.name}
            price={product.price || 0}
            currency={product.currency}
            images={product.images?.map(img => ({ id: img.id, image_url: img.imageUrl, position: img.position, is_primary: img.position === 0 })) || []}
            image={product.images?.[0]?.imageUrl}
            colors={product.variants || []}
            sizes={product.variants?.map(v => v.size).filter(Boolean) as string[] || []}
            material={product.description || undefined}
            quantity={product.inStock ? 1 : 0}
            brandName={collection?.name}
            itemNumber={index + 1}
            onAddToCart={
              onAddToCart ||
              (async (id) => {
                console.log('Add to cart:', id);
              })
            }
            onSelect={onProductSelect}
          />
        ))}
      </div>
    </div>
  );
}