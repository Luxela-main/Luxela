"use client";

import { useSearch } from '@/context/SearchContext';
import { useListings } from '@/context/ListingsContext';
import { useMemo, useEffect, useState } from 'react';
import { logListingsDebug } from '@/lib/debug/listings-debug';
import { useBrands, type Brand } from '@/modules/buyer/queries';
import { useCollectionsCached } from '@/modules/buyer/queries/useCollections-cached';
import { useBrandsCached } from '@/modules/buyer/queries/useBrands-cached';
import { prefetchBuyerPageData } from '@/utils/cache/buyer-page-cache';
import {
  BrandShowcase,
  CollectionShowcase,
  ProductDisplayGrid,
  ProductDisplayHero,
} from '@/components/buyer/product-display';
import { SearchX, Sparkles, TrendingUp } from 'lucide-react';
import ScrollToTopButton from '@/components/buyer/ScrollToTopButton';

const Homepage = () => {
  const { searchQuery } = useSearch();
  const { listings, loading, error } = useListings();
  const { brands: brandsArray, isLoading: brandsLoading, total: totalBrands, isFromCache: brandsFromCache } = useBrandsCached({ limit: 8 });
  const { data: collectionsData = [], isLoading: collectionsLoading, isFromCache: collectionsFromCache } = useCollectionsCached({ limit: 8 });
  const [showNewArrivals, setShowNewArrivals] = useState(true);
  
  useEffect(() => {
    prefetchBuyerPageData(8);
  }, []);
  
  useEffect(() => {
    if (listings.length > 0) {
      logListingsDebug.display(listings);
      console.log('[Homepage] Loaded', listings.length, 'products from real data');
    }
    if (error) {
      logListingsDebug.error(error, 'Homepage/listings');
      console.error('[Homepage] Error loading listings:', error);
    }
  }, [listings, error]);

  const filteredBrands = useMemo(() => {
    if (!brandsArray) return [];
    if (!searchQuery.trim()) return brandsArray;
    
    const query = searchQuery.toLowerCase();
    return brandsArray.filter((brand: Brand) => 
      brand.name?.toLowerCase().includes(query) ||
      brand.description?.toLowerCase().includes(query)
    );
  }, [brandsArray, searchQuery]);

  const filteredCollections = useMemo(() => {
    if (!collectionsData || collectionsData.length === 0) return [];
    if (!searchQuery.trim()) return collectionsData;
    
    const query = searchQuery.toLowerCase();
    return collectionsData.filter((collection: any) => 
      collection.name?.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query)
    );
  }, [collectionsData, searchQuery]);

  // Featured products - newest items
  const featuredProducts = useMemo(() => {
    if (!listings || listings.length === 0) return [];
    console.log('[Homepage] All listings:', listings.map((l: any) => ({ id: l.id, title: l.title, type: l.type })));
    const sorted = listings
      .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 4);
    console.log('[Homepage] Featured products (top 4):', sorted.map((p: any) => ({ id: p.id, title: p.title })));
    return sorted;
  }, [listings]);

  const filteredListings = useMemo(() => {
    if (!listings || listings.length === 0) {
      console.log('[Homepage] No listings available');
      return [];
    }
    
    // Backend now filters out collections and products in collections
    if (!searchQuery.trim()) {
      console.log('[Homepage] No search query, showing all', listings.length, 'listings');
      return listings;
    }
    
    const query = searchQuery.toLowerCase();
    const filtered = listings.filter((listing: any) => 
      listing.title?.toLowerCase().includes(query) ||
      listing.description?.toLowerCase().includes(query) ||
      listing.category?.toLowerCase().includes(query) ||
      listing.sellers?.seller_business?.[0]?.brand_name?.toLowerCase().includes(query)
    );
    console.log('[Homepage] Search filtered:', { query, original: listings.length, filtered: filtered.length });
    return filtered;
  }, [listings, searchQuery]);

  const hasResults = useMemo(() => {
    if (!searchQuery.trim()) return true;

    const query = searchQuery.toLowerCase();

    const hasBrands = (filteredBrands?.length ?? 0) > 0;
    const hasCollections = (filteredCollections?.length ?? 0) > 0;

    const hasProducts = listings.some(listing => {
      if (listing.type !== 'single') return false;
      
      return listing.title?.toLowerCase().includes(query) ||
             listing.description?.toLowerCase().includes(query) ||
             listing.category?.toLowerCase().includes(query) ||
             listing.sellers?.seller_business?.[0]?.brand_name?.toLowerCase().includes(query);
    });

    return hasBrands || hasCollections || hasProducts;
  }, [listings, searchQuery]);

  // Calculate homepage stats
  const homeStats = useMemo(() => {
    return {
      totalProducts: listings.filter((l: any) => l.type !== 'collection').length,
      totalBrands: totalBrands || brandsArray.length,
      totalCollections: collectionsData.length,
    };
  }, [listings, totalBrands, brandsArray.length, collectionsData.length]);

  return (
    <section className='bg-black'>
      <ScrollToTopButton />
      {/* Error State */}
      {error && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-6 sm:mb-8 mt-6 sm:mt-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 sm:p-4 backdrop-blur">
            <p className="text-red-400 text-xs sm:text-sm font-medium">
              ⚠️ Error loading products: {error}
            </p>
          </div>
        </div>
      )}

      {/* No Search Results State */}
      {searchQuery && !hasResults ? (
        <div className="text-center py-16 sm:py-24 md:py-32 px-4 min-h-screen flex items-center justify-center">
          <div className="max-w-lg mx-auto">
            <div className="mb-6 sm:mb-8 flex justify-center">
              <div className="relative w-20 sm:w-28 h-20 sm:h-28 bg-gradient-to-br from-[#8451E1]/20 to-[#5C2EAF]/20 rounded-full flex items-center justify-center border border-[#8451E1]/30">
                <SearchX strokeWidth={1.5} className="w-10 sm:w-14 h-10 sm:h-14 text-[#8451E1]" />
              </div>
            </div>
            <h3 className="text-white text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">
              No Results Found
            </h3>
            <p className="text-[#acacac] mb-2 text-base sm:text-lg font-medium">
              We couldn't find anything matching <span className="text-white">«{searchQuery}»</span>
            </p>
            <p className="text-[#999] text-xs sm:text-sm mb-6 sm:mb-8 leading-relaxed px-2">
              Try searching by brand name, product name, collection, or category
            </p>
            <div className="flex flex-col sm:flex-row flex-wrap gap-2 sm:gap-3 justify-center">
              <button className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[#8451E1]/20 border border-[#8451E1]/50 text-[#8451E1] text-xs sm:text-sm font-semibold hover:bg-[#8451E1]/30 transition-all active:scale-95 cursor-pointer">
                Browse All Products
              </button>
              <button className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[#1a1a1a] border border-[#333] text-[#acacac] text-xs sm:text-sm font-semibold hover:border-[#8451E1] hover:text-white transition-all active:scale-95 cursor-pointer">
                View Collections
              </button>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Hero Section */}
          <ProductDisplayHero 
            title="Welcome to Luxela" 
            description="Discover curated collections from the world's most prestigious fashion brands. Luxury shopping redefined." 
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12 sm:space-y-16 md:space-y-20 py-6 sm:py-8 md:py-12">

            {/* Homepage Stats Bar */}
            {!searchQuery && (listings.length > 0 || brandsArray.length > 0) && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 bg-gradient-to-r from-[#8451E1]/8 to-[#5C2EAF]/8 rounded-2xl p-4 sm:p-6 md:p-8 border border-[#8451E1]/20 backdrop-blur-sm">
                <div className="text-center sm:border-r sm:border-[#8451E1]/20">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-light text-[#8451E1] mb-1 sm:mb-2">{homeStats.totalProducts.toLocaleString()}</div>
                  <div className="text-xs text-[#acacac] font-medium tracking-widest uppercase">Premium Products</div>
                </div>
                <div className="text-center border-l border-[#8451E1]/20 sm:border-l sm:border-r">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-light text-[#8451E1] mb-1 sm:mb-2">{homeStats.totalBrands}</div>
                  <div className="text-xs text-[#acacac] font-medium tracking-widest uppercase">Luxury Brands</div>
                </div>
                <div className="col-span-2 sm:col-span-1 text-center sm:border-l sm:border-[#8451E1]/20">
                  <div className="text-2xl sm:text-3xl md:text-4xl font-light text-[#8451E1] mb-1 sm:mb-2">{homeStats.totalCollections}</div>
                  <div className="text-xs text-[#acacac] font-medium tracking-widest uppercase">Collections</div>
                </div>
              </div>
            )}

            {/* Loading State */}
            {(loading || brandsLoading || collectionsLoading) && listings.length === 0 && brandsArray.length === 0 && collectionsData.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 sm:py-16 md:py-20">
                <div className="relative w-12 sm:w-16 h-12 sm:h-16 mb-4 sm:mb-6">
                  <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#8451E1] border-r-[#8451E1] animate-spin"></div>
                  <div className="absolute inset-2 rounded-full border-2 border-transparent border-b-[#5C2EAF] animate-spin" style={{animationDirection: 'reverse'}}></div>
                </div>
                <p className="text-[#acacac] font-medium text-center text-sm sm:text-base">Curating your Luxela experience...</p>
                <p className="text-[#666] text-xs sm:text-sm mt-1 sm:mt-2">Loading premium brands and collections</p>
              </div>
            ) : (
              <>
                {/* Featured Brands Section */}
                {filteredBrands.length > 0 && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10 md:mb-12">
                      <div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                          <Sparkles className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-[#8451E1] flex-shrink-0" />
                          Premium Brands
                        </h2>
                        <p className="text-[#999] text-sm sm:text-base md:text-lg">Discover collections from the world's most prestigious designers</p>
                      </div>
                    </div>
                    <BrandShowcase brands={filteredBrands} title="" variant="carousel" />
                  </div>
                )}

                {/* Featured Collections Section */}
                {filteredCollections.length > 0 && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10 md:mb-12">
                      <div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-2 sm:mb-3 flex items-center gap-2 sm:gap-3">
                          <TrendingUp className="w-5 sm:w-6 md:w-7 h-5 sm:h-6 md:h-7 text-[#8451E1] flex-shrink-0" />
                          Trending Collections
                        </h2>
                        <p className="text-[#999] text-sm sm:text-base md:text-lg">Carefully curated selections for every style</p>
                      </div>
                    </div>
                    <CollectionShowcase collections={filteredCollections} title="" variant="carousel" />
                  </div>
                )}

                {/* New Arrivals Section */}
                {filteredListings.length > 0 && featuredProducts.length > 0 && (
                  <div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-10 md:mb-12 gap-4 sm:gap-0">
                      <div>
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-light text-white mb-2 sm:mb-3">New Arrivals</h2>
                        <p className="text-[#999] text-sm sm:text-base md:text-lg">Latest additions to our exclusive collection</p>
                      </div>
                      <a href="/buyer/browse" className="px-4 sm:px-6 py-2.5 sm:py-3 rounded-lg bg-[#8451E1]/20 border border-[#8451E1]/50 text-[#8451E1] hover:bg-[#8451E1]/30 transition-all font-semibold text-xs sm:text-sm active:scale-95 whitespace-nowrap cursor-pointer">
                        View All →
                      </a>
                    </div>
                    <ProductDisplayGrid products={featuredProducts} />
                  </div>
                )}
              </>
            )}
          </div>
        </>
      )}
    </section>
  );
};

export default Homepage;

