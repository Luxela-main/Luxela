'use client';

import { useState } from 'react';
import { ChevronDown, X, Sliders } from 'lucide-react';

interface FilterCategory {
  label: string;
  value: string;
  count?: number;
  icon?: string;
}

interface FilterColor {
  label: string;
  value: string;
  hex?: string;
}

interface ProductFilters {
  categories: string[];
  priceRange: [number, number];
  ratings: number[];
  colors: string[];
  inStockOnly: boolean;
  verified: boolean;
}

interface CollectionFiltersProps {
  categories: FilterCategory[];
  colors: FilterColor[];
  onFiltersChange: (filters: ProductFilters) => void;
  priceMin?: number;
  priceMax?: number;
  onClearAll?: () => void;
}

export function CollectionFilters({
  categories = [],
  colors = [],
  onFiltersChange,
  priceMin = 0,
  priceMax = 10000,
  onClearAll,
}: CollectionFiltersProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: [],
    priceRange: [priceMin, priceMax],
    ratings: [],
    colors: [],
    inStockOnly: false,
    verified: false,
  });

  const [expandedFilter, setExpandedFilter] = useState<string | null>(null);

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const toggleCategory = (category: string): void => {
    updateFilters({
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    });
  };

  const toggleColor = (color: string): void => {
    updateFilters({
      colors: filters.colors.includes(color)
        ? filters.colors.filter((c) => c !== color)
        : [...filters.colors, color],
    });
  };

  const toggleRating = (rating: number): void => {
    updateFilters({
      ratings: filters.ratings.includes(rating)
        ? filters.ratings.filter((r) => r !== rating)
        : [...filters.ratings, rating],
    });
  };

  const activeFilterCount =
    filters.categories.length +
    filters.colors.length +
    filters.ratings.length +
    (filters.inStockOnly ? 1 : 0) +
    (filters.verified ? 1 : 0);

  return (
    <div className="w-full space-y-4">
      {/* Header with Clear Button */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#8451E1]" />
          <h3 className="text-sm font-semibold text-white">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="inline-flex items-center justify-center w-6 h-6 ml-1 text-xs font-bold text-white bg-gradient-to-r from-[#8451E1] to-[#5C2EAF] rounded-full animate-pulse">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={() => {
              setFilters({
                categories: [],
                priceRange: [priceMin, priceMax],
                ratings: [],
                colors: [],
                inStockOnly: false,
                verified: false,
              });
              onClearAll?.();
            }}
            className="text-xs font-medium text-[#8451E1] hover:text-[#a575ff] transition-colors flex items-center gap-1"
          >
            <X className="w-3.5 h-3.5" />
            Clear
          </button>
        )}
      </div>

      {/* Filter Buttons Grid */}
      <div className="flex flex-wrap gap-2">
        {/* Categories Filter Button */}
        <div className="relative">
          <button
            onClick={() =>
              setExpandedFilter(expandedFilter === 'categories' ? null : 'categories')
            }
            className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              filters.categories.length > 0
                ? 'bg-[#8451E1]/20 border-[#8451E1] text-[#8451E1]'
                : 'bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 border-[#8451E1]/30 text-[#acacac] hover:border-[#8451E1] hover:text-[#8451E1]'
            }`}
          >
            <span>👔 Category</span>
            {filters.categories.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-[#8451E1] text-white rounded-full">
                {filters.categories.length}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedFilter === 'categories' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Categories Dropdown */}
          {expandedFilter === 'categories' && (
            <div className="absolute top-full left-0 mt-2 z-50 w-56 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] backdrop-blur-xl border border-[#8451E1]/40 rounded-2xl p-3 shadow-2xl shadow-[#8451E1]/20">
              <div className="space-y-2">
                {categories.map((category) => (
                  <label
                    key={category.value}
                    className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-[#8451E1]/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.categories.includes(category.value)}
                      onChange={() => toggleCategory(category.value)}
                      className="w-4 h-4 rounded border-[#333] bg-[#222] checked:bg-[#8451E1] checked:border-[#8451E1] cursor-pointer accent-[#8451E1]"
                    />
                    <span className="text-[#acacac] text-sm group-hover:text-white transition-colors flex-1">
                      {category.icon && <span className="mr-2">{category.icon}</span>}
                      {category.label}
                    </span>
                    {category.count && (
                      <span className="text-[#666] text-xs font-medium">
                        ({category.count})
                      </span>
                    )}
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Price Filter Button */}
        <div className="relative">
          <button
            onClick={() =>
              setExpandedFilter(expandedFilter === 'price' ? null : 'price')
            }
            className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              filters.priceRange[0] !== priceMin || filters.priceRange[1] !== priceMax
                ? 'bg-[#8451E1]/20 border-[#8451E1] text-[#8451E1]'
                : 'bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 border-[#8451E1]/30 text-[#acacac] hover:border-[#8451E1] hover:text-[#8451E1]'
            }`}
          >
            <span>💵 Price</span>
            {(filters.priceRange[0] !== priceMin || filters.priceRange[1] !== priceMax) && (
              <span className="px-2 py-0.5 text-xs font-bold bg-[#8451E1] text-white rounded-full">
                ₦{Math.round(filters.priceRange[1]).toLocaleString()}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedFilter === 'price' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Price Dropdown */}
          {expandedFilter === 'price' && (
            <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] backdrop-blur-xl border border-[#8451E1]/40 rounded-2xl p-4 shadow-2xl shadow-[#8451E1]/20">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={filters.priceRange[0]}
                    onChange={(e) =>
                      updateFilters({
                        priceRange: [
                          parseInt(e.target.value),
                          filters.priceRange[1],
                        ],
                      })
                    }
                    className="w-1/2 px-3 py-2 bg-[#222] border border-[#333] rounded-lg text-white text-sm focus:border-[#8451E1] outline-none transition-colors"
                    placeholder="Min"
                  />
                  <input
                    type="number"
                    value={filters.priceRange[1]}
                    onChange={(e) =>
                      updateFilters({
                        priceRange: [
                          filters.priceRange[0],
                          parseInt(e.target.value),
                        ],
                      })
                    }
                    className="w-1/2 px-3 py-2 bg-[#222] border border-[#333] rounded-lg text-white text-sm focus:border-[#8451E1] outline-none transition-colors"
                    placeholder="Max"
                  />
                </div>
                <input
                  type="range"
                  min={priceMin}
                  max={priceMax}
                  value={filters.priceRange[1]}
                  onChange={(e) =>
                    updateFilters({
                      priceRange: [filters.priceRange[0], parseInt(e.target.value)],
                    })
                  }
                  className="w-full accent-[#8451E1]"
                />
              </div>
            </div>
          )}
        </div>

        {/* Colors Filter Button */}
        {colors.length > 0 && (
          <div className="relative">
            <button
              onClick={() =>
                setExpandedFilter(expandedFilter === 'colors' ? null : 'colors')
              }
              className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
                filters.colors.length > 0
                  ? 'bg-[#8451E1]/20 border-[#8451E1] text-[#8451E1]'
                  : 'bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 border-[#8451E1]/30 text-[#acacac] hover:border-[#8451E1] hover:text-[#8451E1]'
              }`}
            >
              <span>🎨 Color</span>
              {filters.colors.length > 0 && (
                <span className="px-2 py-0.5 text-xs font-bold bg-[#8451E1] text-white rounded-full">
                  {filters.colors.length}
                </span>
              )}
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  expandedFilter === 'colors' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {/* Colors Dropdown */}
            {expandedFilter === 'colors' && (
              <div className="absolute top-full left-0 mt-2 z-50 w-64 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] backdrop-blur-xl border border-[#8451E1]/40 rounded-2xl p-4 shadow-2xl shadow-[#8451E1]/20">
                <div className="flex flex-wrap gap-2">
                  {colors.map((color) => (
                    <button
                      key={color.value}
                      onClick={() => toggleColor(color.value)}
                      className={`px-3 py-1.5 rounded-lg border-2 transition-all text-xs font-medium ${
                        filters.colors.includes(color.value)
                          ? 'border-[#8451E1] text-[#8451E1]'
                          : 'border-[#333] text-[#acacac] hover:border-[#8451E1]/50'
                      }`}
                      style={{
                        backgroundColor: filters.colors.includes(color.value)
                          ? (color.hex || '#8451E1') + '20'
                          : undefined,
                        borderColor: filters.colors.includes(color.value)
                          ? color.hex || '#8451E1'
                          : '#333',
                      }}
                    >
                      {color.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Rating Filter Button */}
        <div className="relative">
          <button
            onClick={() =>
              setExpandedFilter(expandedFilter === 'ratings' ? null : 'ratings')
            }
            className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
              filters.ratings.length > 0
                ? 'bg-[#8451E1]/20 border-[#8451E1] text-[#8451E1]'
                : 'bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 border-[#8451E1]/30 text-[#acacac] hover:border-[#8451E1] hover:text-[#8451E1]'
            }`}
          >
            <span>⭐ Rating</span>
            {filters.ratings.length > 0 && (
              <span className="px-2 py-0.5 text-xs font-bold bg-[#8451E1] text-white rounded-full">
                {filters.ratings.length}
              </span>
            )}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedFilter === 'ratings' ? 'rotate-180' : ''
              }`}
            />
          </button>

          {/* Ratings Dropdown */}
          {expandedFilter === 'ratings' && (
            <div className="absolute top-full left-0 mt-2 z-50 w-56 bg-gradient-to-br from-[#1a1a2e] to-[#0f0f1a] backdrop-blur-xl border border-[#8451E1]/40 rounded-2xl p-3 shadow-2xl shadow-[#8451E1]/20">
              <div className="space-y-2">
                {[5, 4, 3, 2, 1].map((rating) => (
                  <label
                    key={rating}
                    className="flex items-center gap-3 cursor-pointer group p-2 rounded-lg hover:bg-[#8451E1]/10 transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={filters.ratings.includes(rating)}
                      onChange={() => toggleRating(rating)}
                      className="w-4 h-4 rounded border-[#333] bg-[#222] checked:bg-[#8451E1] checked:border-[#8451E1] cursor-pointer accent-[#8451E1]"
                    />
                    <span className="text-[#acacac] text-sm group-hover:text-white transition-colors flex-1 flex items-center gap-1">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          className={`w-3 h-3 ${
                            i < rating
                              ? 'fill-yellow-400 text-yellow-400'
                              : 'text-gray-600'
                          }`}
                          viewBox="0 0 20 20"
                        >
                          <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                        </svg>
                      ))}
                      <span className="ml-1">{rating}+</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Stock & Verified Toggle Buttons */}
        <button
          onClick={() => updateFilters({ inStockOnly: !filters.inStockOnly })}
          className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
            filters.inStockOnly
              ? 'bg-green-500/20 border-green-500 text-green-400'
              : 'bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 border-[#8451E1]/30 text-[#acacac] hover:border-green-500/50 hover:text-green-400'
          }`}
        >
          <span>📦 Stock</span>
          {filters.inStockOnly && <span className="text-xs font-bold">ON</span>}
        </button>

        <button
          onClick={() => updateFilters({ verified: !filters.verified })}
          className={`px-4 py-2.5 rounded-xl border-2 transition-all font-medium text-sm flex items-center gap-2 whitespace-nowrap ${
            filters.verified
              ? 'bg-blue-500/20 border-blue-500 text-blue-400'
              : 'bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 border-[#8451E1]/30 text-[#acacac] hover:border-blue-500/50 hover:text-blue-400'
          }`}
        >
          <span>✓ Verified</span>
          {filters.verified && <span className="text-xs font-bold">ON</span>}
        </button>
      </div>
    </div>
  );
}