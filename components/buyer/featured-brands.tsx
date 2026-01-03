"use client";

import Link from "next/link";
import { useState, useRef, useEffect } from "react";


type ScrollDirection = "left" | "right";


interface Brand {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  // href: string;
}

const BRANDS: Brand[] = [
  {
    id: "1",
    slug: "baz",
    name: "BAZ",
    description: "We are not singular. Our genetics are only a foundation, not a full identity. We grow, learn, forget, give, and take—changing every day. Our individuality is ever-evolving.",
    image:
      "/images/baz1.svg",
    // href: "#",
  },
  {
    id: "2",
    slug: "honorah",
    name: "HONORAH",
    description: "HONORAH creates timeless pieces that elevate everyday moments and empower self-expression. Rooted in elegance and simplicity, as you Style Forward.",
    image:
      "/images/hon1.svg",
    // href: "#",
  },
  {
    id: "3",
    slug: "luxe-co",
    name: "LUXE COLLECTIVE",
    description: "Curating exceptional experiences through premium lifestyle products that speak to the modern connoisseur's refined taste and appreciation for quality.",
    image:
      "/images/baz1.svg",
    // href: "#",
  },
  {
    id: "4",
    slug: "aurora-studio", 
    name: "AURORA STUDIO",
    description: "Where creativity meets craftsmanship. Each piece tells a story of innovation, beauty, and the endless pursuit of artistic excellence.",
    image:
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400&h=300&fit=crop",
  },
];

const FeaturedBrands = () => {
  const carouselRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);

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
      const scrollAmount = carouselRef.current.clientWidth * 0.8;
      carouselRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const handleMouseDown = () => setIsDragging(true);
  const handleMouseUp = () => setIsDragging(false);

  return (
    <div className="mt-16">
      <main className="px-6">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl capitalize font-bold text-white">
            Featured Brands
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

        {/* Carousel Container */}
        <div className="relative">
          <div
            ref={carouselRef}
            className={`py-6 flex gap-6 overflow-x-auto scrollbar-hide transition-all duration-200`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {BRANDS.map((brand, i) => (
              <div
                key={brand.id}
                className="min-w-[320px] md:min-w-[480px] lg:min-w-[600px] bg-[#161616] rounded-[20px] p-8 overflow-hidden shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] flex flex-col md:flex-row gap-6"
              >
                {/* Text Content */}
                <div className="flex-1 py-8 flex flex-col justify-between">
                  <div>
                    <h3 className="text-white font-bold text-xl mb-3">
                      {brand.name}
                    </h3>
                    <p className="text-[#DCDCDC] leading-relaxed text-sm">
                      {brand.description}
                    </p>
                  </div>
                  {/* <button
                    onClick={() => window.open(brand.href, '_blank')}
                    className="cursor-pointer w-full md:max-w-[230px] mt-6 self-start bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] text-white text-sm px-8 py-3 rounded-lg font-semibold hover:from-[#8451E1] hover:via-[#7240D0] hover:to-[#4A1E8F] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
                  >
                    Shop Now
                  </button> */}

                  <Link href={`/buyer/brands/${brand.slug}`} prefetch={true}> 
                    <button className="cursor-pointer w-full md:max-w-[230px] mt-6 self-start bg-gradient-to-b from-[#9872DD] via-[#8451E1] to-[#5C2EAF] text-white text-sm px-8 py-3 rounded-lg font-semibold hover:from-[#8451E1] hover:via-[#7240D0] hover:to-[#4A1E8F] transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5">
                      Shop Now
                    </button>
                  </Link>
                </div>

                {/* Image */}
                <div className="flex-1 min-h-[250px] md:min-h-[300px] relative overflow-hidden">
                  <img
                    src={brand.image}
                    alt={`${brand.name} brand showcase`}
                    className="absolute inset-0 w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                </div>
              </div>
            ))}
          </div>

          {/* Scroll Indicators */}
          {/* <div className="flex justify-center mt-6 gap-2">
            {BRANDS.map((_, index) => (
              <div
                key={index}
                className="w-2 h-2 rounded-full bg-gray-600 hover:bg-[#9872DD] transition-colors cursor-pointer"
              />
            ))}
          </div> */}
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
      </main>
    </div>
  );
};

export default FeaturedBrands;
