"use client";

import { useState, useMemo } from "react";
import { useListings } from "@/context/ListingsContext";
import ProductCard from "@/components/buyer/ProductCard";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type SortOption = "newest" | "oldest" | "price-low" | "price-high" | "name-az" | "name-za";

const ExploreAllProducts = () => {
  const { listings, loading } = useListings();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const products = listings.filter(listing => listing.type === 'single');

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-az", label: "Name: A-Z" },
    { value: "name-za", label: "Name: Z-A" },
  ];

  const sortedProducts = useMemo(() => {
    const sorted = [...products];
    switch (sortBy) {
      case "newest":
        return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      case "oldest":
        return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      case "price-low":
        return sorted.sort((a, b) => a.price_cents - b.price_cents);
      case "price-high":
        return sorted.sort((a, b) => b.price_cents - a.price_cents);
      case "name-az":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "name-za":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  }, [products, sortBy]);

  const displayedProducts = sortedProducts.slice(0, 8);

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl capitalize font-bold text-white">Explore All</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-[3/4] bg-gray-800 rounded-2xl mb-3" />
              <div className="h-3 bg-gray-800 rounded w-1/2 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-800 rounded w-1/3" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-xl capitalize font-bold text-white">Explore All</h2>
        <Link
          href="/buyer/brands"
          className="text-sm text-[#9872DD] hover:text-[#8451E1] transition-colors flex items-center gap-1"
        >
          See all →
        </Link>
      </div>

      {/* Sort Dropdown */}
      <div className="relative flex justify-end mb-6">
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-[#1A1A1A] hover:bg-[#1f1f1f] rounded-lg transition-colors text-gray-300 text-sm"
        >
          <span>
            Sort by:{" "}
            <span className="text-white">
              {sortOptions.find((o) => o.value === sortBy)?.label}
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${showSortMenu ? "rotate-180" : ""
              }`}
          />
        </button>

        {showSortMenu && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-[#1A1A1A] border border-gray-800 rounded-lg shadow-xl z-10">
            {sortOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                  setShowSortMenu(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${sortBy === option.value
                    ? "bg-[#9872DD] text-white"
                    : "text-gray-300 hover:bg-[#1f1f1f]"
                  }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
        {displayedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default ExploreAllProducts;
