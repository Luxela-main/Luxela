"use client";

import { useState, useMemo } from "react";
import { useListings } from "@/context/ListingsContext";
import { useSearch } from "@/context/SearchContext";
import ProductCard from "@/components/buyer/ProductCard";
import Link from "next/link";
import { ChevronDown, Filter, Grid3x3, List } from "lucide-react";

const CATEGORIES = [
  { label: "All Categories", value: "" },
  { label: "Men Clothing", value: "men_clothing" },
  { label: "Women Clothing", value: "women_clothing" },
  { label: "Men Shoes", value: "men_shoes" },
  { label: "Women Shoes", value: "women_shoes" },
  { label: "Accessories", value: "accessories" },
  { label: "Merchandise", value: "merch" },
  { label: "Others", value: "others" },
];

const SORT_OPTIONS = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Name: A-Z", value: "name-az" },
  { label: "Name: Z-A", value: "name-za" },
];

export default function BrowsePage() {
  const { listings, loading } = useListings();
  const { searchQuery } = useSearch();

  const [selectedCategory, setSelectedCategory] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  // Filter listings based on search and category
  const filteredListings = useMemo(() => {
    let results = listings.filter((listing) => listing.type === "single");

    // Category filter
    if (selectedCategory) {
      results = results.filter((listing) => listing.category === selectedCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter((product) => {
        return (
          product.title?.toLowerCase().includes(query) ||
          product.description?.toLowerCase().includes(query) ||
          product.category?.toLowerCase().includes(query) ||
          product.sellers?.seller_business?.[0]?.brand_name?.toLowerCase().includes(query)
        );
      });
    }

    return results;
  }, [listings, selectedCategory, searchQuery]);

  // Sort listings
  const sortedListings = useMemo(() => {
    const sorted = [...filteredListings];

    switch (sortBy) {
      case "newest":
        return sorted.sort(
          (a, b) =>
            new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      case "price-low":
        return sorted.sort((a, b) => (a.price_cents || 0) - (b.price_cents || 0));
      case "price-high":
        return sorted.sort((a, b) => (b.price_cents || 0) - (a.price_cents || 0));
      case "name-az":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      case "name-za":
        return sorted.sort((a, b) => b.title.localeCompare(a.title));
      default:
        return sorted;
    }
  }, [filteredListings, sortBy]);

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Browse Products</h1>
          <p className="text-gray-400">
            Discover {filteredListings.length} {filteredListings.length === 1 ? "product" : "products"}
          </p>
        </div>

        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 items-center justify-between">
          {/* Category Dropdown */}
          <div className="relative w-full md:w-48">
            <button
              onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white flex items-center justify-between hover:border-[#8451E1]/50 transition-colors"
            >
              <span className="text-sm">
                {CATEGORIES.find((c) => c.value === selectedCategory)?.label || "All Categories"}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showCategoryDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showCategoryDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-lg z-10">
                {CATEGORIES.map((category) => (
                  <button
                    key={category.value}
                    onClick={() => {
                      setSelectedCategory(category.value);
                      setShowCategoryDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#8451E1]/20 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      selectedCategory === category.value
                        ? "bg-[#8451E1]/30 text-[#8451E1]"
                        : "text-gray-300"
                    }`}
                  >
                    {category.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sort Dropdown */}
          <div className="relative w-full md:w-48">
            <button
              onClick={() => setShowSortDropdown(!showSortDropdown)}
              className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#333] rounded-lg text-white flex items-center justify-between hover:border-[#8451E1]/50 transition-colors"
            >
              <span className="text-sm">
                {SORT_OPTIONS.find((s) => s.value === sortBy)?.label || "Sort"}
              </span>
              <ChevronDown
                className={`w-4 h-4 transition-transform ${
                  showSortDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showSortDropdown && (
              <div className="absolute top-full left-0 right-0 mt-2 bg-[#1a1a1a] border border-[#333] rounded-lg shadow-lg z-10">
                {SORT_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setSortBy(option.value);
                      setShowSortDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-[#8451E1]/20 transition-colors first:rounded-t-lg last:rounded-b-lg ${
                      sortBy === option.value
                        ? "bg-[#8451E1]/30 text-[#8451E1]"
                        : "text-gray-300"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-[#8451E1] text-white"
                  : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-[#8451E1]/50"
              }`}
              title="Grid view"
            >
              <Grid3x3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-3 rounded-lg transition-colors ${
                viewMode === "list"
                  ? "bg-[#8451E1] text-white"
                  : "bg-[#1a1a1a] border border-[#333] text-gray-400 hover:border-[#8451E1]/50"
              }`}
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-gray-400">Loading products...</div>
          </div>
        ) : sortedListings.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-400 text-lg mb-2">No products found</p>
            <p className="text-gray-500 text-sm">
              {searchQuery
                ? `Try adjusting your search query or category filters`
                : "Check back soon for new listings"}
            </p>
          </div>
        ) : (
          <>
            {/* Grid View */}
            {viewMode === "grid" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                {sortedListings.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}

            {/* List View */}
            {viewMode === "list" && (
              <div className="space-y-3">
                {sortedListings.map((product) => (
                  <Link
                    key={product.id}
                    href={`/buyer/product/${product.id}`}
                    className="flex items-center gap-4 bg-[#1a1a1a] border border-[#333] rounded-lg p-4 hover:border-[#8451E1]/50 transition-colors group"
                  >
                    {/* Image */}
                    <div className="w-24 h-24 bg-[#222] rounded-lg overflow-hidden flex-shrink-0">
                      {product.image ? (
                        <img
                          src={product.image}
                          alt={product.title}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <div className="text-gray-600">No image</div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-white font-semibold line-clamp-1 group-hover:text-[#8451E1] transition-colors">
                        {product.title}
                      </h3>
                      <p className="text-gray-400 text-sm line-clamp-1">
                        {product.sellers?.seller_business?.[0]?.brand_name || "Luxela"}
                      </p>
                      <p className="text-gray-500 text-xs mt-1 line-clamp-1">
                        {product.category?.replace(/_/g, " ")}
                      </p>
                    </div>

                    {/* Price & Stock */}
                    <div className="text-right flex-shrink-0">
                      <p className="text-[#8451E1] font-bold">
                        ₦{((product.price_cents || 0) / 100).toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {product.quantity_available &&
                        product.quantity_available > 0
                          ? `${product.quantity_available} in stock`
                          : "Out of stock"}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}