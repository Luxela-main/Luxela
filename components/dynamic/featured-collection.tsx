"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";

type ScrollDirection = "left" | "right";

type BadgeType =
  | "Limited Edition"
  | "New Drop"
  | "Trending"
  | "Exclusive"
  | string;

interface Collection {
  id: number;
  slug: string;
  collectionSlug: string;
  badge: string;
  title: string;
  brand: string;
  brandSlug: string;
  brandHref: string;
  image: string;
  description: string;
}

const COLLECTIONS: Collection[] = [
  {
    id: 1,
    slug: "wrangler-collection",
    collectionSlug: "wrangler",
    badge: "Limited Edition",
    title: "Wrangler Collection",
    brand: "BAZ Fashion",
    brandSlug: "baz-fashion",
    brandHref: "#",
    image:
      "https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400&h=500&fit=crop",
    description: "Rugged meets refined in this exclusive denim collection",
  },
  {
    id: 2,
    slug: "prime-collection",
    collectionSlug: "prime",
    badge: "New Drop",
    title: "Prime Collection",
    brand: "RIO Jewels",
    brandSlug: "rio-jewels",
    brandHref: "#",
    image:
      "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=500&fit=crop",
    description: "Luxury jewelry pieces that capture timeless elegance",
  },
  {
    id: 3,
    slug: "black-atlas-collection",
    collectionSlug: "black-atlas",
    badge: "Limited Edition",
    title: "The Black Atlas Collection",
    brand: "SHU",
    brandSlug: "shu",
    brandHref: "#",
    image:
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400&h=500&fit=crop",
    description: "Premium footwear crafted for the modern adventurer",
  },
  {
    id: 4,
    slug: "valor-collection",
    collectionSlug: "valor",
    badge: "Trending",
    title: "Valor Collection",
    brand: "BAZ Fashion",
    brandSlug: "baz-fashion",
    brandHref: "#",
    image:
      "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=400&h=500&fit=crop",
    description: "Bold statement pieces for the confident individual",
  },
  {
    id: 5,
    slug: "aurora-series",
    collectionSlug: "aurora",
    badge: "Exclusive",
    title: "Aurora Series",
    brand: "LUXE Co.",
    brandSlug: "luxe-co",
    brandHref: "#",
    image:
      "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=400&h=500&fit=crop",
    description: "Ethereal designs inspired by natural beauty",
  },
];

const getBadgeColor = (badge: BadgeType): string => {
  const colors: Record<string, string> = {
    "Limited Edition": "bg-gradient-to-r from-red-500 to-red-600",
    "New Drop": "bg-gradient-to-r from-green-500 to-green-600",
    Trending: "bg-gradient-to-r from-orange-500 to-orange-600",
    Exclusive: "bg-gradient-to-r from-purple-500 to-purple-600",
  };
  return colors[badge] || "bg-gray-500";
};

const FeaturedCollection = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredId, setHoveredId] = useState<number | null>(null);

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
  }, []);

  const scroll = (direction: ScrollDirection) => {
    if (carouselRef.current) {
      const scrollAmount = carouselRef.current?.offsetWidth
        ? carouselRef.current.offsetWidth * 0.8 // scroll 80% of viewport width
        : 320;

      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  return (
    <div className="mt-16">
      <section className="">
        {/* Header */}
        <div className="md:flex items-center md:justify-between mb-8">
          <div>
            <h2 className="text-xl font-bold text-white mb-1">
              Featured Collections
            </h2>
            <p className="text-gray-400 text-sm">
              Discover our curated selection of premium collections
            </p>
          </div>

          <div className="mt-6 md:mt-0 flex items-center  gap-4">
            <button
              onClick={() => scroll("left")}
              disabled={!canScrollLeft}
              className={`p-2 rounded-full transition-all ${
                canScrollLeft
                  ? "bg-[#8451E1] text-white hover:bg-[#8451E1] shadow-lg"
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
                  ? "bg-[#8451E1] text-white hover:bg-[#8451E1] shadow-lg"
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
          </div>
        </div>
        {/* ...rest of the original FeaturedCollection component code... */}
      </section>
    </div>
  );
};

export default FeaturedCollection;
