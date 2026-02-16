"use client";

import { use, useState, useMemo } from "react";
import { ProductDisplayGrid, CollectionShowcase } from "@/components/buyer/product-display";
import { ChevronDown, ChevronRight, Loader2, Package, TrendingUp, AlertCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { trpc } from "@/app/_trpc/client";

type SortOption =
  | "newest"
  | "oldest"
  | "price-low"
  | "price-high"
  | "name-az"
  | "name-za";

export default function BrandPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ sellerId?: string }>;
}) {
  const { id } = use(params);
  const { sellerId } = use(searchParams);
  console.log('[BrandPage] Rendering with id:', id, 'sellerId:', sellerId);
  const [activeTab, setActiveTab] = useState<"products" | "collections">(

    "products"
  );
  const [sortBy, setSortBy] = useState<SortOption>("newest");
  const [showSortMenu, setShowSortMenu] = useState(false);

  // Determine if the ID is a UUID or a slug
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  const isUUID = uuidRegex.test(id);
  // Convert empty string sellerId to undefined for proper query handling
  const normalizedSellerId = sellerId && sellerId.trim() ? sellerId : undefined;
  const useSellerIdLookup = normalizedSellerId && !isUUID;
  console.log('[BrandPage] UUID check:', { id, isUUID, useSellerIdLookup, sellerId, normalizedSellerId });

  // Fetch brand by ID using tRPC (if ID is UUID)
  const { data: brandDataById, isLoading: isBrandLoadingById, error: brandErrorById } = trpc.brands.getBrandById.useQuery(
    { brandId: id },
    { enabled: !!id && isUUID }
  );

  // Fetch brand by slug using tRPC (if ID is not UUID)
  const { data: brandDataBySlug, isLoading: isBrandLoadingBySlug, error: brandErrorBySlug } = trpc.brands.getBrandBySlug.useQuery(
    { slug: id, sellerId: normalizedSellerId },
    { enabled: Boolean(id && !isUUID && !useSellerIdLookup) }
  );

  // Fetch brand by seller ID as fallback
  const { data: brandDataBySellerId, isLoading: isBrandLoadingBySellerId, error: brandErrorBySellerId } = trpc.brands.getBrandBySellerId.useQuery(
    { sellerId: normalizedSellerId! },
    { enabled: Boolean(normalizedSellerId && useSellerIdLookup) }
  );


  // Use whichever query succeeded (prioritize seller ID lookup if enabled)
  const brandData = useSellerIdLookup ? brandDataBySellerId : (isUUID ? brandDataById : brandDataBySlug);
  const isBrandLoading = useSellerIdLookup ? isBrandLoadingBySellerId : (isUUID ? isBrandLoadingById : isBrandLoadingBySlug);
  const brandError = useSellerIdLookup ? brandErrorBySellerId : (isUUID ? brandErrorById : brandErrorBySlug);
  
  console.log('[BrandPage] Brand query state:', {
    isUUID,
    useSellerIdLookup,
    isBrandLoading,
    hasError: !!brandError,
    errorMessage: brandError?.message,
    brandData: brandData ? 'exists' : 'null',
  });

  // Extract brand from the response
  // The server returns { brand: {...} }, so we extract it from that structure
  const brand = brandData?.brand;
  console.log('[BrandPage] Brand object:', {
    hasBrand: !!brand,
    brandId: brand?.id,
    brandName: brand?.brandName || brand?.name,
    brandSlug: brand?.slug,
    hasImage: !!brand?.storeLogo,
    fullBrand: JSON.stringify(brand),
  });

  // Fetch brand listings directly using the dedicated endpoint
  const { data: listingsData, isLoading: isListingsLoading } = trpc.brands.getBrandListings.useQuery(
    { brandId: brand?.id || "", page: 1, limit: 100 },
    { enabled: !!brand?.id }
  );

  const brandListings = listingsData?.listings || [];
  console.log('[BrandPage] Listings query:', { listingsCount: brandListings.length, total: listingsData?.total });

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

  if (isBrandLoading || isListingsLoading) {
    console.log('[BrandPage] Loading...');
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading brand...</p>
        </div>
      </div>
    );
  }

  if (brandError || !brand) {
    console.error('[BrandPage] Brand not found or error:', {
      error: brandError,
      errorMessage: brandError?.message || 'No error message',
      brandExists: !!brand,
      isUUID,
      useSellerIdLookup,
      queryUsed: useSellerIdLookup ? 'getBrandBySellerId' : (isUUID ? 'getBrandById' : 'getBrandBySlug'),
      attemptedId: id,
      attemptedSellerId: sellerId,
    });
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-center">
        <div>
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-4">Brand not found</p>
          {brandError && (
            <p className="text-red-400 text-sm mb-4">{brandError.message || 'Unknown error'}</p>
          )}
          <Link
            href="/buyer/brands"
            className="px-6 py-2 bg-[#8451E1] text-white rounded-lg hover:bg-[#7240D0] transition-colors"
          >
            Back to Brands
          </Link>
        </div>
      </div>
    );
  }

  console.log('[BrandPage] Rendering brand details successfully');

  return (
    <div className="bg-black min-h-screen">
      {/* Sticky Header */}
      <div className="px-6 lg:px-10 pt-6 pb-4 sticky top-0 bg-black/95 backdrop-blur-sm border-b border-[#222] z-40">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center gap-2 text-sm text-[#acacac]">
            <Link href="/buyer/brands" className="hover:text-white transition-colors">
              Brands
            </Link>
            <ChevronRight size={16} />
            <span className="text-[#f2f2f2] font-medium capitalize">
              {(brand.brandName || brand.name)?.replace("-", " ")}
            </span>
          </div>
        </div>
      </div>

      {/* Hero Section with Gradient */}
      <div className="relative h-96 md:h-[500px] overflow-hidden bg-gradient-to-b from-[#161616] via-[#0a0a0a] to-black">
        {/* Background Effects */}
        <div className="absolute inset-0">
          {brand.storeBanner ? (
            <div className="absolute inset-0 opacity-30">
              <Image
                src={brand.storeBanner}
                fill
                alt="brand-hero"
                className="object-cover"
              />
            </div>
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-[#8451E1]/20 via-transparent to-[#5C2EAF]/20" />
        </div>

        {/* Hero Content */}
        <div className="relative h-full flex flex-col items-center justify-center px-6 text-center">
          {brand.storeLogo ? (
            <div className="mb-8 relative">
              <div className="absolute inset-0 bg-[#8451E1] opacity-10 rounded-2xl blur-2xl" />
              <Image
                src={brand.storeLogo}
                width={120}
                height={120}
                alt="brand-logo"
                className="relative w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 border-[#8451E1] object-cover shadow-2xl shadow-[#8451E1]/20"
              />
            </div>
          ) : null}

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 tracking-tight">
            {brand.brandName || brand.name}
          </h1>
          {brand.storeDescription && (
            <p className="text-[#acacac] text-lg max-w-2xl leading-relaxed">
              {brand.storeDescription}
            </p>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-6 lg:px-10">
        <div className="max-w-7xl mx-auto">
          {/* Brand Statistics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12 -mt-12 relative z-10">
            <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-6 backdrop-blur-sm hover:border-[#8451E1]/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-[#8451E1]" />
                <span className="text-[#666] text-xs uppercase tracking-wider">Products</span>
              </div>
              <p className="text-2xl font-bold text-white">{brand.totalProducts}</p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-6 backdrop-blur-sm hover:border-[#8451E1]/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <Package className="w-5 h-5 text-[#8451E1]" />
                <span className="text-[#666] text-xs uppercase tracking-wider">Collections</span>
              </div>
              <p className="text-2xl font-bold text-white">{brand.totalCollections || 0}</p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-6 backdrop-blur-sm hover:border-[#8451E1]/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-[#8451E1]" />
                <span className="text-[#666] text-xs uppercase tracking-wider">Reviews</span>
              </div>
              <p className="text-2xl font-bold text-white">{brand.reviewsCount || 0}</p>
            </div>
            <div className="bg-[#0f0f0f] border border-[#222] rounded-xl p-6 backdrop-blur-sm hover:border-[#8451E1]/50 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-[#8451E1]" />
                <span className="text-[#666] text-xs uppercase tracking-wider">Followers</span>
              </div>
              <p className="text-2xl font-bold text-white">{brand.followersCount}</p>
            </div>
          </div>

          {/* Tabs Navigation */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 md:gap-6 mb-8 pb-6 border-b border-[#222]">
            <h2 className="text-2xl font-bold text-white">
              {activeTab === "products" ? "Products" : "Collections"}
            </h2>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 w-full md:w-auto">
              {/* Tab Buttons */}
              <div className="inline-flex bg-[#0f0f0f] border border-[#222] rounded-lg p-1">
                <button
                  onClick={() => setActiveTab("products")}
                  className={`px-6 py-2.5 text-sm font-semibold rounded transition-all ${
                    activeTab === "products"
                      ? "bg-[#8451E1] text-white shadow-lg shadow-[#8451E1]/20"
                      : "text-[#acacac] hover:text-white"
                  }`}
                >
                  All Products
                </button>
                <button
                  onClick={() => setActiveTab("collections")}
                  className={`px-6 py-2.5 text-sm font-semibold rounded transition-all ${
                    activeTab === "collections"
                      ? "bg-[#8451E1] text-white shadow-lg shadow-[#8451E1]/20"
                      : "text-[#acacac] hover:text-white"
                  }`}
                >
                  Collections
                </button>
              </div>

              {/* Sort Dropdown */}
              <div className="relative w-full sm:w-auto">
                <button
                  onClick={() => setShowSortMenu(!showSortMenu)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-[#0f0f0f] border border-[#222] hover:border-[#8451E1] rounded-lg transition-colors text-[#acacac] text-sm font-medium w-full sm:w-auto justify-between sm:justify-start"
                >
                  <span className="hidden sm:inline">Sort: {sortOptions.find((o) => o.value === sortBy)?.label}</span>
                  <span className="sm:hidden flex-1 text-left">Sort: {sortOptions.find((o) => o.value === sortBy)?.label}</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      showSortMenu ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {showSortMenu && (
                  <div className="absolute left-0 sm:right-0 top-full mt-2 w-full sm:w-64 bg-[#0f0f0f] border border-[#222] rounded-xl shadow-2xl z-50">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setSortBy(option.value);
                          setShowSortMenu(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm transition-colors first:rounded-t-xl last:rounded-b-xl ${
                          sortBy === option.value
                            ? "bg-[#8451E1] text-white font-semibold"
                            : "text-[#acacac] hover:bg-[#1a1a1a]"
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Items Count */}
          <div className="mb-8">
            <p className="text-[#666] text-sm">
              {activeTab === "products"
                ? sortedProducts.length
                : sortedCollections.length}{' '}
              {activeTab === "products" ? "products" : "collections"} found
            </p>
          </div>

          {/* Content Grid */}
          {activeTab === "products" ? (
            <>
              {sortedProducts.length > 0 ? (
                <ProductDisplayGrid products={sortedProducts} />
              ) : (
                <div className="text-center py-20">
                  <Package className="w-12 h-12 text-[#333] mx-auto mb-4" />
                  <p className="text-[#acacac] text-lg font-medium">No products found</p>
                  <p className="text-[#666] text-sm mt-2">Check back soon for new products</p>
                </div>
              )}
            </>
          ) : (
            <>
              {sortedCollections.length > 0 ? (
                <CollectionShowcase collections={sortedCollections} title="" variant="grid" />
              ) : (
                <div className="text-center py-20">
                  <Package className="w-12 h-12 text-[#333] mx-auto mb-4" />
                  <p className="text-[#acacac] text-lg font-medium">No collections found</p>
                  <p className="text-[#666] text-sm mt-2">Check back soon for new collections</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}