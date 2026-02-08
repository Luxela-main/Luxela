import { useMemo, useState } from 'react';

interface Product {
  id: string;
  name: string;
  description?: string;
  images?: Array<{ image_url: string; position: number }>;
  items_json?: string;
  price_cents?: number;
  currency?: string;
  quantity_available?: number;
  variants?: Array<{ color_name?: string; color_hex?: string; size?: string }>;
}

interface DisplayOptions {
  sortBy?: 'newest' | 'price-low' | 'price-high' | 'popular';
  filterColor?: string;
  filterSize?: string;
  priceRange?: { min: number; max: number };
}

export function useCollectionProductDisplay(products: Product[] = []) {
  const [sortBy, setSortBy] = useState<DisplayOptions['sortBy']>('newest');
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [filterSize, setFilterSize] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<DisplayOptions['priceRange'] | null>(null);

  // Extract all unique colors from products
  const allColors = useMemo(() => {
    const colorMap = new Map<
      string,
      { colorName: string; colorHex: string; count: number }
    >();

    products.forEach((product) => {
      if (product.variants) {
        product.variants.forEach((variant) => {
          if (variant.color_hex) {
            const existing = colorMap.get(variant.color_hex);
            colorMap.set(variant.color_hex, {
              colorName: variant.color_name || 'Unknown',
              colorHex: variant.color_hex,
              count: (existing?.count || 0) + 1,
            });
          }
        });
      }
    });

    return Array.from(colorMap.values()).sort((a, b) => b.count - a.count);
  }, [products]);

  // Extract all unique sizes
  const allSizes = useMemo(() => {
    const sizeSet = new Set<string>();
    products.forEach((product) => {
      if (product.variants) {
        product.variants.forEach((variant) => {
          if (variant.size) {
            sizeSet.add(variant.size);
          }
        });
      }
    });
    return Array.from(sizeSet).sort();
  }, [products]);

  // Get price range
  const priceStats = useMemo(() => {
    if (products.length === 0) return { min: 0, max: 0, average: 0 };

    const prices = products
      .map((p) => p.price_cents || 0)
      .filter((p) => p > 0);

    if (prices.length === 0) return { min: 0, max: 0, average: 0 };

    return {
      min: Math.min(...prices) / 100,
      max: Math.max(...prices) / 100,
      average:
        prices.reduce((a, b) => a + b, 0) / prices.length / 100,
    };
  }, [products]);

  // Filter and sort products
  const displayProducts = useMemo(() => {
    let filtered = products.filter((product) => {
      // Color filter
      if (filterColor && product.variants) {
        const hasColor = product.variants.some(
          (v) => v.color_hex === filterColor
        );
        if (!hasColor) return false;
      }

      // Size filter
      if (filterSize && product.variants) {
        const hasSize = product.variants.some((v) => v.size === filterSize);
        if (!hasSize) return false;
      }

      // Price range filter
      if (priceRange && product.price_cents) {
        const price = product.price_cents / 100;
        if (price < priceRange.min || price > priceRange.max) return false;
      }

      return true;
    });

    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'price-low':
          return (a.price_cents || 0) - (b.price_cents || 0);
        case 'price-high':
          return (b.price_cents || 0) - (a.price_cents || 0);
        case 'popular':
          // Could be based on sales_count or similar metric
          return 0;
        case 'newest':
        default:
          return 0;
      }
    });
  }, [products, sortBy, filterColor, filterSize, priceRange]);

  return {
    // Filtered and sorted products
    displayProducts,

    // Filter state and setters
    filters: {
      sortBy,
      filterColor,
      filterSize,
      priceRange,
    },
    setSort: setSortBy,
    setColorFilter: setFilterColor,
    setSizeFilter: setFilterSize,
    setPriceRange,
    clearFilters: () => {
      setSortBy('newest');
      setFilterColor(null);
      setFilterSize(null);
      setPriceRange(null);
    },

    // Available options for filters
    availableColors: allColors,
    availableSizes: allSizes,
    priceStats,

    // Statistics
    stats: {
      total: products.length,
      displayed: displayProducts.length,
      filtered: products.length - displayProducts.length,
      averagePrice: priceStats.average,
    },
  };
}