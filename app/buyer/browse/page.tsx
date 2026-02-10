'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { logListingsDebug } from '@/lib/debug/listings-debug';
import { useListings } from '@/context/ListingsContext';
import { useSearch } from '@/context/SearchContext';
import { useRealtimeListings } from '@/hooks/useRealtimeListings';
import {
  ProductDisplayHero,
  MasonryGrid,
  UnifiedListingCard,
} from '@/components/buyer/product-display';
import ProductCarousel from '@/components/buyer/ProductCarousel';
import { CollectionSort } from '@/components/buyer/CollectionSort';
import { CollectionFilters } from '@/components/buyer/CollectionFilters';
import { Filter, X, TrendingUp, Columns2, Columns3, ChevronLeft, ChevronRight } from 'lucide-react';
import ScrollToTopButton from '@/components/buyer/ScrollToTopButton';

// Fashion ecommerce categories optimized for luxury brands
const CATEGORIES = [
  { label: 'Men\'s Couture', value: 'men_clothing', icon: '👔' },
  { label: 'Women\'s Couture', value: 'women_clothing', icon: '👗' },
  { label: 'Men\'s Footwear', value: 'men_shoes', icon: '👞' },
  { label: 'Women\'s Footwear', value: 'women_shoes', icon: '👠' },
  { label: 'Accessories & Essentials', value: 'accessories', icon: '💍' },
  { label: 'Trending Now', value: 'merch', icon: '✨' },
  { label: 'Limited Edition', value: 'others', icon: '📦' },
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
  useRealtimeListings(); // Enable realtime product syncing
  const [showFiltersPanel, setShowFiltersPanel] = useState(true);
  const [sortBy, setSortBy] = useState<string>('newest');
  const [filters, setFilters] = useState<any>({
    categories: [],
    priceRange: [0, 1000000], // Extended range for luxury items
    ratings: [],
    colors: [],
    inStockOnly: false,
    verified: false,
  });
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [filtersScrollPos, setFiltersScrollPos] = useState(0);
  const [sortScrollPos, setSortScrollPos] = useState(0);
  const [showFiltersLeftArrow, setShowFiltersLeftArrow] = useState(false);
  const [showFiltersRightArrow, setShowFiltersRightArrow] = useState(false);
  const [showSortLeftArrow, setShowSortLeftArrow] = useState(false);
  const [showSortRightArrow, setShowSortRightArrow] = useState(false);
  const productsCarouselRef = useRef<HTMLDivElement>(null);
  const [productsScrollPos, setProductsScrollPos] = useState(0);
  const [showProductsLeftArrow, setShowProductsLeftArrow] = useState(false);
  const [showProductsRightArrow, setShowProductsRightArrow] = useState(false);
  
  useEffect(() => {
    logListingsDebug.initialized(1, 100);
    console.log('[BrowsePage] Initialized with luxury filter ranges');
  }, []);

  // Extract real data from listings
  const singleProducts = useMemo(() => {
    // Don't filter by type - show all products
    if (listings.length > 0) {
      logListingsDebug.display(listings);
    }
    return listings;
  }, [listings]);

  // Filter products based on search and filters
  const filteredListings = useMemo(() => {
    let results = [...singleProducts];
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      results = results.filter(
        (p) =>
          p.title.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query)
      );
    }

    // Category filter - improved logic
    if (filters.categories.length > 0) {
      const selectedCats = filters.categories.map((c: string) => c.toLowerCase());
      console.log('[BrowsePage] Filtering by categories:', selectedCats);
      console.log('[BrowsePage] Available product categories:', Array.from(new Set(results.map(p => p.category))));
      
      const beforeCount = results.length;
      results = results.filter((p: any) => {
        const productCategory = (p.category || '').toLowerCase();
        const matches = selectedCats.some((cat: string) => 
          productCategory === cat || 
          productCategory.includes(cat) ||
          cat.includes(productCategory)
        );
        return matches;
      });
      console.log(`[BrowsePage] Category filter: ${beforeCount} to ${results.length} products matched`);
      
      if (results.length === 0) {
        console.warn('[BrowsePage] WARNING: No products found for selected categories');
      }
    }

    // Price range filter (in cents)
    if (filters.priceRange) {
      const [minCents, maxCents] = [filters.priceRange[0] * 100, filters.priceRange[1] * 100];
      results = results.filter(
        (p) => (p.price_cents || 0) >= minCents && (p.price_cents || 0) <= maxCents
      );
    }

    // Color filter
    if (filters.colors && filters.colors.length > 0) {
      results = results.filter((p: any) => {
        if (!p.colors_available) return false;
        const productColors = typeof p.colors_available === 'string'
          ? p.colors_available.split(',')
          : Array.isArray(p.colors_available)
            ? p.colors_available
            : [];
        const productColorsLower = productColors.map((c: string) => c.trim().toLowerCase());
        return filters.colors.some((filter: string) => productColorsLower.includes(filter.toLowerCase()));
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

  // Dynamically extract actual categories from products
  const actualCategories = useMemo(() => {
    const categorySet = new Set(singleProducts
      .map(p => p.category)
      .filter(Boolean));
    
    // Map actual categories to display labels
    const categoryMap = new Map<string, {label: string, icon: string}>();
    CATEGORIES.forEach((cat: any) => {
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
    AVAILABLE_COLORS.forEach((color: any) => {
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

  // Debug: Track data flow (after all variables are declared)
  useEffect(() => {
    console.log('[BrowsePage DEBUG]', {
      listings_count: listings.length,
      single_products_count: singleProducts.length,
      filtered_count: filteredListings.length,
      sorted_count: sortedListings.length,
      loading,
      error,
      first_listing: listings[0] ? {
        id: listings[0].id,
        title: listings[0].title,
        type: listings[0].type,
        category: listings[0].category
      } : null,
      first_filtered: filteredListings[0] ? {
        id: filteredListings[0].id,
        title: filteredListings[0].title
      } : null
    });
  }, [listings, loading, error, singleProducts, filteredListings, sortedListings]);

  const activeFilterCount =
    filters.categories.length +
    filters.colors.length +
    filters.ratings.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.verified ? 1 : 0);
  
  // Handle scroll for filters
  const handleFiltersScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('filters-scroll-container');
    if (container) {
      const scrollAmount = 300;
      const newPos = direction === 'left' 
        ? Math.max(0, filtersScrollPos - scrollAmount)
        : filtersScrollPos + scrollAmount;
      
      container.scrollTo({ left: newPos, behavior: 'smooth' });
      setFiltersScrollPos(newPos);
    }
  };
  
  // Handle scroll for sort
  const handleSortScroll = (direction: 'left' | 'right') => {
    const container = document.getElementById('sort-scroll-container');
    if (container) {
      const scrollAmount = 200;
      const newPos = direction === 'left' 
        ? Math.max(0, sortScrollPos - scrollAmount)
        : sortScrollPos + scrollAmount;
      
      container.scrollTo({ left: newPos, behavior: 'smooth' });
      setSortScrollPos(newPos);
    }
  };
  
  // Handle scroll for products
  const handleProductsScroll = (direction: 'left' | 'right') => {
    if (productsCarouselRef.current) {
      productsCarouselRef.current.scrollBy({
        left: direction === 'left' ? -300 : 300,
        behavior: 'smooth',
      });
    }
  };
  

  
  // Check scroll positions for visibility
  const checkScroll = useCallback(() => {
    const filtersContainer = document.getElementById('filters-scroll-container');
    const sortContainer = document.getElementById('sort-scroll-container');
    
    if (filtersContainer) {
      const { scrollLeft, scrollWidth, clientWidth } = filtersContainer;
      setShowFiltersLeftArrow(scrollLeft > 0);
      setShowFiltersRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
    
    if (sortContainer) {
      const { scrollLeft, scrollWidth, clientWidth } = sortContainer;
      setShowSortLeftArrow(scrollLeft > 0);
      setShowSortRightArrow(scrollLeft < scrollWidth - clientWidth - 10);
    }
    
    if (productsCarouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = productsCarouselRef.current;
      setShowProductsLeftArrow(scrollLeft > 0);
      setShowProductsRightArrow(scrollLeft < scrollWidth - clientWidth - 1);
    }
  }, []);
  
  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    const productsCarousel = productsCarouselRef.current;
    if (productsCarousel) {
      productsCarousel.addEventListener('scroll', checkScroll);
      return () => {
        window.removeEventListener('resize', checkScroll);
        productsCarousel.removeEventListener('scroll', checkScroll);
      };
    }
    return () => window.removeEventListener('resize', checkScroll);
  }, [checkScroll]);

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

  // Get featured products (top 12 by newest)
  const featuredProducts = useMemo(() => {
    return [...singleProducts]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 12);
  }, [singleProducts]);

  // Get products by category for carousels
  const productsByCategory = useMemo(() => {
    const categories: Record<string, any[]> = {};
    actualCategories.forEach(category => {
      categories[category.value] = singleProducts
        .filter(p => p.category === category.value)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 15);
    });
    
    // Debug: Log category breakdown
    const categoryBreakdown: Record<string, number> = {};
    Object.entries(categories).forEach(([cat, prods]) => {
      categoryBreakdown[cat] = prods.length;
    });
    if (Object.keys(categoryBreakdown).length > 0) {
      console.log('[BrowsePage] Products by category:', categoryBreakdown);
      console.log('[BrowsePage] Categories with products:', Object.values(categories).filter(c => c.length > 0).length, 'out of', actualCategories.length);
    }
    return categories;
  }, [singleProducts, actualCategories]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a0a] via-[#1a0a2e] to-[#0f0a1a] text-white overflow-hidden">
      <ScrollToTopButton />
      {/* Hero Section */}
      <div className="relative overflow-hidden pt-0">
        {/* Animated background elements */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#8451E1]/10 via-transparent to-transparent pointer-events-none"></div>
        <div className="absolute top-0 left-1/4 -translate-x-1/2 w-96 h-96 bg-[#8451E1]/25 rounded-full blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute top-40 right-1/4 w-80 h-80 bg-[#5C2EAF]/20 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2s"></div>
        
        <div className="relative z-10">
          <ProductDisplayHero
            title="Discover Luxela's Curated Selection"
            description="Explore our exclusive collection of premium fashion from the world's most prestigious brands. Browse by style, price, and color with our intelligent filtering."
            subtitle="Browse Premium Fashion"
            showSearch={false}
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">

        {/* Featured Products Carousel */}
        {!searchQuery && filters.categories.length === 0 && activeFilterCount === 0 && (
          <div className="mb-14 sm:mb-20 relative animate-fade-in">
            {/* Background glow */}
            <div className="absolute -left-10 -top-10 w-96 h-96 bg-[#8451E1]/10 rounded-full blur-3xl pointer-events-none opacity-50"></div>
            <div className="relative z-10">
              <div className="mb-4 sm:mb-6 group">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl group-hover:scale-125 transition-transform duration-300">⭐</span>
                  <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white via-[#e0e0e0] to-[#b0b0b0] bg-clip-text text-transparent group-hover:via-[#ffffff] transition-all duration-300">New Arrivals</h2>
                </div>
                <p className="text-[#999] text-sm sm:text-base font-light ml-10 group-hover:text-[#8451E1]/60 transition-colors duration-300">Discover the latest luxury collections</p>
              </div>
              <ProductCarousel
                title="New Arrivals"
                products={featuredProducts}
                isFeatured={true}
                categoryIcon="⭐"
              />
            </div>
          </div>
        )}

        {/* Quick Stats Bar */}
        {filteredListings.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mb-10 sm:mb-14 md:mb-16 animate-fade-in">
            {/* Stats Card 1 */}
            <div className="group relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/30 rounded-2xl p-4 sm:p-5 md:p-6 text-center hover:border-[#8451E1]/70 transition-all duration-500 shadow-xl hover:shadow-[0_0_50px_rgba(132,81,225,0.35)] hover:-translate-y-1.5 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8451E1]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#8451E1] via-[#a575ff] to-[#c084fc] bg-clip-text text-transparent group-hover:via-[#ff6b9d] transition-all duration-500 group-hover:to-[#ff9a9e]">{filteredListings.length}</div>
                <div className="text-xs text-[#999] mt-2 sm:mt-3 font-semibold tracking-wider uppercase">Products</div>
              </div>
            </div>
            {/* Stats Card 2 */}
            <div className="group relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/30 rounded-2xl p-4 sm:p-5 md:p-6 text-center hover:border-[#8451E1]/70 transition-all duration-500 shadow-xl hover:shadow-[0_0_50px_rgba(132,81,225,0.35)] hover:-translate-y-1.5 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8451E1]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#8451E1] via-[#a575ff] to-[#c084fc] bg-clip-text text-transparent group-hover:via-[#ffd89b] transition-all duration-500 group-hover:to-[#19547b]">{stats.brands}</div>
                <div className="text-xs text-[#999] mt-2 sm:mt-3 font-semibold tracking-wider uppercase">Brands</div>
              </div>
            </div>
            {/* Stats Card 3 */}
            <div className="group relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/30 rounded-2xl p-4 sm:p-5 md:p-6 text-center hover:border-[#8451E1]/70 transition-all duration-500 shadow-xl hover:shadow-[0_0_50px_rgba(132,81,225,0.35)] hover:-translate-y-1.5 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8451E1]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-[#8451E1] via-[#a575ff] to-[#c084fc] bg-clip-text text-transparent group-hover:via-[#4ecca3] transition-all duration-500 group-hover:to-[#44a08d]">{stats.inStock}</div>
                <div className="text-xs text-[#999] mt-2 sm:mt-3 font-semibold tracking-wider uppercase">In Stock</div>
              </div>
            </div>
            {/* Stats Card 4 */}
            <div className="group relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/30 rounded-2xl p-4 sm:p-5 md:p-6 text-center hover:border-[#8451E1]/70 transition-all duration-500 shadow-xl hover:shadow-[0_0_50px_rgba(132,81,225,0.35)] hover:-translate-y-1.5 hover:scale-105">
              <div className="absolute inset-0 bg-gradient-to-br from-[#8451E1]/10 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="relative">
                <div className="text-sm sm:text-base font-semibold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent group-hover:from-[#FF6B6B] group-hover:to-[#FFE66D] transition-all duration-500 leading-tight">
                  ₦{Math.round(stats.minPrice).toLocaleString()} - ₦{Math.round(stats.maxPrice).toLocaleString()}
                </div>
                <div className="text-xs text-[#999] mt-2 sm:mt-3 font-semibold tracking-wider uppercase">Price Range</div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/15 backdrop-blur-xl border border-red-500/40 rounded-2xl p-4 sm:p-5 mb-6 sm:mb-8 shadow-lg shadow-red-500/10 animate-pulse">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                  <span className="text-red-400 font-bold text-xs">!</span>
                </div>
              </div>
              <p className="text-red-300 text-xs sm:text-sm font-medium">
                Error loading products: {error}
              </p>
            </div>
          </div>
        )}

        {/* Category Carousels */}
        {!searchQuery && filters.categories.length === 0 && activeFilterCount === 0 && (
          <div className="mb-14 sm:mb-20">
            {actualCategories.map((category, catIndex) => (
              productsByCategory[category.value]?.length > 0 && (
                <div key={category.value} className="mb-12 sm:mb-16 animate-fade-in" style={{
                  animationDelay: `${catIndex * 100}ms`
                }}>
                  <div className="mb-4 sm:mb-6">
                    <div className="inline-flex items-center gap-2 p-3 rounded-xl bg-gradient-to-r from-[#8451E1]/10 to-[#5C2EAF]/10 border border-[#8451E1]/20 mb-3">
                      <span className="text-2xl">{category.icon}</span>
                      <h2 className="text-lg sm:text-2xl font-bold text-white">{category.label}</h2>
                    </div>
                    <p className="text-[#999] text-sm sm:text-base font-light ml-12">Curated selection of premium pieces</p>
                  </div>
                  <ProductCarousel
                    title={category.label}
                    products={productsByCategory[category.value]}
                    categoryIcon={category.icon}
                  />
                </div>
              )
            ))}
          </div>
        )}

        {/* Filters Bar */}
        <div className="mb-8 sm:mb-10 md:mb-12 pb-6 sm:pb-8 border-b border-[#8451E1]/20 backdrop-blur-xl">
          <div className="relative">
            {/* Left Scroll Arrow for Filters */}
            {showFiltersLeftArrow && (
              <button
                onClick={() => handleFiltersScroll('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-r from-[#0a0a0a] via-[#1a0a2e] to-transparent p-2 rounded-r-lg hover:from-[#1a0a2e] transition-all duration-300 hidden sm:flex items-center justify-center"
                aria-label="Scroll filters left"
              >
                <svg className="w-4 h-4 text-[#8451E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Filters Container with scroll */}
            <div
              id="filters-scroll-container"
              className="overflow-x-auto scrollbar-hide scroll-smooth"              
              onScroll={() => checkScroll()}
            >
              <div className="px-8 sm:px-0">
                <CollectionFilters
                  categories={actualCategories.map((cat) => ({
                    label: cat.label,
                    value: cat.value,
                    icon: cat.icon,
                    count: singleProducts.filter((p) => p.category === cat.value).length,
                  }))}
                  colors={actualColors}
                  onFiltersChange={setFilters}
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
            
            {/* Right Scroll Arrow for Filters */}
            {showFiltersRightArrow && (
              <button
                onClick={() => handleFiltersScroll('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-gradient-to-l from-[#0a0a0a] via-[#1a0a2e] to-transparent p-2 rounded-l-lg hover:from-[#1a0a2e] transition-all duration-300 hidden sm:flex items-center justify-center"
                aria-label="Scroll filters right"
              >
                <svg className="w-4 h-4 text-[#8451E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between mb-8 sm:mb-10 md:mb-12 gap-3 sm:gap-4 pb-6 sm:pb-8 border-b border-[#8451E1]/20 backdrop-blur-xl">
          <div className="flex items-center gap-2 sm:gap-3 overflow-x-auto pb-2 sm:pb-0 -mx-4 sm:mx-0 px-4 sm:px-0">
            {/* Removed: Mobile Filter Toggle now handled by horizontal filters */}

            {/* Product Count */}
            <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/30 whitespace-nowrap flex-shrink-0 shadow-lg shadow-[#8451E1]/5">
              <div className="flex items-center gap-2 text-xs sm:text-sm">
                <span className="text-[#8451E1] hidden sm:inline font-semibold">Results:</span>
                <span className="text-white font-bold text-sm sm:text-base bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                  {sortedListings.length}
                </span>
              </div>
            </div>

            {/* Active Filters Indicator */}
            {activeFilterCount > 0 && (
              <div className="px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl bg-gradient-to-r from-[#8451E1]/40 to-[#5C2EAF]/40 backdrop-blur-xl border border-[#8451E1]/60 text-[#8451E1] text-xs sm:text-sm font-bold flex items-center gap-2 sm:gap-2.5 whitespace-nowrap flex-shrink-0 shadow-lg shadow-[#8451E1]/20 animate-pulse">
                <TrendingUp className="w-4 sm:w-4 h-4 sm:h-4" />
                <span className="hidden sm:inline">{activeFilterCount} active filter{activeFilterCount > 1 ? 's' : ''}</span>
                <span className="sm:hidden">{activeFilterCount}</span>
              </div>
            )}
          </div>

          {/* Sort Menu */}
          <div className="relative sm:ml-auto">
            {/* Left Scroll Arrow for Sort */}
            {showSortLeftArrow && (
              <button
                onClick={() => handleSortScroll('left')}
                className="absolute -left-8 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-r-lg hover:bg-[#8451E1]/20 transition-all duration-300 hidden md:flex items-center justify-center"
                aria-label="Scroll sort left"
              >
                <svg className="w-3.5 h-3.5 text-[#8451E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
            )}
            
            {/* Sort Container with scroll */}
            <div
              id="sort-scroll-container"
              className="overflow-x-auto scrollbar-hide scroll-smooth px-1"
              onScroll={() => checkScroll()}
            >
              <CollectionSort value={sortBy} onChange={setSortBy} />
            </div>
            
            {/* Right Scroll Arrow for Sort */}
            {showSortRightArrow && (
              <button
                onClick={() => handleSortScroll('right')}
                className="absolute -right-8 top-1/2 -translate-y-1/2 z-10 p-1.5 rounded-l-lg hover:bg-[#8451E1]/20 transition-all duration-300 hidden md:flex items-center justify-center"
                aria-label="Scroll sort right"
              >
                <svg className="w-3.5 h-3.5 text-[#8451E1]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Main Products Carousel */}
        {loading && listings.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 sm:py-28 md:py-36">
            <div className="inline-block text-center">
              {/* Luxury Loading Animation */}
              <div className="relative w-16 sm:w-20 h-16 sm:h-20 mx-auto mb-6 sm:mb-10">
                <div className="absolute inset-0 rounded-full border-3 border-transparent border-t-[#8451E1] border-r-[#8451E1] animate-spin"></div>
                <div className="absolute inset-3 rounded-full border-2 border-transparent border-b-[#5C2EAF] animate-spin" style={{animationDirection: 'reverse'}}></div>
                <div className="absolute inset-5 rounded-full border-2 border-[#8451E1]/20"></div>
              </div>
              <p className="text-white font-semibold text-lg sm:text-xl mb-2">Curating Your Experience</p>
              <p className="text-[#8451E1] font-light text-sm sm:text-base mb-3">Loading our exclusive collection...</p>
              <p className="text-[#666] text-xs sm:text-sm">Premium fashion handpicked for you</p>
            </div>
          </div>
        ) : sortedListings.length > 0 ? (
          <div className="relative">
            {/* Products Left Scroll Arrow */}
            {showProductsLeftArrow && (
              <button
                onClick={() => handleProductsScroll('left')}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#8451E1] hover:bg-[#9468F2] text-white transition-all shadow-lg flex items-center justify-center"
                aria-label="Scroll products left"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            
            {/* Products Right Scroll Arrow */}
            {showProductsRightArrow && (
              <button
                onClick={() => handleProductsScroll('right')}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-[#8451E1] hover:bg-[#9468F2] text-white transition-all shadow-lg flex items-center justify-center"
                aria-label="Scroll products right"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            
            <div
              ref={productsCarouselRef}
              className="flex gap-4 sm:gap-5 overflow-x-auto scrollbar-hide px-0 sm:px-0"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              onScroll={() => checkScroll()}
            >
              {sortedListings.map((product) => (
                <div key={product.id} className="min-w-[calc(100vw-100px)] sm:min-w-[280px] md:min-w-[300px] flex-shrink-0">
                  <UnifiedListingCard
                    listing={product}
                    showWishlist={true}
                    showQuickView={true}
                    showShare={true}
                  />
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 px-4">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 mx-auto mb-4 bg-[#222] rounded-full flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-[#666]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No Products Found</h3>
              <p className="text-[#acacac] text-sm">
                {filters.categories.length > 0
                  ? `No products found in ${filters.categories.join(', ')}. Try a different category or clear filters.`
                  : activeFilterCount > 0
                    ? '🔍 No matches found. Your filters are too specific. Try adjusting them to discover more.'
                    : searchQuery
                      ? `No results for "${searchQuery}". Try browsing by category or price range instead.`
                      : listings.length === 0
                        ? '✨ Our exclusive collection is being curated. Check back soon for new arrivals!'
                        : 'No products available.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
          opacity: 0;
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2s {
          animation-delay: 2s;
        }
      `}</style>
    </div>
  );
}