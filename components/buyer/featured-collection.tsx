"use client";

import { useListings } from "@/context/ListingsContext";
import Link from "next/link";
import { useRef, useState, useEffect } from "react";
import { Button } from "../ui/button";
import { MoveRight } from "lucide-react";

type ScrollDirection = "left" | "right";

const FeaturedCollection = () => {
  const { listings, loading } = useListings();
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const collections = listings.filter(
    (listing) => listing.type === "collection"
  );

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
    if (collection.limited_edition_badge === "show_badge")
      return "Limited Edition";
    const createdDate = new Date(collection.created_at);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    if (createdDate > weekAgo) return "New Drop";
    return "Featured Item";
  };

  if (loading) {
    return (
      <section className="mb-16">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl capitalize font-bold text-white">
            Featured Collections
          </h2>
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
        <h2 className="text-xl capitalize font-bold text-white">
          Featured Collections
        </h2>
        <div className="flex items-center gap-4">
          <button
            onClick={() => scroll("left")}
            disabled={!canScrollLeft}
            className={`p-2 rounded-full transition-all ${
              canScrollLeft
                ? "bg-[#9872DD] text-white hover:bg-[#8451E1]"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            onClick={() => scroll("right")}
            disabled={!canScrollRight}
            className={`p-2 rounded-full transition-all ${
              canScrollRight
                ? "bg-[#9872DD] text-white hover:bg-[#8451E1]"
                : "bg-gray-800 text-gray-500 cursor-not-allowed"
            }`}
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
          <Link
            href="/buyer/brands"
            className="text-sm text-[#9872DD] hover:text-[#8451E1] transition-colors flex items-center gap-1 ml-2"
          >
            See all →
          </Link>
        </div>
      </div>

      <div className="relative">
        <div
          ref={carouselRef}
          className="py-6 flex gap-5 overflow-x-auto scrollbar-hide transition-all duration-200"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {collections.map((collection) => {
            const brand = collection.sellers?.seller_business?.[0];
            return (
              <Link
                key={collection.id}
                href={`/buyer/collection/${collection.id}`}
                className="group cursor-pointer min-w-[280px] flex-shrink-0"
              >
                <div className="relative aspect-[3/4] bg-[#161616] rounded-2xl overflow-hidden mb-3">
                  <img
                    src={collection.image || "/images/baz1.svg"}
                    alt={collection.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />

                  <div className="absolute top-3 left-3 bg-[#8451E1CC] px-3 py-1.5 rounded-lg">
                    <span className="text-white text-xs font-medium uppercase">
                      {getBadgeText(collection)}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-semibold text-[#dcdcdc] mb-1 capitalize">
                    {collection.title}
                  </h3>
                  <p className="text-sm text-[#8451e1]">
                    {brand?.brand_name || "Featured Brand"}
                  </p>
                  <Button className="w-full mt-4 text-white py-3 px-1.5 font-medium flex items-center justify-between gap-2">
                    View Collection
                    <span className="bg-black p-1.5 rounded">
                      <MoveRight className="w-6 h-6 text-white" />
                    </span>
                  </Button>
                </div>
              </Link>
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
