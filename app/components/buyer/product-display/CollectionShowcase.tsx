'use client';

import Image from 'next/image';
import Link from 'next/link';

interface Collection {
  id: string;
  name: string;
  image_url?: string;
  description?: string;
  product_count?: number;
}

interface CollectionShowcaseProps {
  collections: Collection[];
  title?: string;
  variant?: 'carousel' | 'grid';
}

export function CollectionShowcase({
  collections = [],
  title = 'Featured Collections',
  variant = 'carousel',
}: CollectionShowcaseProps) {
  if (!collections || collections.length === 0) {
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
            {collections.map((collection) => (
              <Link
                key={collection.id}
                href={`/buyer/collections/${collection.id}`}
                className="flex-shrink-0 w-48 sm:w-56"
              >
                <div className="group relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/20 rounded-2xl overflow-hidden hover:border-[#8451E1]/60 transition-all duration-500 h-56 sm:h-64 flex flex-col hover:shadow-[0_0_50px_rgba(132,81,225,0.2)]">
                  <div className="relative w-full h-32 sm:h-40 overflow-hidden">
                    {collection.image_url ? (
                      <Image
                        src={collection.image_url}
                        alt={collection.name}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-[#8451E1]/20 to-[#5C2EAF]/20 flex items-center justify-center">
                        <span className="text-4xl">✨</span>
                      </div>
                    )}
                  </div>
                  <div className="p-4 sm:p-5 flex flex-col justify-between flex-1">
                    <h4 className="text-white font-semibold text-sm sm:text-base mb-1 group-hover:text-[#8451E1] transition-colors line-clamp-2">
                      {collection.name}
                    </h4>
                    {collection.product_count && (
                      <p className="text-[#999] text-xs sm:text-sm">
                        {collection.product_count} items
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 sm:gap-6">
          {collections.map((collection) => (
            <Link
              key={collection.id}
              href={`/buyer/collections/${collection.id}`}
              className="group relative"
            >
              <div className="relative bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/20 rounded-2xl overflow-hidden hover:border-[#8451E1]/60 transition-all duration-500 hover:shadow-[0_0_50px_rgba(132,81,225,0.2)] h-48 sm:h-56 flex flex-col">
                <div className="relative w-full h-24 sm:h-32 overflow-hidden">
                  {collection.image_url ? (
                    <Image
                      src={collection.image_url}
                      alt={collection.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[#8451E1]/20 to-[#5C2EAF]/20 flex items-center justify-center">
                      <span className="text-3xl">✨</span>
                    </div>
                  )}
                </div>
                <div className="p-3 sm:p-4 flex flex-col justify-between flex-1">
                  <h4 className="text-white font-semibold text-xs sm:text-sm mb-1 group-hover:text-[#8451E1] transition-colors line-clamp-2">
                    {collection.name}
                  </h4>
                  {collection.product_count && (
                    <p className="text-[#999] text-xs">
                      {collection.product_count} items
                    </p>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}