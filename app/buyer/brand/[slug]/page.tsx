"use client";

import { use, useState, useMemo } from "react";
import { useListings } from "@/context/ListingsContext";
import ProductCard from "@/components/buyer/ProductCard";
import CollectionCard from "@/components/buyer/CollectionCard";
import { ChevronDown, ChevronRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

type SortOption =
  | "newest"
  | "oldest"
  | "price-low"
  | "price-high"
  | "name-az"
  | "name-za";

export default function BrandPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { listings, loading, error } = useListings();
  const [activeTab, setActiveTab] = useState<"products" | "collections">(
    "products"
  );
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  const brandListings = useMemo(() => {
    return listings.filter((listing) => {
      const business = listing.sellers?.seller_business?.[0];
      const sellerId = listing.seller_id;

      // Check if slug matches the ID
      if (sellerId === slug) return true;

      const businessSlug = business?.brand_name
        ?.toLowerCase()
        .replace(/\s+/g, "-");
      return businessSlug === slug;
    });
  }, [listings, slug]);

  const business = brandListings[0]?.sellers?.seller_business?.[0];
  const products = brandListings.filter((listing) => listing.type === "single");
  const collections = brandListings.filter(
    (listing) => listing.type === "collection"
  );

  const sortItems = (items: any[]) => {
    const sorted = [...items];
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
  };

  const sortedProducts = useMemo(() => sortItems(products), [products, sortBy]);
  const sortedCollections = useMemo(
    () => sortItems(collections),
    [collections, sortBy]
  );

  const sortOptions: { value: SortOption; label: string }[] = [
    { value: "newest", label: "Newest First" },
    { value: "oldest", label: "Oldest First" },
    { value: "price-low", label: "Price: Low to High" },
    { value: "price-high", label: "Price: High to Low" },
    { value: "name-az", label: "Name: A-Z" },
    { value: "name-za", label: "Name: Z-A" },
  ];

  if (loading)
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );

  if (error || !business) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-center">
        <div>
          <p className="text-gray-400 text-lg mb-4">Brand "{slug}" not found</p>
          <Link
            href="/buyer/brands"
            className="px-6 py-2 bg-purple-600 text-white rounded-lg"
          >
            Back to Brands
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen px-6 lg:px-10">
      <header>
        {/* Breadcrumb */}
        <div className="w-fit flex items-center gap-2 my-10 text-sm text-[#858585]">
          <Link href="/buyer/brands" className="hover:text-[#DCDCDC]">
            Brands
          </Link>
          <ChevronRight size={16} />
          <span className="text-[#DCDCDC] capitalize">
            {business?.brand_name?.replace("-", " ")}
          </span>
        </div>

        {/* Hero Section */}
        <div className="relative max-w-[1360px] h-[360px] mx-auto mb-8 rounded-[12px]">
          <Image
            src={business.store_banner}
            width={1360}
            height={360}
            alt="brand-hero"
            className="w-full h-full rounded-[12px] object-cover"
          />

          <Image
            src={business.store_logo}
            width={148}
            height={148}
            alt="brand-logo"
            className="absolute -bottom-14 left-[50%] transform -translate-x-[50%] size-[148px] rounded-full border-4 border-black"
          />
        </div>

        {/* Brand Info */}
        <div className="my-20 max-w-[1280px] mx-auto text-center">
          <h2 className="text-2xl font-bold text-white">
            {business.brand_name}
          </h2>
          <p className="text-xs {#f2f2f2} mt-1">{business.business_type}</p>
          <p className="text-sm text-[#f2f2f2] max-w-[720px] mx-auto mt-4 capitalize">
            {business.store_description ? business.store_description : ""}
          </p>
        </div>
      </header>

      <div className="">
        {/* Tabs Navigation */}
        <div className="flex items-center justify-center gap-6 mb-10">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab("products")}
              className={`px-6 py-3 text-sm font-medium transition-all relative ${
                activeTab === "products"
                  ? "text-[#6B7280] border-b-2 border-[#6B7280]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Explore All
            </button>
            <button
              onClick={() => setActiveTab("collections")}
              className={`px-6 py-3 text-sm font-medium transition-all relative ${
                activeTab === "collections"
                  ? "text-[#D1D5DB] border-b-2 border-[#D1D5DB]"
                  : "text-gray-500 hover:text-gray-300"
              }`}
            >
              Collections
            </button>
          </div>
        </div>

        {/* Sort Dropdown */}
        <div className="relative flex items-center justify-end">
          <button
            onClick={() => setShowSortMenu(!showSortMenu)}
            className="flex items-center gap-2 px-4 py-2 bg-[#161616] hover:bg-[#1f1f1f] rounded-lg transition-colors text-gray-300 text-sm"
          >
            <span>
              Sort By:{" "}
              <span className="text-[#dcdcdc]">
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
            <div className="absolute right-0 mt-2 w-56 bg-[#161616] border border-gray-800 rounded-lg shadow-xl z-10">
              {sortOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setSortBy(option.value);
                    setShowSortMenu(false);
                  }}
                  className={`w-full text-left px-4 py-3 text-sm transition-colors first:rounded-t-lg last:rounded-b-lg ${
                    sortBy === option.value
                      ? "bg-[#8451E1CC] text-[#dcdcdc]"
                      : "text-gray-300 hover:bg-[#1f1f1f]"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Section Title */}
        <div className="mb-6">
          <h2 className="text-[#f2f2f2] text-base">
            {activeTab === "products"
              ? `Made by ${business?.brand_name}`
              : `${business?.brand_name} Collections`}
            <span className="text-[#dcdcdc] text-xs ml-2">
              (
              {activeTab === "products"
                ? sortedProducts.length
                : sortedCollections.length}{" "}
              Items)
            </span>
          </h2>
        </div>

        {/* Content Grid */}
        {activeTab === "products" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {sortedProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {sortedCollections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </div>
        )}

        {/* Empty State */}
        {((activeTab === "products" && sortedProducts.length === 0) ||
          (activeTab === "collections" && sortedCollections.length === 0)) && (
          <div className="text-center py-20">
            <p className="text-base text-[#f2f2f2]">No {activeTab} found</p>
          </div>
        )}
      </div>
    </div>
  );
}