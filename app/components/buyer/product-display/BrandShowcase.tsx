'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  logo_url?: string;
  description?: string;
  product_count?: number;
}

interface BrandShowcaseProps {
  brands: Brand[];
  title?: string;
  variant?: 'carousel' | 'grid';
}

export function BrandShowcase({
  brands = [],
  title = 'Featured Brands',
  variant = 'carousel',
}: BrandShowcaseProps) {
  if (!brands || brands.length === 0) {
    return null;
  }

  return (
    <div>
      {title && (
        <h3 className="text-xl sm:text-2xl font-semibold text-white mb-6 sm:mb-8">
          {title}
        </h3>
      )}
      
      {variant === 'carousel' ? (
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-4 sm:gap-6 pb-4">
            {brands.map((brand) => (
              <Link
                key={brand.id}
                href={`/buyer/brands/${brand.id}`}
                className="flex-shrink-0 w-40 sm:w-48"
              >
                <div className="group relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/20 rounded-2xl p-6 sm:p-8 text-center hover:border-[#8451E1]/60 transition-all duration-500 h-40 sm:h-48 flex flex-col items-center justify-center hover:shadow-[0_0_50px_rgba(132,81,225,0.2)]">
                  {brand.logo_url ? (
                    <Image
                      src={brand.logo_url}
                      alt={brand.name}
                      width={80}
                      height={80}
                      className="mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-16 sm:w-20 h-16 sm:h-20 rounded-full bg-[#8451E1]/20 flex items-center justify-center mb-3 sm:mb-4">
                      <span className="text-2xl sm:text-3xl">👜</span>
                    </div>
                  )}
                  <h4 className="text-white font-semibold text-sm sm:text-base mb-1 group-hover:text-[#8451E1] transition-colors line-clamp-2">
                    {brand.name}
                  </h4>
                  {brand.product_count && (
                    <p className="text-[#999] text-xs sm:text-sm">
                      {brand.product_count} products
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {brands.map((brand) => (
            <Link
              key={brand.id}
              href={`/buyer/brands/${brand.id}`}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/20 rounded-2xl p-6 sm:p-8 text-center hover:border-[#8451E1]/60 transition-all duration-500 hover:shadow-[0_0_50px_rgba(132,81,225,0.2)]">
                {brand.logo_url ? (
                  <Image
                    src={brand.logo_url}
                    alt={brand.name}
                    width={64}
                    height={64}
                    className="mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-12 sm:w-16 h-12 sm:h-16 rounded-full bg-[#8451E1]/20 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <span className="text-xl sm:text-2xl">👜</span>
                  </div>
                )}
                <h4 className="text-white font-semibold text-sm sm:text-base mb-1 group-hover:text-[#8451E1] transition-colors line-clamp-2">
                  {brand.name}
                </h4>
                {brand.product_count && (
                  <p className="text-[#999] text-xs sm:text-sm">
                    {brand.product_count} products
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}