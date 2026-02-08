'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { logListingsDebug } from '@/lib/debug/listings-debug';
import { useListings } from '@/context/ListingsContext';
import { useSearch } from '@/context/SearchContext';
import {
  ProductDisplayGrid,
  ProductFiltersPanel,
  ProductSortMenu,
  ProductDisplayHero,
} from '@/components/buyer/product-display';
import type { ProductFilters, SortOption } from '@/components/buyer/product-display';
import { Filter, X, TrendingUp } from 'lucide-react';
import ScrollToTopButton from '@/components/buyer/ScrollToTopButton';

// Fashion ecommerce categories optimized for luxury brands
const CATEGORIES = [
  { label: 'Men\'s Collection', value: 'men_clothing', icon: '👔' },
  { label: 'Women\'s Collection', value: 'women_clothing', icon: '👗' },
  { label: 'Men\'s Footwear', value: 'men_shoes', icon: '👞' },
  { label: 'Women\'s Footwear', value: 'women_shoes', icon: '👠' },
  { label: 'Accessories', value: 'accessories', icon: '💍' },
  { label: 'Premium Collections', value: 'merch', icon: '✨' },
  { label: 'Other Items', value: 'others', icon: '📦' },
];

// Extended luxury color palette
const AVAILABLE_COLORS = [
  { label: 'Noir', value: 'black', hex: '#000000' },
  { label: 'Blanc', value: 'white', hex: '#ffffff' },
  { label: 'Burgundy', value: 'burgundy', hex: '#800020' },
  { label: 'Navy', value: 'blue', hex: '#1a1a3e' },
  { label: 'Gold', value: 'gold', hex: '#d4af37' },
  { label: 'Silver', value: 'silver', hex: '#c0c0c0' },
  { label: 'Blush', value: 'pink', hex: '#f3e5e8' },
  { label: 'Charcoal', value: 'charcoal', hex: '#36454f' },
  { label: 'Taupe', value: 'taupe', hex: '#b38b6d' },
  { label: 'Emerald', value: 'green', hex: '#50c878' },
];

