'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import { useCollections } from '@/modules/buyer/queries/useCollections';
import { useSearch } from '@/context/SearchContext';
import ScrollToTopButton from '@/components/buyer/ScrollToTopButton';
import {
  ProductDisplayHero,
  CollectionShowcase,
  MasonryGrid,
  EnhancedCollectionCard,
} from '@/components/buyer/product-display';
import { ChevronLeft, ChevronRight, Loader2, Images, Search, X } from 'lucide-react';

type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-az' | 'name-za' | 'rating' | 'sales';

interface ProductFilters {
  categories: string[];
  priceRange: [number, number];
  ratings: number[];
  colors: string[];
  inStockOnly: boolean;
  verified: boolean;
}



const bgAnimations = `
  @keyframes blobFloat {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    25% {
      transform: translate(20px, -20px) scale(1.05);
    }
    50% {
      transform: translate(-10px, 20px) scale(0.95);
    }
    75% {
      transform: translate(-20px, -10px) scale(1.02);
    }
  }
  .blob-float {
    animation: blobFloat 7s ease-in-out infinite;
  }
  .fade-in {
    animation: fadeIn 0.6s ease-out forwards;
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
`;

export default function CollectionsPage() {
  const { data: allCollections = [], isLoading } = useCollections();
  const { searchQuery } = useSearch();
  
  
  console.log('[CollectionsPage] allCollections:', allCollections.length, allCollections.map((c: any) => ({ id: c.id, title: c.title, itemsCount: c.items?.length || 0 })));
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'carousel'>('grid');
  const [filters, setFilters] = useState<ProductFilters>({
    categories: [],
    priceRange: [0, 1000000],
    ratings: [],
    colors: [],
    inStockOnly: false,
    verified: false,
  });
  const [searchInput, setSearchInput] = useState('');
  const sortContainerRef = useRef<HTMLDivElement>(null);
  const categoriesContainerRef = useRef<HTMLDivElement>(null);
  const [showSortLeftScroll, setShowSortLeftScroll] = useState(false);
  const [showSortRightScroll, setShowSortRightScroll] = useState(false);
  const [showCatsLeftScroll, setShowCatsLeftScroll] = useState(false);
  const [showCatsRightScroll, setShowCatsRightScroll] = useState(false);

  const checkScroll = (ref: React.RefObject<HTMLDivElement | null>, isSort: boolean) => {
    if (ref.current) {
      const { scrollLeft, scrollWidth, clientWidth } = ref.current;
      if (isSort) {
        setShowSortLeftScroll(scrollLeft > 0);
        setShowSortRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
      } else {
        setShowCatsLeftScroll(scrollLeft > 0);
        setShowCatsRightScroll(scrollLeft < scrollWidth - clientWidth - 10);
      }
    }
  };

  const scroll = (ref: React.RefObject<HTMLDivElement | null>, direction: 'left' | 'right') => {
    if (ref.current) {
      const scrollAmount = 200;
      ref.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
      setTimeout(() => {
        const isSort = ref === sortContainerRef;
        checkScroll(ref, isSort);
      }, 300);
    }
  };

  
  const approvedCollections = useMemo(() => {
    return allCollections;
  }, [allCollections]);

  const filteredCollections = useMemo(() => {
    let result = [...approvedCollections];

    
    const query = (searchInput || searchQuery).toLowerCase();
    if (query.trim()) {
      result = result.filter((collection: any) =>
        collection.title?.toLowerCase().includes(query) ||
        collection.description?.toLowerCase().includes(query)
      );
    }

    
    if (filters.categories.length > 0) {
      result = result.filter((collection: any) => {
        if (!collection.categories || !Array.isArray(collection.categories)) {
          return false;
        }
        return collection.categories.some((cat: string) =>
          filters.categories.includes(cat)
        );
      });
    }

    return result;
  }, [approvedCollections, searchQuery, searchInput, filters.categories]);

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
          const priceA = a.totalPrice || a.collectionTotalPrice || 0;
          const priceB = b.totalPrice || b.collectionTotalPrice || 0;
          return priceA - priceB;
        });
        break;
      case 'price-high':
        sorted.sort((a: any, b: any) => {
          const priceA = a.totalPrice || a.collectionTotalPrice || 0;
          const priceB = b.totalPrice || b.collectionTotalPrice || 0;
          return priceB - priceA;
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
          
          return 0;
        });
        break;
      case 'sales':
        
        sorted.sort((a: any, b: any) => {
          const aCount = a.collectionItemCount || a.items?.length || 0;
          const bCount = b.collectionItemCount || b.items?.length || 0;
          return bCount - aCount;
        });
        break;
    }

    return sorted;
  }, [filteredCollections, sortBy]);

  const handleClearSearch = () => {
    setSearchInput('');
    setFilters(prev => ({ ...prev, categories: [] }));
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
    <main className="bg-black min-h-screen relative overflow-hidden">
      {}
      <style>{bgAnimations}</style>
      
      {}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-br from-purple-900/30 to-transparent rounded-full blur-3xl blob-float" style={{ animationDelay: '0s' }} />
        <div className="absolute top-1/3 right-0 w-80 h-80 bg-gradient-to-bl from-pink-900/20 to-transparent rounded-full blur-3xl blob-float" style={{ animationDelay: '2s' }} />
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-t from-purple-900/20 to-transparent rounded-full blur-3xl blob-float" style={{ animationDelay: '4s' }} />
      </div>

      {}
      <div className="relative z-10">
        <ProductDisplayHero
          title="Curated Collections"
          subtitle="Discover carefully curated collections of premium fashion items"
          description="Explore exclusive collections from Luxela's top brands"
        />
      </div>

      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16 relative z-20">
        {}
        <div className="mb-6 sm:mb-8 md:mb-10 sticky top-0 z-40 bg-black/98 backdrop-blur-lg py-3 sm:py-4 -mx-4 sm:-mx-6 px-4 sm:px-6 border-b border-purple-900/20 shadow-lg shadow-purple-900/10">
          <div className="container mx-auto px-0 sm:px-0">
            {}
            <div className="mb-4 sm:mb-6">
              <div className="relative">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 w-4 sm:w-5 h-4 sm:h-5 text-[#666]" />
                <input
                  type="text"
                  placeholder="Search collections..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] border border-purple-900/40 rounded-lg text-sm sm:text-base text-white placeholder-[#666] focus:border-[#8451E1] focus:outline-none focus:ring-2 focus:ring-purple-900/30 transition-all shadow-lg shadow-black/50"
                />
                {(searchInput || filters.categories.length > 0) && (
                  <button
                    onClick={handleClearSearch}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-purple-900/40 rounded transition-colors"
                    aria-label="Clear search"
                  >
                    <X className="w-3.5 sm:w-4 h-3.5 sm:h-4 text-purple-400 hover:text-purple-200 transition-colors" />
                  </button>
                )}
              </div>
            </div>

            {}
            <div className="flex items-center gap-3 mt-4">
              <label className="text-sm text-purple-300 flex-shrink-0">Sort by:</label>
              <div className="relative flex items-center gap-2 flex-1 md:flex-none">
                {showSortLeftScroll && (
                  <button
                    onClick={() => scroll(sortContainerRef, 'left')}
                    className="absolute -left-8 hidden md:flex z-10 p-1 text-purple-400 hover:text-purple-200 hover:bg-purple-900/40 rounded transition-colors"
                    aria-label="Scroll left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}
                <div
                  ref={sortContainerRef}
                  onScroll={() => checkScroll(sortContainerRef, true)}
                  className="flex gap-2 overflow-x-auto scrollbar-hide md:overflow-visible"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortOption)}
                    className="px-3 py-2 bg-purple-900/30 border border-purple-700/50 rounded text-purple-100 text-sm hover:border-purple-500/50 transition-colors flex-shrink-0"
                  >
                    <option value="newest">Newest</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="name-az">Name: A-Z</option>
                    <option value="name-za">Name: Z-A</option>
                  </select>
                </div>
                {showSortRightScroll && (
                  <button
                    onClick={() => scroll(sortContainerRef, 'right')}
                    className="absolute -right-8 hidden md:flex z-10 p-1 text-purple-400 hover:text-purple-200 hover:bg-purple-900/40 rounded transition-colors"
                    aria-label="Scroll right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 flex-wrap w-full sm:w-auto mt-4">

                {}
                <div className="flex items-center gap-1 sm:gap-2 bg-gradient-to-r from-[#0f0f0f] to-[#1a1a1a] rounded-lg p-1 border border-purple-900/40 flex-shrink-0 shadow-lg shadow-black/50">
                  <button
                    onClick={() => setLayoutMode('grid')}
                    className={`p-2 sm:p-2.5 rounded transition-all ${
                      layoutMode === 'grid'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50'
                        : 'text-purple-400 hover:text-purple-200 hover:bg-purple-900/20'
                    }`}
                    title="Grid view"
                    aria-label="Grid view"
                  >
                    <Images className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </button>
                  <button
                    onClick={() => setLayoutMode('carousel')}
                    className={`p-2 sm:p-2.5 rounded transition-all ${
                      layoutMode === 'carousel'
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50'
                        : 'text-purple-400 hover:text-purple-200 hover:bg-purple-900/20'
                    }`}
                    title="Carousel view"
                    aria-label="Carousel view"
                  >
                    <Images className="w-3.5 sm:w-4 h-3.5 sm:h-4" />
                  </button>
                </div>
            </div>

            {}
            {(searchInput || filters.categories.length > 0) && (
              <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-2 fade-in">
                <span className="text-xs sm:text-sm text-purple-400/70">Active filters:</span>
                {searchInput && (
                  <span className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-purple-900/40 to-pink-900/20 text-purple-200 rounded-full text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border border-purple-900/40">
                    <span className="truncate max-w-[100px] sm:max-w-none">{searchInput}</span>
                    <X
                      className="w-2.5 sm:w-3 h-2.5 sm:h-3 cursor-pointer flex-shrink-0 hover:text-purple-100 transition-colors"
                      onClick={() => setSearchInput('')}
                    />
                  </span>
                )}
                {filters.categories.map((cat) => (
                  <span
                    key={cat}
                    className="px-2.5 sm:px-3 py-1 bg-gradient-to-r from-purple-900/40 to-pink-900/20 text-purple-200 rounded-full text-xs sm:text-sm flex items-center gap-1.5 sm:gap-2 border border-purple-900/40"
                  >
                    <span className="truncate max-w-[100px] sm:max-w-none">{cat}</span>
                    <X
                      className="w-2.5 sm:w-3 h-2.5 sm:h-3 cursor-pointer flex-shrink-0 hover:text-purple-100 transition-colors"
                      onClick={() =>
                        setFilters(prev => ({
                          ...prev,
                          categories: prev.categories.filter((c) => c !== cat)
                        }))
                      }
                    />
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {}
        <div className="fade-in">
        {sortedCollections.length > 0 ? (
          layoutMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sortedCollections.map((collection) => (
                <div key={collection.id}>
                  <EnhancedCollectionCard
                    collection={collection}
                    variant="featured"
                  />
                </div>
              ))}
            </div>
          ) : (
            <CollectionShowcase
              collections={sortedCollections}
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
              {filters.categories.length > 0 || searchInput
                ? 'Try adjusting your search or filters'
                : 'No collections available at the moment'}
            </p>
          </div>
        )}
        </div>
      </div>
      <ScrollToTopButton />
    </main>
  );
}