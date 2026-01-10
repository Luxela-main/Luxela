

"use client";

import { useListings } from "@/context/ListingsContext";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";


type ScrollDirection = "left" | "right";

const FeaturedCollection = () => {
  const { listings, loading } = useListings();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const collections = listings.filter(listing => listing.type === 'collection');

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
  }, [collections]);

  const scroll = (direction: ScrollDirection) => {
    if (carouselRef.current) {
      const scrollAmount = 300;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const getBadgeText = (collection: any) => {
    if (collection.limited_edition_badge === 'show_badge') return 'Limited Edition';
    const createdDate = new Date(collection.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (createdDate > weekAgo) return 'New Drop';
    return 'Featured Item';
  };

  if (loading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl capitalize font-bold text-white">Featured Collections</h2>
        </div>
        <div className="flex gap-5 overflow-hidden">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="min-w-[280px] animate-pulse">
              <div className="aspect-[3/4] bg-gray-800 rounded-2xl mb-3" />
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="mb-16">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl ml-10 capitalize font-bold text-white">
          Featured Collections
        </h2>
        <div className="flex items-center gap-4">
          <Link
            href="/buyer/brands"
            className=" text-[#9872DD] hover:text-[#8451E1] transition-colors flex items-center gap-1 ml-2"
          >
            See all →
          </Link>
        </div>
      </div>

      <div className="relative">
        <div
          ref={carouselRef}
          className="py-6 flex ml-24 gap-8 overflow-x-auto scrollbar-hide transition-all duration-200"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {collections.map((collection) => {
            const brand = collection.sellers?.seller_business?.[0];
            return (
              <div
                key={collection.id}
                className="group min-w-[320px] flex-shrink-0"
              >
                <Link href={`/buyer/collection/${collection.id}`}>
                  <div className="relative w-[400px] aspect-[5/6] bg-[#161616] rounded-2xl overflow-hidden mb-3 cursor-pointer">
                    <img
                      src={collection.image || '/images/baz1.svg'}
                      alt={collection.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 bg-purple-600 px-8 py-1.5 rounded-3xl">
                      <span className="text-white font-bold uppercase">
                        {getBadgeText(collection)}
                      </span>
                    </div>
                  </div>
                </Link>

                <div className="mt-2 flex flex-col gap-y-3">
                  <h3 className="text-2xl font-semibold text-white capitalize">
                    {collection.title}
                  </h3>


                  <p className="text-xl text-[#8451E1]">{brand?.brand_name || 'Featured Brand'}</p>

                  <Link href={`/buyer/collection/${collection.id}`} className="block w-full">
                    <button className="cursor-pointer flex items-center justify-center gap-x-2 w-full text-xl bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] text-white px-4 py-4 rounded-lg font-semibold hover:from-[#8451E1] hover:via-[#7240D0] hover:to-[#4A1E8F] transition-all duration-300">
                      <span>View Collection</span>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                    </button>

                  </Link>

                </div>
              </div>
            );
          })}
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

export default FeaturedCollection;