export default function BrowsePage() {
  const { listings, loading, error } = useListings();
  const { searchQuery } = useSearch();
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<ProductFilters>({
    categories: [],
    priceRange: [0, 1000000], // Extended range for luxury items
    ratings: [],
    colors: [],
    inStockOnly: false,
    verified: false,
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  
  useEffect(() => {
    logListingsDebug.initialized(1, 100);
    console.log('[BrowsePage] Initialized with luxury filter ranges');
  }, []);
  
  useEffect(() => {
    if (listings.length > 0) {
      logListingsDebug.display(listings);
      console.log('[BrowsePage] Listings loaded:', listings.length);
    }
  }, [listings]);

  // Extract real data from listings
  const singleProducts = useMemo(() => {
    const singles = listings.filter((listing) => listing.type === 'single');
    if (singles.length > 0) {
      logListingsDebug.display(singles);
    }
    return singles;
  }, [listings]);

  // Dynamically extract actual categories from products
  const actualCategories = useMemo(() => {
    const categorySet = new Set(singleProducts
      .map(p => p.category)
      .filter(Boolean));
    
    // Map actual categories to display labels
    const categoryMap = new Map<string, {label: string, icon: string}>();
    CATEGORIES.forEach(cat => {
      categoryMap.set(cat.value, { label: cat.label, icon: cat.icon });
    });
    
    return Array.from(categorySet).map(cat => ({
      value: cat as string,
      label: categoryMap.get(cat as string)?.label || cat,
      icon: categoryMap.get(cat as string)?.icon || '📦',
    })).sort((a, b) => a.label.localeCompare(b.label));
  }, [singleProducts]);

  // Dynamically extract actual colors from products
  const actualColors = useMemo(() => {
    const colorSet = new Set<string>();
    singleProducts.forEach(p => {
      if (p.colors_available) {
        const colors = typeof p.colors_available === 'string' 
          ? p.colors_available.split(',') 
          : Array.isArray(p.colors_available) 
            ? p.colors_available 
            : [];
        colors.forEach(c => colorSet.add(c.trim().toLowerCase()));
      }
    });
    
    // Map to color palette
    const colorMap = new Map<string, string>();
    AVAILABLE_COLORS.forEach(color => {
      colorMap.set(color.value, color.hex);
    });
    
    return Array.from(colorSet).map(color => {
      const colorLabel = AVAILABLE_COLORS.find(c => c.value === color)?.label || color.charAt(0).toUpperCase() + color.slice(1);
      return {
        label: colorLabel,
        value: color,
        hex: colorMap.get(color) || '#808080',
      };
    });
  }, [singleProducts]);

  // Advanced filtering with real product data
  const filteredListings = useMemo(() => {
    let results = [...singleProducts];

    // Text search across multiple fields
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (product) =>
          product.title?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.sellers?.seller_business?.[0]?.brand_name
            ?.toLowerCase()
            .includes(query)
      );
    }

    // Category filter
    if (filters.categories.length > 0) {
      results = results.filter((p) => filters.categories.includes(p.category || ''));
    }

    // Price range filter (in cents)
    if (filters.priceRange) {
      const [minCents, maxCents] = [filters.priceRange[0] * 100, filters.priceRange[1] * 100];
      results = results.filter(
        (p) => (p.price_cents || 0) >= minCents && (p.price_cents || 0) <= maxCents
      );
    }

    // Color filter
    if (filters.colors.length > 0) {
      results = results.filter((p) => {
        if (!p.colors_available) return false;
        const productColors = typeof p.colors_available === 'string'
          ? p.colors_available.split(',')
          : Array.isArray(p.colors_available)
            ? p.colors_available
            : [];
        const productColorsLower = productColors.map(c => c.trim().toLowerCase());
        return filters.colors.some(filter => productColorsLower.includes(filter.toLowerCase()));
      });
    }

    // Stock filter
    if (filters.inStockOnly) {
      results = results.filter((p) => (p.quantity_available || 0) > 0);
    }

    // Verified sellers filter (check if seller has brand info)
    if (filters.verified) {
      results = results.filter((p) => {
        return p.sellers?.seller_business && p.sellers.seller_business.length > 0;
      });
    }

    return results;
  }, [singleProducts, searchQuery, filters]);

  // Sort products with real data
  const sortedListings = useMemo(() => {
    console.log(`[BrowsePage] Sorting ${filteredListings.length} products by ${sortBy}`);
    const sorted = [...filteredListings];

    switch (sortBy) {
      case 'newest':
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case 'price-low':
        return sorted.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
      case 'price-high':
        return sorted.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));
      case 'name-az':
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case 'name-za':
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      case 'rating':
        // Sort by verification status (proxied metric)
        return sorted.sort((a, b) => {
          const aVerified = (a.sellers?.seller_business?.length ?? 0) > 0 ? 1 : 0;
          const bVerified = (b.sellers?.seller_business?.length ?? 0) > 0 ? 1 : 0;
          return bVerified - aVerified || (b.price_cents || 0) - (a.price_cents || 0);
        });
      case 'sales':
        // Sort by stock availability and inventory level
        return sorted.sort((a, b) => (b.quantity_available || 0) - (a.quantity_available || 0));
      default:
        return sorted;
    }
  }, [filteredListings, sortBy]);

  const activeFilterCount =
    filters.categories.length +
    filters.colors.length +
    filters.ratings.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.verified ? 1 : 0);

  // Calculate stats for the page
  const stats = useMemo(() => {
    const inStock = filteredListings.filter(p => (p.quantity_available || 0) > 0).length;
    const minPrice = filteredListings.length > 0 
      ? Math.min(...filteredListings.map(p => p.price_cents || 0)) / 100 
      : 0;
    const maxPrice = filteredListings.length > 0 
      ? Math.max(...filteredListings.map(p => p.price_cents || 0)) / 100 
      : 0;
    const brands = new Set(filteredListings.map(p => p.sellers?.seller_business?.[0]?.brand_name).filter(Boolean)).size;
    
    return { inStock, minPrice, maxPrice, brands };
  }, [filteredListings]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-black via-[#0a0a0a] to-black text-white">
      <ScrollToTopButton />
      {/* Hero Section */}
      <ProductDisplayHero
        title="Discover Luxela's Curated Selection"
        description="Explore our exclusive collection of premium fashion from the world's most prestigious brands. Browse by style, price, and color with our intelligent filtering."
        subtitle="Browse Premium Fashion"
        showSearch={false}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">

        {/* Quick Stats Bar */}
        {filteredListings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-4 mb-8 sm:mb-10 md:mb-12">
            <div className="bg-[#0f0f0f] border border-[#2B2B2B] rounded-xl p-3 sm:p-4 md:p-5 text-center hover:border-[#8451E1]/50 transition-colors">
              <div className="text-2xl sm:text-3xl font-light text-[#8451E1]">{filteredListings.length}</div>
              <div className="text-xs text-[#999] mt-1 sm:mt-2 font-medium tracking-widest uppercase">Products</div>
            </div>
            <div className="bg-[#0f0f0f] border border-[#2B2B2B] rounded-xl p-3 sm:p-4 md:p-5 text-center hover:border-[#8451E1]/50 transition-colors">
              <div className="text-2xl sm:text-3xl font-light text-[#8451E1]">{stats.brands}</div>
              <div className="text-xs text-[#999] mt-1 sm:mt-2 font-medium tracking-widest uppercase">Brands</div>
            </div>
            <div className="bg-[#0f0f0f] border border-[#2B2B2B] rounded-xl p-3 sm:p-4 md:p-5 text-center hover:border-[#8451E1]/50 transition-colors">
              <div className="text-2xl sm:text-3xl font-light text-[#8451E1]">{stats.inStock}</div>
              <div className="text-xs text-[#999] mt-1 sm:mt-2 font-medium tracking-widest uppercase">In Stock</div>
            </div>
            <div className="bg-[#0f0f0f] border border-[#2B2B2B] rounded-xl p-3 sm:p-4 md:p-5 text-center hover:border-[#8451E1]/50 transition-colors">
              <div className="text-sm sm:text-base font-light text-[#8451E1] leading-tight">
                ₦{Math.round(stats.minPrice).toLocaleString()} - ₦{Math.round(stats.maxPrice).toLocaleString()}
              </div>
              <div className="text-xs text-[#999] mt-1 sm:mt-2 font-medium tracking-widest uppercase">Price</div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <p className="text-red-400 text-xs sm:text-sm">
              Error loading products: {error}
            </p>
          </div>
        )}

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-6 sm:mb-8 gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0">
            {/* Mobile Filter Toggle */}
            <button
              onClick={() => setShowMobileFilters(!showMobileFilters)}
              className="p-2 sm:p-2.5 rounded-lg bg-[#1a1a1a] border border-[#333] hover:border-[#8451E1] text-[#acacac] hover:text-white transition-all lg:hidden flex-shrink-0"
              title="Toggle filters"
              aria-label="Toggle filters"
            >
              {showMobileFilters ? (
                <X className="w-4 sm:w-5 h-4 sm:h-5" />
              ) : (
                <Filter className="w-4 sm:w-5 h-4 sm:h-5" />
              )}
            </button>

            {/* Product Count */}
            <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-[#1a1a1a] border border-[#333] whitespace-nowrap flex-shrink-0">
              <div className="flex items-center gap-1.5 sm:gap-2 text-xs sm:text-sm">
                <span className="text-[#acacac] hidden sm:inline">Results:</span>
                <span className="text-white font-semibold text-sm sm:text-base">
                  {sortedListings.length}
                </span>
              </div>
            </div>

            {/* Active Filters Indicator */}
            {activeFilterCount > 0 && (
              <div className="px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg bg-gradient-to-r from-[#8451E1]/20 to-[#5C2EAF]/20 border border-[#8451E1]/30 text-[#8451E1] text-xs sm:text-xs font-semibold flex items-center gap-1.5 sm:gap-2 whitespace-nowrap flex-shrink-0">
                <TrendingUp className="w-3 sm:w-3.5 h-3 sm:h-3.5" />
                <span className="hidden sm:inline">{activeFilterCount} filter{activeFilterCount > 1 ? 's' : ''}</span>
                <span className="sm:hidden">{activeFilterCount}</span>
              </div>
            )}
          </div>

          {/* Sort Menu */}
          <div className="sm:ml-auto">
            <ProductSortMenu currentSort={sortBy} onSortChange={setSortBy} />
          </div>
        </div>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Sidebar - Filters (Desktop + Mobile) */}
          <div className={`${showMobileFilters ? 'block' : 'hidden'} lg:block lg:col-span-1`}>
            {/* Mobile Filter Modal Background */}
            {showMobileFilters && (
              <div 
                className="fixed inset-0 bg-black/60 z-40 lg:hidden" 
                onClick={() => setShowMobileFilters(false)}
              />
            )}
            
            <div className="lg:sticky lg:top-4 max-h-[calc(100vh-100px)] overflow-y-auto">
              <ProductFiltersPanel
                onFiltersChange={setFilters}
                availableCategories={actualCategories.map((cat) => ({
                  label: cat.label,
                  value: cat.value,
                  count: singleProducts.filter(
                    (p) => p.category === cat.value
                  ).length,
                }))}
                availableColors={actualColors}
                priceMin={0}
                priceMax={1000000}
                onClearAll={() =>
                  setFilters({
                    categories: [],
                    priceRange: [0, 1000000],
                    ratings: [],
                    colors: [],
                    inStockOnly: false,
                    verified: false,
                  })
                }
              />
            </div>
          </div>

          {/* Main Content */}
          <div className={showMobileFilters && !showFiltersPanel ? 'hidden lg:block lg:col-span-4' : 'lg:col-span-4'}>
            {loading && listings.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 sm:py-24 md:py-32">
                <div className="inline-block text-center">
                  {/* Luxury Loading Animation */}
                  <div className="relative w-12 sm:w-16 h-12 sm:h-16 mx-auto mb-4 sm:mb-8">
                    <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#8451E1] border-r-[#8451E1] animate-spin"></div>
                    <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#5C2EAF] animate-spin" style={{animationDirection: 'reverse'}}></div>
                  </div>
                  <p className="text-[#999] font-medium text-base sm:text-lg">Loading our exclusive collection...</p>
                  <p className="text-[#666] text-xs sm:text-sm mt-1 sm:mt-2">Premium fashion curated for you</p>
                </div>
              </div>
            ) : (
              <ProductDisplayGrid
                products={sortedListings}
                isLoading={loading}
                layout="normal"
                columns={{ mobile: 2, tablet: 3, desktop: 3 }}
                showActions={{
                  wishlist: true,
                  quickView: true,
                  share: true,
                }}
                emptyMessage={
                  activeFilterCount > 0
                    ? '🔍 No matches found. Your filters are too specific. Try adjusting them to discover more.'
                    : searchQuery
                      ? `No results for "${searchQuery}". Try browsing by category or price range instead.`
                      : listings.length === 0
                        ? '✨ Our exclusive collection is being curated. Check back soon for new arrivals!'
                        : 'No products available.'
                }
              />
            )}
          </div>
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}