'use client';

import { useState } from 'react';
import { ChevronDown, X } from 'lucide-react';

export interface ProductFilters {
  categories: string[];
  priceRange: [number, number];
  ratings: number[];
  colors: string[];
  inStockOnly: boolean;
  verified: boolean;
}

interface ProductFiltersPanelProps {
  onFiltersChange: (filters: ProductFilters) => void;
  availableCategories: Array<{ label: string; value: string; count?: number }>;
  availableColors: Array<{ label: string; value: string; hex?: string }>;
  priceMin?: number;
  priceMax?: number;
  onClearAll?: () => void;
}

export default function ProductFiltersPanel({
  onFiltersChange = () => {},
  availableCategories,
  availableColors = [],
  priceMin = 0,
  priceMax = 10000,
  onClearAll,
}: ProductFiltersPanelProps) {
  const [filters, setFilters] = useState<ProductFilters>({
    categories: [],
    priceRange: [priceMin, priceMax],
    ratings: [],
    colors: [],
    inStockOnly: false,
    verified: false,
  });

  const [expandedSections, setExpandedSections] = useState<string[]>([
    'categories',
    'price',
  ]);

  const toggleSection = (section: string) => {
    setExpandedSections((prev) =>
      prev.includes(section)
        ? prev.filter((s) => s !== section)
        : [...prev, section]
    );
  };

  const updateFilters = (newFilters: Partial<ProductFilters>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFiltersChange(updated);
  };

  const toggleCategory = (category: string) => {
    updateFilters({
      categories: filters.categories.includes(category)
        ? filters.categories.filter((c) => c !== category)
        : [...filters.categories, category],
    });
  };

  const toggleColor = (color: string) => {
    updateFilters({
      colors: filters.colors.includes(color)
        ? filters.colors.filter((c) => c !== color)
        : [...filters.colors, color],
    });
  };

  const toggleRating = (rating: number) => {
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
    <div className="w-full lg:w-72 bg-[#1a1a1a] rounded-xl border border-[#333] p-5 h-fit lg:sticky lg:top-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-white font-semibold">Filters</h2>
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
            className="text-xs text-[#8451E1] hover:text-[#9468F2] transition-colors font-medium"
          >
            Clear ({activeFilterCount})
          </button>
        )}
      </div>

      {/* Category Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('categories')}
          className="w-full flex items-center justify-between mb-3 text-white font-medium text-sm"
        >
          Category
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSections.includes('categories') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.includes('categories') && (
          <div className="space-y-2 pl-2">
            {availableCategories.map((category) => (
              <label
                key={category.value}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category.value)}
                  onChange={() => toggleCategory(category.value)}
                  className="w-4 h-4 rounded border-[#333] bg-[#222] checked:bg-[#8451E1] checked:border-[#8451E1] cursor-pointer"
                />
                <span className="text-[#acacac] text-sm group-hover:text-white transition-colors flex-1">
                  {category.label}
                </span>
                {category.count && (
                  <span className="text-[#666] text-xs">({category.count})</span>
                )}
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('price')}
          className="w-full flex items-center justify-between mb-3 text-white font-medium text-sm"
        >
          Price
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSections.includes('price') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.includes('price') && (
          <div className="space-y-3 pl-2">
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
                className="w-1/2 px-3 py-2 bg-[#222] border border-[#333] rounded text-white text-sm focus:border-[#8451E1] outline-none transition-colors"
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
                className="w-1/2 px-3 py-2 bg-[#222] border border-[#333] rounded text-white text-sm focus:border-[#8451E1] outline-none transition-colors"
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
              className="w-full"
            />
          </div>
        )}
      </div>

      {/* Rating Filter */}
      <div className="mb-6">
        <button
          onClick={() => toggleSection('ratings')}
          className="w-full flex items-center justify-between mb-3 text-white font-medium text-sm"
        >
          Rating
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              expandedSections.includes('ratings') ? 'rotate-180' : ''
            }`}
          />
        </button>

        {expandedSections.includes('ratings') && (
          <div className="space-y-2 pl-2">
            {[5, 4, 3, 2, 1].map((rating) => (
              <label
                key={rating}
                className="flex items-center gap-3 cursor-pointer group"
              >
                <input
                  type="checkbox"
                  checked={filters.ratings.includes(rating)}
                  onChange={() => toggleRating(rating)}
                  className="w-4 h-4 rounded border-[#333] bg-[#222] checked:bg-[#8451E1] checked:border-[#8451E1] cursor-pointer"
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
        )}
      </div>

      {/* Color Filter */}
      {availableColors.length > 0 && (
        <div className="mb-6">
          <button
            onClick={() => toggleSection('colors')}
            className="w-full flex items-center justify-between mb-3 text-white font-medium text-sm"
          >
            Colors
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedSections.includes('colors') ? 'rotate-180' : ''
              }`}
            />
          </button>

          {expandedSections.includes('colors') && (
            <div className="flex flex-wrap gap-2 pl-2">
              {availableColors.map((color) => (
                <button
                  key={color.value}
                  onClick={() => toggleColor(color.value)}
                  className={`px-3 py-1.5 rounded-lg border-2 transition-all text-xs font-medium ${
                    filters.colors.includes(color.value)
                      ? 'border-[#8451E1] bg-[#8451E1]/20 text-[#8451E1]'
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
          )}
        </div>
      )}

      {/* Availability Filter */}
      <div className="mb-6">
        <label className="flex items-center gap-3 cursor-pointer group mb-3">
          <input
            type="checkbox"
            checked={filters.inStockOnly}
            onChange={(e) =>
              updateFilters({ inStockOnly: e.target.checked })
            }
            className="w-4 h-4 rounded border-[#333] bg-[#222] checked:bg-[#8451E1] checked:border-[#8451E1] cursor-pointer"
          />
          <span className="text-[#acacac] text-sm group-hover:text-white transition-colors">
            In Stock Only
          </span>
        </label>
      </div>

      {/* Verified Filter */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <input
            type="checkbox"
            checked={filters.verified}
            onChange={(e) => updateFilters({ verified: e.target.checked })}
            className="w-4 h-4 rounded border-[#333] bg-[#222] checked:bg-[#8451E1] checked:border-[#8451E1] cursor-pointer"
          />
          <span className="text-[#acacac] text-sm group-hover:text-white transition-colors">
            Verified Sellers Only
          </span>
        </label>
      </div>
    </div>
  );
}