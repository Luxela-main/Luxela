# Collection Products - Integration Guide

This guide explains how to use the `useCollectionProducts` hook to fetch and display collection products with all their data (images, variants, inventory, etc.) in your Luxela buyer pages.

## Overview

The `useCollectionProducts` hook provides a complete solution for fetching collection products with:

- ✅ All product images (sorted by position)
- ✅ All variants (colors, sizes)
- ✅ Inventory and stock information
- ✅ Listing details (pricing, shipping, policies)
- ✅ Parsed items JSON data
- ✅ Real-time updates with Supabase subscriptions
- ✅ Automatic cleanup on unmount

## Hooks Available

### 1. `useCollectionProducts` (Main Hook)

Fetches collection products with all related data.

**Location:** `modules/buyer/queries/useCollectionProducts.ts`

**Basic Usage:**

```typescript
import { useCollectionProducts } from '@/modules/buyer/queries/useCollectionProducts';

export function MyCollectionPage({ collectionId }: { collectionId: string }) {
  const {
    collections,
    products,
    listings,
    isLoading,
    error,
    stats,
  } = useCollectionProducts({ collectionId });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div>
      {listings.map((listing) => (
        <div key={listing.id}>
          {/* Render product card */}
        </div>
      ))}
    </div>
  );
}
```

**Return Data:**

```typescript
{
  // Collections data
  collections: Array<{
    id: string;
    name: string;
    description?: string;
    logo_image?: string;
    hero_image?: string;
  }>;

  // Products with all details
  products: Array<{
    id: string;
    name: string;
    description?: string;
    images: Array<{
      id: string;
      image_url: string;
      position: number;
    }>;
    variants: Array<{
      id: string;
      color_name?: string;
      color_hex?: string;
      size?: string;
      sku?: string;
      inventory: Array<{
        id: string;
        quantity_available: number;
        quantity_reserved: number;
      }>;
    }>;
    items_json?: any;
  }>;

  // Listings (pricing & shipping)
  listings: Array<{
    id: string;
    product_id: string;
    price_cents: number;
    currency: string;
    quantity_available: number;
    quantity_reserved: number;
    shipping_duration?: string;
    shipping_cost_cents?: number;
    refund_policy?: string;
    tax_percentage?: number;
  }>;

  // Statistics
  stats: {
    totalProducts: number;
    averagePrice: number;
    totalVariants: number;
    totalImages: number;
  };

  // State
  isLoading: boolean;
  error: string | null;

  // Methods
  handleRefresh: () => Promise<void>;
}
```

### 2. `useCollectionProductDisplay` (Display Hook)

Provides filtering, sorting, and display utilities for products.

**Location:** `modules/buyer/hooks/useCollectionProductDisplay.ts`

**Usage:**

```typescript
import { useCollectionProductDisplay } from '@/modules/buyer/hooks/useCollectionProductDisplay';

export function CollectionDisplay({ products }) {
  const {
    displayProducts,
    filters,
    setSort,
    setColorFilter,
    setSizeFilter,
    availableColors,
    availableSizes,
    stats,
    clearFilters,
  } = useCollectionProductDisplay(products);

  return (
    <div className="space-y-6">
      {/* Filter UI */}
      <div className="flex gap-4">
        <select value={filters.sortBy} onChange={(e) => setSort(e.target.value)}>
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>

        <select
          value={filters.filterColor || ''}
          onChange={(e) => setColorFilter(e.target.value || null)}
        >
          <option value="">All Colors</option>
          {availableColors.map((color) => (
            <option key={color.colorHex} value={color.colorHex}>
              {color.colorName}
            </option>
          ))}
        </select>
      </div>

      {/* Results Counter */}
      <div>
        Showing {stats.displayed} of {stats.total} products
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-4 gap-4">
        {displayProducts.map((product) => (
          <EnhancedProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

## Integration Examples

### Example 1: Simple Collection Display

```typescript
'use client';

