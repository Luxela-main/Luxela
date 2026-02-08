'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Listing } from '@/types/listing';
import { ArrowRight, Grid, Star, CheckCircle } from 'lucide-react';
import { Button } from '../../ui/button';

interface EnhancedCollectionCardProps {
  collection: any;
  variant?: 'featured' | 'grid' | 'hero';
}

export default function EnhancedCollectionCard({
  collection,
  variant = 'grid',
}: EnhancedCollectionCardProps) {
  const [imageIndex, setImageIndex] = useState(0);

  let collectionItems: Listing[] = [];
  try {
    collectionItems = collection.items_json
      ? JSON.parse(collection.items_json)
      : [];
  } catch (e) {
    console.error('Error parsing items_json:', e);
  }

  const brand = collection.sellers?.seller_business?.[0];
  const productCount = collectionItems.length;
  const avgRating =
    productCount > 0
      ? (
          collectionItems.reduce((sum, item) => sum + (item.rating || 0), 0) /
          productCount
        ).toFixed(1)
      : 0;

  const getBadgeText = (collection: any) => {
    if (collection.limited_edition_badge === 'show_badge')
      return 'Limited Edition';
    const createdDate = new Date(collection.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (createdDate > weekAgo) return 'New Drop';
    return 'Featured';
  };

  if (variant === 'hero') {
    return (
      <Link href={`/buyer/collection/${collection.id}`} className="block group">
        <div className="relative aspect-video md:aspect-auto md:h-96 rounded-2xl overflow-hidden">
          {/* Background Image */}
          <img
            src={collection.image || '/images/baz1.svg'}
            alt={collection.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent" />

          {/* Content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
            <div className="mb-4">
              <span
                className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest text-white backdrop-blur-md"
                style={{
                  backgroundColor: '#8451E1',
                  boxShadow: '0 0 20px #8451E140',
                }}
              >
                {getBadgeText(collection)}
              </span>
            </div>

            <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 capitalize">
              {collection.title}
            </h2>

            {collection.description && (
              <p className="text-base text-[#dcdcdc] mb-4 line-clamp-2">
                {collection.description}
              </p>
            )}

            <div className="flex items-center gap-4">
              <p className="text-sm text-[#acacac]">
                <span className="font-semibold text-white">{productCount}</span>{' '}
                Products
              </p>
              <p className="text-sm text-[#acacac]">
                by{' '}
                <span className="font-semibold text-white">
                  {brand?.brand_name || 'Featured Brand'}
                </span>
              </p>
            </div>

            <Button className="mt-6 w-full md:w-auto text-white py-3 px-8 font-medium flex items-center gap-2 bg-gradient-to-r from-[#8451E1] to-[#5C2EAF] hover:shadow-lg hover:shadow-[#8451E1]/50 transition-all transform group-hover:translate-x-1">
              Explore Collection
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/buyer/collection/${collection.id}`} className="block group">
      <div className="relative rounded-xl overflow-hidden transition-all duration-300 h-full flex flex-col">
        {/* Image Section */}
        <div className="relative aspect-square md:aspect-video bg-[#1a1a1a] overflow-hidden flex-shrink-0 mb-4">
          <img
            src={collection.image || '/images/baz1.svg'}
            alt={collection.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          />

          {/* Overlay Gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent group-hover:from-black/60 transition-all duration-300" />

          {/* Badge */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#8451E1]/90 backdrop-blur-md">
              <span className="text-white text-xs font-medium uppercase">
                {getBadgeText(collection)}
              </span>
            </div>
            
            {/* Verified Badge */}
            {collection.status === 'approved' && (
              <div className="px-3 py-1.5 rounded-lg bg-[#8451E1] backdrop-blur-md flex items-center gap-1">
                <CheckCircle className="w-3.5 h-3.5 text-white" />
                <span className="text-white text-xs font-medium">Verified</span>
              </div>
            )}
          </div>

          {/* Product Count Overlay */}
          <div className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg bg-black/60 backdrop-blur-md flex items-center gap-1">
            <Grid className="w-3 h-3 text-[#8451E1]" />
            <span className="text-white text-xs font-medium">
              {productCount} items
            </span>
          </div>
        </div>

        {/* Content Section */}
        <div className="flex flex-col flex-1">
          {/* Brand Name */}
          <p className="text-[#acacac] text-[10px] font-medium uppercase tracking-wider mb-2">
            {brand?.brand_name || 'Featured Brand'}
          </p>

          {/* Title */}
          <h3 className="text-[#f2f2f2] capitalize font-semibold text-sm line-clamp-2 leading-snug h-9 mb-2 group-hover:text-[#8451E1] transition-colors">
            {collection.title}
          </h3>

          {/* Description */}
          {collection.description && (
            <p className="text-[#acacac] text-[11px] line-clamp-1 mb-3">
              {collection.description}
            </p>
          )}

          {/* Stats Row */}
          <div className="flex items-center justify-between gap-2 mb-3 text-[11px]">
            <div className="flex items-center gap-1">
              <span className="text-[#acacac]">{productCount} items</span>
            </div>

            {productCount > 0 && (
              <div className="flex items-center gap-1">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-2.5 h-2.5 ${
                        i < Math.round(parseFloat(avgRating as string))
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[#acacac]">({avgRating})</span>
              </div>
            )}
          </div>

          {/* CTA Button */}
          <Button className="w-full text-white py-2 px-3 font-medium text-sm flex items-center justify-center gap-2 bg-gradient-to-b from-[#8451E1] to-[#7240D0] hover:from-[#9468F2] hover:to-[#8451E1] transition-all hover:shadow-lg hover:shadow-[#8451E1]/50 active:scale-95 mt-auto">
            View Collection
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </Link>
  );
}