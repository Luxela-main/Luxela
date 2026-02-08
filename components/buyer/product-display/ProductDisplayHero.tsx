'use client';

import { ReactNode } from 'react';
import { Search } from 'lucide-react';

interface ProductDisplayHeroProps {
  title: string;
  description?: string;
  subtitle?: string;
  showSearch?: boolean;
  onSearch?: (query: string) => void;
  children?: ReactNode;
  backgroundGradient?: string;
}

export default function ProductDisplayHero({
  title,
  description,
  subtitle,
  showSearch = false,
  onSearch,
  children,
  backgroundGradient = 'from-[#8451E1]/10 to-[#5C2EAF]/10',
}: ProductDisplayHeroProps) {
  return (
    <div
      className={`bg-gradient-to-r ${backgroundGradient} rounded-2xl p-8 md:p-12 mb-12 relative overflow-hidden`}
    >
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#8451E1]/5 rounded-full blur-3xl -z-10" />

      <div className="max-w-2xl">
        {subtitle && (
          <p className="text-[#8451E1] text-xs uppercase font-bold tracking-widest mb-3">
            {subtitle}
          </p>
        )}

        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 leading-tight">
          {title}
        </h1>

        {description && (
          <p className="text-[#dcdcdc] text-lg mb-6 leading-relaxed">
            {description}
          </p>
        )}

        {showSearch && (
          <div className="relative max-w-md">
            <input
              type="text"
              placeholder="Search products..."
              onChange={(e) => onSearch?.(e.target.value)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-[#acacac] focus:border-[#8451E1] outline-none transition-colors"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#acacac]" />
          </div>
        )}

        {children}
      </div>
    </div>
  );
}