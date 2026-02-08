'use client';

import { useState, useMemo } from 'react';
import { useCollections } from '@/modules/buyer/queries/useCollections';
import { useSearch } from '@/context/SearchContext';
import ScrollToTopButton from '@/components/buyer/ScrollToTopButton';
import {
  ProductDisplayHero,
  CollectionShowcase,
  ProductDisplayGrid,
  ProductFiltersPanel,
  ProductSortMenu,
  type SortOption,
} from '@/components/buyer/product-display';
import { Loader2, Images, Search, X } from 'lucide-react';

export default function CollectionsPage() {
  const { data: allCollections = [], isLoading } = useCollections();
  const { searchQuery } = useSearch();
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'carousel'>('grid');
  const [filteredByCategory, setFilteredByCategory] = useState<string[]>([]);
  const [searchInput, setSearchInput] = useState('');

  // Collections from the hook are already filtered to approved status
  const approvedCollections = useMemo(() => {
    return allCollections;
  }, [allCollections]);

  const filteredCollections = useMemo(() => {
    let result = [...approvedCollections];

    // Use local search input or context search query
    const query = (searchInput || searchQuery).toLowerCase();
    if (query.trim()) {
      result = result.filter((collection: any) =>
        collection.title?.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
      );
    }

    // Filter by categories if selected
    if (filteredByCategory.length > 0) {
      result = result.filter((collection: any) => {
        if (!collection.categories || !Array.isArray(collection.categories)) {
          return false;
        }
        return collection.categories.some((cat: string) =>
          filteredByCategory.includes(cat)
        );
      });
    }

    return result;
  }, [approvedCollections, searchQuery, searchInput, filteredByCategory]);

  const availableCategories = useMemo(() => {
    const categorySet = new Set<string>();

    approvedCollections.forEach((collection: any) => {
      if (collection.categories && Array.isArray(collection.categories)) {
        collection.categories.forEach((cat: string) => {
          categorySet.add(cat);
        });
      }
    });

    return Array.from(categorySet).map((cat) => ({
      value: cat,
      label: cat.charAt(0).toUpperCase() + cat.slice(1),
    }));
  }, [approvedCollections]);

  const sortedCollections = useMemo(() => {
    let sorted = [...filteredCollections];

    switch (sortBy) {
      case 'newest':
        sorted.sort((a: any, b: any) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'price-low':
        sorted.sort((a: any, b: any) => {
          const avgPriceA = a.itemsJson?.reduce((sum: number, item: any) => sum + (item.price || 0), 0) / (a.itemsJson?.length || 1) || 0;
          const avgPriceB = b.itemsJson?.reduce((sum: number, item: any) => sum + (item.price || 0), 0) / (b.itemsJson?.length || 1) || 0;
          return avgPriceA - avgPriceB;
        });
        break;
      case 'price-high':
        sorted.sort((a: any, b: any) => {
          const avgPriceA = a.itemsJson?.reduce((sum: number, item: any) => sum + (item.price || 0), 0) / (a.itemsJson?.length || 1) || 0;
          const avgPriceB = b.itemsJson?.reduce((sum: number, item: any) => sum + (item.price || 0), 0) / (b.itemsJson?.length || 1) || 0;
          return avgPriceB - avgPriceA;
        });
        break;
      case 'name-az':
        sorted.sort((a: any, b: any) =>
          a.title?.localeCompare(b.title || '')
        );
        break;
      case 'name-za':
        sorted.sort((a: any, b: any) =>
          b.title?.localeCompare(a.title || '')
        );
        break;
      case 'rating':
        sorted.sort((a: any, b: any) => {
          const avgRatingA = a.itemsJson?.reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / (a.itemsJson?.length || 1) || 0;
          const avgRatingB = b.itemsJson?.reduce((sum: number, item: any) => sum + (item.rating || 0), 0) / (b.itemsJson?.length || 1) || 0;
          return avgRatingB - avgRatingA;
        });
        break;
      case 'sales':
        // For now, sort by items count as a proxy for sales
        sorted.sort((a: any, b: any) => {
          const aCount = a.itemsJson?.length || 0;
          const bCount = b.itemsJson?.length || 0;
          return bCount - aCount;
        });
        break;
    }

    return sorted;
  }, [filteredCollections, sortBy]);

  const handleClearSearch = () => {
    setSearchInput('');
    setFilteredByCategory([]);
  };

  if (isLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center px-4">
        <div className="text-center">
          <Loader2 className="w-8 sm:w-10 h-8 sm:h-10 text-[#8451E1] animate-spin mx-auto mb-2 sm:mb-3" />
          <p className="text-xs sm:text-sm text-[#acacac]">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="bg-black min-h-screen">
      {/* Hero Section */}
      <ProductDisplayHero
        title="Curated Collections"
        subtitle="Discover carefully curated collections of premium fashion items"
        description="Explore exclusive collections from Luxela's top brands"
      />

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        {/* Search and Filters Bar */}
        <div className="mb-6 sm:mb-8 md:mb-10 sticky top-0 z-40 bg-black/95 backdrop-blur-sm py-3 sm:py-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="container mx-auto px-0 sm:px-0">
            {/* Search Input */}
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-[#666]" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-[#0f0f0f] border border-[#2B2B2B] rounded-lg text-sm sm:text-base text-white placeholder-[#666] focus:border-[#8451E1] focus:outline-none transition-colors"
                />
                {(searchInput || filteredByCategory.length > 0) && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-[#2B2B2B] rounded"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-[#acacac]" />
                  </button>
                )}
              </div>
            </div>

            {/* Controls Bar */}
            <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
              {/* Filters - Hidden on mobile, shown on desktop */}
              <div className="hidden md:block">
                <ProductFiltersPanel
                  onFiltersChange={() => {}}
                  availableCategories={availableCategories}
                  availableColors={[]}
                />
              </div>

              <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto">
                {/* Sort Menu */}
                <div className="flex-1 sm:flex-none">
                  <ProductSortMenu
                    currentSort={sortBy}
                    onSortChange={setSortBy}
                    showLabel={false}
                  />
                </div>

                {/* Layout Toggle */}
                <div className="flex items-center gap-1 sm:gap-2 bg-[#0f0f0f] rounded-lg p-1 border border-[#2B2B2B] flex-shrink-0">
                  <button
                    onClick={() => setLayoutMode('grid')}
                    className={`p-2 sm:p-2.5 rounded transition-colors ${
                      layoutMode === 'grid'
                        ? 'bg-[#8451E1] text-white'
                        : 'text-[#acacac] hover:text-white'
                    }`}
                    title="Grid view"
                    aria-label="Grid view"
                  >
                    <Images className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </button>
                  <button
                    onClick={() => setLayoutMode('carousel')}
                    className={`p-2 sm:p-2.5 rounded transition-colors ${
                      layoutMode === 'carousel'
                        ? 'bg-[#8451E1] text-white'
                        : 'text-[#acacac] hover:text-white'
                    }`}
                    title="Carousel view"
                    aria-label="Carousel view"
                  >
                    <Images className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Active Filters Display */}
            {(searchInput || filteredByCategory.length > 0) && (
              <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2">
                <span className="text-xs sm:text-sm text-[#666]">Active filters:</span>
                {searchInput && (
                  <span className="px-2.5 sm:px-3 py-1 bg-[#8451E1]/20 text-[#8451E1] rounded-full text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2">
                    <span className="truncate max-w-[100px] sm:max-w-none">{searchInput}</span>
                    <X
                      className="w-2.5 sm:w-3 h-2.5 sm:h-3 cursor-pointer flex-shrink-0"
                      onClick={() => setSearchInput('')}
                    />
                  </span>
                )}
                {filteredByCategory.map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 sm:px-3 py-1 bg-[#8451E1]/20 text-[#8451E1] rounded-full text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2"
                  >
                    <span className="truncate max-w-[100px] sm:max-w-none">{cat}</span>
                    <X
                      className="w-2.5 sm:w-3 h-2.5 sm:h-3 cursor-pointer flex-shrink-0"
                      onClick={() =>
                        setFilteredByCategory(
                          filteredByCategory.filter((c) => c !== cat)
                        )
                      }
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Collections Display */}
        {sortedCollections.length > 0 ? (
          layoutMode === 'grid' ? (
            <ProductDisplayGrid
              products={sortedCollections as any}
              columns={{ mobile: 1, tablet: 2, desktop: 3 }}
              emptyMessage="No collections found. Try adjusting your search."
            />
          ) : (
            <CollectionShowcase
              collections={sortedCollections.map((collection: any) => ({
                id: collection.id,
                title: collection.name || collection.title,
                image: collection.image || 'https://via.placeholder.com/300x300',
                description: collection.description,
                itemCount: 0,
                href: `/buyer/collection/${collection.id}`,
              }))}
              variant="carousel"
              showControls={true}
            />
          )
        ) : (
          <div className="text-center py-12 sm:py-16 md:py-24">
            <Images className="w-10 sm:w-12 md:w-16 h-10 sm:h-12 md:h-16 text-[#333] mx-auto mb-3 sm:mb-4 md:mb-6" />
            <h3 className="text-lg sm:text-xl md:text-2xl font-light text-white mb-2 sm:mb-3">
              No Collections Found
            </h3>
            <p className="text-xs sm:text-sm md:text-base text-[#999]">
              {filteredByCategory.length > 0 || searchInput
                ? 'Try adjusting your search or filters'
                : 'No collections available at the moment'}
            </p>
          </div>
        )}
      </div>
      <ScrollToTopButton />
    </main>
  );
}