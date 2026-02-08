'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

export type SortOption = 'newest' | 'price-low' | 'price-high' | 'name-az' | 'name-za' | 'rating' | 'sales';

interface ProductSortMenuProps {
  onSortChange: (sort: SortOption) => void;
  currentSort?: SortOption;
  showLabel?: boolean;
}

const SORT_OPTIONS: Array<{ label: string; value: SortOption; icon?: string }> = [
  { label: 'Newest', value: 'newest', icon: '⭐' },
  { label: 'Price: Low to High', value: 'price-low', icon: '↑' },
  { label: 'Price: High to Low', value: 'price-high', icon: '↓' },
  { label: 'Name: A-Z', value: 'name-az', icon: '📝' },
  { label: 'Name: Z-A', value: 'name-za', icon: '📝' },
  { label: 'Top Rated', value: 'rating', icon: '⭐' },
  { label: 'Best Sellers', value: 'sales', icon: '🔥' },
];

export default function ProductSortMenu({
  onSortChange = () => {},
  currentSort = 'newest',
  showLabel = true,
}: ProductSortMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const currentLabel = SORT_OPTIONS.find((o) => o.value === currentSort)?.label || 'Sort';

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="px-4 py-2.5 bg-[#1a1a1a] border-l-4 border-l-[#8451E1] rounded-lg text-white flex items-center justify-between hover:bg-[#252525] transition-colors min-w-max"
      >
        {showLabel && <span className="text-sm font-medium">{currentLabel}</span>}
        <ChevronDown
          className={`w-4 h-4 ml-2 transition-transform ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-lg z-20 overflow-hidden">
          {SORT_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onSortChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-4 py-3 text-sm hover:bg-[#8451E1]/20 transition-colors flex items-center gap-2 ${
                currentSort === option.value
                  ? 'bg-[#8451E1]/20 text-[#8451E1]'
                  : 'text-gray-300'
              }`}
            >
              {option.icon && <span className="text-base">{option.icon}</span>}
              {option.label}
              {currentSort === option.value && (
                <div className="ml-auto w-2 h-2 rounded-full bg-[#8451E1]" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}