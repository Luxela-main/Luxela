'use client';

import { useState, useMemo, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useBrands, type Brand } from '@/modules/buyer/queries/useBrands';
import { useRealtimeListings } from '@/hooks/useRealtimeListings';
import {
  BrandShowcase,
  ProductDisplayGrid,
} from '@/components/buyer/product-display';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Search, X, Loader2, TrendingUp, Star, Users } from 'lucide-react';
import Image from 'next/image';

// Dynamically import Select components to prevent hydration mismatch with Radix UI useId()
const Select = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.Select })), {
  ssr: false,
  loading: () => <div className="w-full h-10 bg-[#0f0f0f] rounded-lg animate-pulse" />
});
const SelectContent = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectContent })), {
  ssr: false,
});
const SelectItem = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectItem })), {
  ssr: false,
});
const SelectTrigger = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectTrigger })), {
  ssr: false,
});
const SelectValue = dynamic(() => import('@/components/ui/select').then(mod => ({ default: mod.SelectValue })), {
  ssr: false,
});

export default function BrandsPage() {
  const router = useRouter();
  useRealtimeListings(); // Enable realtime product syncing
  const [page, setPage] = useState(1);
  const [limit] = useState(12);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState<'followers' | 'products' | 'name' | 'rating'>(
    'followers'
  );
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { brands: brandsList, isLoading, totalPages, total } = useBrands({
    page,
    limit,
    search: search.length > 0 ? search : undefined,
    sortBy,
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (value: string) => {
    setSortBy(value as any);
    setPage(1);
  };

  const handleClearSearch = () => {
    setSearch('');
    setPage(1);
  };

  return (
    <div className="min-h-screen bg-black">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#161616] via-[#0a0a0a] to-black mb-8 sm:mb-10 md:mb-12 border-b border-[#8451E1]/20 py-16 sm:py-24 md:py-32">
        <div className="absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-r from-[#8451E1]/8 via-transparent to-[#5C2EAF]/8 opacity-40" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6">
          <div className="text-center">
            <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-light text-white mb-4 sm:mb-6 tracking-tight">
              Discover Premium Brands
            </h1>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl text-[#999] max-w-3xl mx-auto leading-relaxed px-2">
              Explore meticulously curated collections from verified sellers offering
              world-class luxury and quality exclusively on Luxela
            </p>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 py-6 sm:py-8">
        {/* Search & Filters Section */}
        <div className="mb-8 sm:mb-10 md:mb-12 space-y-4 sm:space-y-6">
          {/* Search Box */}
          <div className="relative">
            <Search className="absolute left-3 sm:left-4 top-3 sm:top-4 h-4 sm:h-5 w-4 sm:w-5 text-[#666]" />
            <Input
              placeholder="Search brands by name..."
              value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 sm:pl-12 h-11 sm:h-14 bg-[#0f0f0f] border border-[#2B2B2B] text-white placeholder:text-[#666] focus-visible:border-[#8451E1] focus-visible:ring-[#8451E1] rounded-lg text-sm sm:text-base"
            />
            {search && (
              <button
                onClick={handleClearSearch}
                className="absolute right-3 sm:right-4 top-3 sm:top-4 text-[#666] hover:text-white transition-colors"
              >
                <X className="h-4 sm:h-5 w-4 sm:w-5" />
              </button>
            )}
          </div>

          {/* Controls Row */}
          <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:justify-between sm:items-center">
            <div className="text-xs sm:text-sm text-[#999]">
              <span className="text-white font-light text-base sm:text-lg">
                {total || 0}
              </span>
              {' '}premium brands available
            </div>

            <div className="flex gap-2 sm:gap-3 flex-wrap items-center justify-between sm:justify-start">
              {/* Sort Dropdown */}
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full sm:w-48 md:w-52 bg-[#0f0f0f] border border-[#2B2B2B] text-white hover:border-[#8451E1] h-10 sm:h-11 rounded-lg text-xs sm:text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#0f0f0f] border border-[#2B2B2B]">
                  <SelectItem value="followers" className="text-white">
                    Most Followed
                  </SelectItem>
                  <SelectItem value="products" className="text-white">
                    Most Products
                  </SelectItem>
                  <SelectItem value="rating" className="text-white">
                    Top Rated
                  </SelectItem>
                  <SelectItem value="name" className="text-white">
                    Name (A-Z)
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* View Mode Toggle */}
              <div className="flex gap-1 sm:gap-2 bg-[#0f0f0f] rounded-lg p-1 border border-[#2B2B2B]">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded text-xs sm:text-sm font-medium transition-all ${
                    viewMode === 'grid'
                      ? 'bg-[#8451E1] text-white shadow-lg shadow-[#8451E1]/20'
                      : 'text-[#acacac] hover:text-white'
                  }`}
                >
                  Grid
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`px-3 sm:px-5 py-2 sm:py-2.5 rounded text-xs sm:text-sm font-medium transition-all ${
                    viewMode === 'list'
                      ? 'bg-[#8451E1] text-white shadow-lg shadow-[#8451E1]/20'
                      : 'text-[#acacac] hover:text-white'
                  }`}
                >
                  List
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading ? (
          <div className="grid gap-3 sm:gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-80 bg-[#0f0f0f] rounded-xl animate-pulse border border-[#222]"
              />
            ))}
          </div>
        ) : viewMode === 'grid' ? (
          <>
            {brandsList && brandsList.length > 0 ? (
              <>
                <BrandShowcase
                  brands={brandsList}
                  variant="carousel"
                  columns={4}
                />

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-[#222] text-white hover:bg-[#0f0f0f] hover:border-[#8451E1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              page === pageNum
                                ? 'bg-[#8451E1] text-white shadow-lg shadow-[#8451E1]/20'
                                : 'border border-[#222] text-[#acacac] hover:text-white hover:border-[#8451E1]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && (
                        <span className="px-2 py-2 text-[#666]">...</span>
                      )}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-[#222] text-white hover:bg-[#0f0f0f] hover:border-[#8451E1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 sm:py-16 md:py-20">
                <TrendingUp className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-[#333] mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  No brands found
                </h3>
                <p className="text-xs sm:text-sm text-[#acacac]">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </>
        ) : (
          <>
            {/* List View */}
            {brandsList && brandsList.length > 0 ? (
              <>
                <div className="space-y-3 sm:space-y-4">
                  {brandsList.map((brand: Brand) => {
                    const handleBrandClick = () => {
                      const brandIdentifier = brand.slug || brand.id;
                      if (brandIdentifier) {
                        router.push(`/buyer/brand/${brandIdentifier}`);
                      }
                    };
                    return (
                    <div
                      key={brand.id}
                      className="bg-[#0f0f0f] border border-[#2B2B2B] rounded-xl overflow-hidden hover:border-[#8451E1] transition-all group cursor-pointer duration-300"
                      onClick={handleBrandClick}
                    >
                      <div className="flex flex-col sm:flex-row gap-4 sm:gap-6 items-start p-4 sm:p-6">
                        {/* Logo */}
                        {(brand.logoImage || brand.storeLogo) && (
                          <div className="w-16 sm:w-20 md:w-24 h-16 sm:h-20 md:h-24 rounded-lg overflow-hidden flex-shrink-0 bg-[#1a1a1a] border border-[#2B2B2B] flex items-center justify-center">
                            <Image
                              src={brand.logoImage || brand.storeLogo || ''}
                              alt={brand.name}
                              width={96}
                              height={96}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          </div>
                        )}

                        {/* Info */}
                        <div className="flex-grow min-w-0">
                          <h3 className="text-base sm:text-lg font-semibold text-white mb-1 sm:mb-2">
                            {brand.name || brand.brandName || 'Store'}
                          </h3>
                          {(brand.description || brand.storeDescription) && (
                            <p className="text-[#999] text-xs sm:text-sm mb-2 sm:mb-4 line-clamp-2 leading-relaxed">
                              {brand.description || brand.storeDescription}
                            </p>
                          )}

                          {/* Stats */}
                          <div className="flex gap-3 sm:gap-6 text-xs sm:text-sm flex-wrap">
                            <div className="flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-[#8451E1]" />
                              <span className="text-[#acacac]">Products:</span>
                              <span className="text-white font-semibold">
                                {brand.totalProducts || 0}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Star className="w-4 h-4 text-[#8451E1]" />
                              <span className="text-[#acacac]">Rating:</span>
                              <span className="text-white font-semibold">
                                ⭐ {brand.rating || '0'}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <Users className="w-4 h-4 text-[#8451E1]" />
                              <span className="text-[#acacac]">Followers:</span>
                              <span className="text-white font-semibold">
                                {brand.followersCount || 0}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* CTA */}
                        <button 
                          onClick={() => {
                            console.log('[BrandListView] Brand object:', brand);
                            console.log('[BrandListView] Brand slug:', brand.slug);
                            console.log('[BrandListView] Brand id:', brand.id);
                            const brandIdentifier = brand.slug || brand.id;
                            if (!brandIdentifier) {
                              console.error('[BrandListView] Neither slug nor id available for brand:', brand);
                              return;
                            }
                            console.log('[BrandListView] Navigating to:', `/buyer/brand/${brandIdentifier}`);
                            router.push(`/buyer/brand/${brandIdentifier}`);
                          }}
                          className="px-3 sm:px-6 py-2 sm:py-3 bg-[#8451E1] text-white rounded-lg font-semibold hover:bg-[#7240D0] transition-all shadow-lg shadow-[#8451E1]/20 self-start sm:self-center whitespace-nowrap text-xs sm:text-sm active:scale-95"
                        >
                          View Brand
                        </button>
                      </div>
                    </div>
                    );
                  })}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="mt-12 flex justify-center items-center gap-4">
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page === 1}
                      className="p-2 rounded-lg border border-[#222] text-white hover:bg-[#0f0f0f] hover:border-[#8451E1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="flex gap-2">
                      {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => {
                        const pageNum = i + 1;
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setPage(pageNum)}
                            className={`px-4 py-2 rounded-lg font-medium transition-all ${
                              page === pageNum
                                ? 'bg-[#8451E1] text-white shadow-lg shadow-[#8451E1]/20'
                                : 'border border-[#222] text-[#acacac] hover:text-white hover:border-[#8451E1]'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      {totalPages > 5 && (
                        <span className="px-2 py-2 text-[#666]">...</span>
                      )}
                    </div>

                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page === totalPages}
                      className="p-2 rounded-lg border border-[#222] text-white hover:bg-[#0f0f0f] hover:border-[#8451E1] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12 sm:py-16 md:py-20">
                <Users className="w-8 sm:w-10 md:w-12 h-8 sm:h-10 md:h-12 text-[#333] mx-auto mb-3 sm:mb-4" />
                <h3 className="text-lg sm:text-xl font-semibold text-white mb-2">
                  No brands found
                </h3>
                <p className="text-xs sm:text-sm text-[#acacac]">
                  Try adjusting your search terms
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}