import { use } from 'react';
import { useCollectionProducts } from '@/modules/buyer/queries/useCollectionProducts';
import { useCollectionProductDisplay } from '@/modules/buyer/hooks/useCollectionProductDisplay';
import EnhancedProductCard from '@/components/buyer/product-display/EnhancedProductCard';

export default function CollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { products, isLoading, error } = useCollectionProducts({ collectionId: id });
  const { displayProducts, stats } = useCollectionProductDisplay(products);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">Collection Products</h1>
      <div className="text-sm text-gray-600 mb-6">
        Showing {stats.displayed} products
      </div>
      <div className="grid grid-cols-4 gap-4">
        {displayProducts.map((product) => (
          <EnhancedProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
```

### Example 2: With Filters

```typescript
'use client';

import { use } from 'react';
import { useCollectionProducts } from '@/modules/buyer/queries/useCollectionProducts';
import { useCollectionProductDisplay } from '@/modules/buyer/hooks/useCollectionProductDisplay';
import EnhancedProductCard from '@/components/buyer/product-display/EnhancedProductCard';

export default function FilteredCollectionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { products, isLoading } = useCollectionProducts({ collectionId: id });
  const {
    displayProducts,
    filters,
    setSort,
    setColorFilter,
    availableColors,
    stats,
    clearFilters,
  } = useCollectionProductDisplay(products);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-4xl font-bold">Collection</h1>

      {/* Filters */}
      <div className="flex gap-4 bg-white p-4 rounded-lg">
        <select
          value={filters.sortBy}
          onChange={(e) => setSort(e.target.value as any)}
          className="border px-3 py-2 rounded"
        >
          <option value="newest">Newest</option>
          <option value="price-low">Price: Low to High</option>
          <option value="price-high">Price: High to Low</option>
        </select>

        <select
          value={filters.filterColor || ''}
          onChange={(e) => setColorFilter(e.target.value || null)}
          className="border px-3 py-2 rounded"
        >
          <option value="">All Colors</option>
          {availableColors.map((color) => (
            <option key={color.colorHex} value={color.colorHex}>
              {color.colorName}
            </option>
          ))}
        </select>

        <button
          onClick={clearFilters}
          className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
        >
          Clear Filters
        </button>
      </div>

      {/* Results */}
      <div className="text-sm text-gray-600">
        Showing {stats.displayed} of {stats.total} products
      </div>

      {/* Grid */}
      <div className="grid grid-cols-4 gap-4">
        {displayProducts.length === 0 ? (
          <div className="col-span-4 text-center py-12">
            No products found
          </div>
        ) : (
          displayProducts.map((product) => (
            <EnhancedProductCard key={product.id} product={product} />
          ))
        )}
      </div>
    </div>
  );
}
```

### Example 3: With Statistics

```typescript
'use client';

import { use } from 'react';
import { useCollectionProducts } from '@/modules/buyer/queries/useCollectionProducts';

export default function CollectionStatsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { collections, stats, listings, isLoading } = useCollectionProducts({
    collectionId: id,
  });

  if (isLoading) return <div>Loading...</div>;

  const collection = collections[0];

  return (
    <div className="p-8">
      <h1 className="text-4xl font-bold mb-8">{collection?.name}</h1>

      {/* Stats Grid */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <p className="text-gray-600 text-sm">Total Products</p>
          <p className="text-3xl font-bold">{stats.totalProducts}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg">
          <p className="text-gray-600 text-sm">Average Price</p>
          <p className="text-3xl font-bold">${stats.averagePrice.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <p className="text-gray-600 text-sm">Total Variants</p>
          <p className="text-3xl font-bold">{stats.totalVariants}</p>
        </div>
        <div className="bg-orange-50 p-6 rounded-lg">
          <p className="text-gray-600 text-sm">Total Images</p>
          <p className="text-3xl font-bold">{stats.totalImages}</p>
        </div>
      </div>

      {/* Listings Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2">Product ID</th>
              <th className="text-left py-2">Price</th>
              <th className="text-left py-2">Stock</th>
              <th className="text-left py-2">Shipping</th>
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b">
                <td className="py-2">{listing.product_id}</td>
                <td className="py-2">
                  {listing.currency} {(listing.price_cents / 100).toFixed(2)}
                </td>
                <td className="py-2">{listing.quantity_available}</td>
                <td className="py-2">{listing.shipping_duration || 'N/A'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

## API Reference

### useCollectionProducts Options

```typescript
interface UseCollectionProductsOptions {
  collectionId: string;
  limit?: number; // Max listings to fetch (default: 100)
  includeSubscriptions?: boolean; // Enable real-time updates (default: true)
}
```

### useCollectionProductDisplay Options

```typescript
interface DisplayProduct {
  id: string;
  name: string;
  description?: string;
  price_cents?: number;
  currency?: string;
  quantity_available?: number;
  variants?: Array<{
    color_name?: string;
    color_hex?: string;
    size?: string;
  }>;
  images?: Array<{ image_url: string }>;
}

// Returned by hook
interface DisplayState {
  displayProducts: DisplayProduct[];
  filters: {
    sortBy: 'newest' | 'price-low' | 'price-high' | 'popular';
    filterColor: string | null;
    filterSize: string | null;
    priceRange: { min: number; max: number } | null;
  };
  setSort: (sort: string) => void;
  setColorFilter: (color: string | null) => void;
  setSizeFilter: (size: string | null) => void;
  setPriceRange: (range: { min: number; max: number } | null) => void;
  clearFilters: () => void;
  availableColors: Array<{ colorName: string; colorHex: string; count: number }>;
  availableSizes: string[];
  priceStats: { min: number; max: number; average: number };
  stats: {
    total: number;
    displayed: number;
    filtered: number;
    averagePrice: number;
  };
}
```

## Features

### Real-Time Updates

The hook automatically subscribes to Supabase real-time updates for collections, products, and listings. Changes in the database are reflected in real-time in your component.

```typescript
const { products } = useCollectionProducts({ collectionId: 'abc123' });
// Whenever a product or listing changes in the database,
// this component automatically updates
```

### Automatic Cleanup

Subscriptions are automatically cleaned up when the component unmounts, preventing memory leaks.

```typescript
// ✅ No manual cleanup needed
useEffect(() => {
  // Subscriptions managed internally
}, []); // Hook handles cleanup
```

### Type Safety

Fully typed TypeScript interfaces for all data structures.

```typescript
const { products }: { products: Product[] } = useCollectionProducts({
  collectionId: 'abc123',
});
// products is fully typed with autocomplete
```

## Best Practices

1. **Use with EnhancedProductCard**: The hook works seamlessly with your existing `EnhancedProductCard` component
2. **Combine with Display Hook**: Use `useCollectionProductDisplay` for filtering/sorting
3. **Handle Loading/Error States**: Always check `isLoading` and `error` before rendering
4. **Cache Results**: The hook uses Supabase's query caching for performance
5. **Real-Time Updates**: Enable subscriptions for live product updates

## Troubleshooting

### No products showing?

Check the collection ID and verify products exist in the database:

```typescript
const { collections, products, isLoading } = useCollectionProducts({
  collectionId: 'your-collection-id',
});

console.log('Collections:', collections);
console.log('Products:', products);
console.log('Loading:', isLoading);
```

### Images not loading?

Verify image URLs are valid:

```typescript
products.forEach((product) => {
  product.images?.forEach((img) => {
    console.log('Image URL:', img.image_url);
  });
});
```

### Performance issues?

Reduce the number of products fetched:

```typescript
const { products } = useCollectionProducts({
  collectionId: 'abc123',
  limit: 20, // Fetch only 20 products instead of 100
});
```

## Files Included

- `modules/buyer/queries/useCollectionProducts.ts` - Main hook
- `modules/buyer/hooks/useCollectionProductDisplay.ts` - Display utilities
- `modules/buyer/pages/CollectionPageWithProducts.integration.tsx` - Integration example
- `modules/buyer/COLLECTION_PRODUCTS_README.md` - This file