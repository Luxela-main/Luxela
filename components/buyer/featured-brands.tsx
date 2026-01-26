"use client";

import { useListings } from "@/context/ListingsContext";
import Link from "next/link";
import { useRef, useState, useEffect, useMemo } from "react";
import { Button } from "../ui/button";

type ScrollDirection = "left" | "right";

interface FeaturedBrandsProps {
  searchQuery?: string;
}

const FeaturedBrands = ({ searchQuery = '' }: FeaturedBrandsProps) => {
  const { listings, loading } = useListings();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Filter brands based on search query
  const brands = useMemo(() => {
    const brandMap = listings.reduce((acc, listing) => {
      const business = listing.sellers?.seller_business?.[0];
      if (business && !acc.find((b: any) => b.brand_name === business.brand_name)) {
        acc.push({
          ...business,
          slug: business.brand_name.toLowerCase().replace(/\s+/g, '-')
        });
      }
      return acc;
    }, [] as any[]);

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return brandMap.filter(brand => 
        brand.brand_name?.toLowerCase().includes(query) ||
        brand.store_description?.toLowerCase().includes(query)
      );
    }

    return brandMap;
  }, [listings, searchQuery]);

  const checkScrollButtons = () => {
    if (carouselRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = carouselRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScrollButtons();
    const carousel = carouselRef.current;
    if (carousel) {
      carousel.addEventListener("scroll", checkScrollButtons);
      return () => carousel.removeEventListener("scroll", checkScrollButtons);
    }
  }, [brands]);

  const scroll = (direction: ScrollDirection) => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current.clientWidth * 0.8;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  // Don't render section if search returns no results
  if (searchQuery && brands.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl capitalize font-medium text-white">Featured Brands</h2>
        </div>
        <div className="flex gap-6 overflow-hidden">
          {[1, 2, 3].map((i) => (
            <div key={i} className="min-w-[320px] md:min-w-[480px] lg:min-w-[600px] bg-[#161616] rounded-[20px] p-8 animate-pulse">
              <div className="flex flex-col md:flex-row gap-6">
                <div className="flex-1 space-y-4">
                  <div className="h-6 bg-gray-800 rounded w-1/3" />
                  <div className="h-4 bg-gray-800 rounded" />
                  <div className="h-4 bg-gray-800 rounded w-5/6" />
                  <div className="h-10 bg-gray-800 rounded w-1/2 mt-6" />
                </div>
                <div className="flex-1 h-[250px] md:h-[300px] bg-gray-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-8">
      <h2 className="text-[18px] lg:text-xl capitalize font-medium text-white">
  {searchQuery ? (
    <span className="text-sm text-[#dcdcdc] font-medium">
      Brands ({brands.length})
    </span>
  ) : (
    "Featured Brands"
  )}
</h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all ${
              canScrollLeft
                ? "bg-[#8451e1] text-white hover:bg-[#8451E1]"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all ${
              canScrollRight
                ? "bg-[#8451e1] text-white hover:bg-[#8451E1]"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
          <Link
            href="/buyer/brands"
            className="text-sm text-[#8451E1] hover:text-[#8451E1] transition-colors flex items-center gap-1 ml-2"
          >
            See all →
          </Link>
        </div>
      </div>

      <div className="relative">
        <div
          ref={carouselRef}
          className="py-6 flex gap-6 overflow-x-auto scrollbar-hide transition-all duration-200"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {brands.map((brand) => (
            <div
              key={brand.brand_name}
              className="min-w-[320px] md:min-w-[480px] lg:min-w-[600px] bg-[#161616] rounded-[20px] p-8 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col md:flex-row gap-6"
            >
              <div className="flex-1 py-8 flex flex-col justify-between">
                <div>
                  <h3 className="text-white font-medium text-xl mb-3">
                    {brand.brand_name}
                  </h3>
                  <p className="text-[#DCDCDC] text-sm">
                    {brand.store_description || 'Discover our unique collection of premium products.'}
                  </p>
                </div>

                <Link href={`/buyer/brand/${brand.slug}`} prefetch={true}>
                  <Button className="cursor-pointer w-full md:max-w-[230px] mt-6 py-5 self-start text-white text-sm px-8 shadow-lg hover:shadow-xl">
                    Shop Now
                  </Button>
                </Link>
              </div>

              <div className="flex-1 min-h-[250px] md:min-h-[300px] relative overflow-hidden rounded-lg">
                <img
                  src={brand.store_logo}
                  alt={`${brand.brand_name} brand showcase`}
                  className="absolute inset-0 w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
              </div>
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

export default FeaturedBrands;

