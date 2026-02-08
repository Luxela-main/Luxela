'use client';

import Link from 'next/link';
import { Listing } from '@/types/listing';
import { Star, ShoppingCart, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/button';

interface FeaturedProductBannerProps {
  product: Listing;
  title?: string;
  description?: string;
}

export default function FeaturedProductBanner({
  product,
  title = 'Featured Product of the Week',
  description,
}: FeaturedProductBannerProps) {
  const business = product.sellers?.seller_business?.[0];

  return (
    <div className="relative rounded-2xl overflow-hidden mb-12">
      {/* Background Image */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${product.image})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/60 to-transparent" />
      </div>

      {/* Content */}
      <div className="relative z-10 px-6 md:px-12 py-12 md:py-16 grid md:grid-cols-2 gap-8">
        {/* Left Side - Text */}
        <div className="flex flex-col justify-center">
          <span className="text-[#8451E1] text-xs uppercase font-bold tracking-widest mb-3">
            {title}
          </span>

          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 capitalize leading-tight">
            {product.title}
          </h2>

          {description || product.description ? (
            <p className="text-[#dcdcdc] text-base mb-6 leading-relaxed">
              {description || product.description}
            </p>
          ) : null}

          {/* Stats */}
          <div className="flex items-center gap-6 mb-8 flex-wrap">
            {product.rating && (
              <div className="flex items-center gap-2">
                <div className="flex gap-0.5">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-4 h-4 ${
                        i < Math.round(product.rating || 0)
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-600'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-[#acacac] text-sm">
                  {product.rating.toFixed(1)} ({product.review_count || 0})
                </span>
              </div>
            )}

            {product.sales_count && (
              <div className="text-[#acacac] text-sm">
                <span className="text-white font-semibold">
                  {product.sales_count}
                </span>{' '}
                sold
              </div>
            )}

            {product.quantity_available && product.quantity_available > 0 && (
              <div className="text-[#acacac] text-sm">
                <span className="text-white font-semibold">
                  {product.quantity_available}
                </span>{' '}
                in stock
              </div>
            )}
          </div>

          {/* Price */}
          <div className="mb-8">
            <p className="text-[#acacac] text-sm uppercase tracking-wider mb-2">
              Price
            </p>
            <div className="flex items-center gap-3">
              <span className="text-4xl font-bold text-[#8451E1]">
                {product.currency}{' '}
                {((product.price_cents || 0) / 100).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Brand */}
          {business && (
            <p className="text-[#acacac] text-sm mb-8">
              by{' '}
              <span className="text-white font-semibold">
                {business.brand_name}
              </span>
            </p>
          )}

          {/* CTA Buttons */}
          <div className="flex items-center gap-3 flex-wrap">
            <Link href={`/buyer/product/${product.id}`} className="flex-1 md:flex-none">
              <Button className="w-full md:w-auto text-white py-3 px-8 font-medium flex items-center justify-center gap-2 bg-gradient-to-r from-[#8451E1] to-[#5C2EAF] hover:shadow-lg hover:shadow-[#8451E1]/50 transition-all transform hover:translate-x-1">
                <ShoppingCart className="w-5 h-5" />
                Shop Now
              </Button>
            </Link>

            <Link
              href={`/buyer/product/${product.id}`}
              className="px-8 py-3 rounded-lg border border-[#8451E1] text-[#8451E1] hover:bg-[#8451E1]/10 font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
            >
              Learn More
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Right Side - Image */}
        <div className="hidden md:flex items-center justify-end">
          {product.image && (
            <img
              src={product.image}
              alt={product.title}
              className="w-full h-96 object-contain drop-shadow-2xl transform hover:scale-105 transition-transform duration-300"
            />
          )}
        </div>
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-[#8451E1]/10 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-[#5C2EAF]/10 rounded-full blur-3xl -z-10" />
    </div>
  );
}