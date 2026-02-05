"use client";

import { useState, useMemo } from "react";
import { useListings } from "@/context/ListingsContext";
import ProductCard from "@/components/buyer/ProductCard";
import Link from "next/link";
import { ChevronDown } from "lucide-react";

type SortOption =
  | "newest"
  | "oldest"
  | "price-low"
  | "price-high"
  | "name-az"
  | "name-za";

interface ExploreAllProductsProps {
  searchQuery?: string;
}

const ExploreAllProducts = ({ searchQuery = "" }: ExploreAllProductsProps) => {
  const { listings, loading } = useListings();
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-az", label: "Name: A-Z" },
    { value: "name-za", label: "Name: Z-A" },
  ];

  // Filter products based on search query
  const filteredProducts = useMemo(() => {
    const products = listings.filter((listing) => listing.type === "single");

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return products.filter((product) => {
        // Search by product title
        if (product.title?.toLowerCase().includes(query)) {
          return true;
        }

        // Search by description
        if (product.description?.toLowerCase().includes(query)) {
          return true;
        }

        // Search by category
        if (product.category?.toLowerCase().includes(query)) {
          return true;
        }

        // Search by brand name
        const brandName = product.sellers?.seller_business?.[0]?.brand_name;
        if (brandName?.toLowerCase().includes(query)) {
          return true;
        }

        return false;
      });
    }

    return products;
  }, [listings, searchQuery]);

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "oldest":
        return sorted.sort(
          (a, b) =>
            new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        );
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
  }, [filteredProducts, sortBy]);

  const displayedProducts = sortedProducts.slice(0, 8);

  // Don't render section if search returns no results
  if (searchQuery && filteredProducts.length === 0) {
    return null;
  }

  if (loading) {
    return (
      <section>
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-xl capitalize font-bold text-white">
            Explore All
          </h2>
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
    <section className="relative">
      {/* Background Accents */}
      <div className="absolute -top-10 right-0 w-96 h-96 bg-[#E5E7EB]/5 rounded-full blur-3xl" />
      
      <div className="flex items-center justify-between mb-8 relative z-10">
        <h2 className="text-[18px] lg:text-xl capitalize font-semibold text-white relative pb-3">
          {searchQuery ? (
            <>
              <span className="text-sm text-[#dcdcdc] font-medium">
                {" "}
                Products ({filteredProducts.length})
              </span>
            </>
          ) : (
            <span className="">
              Explore All
              <span className="absolute bottom-0 left-0 w-20 h-0.5 bg-gradient-to-r from-[#9CA3AF] to-[#D1D5DB] rounded-full"></span>
            </span>
          )}
        </h2>
        <Link
          href="/buyer/brands"
          className="text-sm text-[#8451E1] hover:text-[#9468F2] transition-colors flex items-center gap-1 font-medium"
        >
          See all →
        </Link>
      </div>

      {/* Sort Dropdown - Enhanced */}
      <div className="relative flex justify-end mb-6">
        <button
          onClick={() => setShowSortMenu(!showSortMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-[#161616] border-2 border-[#9CA3AF]/30 hover:border-[#9CA3AF]/60 rounded-lg transition-all text-gray-300 text-sm hover:bg-[#1f1f1f]"
        >
          <span>
            Sort by:{" "}
            <span className="text-[#9CA3AF] font-medium">
              {sortOptions.find((o) => o.value === sortBy)?.label}
            </span>
          </span>
          <ChevronDown
            className={`w-4 h-4 transition-transform ${
              showSortMenu ? "rotate-180" : ""
            }`}
          />
        </button>

        {showSortMenu && (
          <div className="absolute right-0 top-full mt-2 w-56 bg-[#161616] border-2 border-[#9CA3AF]/30 rounded-lg shadow-xl z-10 overflow-hidden">
            {sortOptions.map((option, index) => (
              <button
                key={option.value}
                onClick={() => {
                  setSortBy(option.value);
                  setShowSortMenu(false);
                }}
                className={`w-full text-left px-4 py-3 text-sm transition-all ${
                  sortBy === option.value
                    ? "bg-gradient-to-r from-[#8451E1] to-[#7240D0] text-white font-medium"
                    : "text-gray-300 hover:bg-[#1f1f1f] hover:text-[#9CA3AF]"
                } ${index !== sortOptions.length - 1 ? "border-b border-[#2B2B2B]" : ""}`}
              >
                {option.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 relative z-5">
        {displayedProducts.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
};

export default ExploreAllProducts;