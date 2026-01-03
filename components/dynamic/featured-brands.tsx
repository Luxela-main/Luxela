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
}

const BRANDS: Brand[] = [
  {
    id: "1",
    slug: "baz",
    name: "BAZ",
    description: "We are not singular. Our genetics are only a foundation, not a full identity. We grow, learn, forget, give, and take—changing every day. Our individuality is ever-evolving.",
    image:
      "/images/baz1.svg",
  },
  {
    id: "2",
    slug: "honorah",
    name: "HONORAH",
    description: "HONORAH creates timeless pieces that elevate everyday moments and empower self-expression. Rooted in elegance and simplicity, as you Style Forward.",
    image:
      "/images/hon1.svg",
  },
  {
    id: "3",
    slug: "luxe-co",
    name: "LUXE COLLECTIVE",
    description: "Curating exceptional experiences through premium lifestyle products that speak to the modern connoisseur's refined taste and appreciation for quality.",
    image:
      "/images/baz1.svg",
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
            {/* ...rest of the code... */}
          </div>
        </div>
        {/* ...rest of the code... */}
      </main>
    </div>
  );
};

export default FeaturedBrands;
