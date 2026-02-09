'use client';

import { Button } from '@/components/ui/button';
import { ArrowUpDown, TrendingUp, Clock, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortOption {
  value: string;
  label: string;
  icon: React.ReactNode;
  description?: string;
}

interface CollectionSortProps {
  value: string;
  onChange: (value: string) => void;
  options?: SortOption[];
}

const DEFAULT_SORT_OPTIONS: SortOption[] = [
  {
    value: 'newest',
    label: 'Newest',
    icon: <Clock className="w-4 h-4" />,
    description: 'Most recent first',
  },
  {
    value: 'price-low',
    label: 'Price: Low to High',
    icon: <TrendingUp className="w-4 h-4" />,
    description: 'Lowest price first',
  },
  {
    value: 'price-high',
    label: 'Price: High to Low',
    icon: <TrendingUp className="w-4 h-4 rotate-180" />,
    description: 'Highest price first',
  },
  {
    value: 'popular',
    label: 'Popular',
    icon: <Zap className="w-4 h-4" />,
    description: 'Most viewed',
  },
];

export function CollectionSort({
  value,
  onChange,
  options = DEFAULT_SORT_OPTIONS,
}: CollectionSortProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2 mb-2">
        <ArrowUpDown className="w-4 h-4 text-muted-foreground" />
        <span className="text-sm font-medium text-muted-foreground">Sort by</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => (
          <Button
            key={option.value}
            onClick={() => onChange(option.value)}
            variant={value === option.value ? 'default' : 'outline'}
            size="sm"
            className={cn(
              'flex items-center gap-2 transition-all',
              value === option.value && 'ring-2 ring-primary ring-offset-2'
            )}
            title={option.description}
          >
            {option.icon}
            <span className="hidden sm:inline">{option.label}</span>
            <span className="sm:hidden text-xs">{option.label.split(':')[0]}</span>
          </Button>
        ))}
      </div>
    </div>
  );
}