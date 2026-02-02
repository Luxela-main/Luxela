"use client";

import { useListings } from "@/context/ListingsContext";
import { useSearch } from "@/context/SearchContext";
import { useAuth } from "@/context/AuthContext";
import { useCartState } from "@/modules/cart/context";
import Link from "next/link";
import { useState, useMemo } from "react";
import {
  ChevronRight,
  Images,
  ShoppingCart,
  Loader2,
  Check,
  LogIn,
  Truck,
  Package,
  Palette,
  Zap,
  Filter,
  ArrowUpDown,
} from "lucide-react";
import { toastSvc } from "@/services/toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface SortOption {
  label: string;
  value: "newest" | "price-low" | "price-high" | "popular";
}

const SORT_OPTIONS: SortOption[] = [
  { label: "Newest", value: "newest" },
  { label: "Price: Low to High", value: "price-low" },
  { label: "Price: High to Low", value: "price-high" },
  { label: "Most Popular", value: "popular" },
];

function ProductCard({
  item,
  collectionId,
  collectionTitle,
  brandName,
  productId,
  shippingInfo,
}: {
  item: any;
  collectionId: string;
  collectionTitle: string;
  brandName?: string;
  productId?: string;
  shippingInfo?: { domestic?: string; international?: string };
}) {
  const { user } = useAuth();
  const { addToCart } = useCartState();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    const targetId = productId || item.id;
    if (!targetId || isAdding) return;

    setIsAdding(true);
    try {
      await addToCart(targetId, 1);
      setAdded(true);
      toastSvc.success(`${item.title} added to cart`);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      toastSvc.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  let colors: Array<{ colorName: string; colorHex: string }> = [];
  try {
    colors = item.colors_available ? JSON.parse(item.colors_available) : [];
  } catch (e) {}

  let sizes: string[] = [];
  try {
    sizes = item.sizes ? JSON.parse(item.sizes) : [];
  } catch (e) {}

  const isValidImage =
    item.image &&
    item.image.length > 0 &&
    !item.image.includes("placeholder.com");

  const stockStatus =
    item.quantity_available === 0
      ? "Out of Stock"
      : item.quantity_available <= 5
        ? `Only ${item.quantity_available} left`
        : "In Stock";

  const stockColor =
    item.quantity_available === 0
      ? "text-red-500"
      : item.quantity_available <= 5
        ? "text-orange-500"
        : "text-green-500";

  return (
    <>
      <Link href={`/buyer/collection/${collectionId}`}>
        <div className="group bg-[#0f0f0f] rounded-xl overflow-hidden border border-[#222] hover:border-[#8451E1]/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(132,81,225,0.15)] min-w-[280px] w-[280px] flex-shrink-0 flex flex-col h-full">
          {/* Image Section */}
          <div className="h-96 bg-[#1a1a1a] relative overflow-hidden">
            {isValidImage ? (
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Images className="w-12 h-12 text-gray-700" />
              </div>
            )}

            {/* Badges */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
              {item.limited_edition_badge === "show_badge" && (
                <div className="bg-[#8451E1]/90 backdrop-blur-sm px-3 py-1 rounded-lg">
                  <span className="text-white text-[9px] font-bold uppercase tracking-wider">
                    Limited
                  </span>
                </div>
              )}
              <div className={`ml-auto text-xs font-semibold px-2 py-1 rounded-lg ${stockColor} bg-black/40 backdrop-blur-sm border border-white/10`}>
                {stockStatus}
              </div>
            </div>
          </div>

          {/* Content Section */}
          <div className="p-4 bg-black flex flex-col flex-grow">
            {/* Brand */}
            <p className="text-[#999] text-[10px] font-bold uppercase tracking-widest mb-2">
              {brandName || "Luxela Exclusive"}
            </p>

            {/* Title */}
            <h3 className="text-[#f2f2f2] capitalize font-semibold text-sm line-clamp-2 leading-snug mb-3 h-10">
              {item.title}
            </h3>

            {/* Colors & Sizes */}
            <div className="flex items-center gap-3 mb-3 pb-3 border-b border-[#222]">
              {colors.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-[#8451E1]" />
                  <div className="flex -space-x-1">
                    {colors.slice(0, 3).map((color, i) => (
                      <div
                        key={i}
                        className="w-3 h-3 rounded-full border border-[#333] shadow-sm"
                        style={{ backgroundColor: color.colorHex }}
                        title={color.colorName}
                      />
                    ))}
                    {colors.length > 3 && (
                      <div className="w-3 h-3 rounded-full bg-[#333] border border-[#444] flex items-center justify-center text-[6px] text-white font-bold">
                        +
                      </div>
                    )}
                  </div>
                </div>
              )}

              {sizes.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Package className="w-3.5 h-3.5 text-[#8451E1]" />
                  <span className="text-[#acacac] text-[10px]">
                    {sizes.length} sizes
                  </span>
                </div>
              )}
            </div>

            {/* Material & Shipping */}
            {(item.material_composition || shippingInfo?.domestic) && (
              <div className="text-[#666] text-[10px] space-y-1 mb-3">
                {item.material_composition && (
                  <p className="line-clamp-1">📦 {item.material_composition}</p>
                )}
                {shippingInfo?.domestic && (
                  <p className="flex items-center gap-1 line-clamp-1">
                    <Truck className="w-3 h-3 flex-shrink-0" />
                    {shippingInfo.domestic}
                  </p>
                )}
              </div>
            )}

            {/* Price & Action - Fixed at bottom */}
            <div className="flex items-center justify-between mt-auto pt-3 border-t border-[#222]">
              <div>
                <div className="text-[#f2f2f2] text-sm font-bold">
                  {item.currency || "NGN"}{" "}
                  {((item.price_cents || 0) / 100).toLocaleString()}
                </div>
              </div>

              <button
                onClick={handleQuickAdd}
                disabled={isAdding || item.quantity_available === 0}
                className={`
                  relative flex cursor-pointer items-center justify-center p-2.5 rounded-lg transition-all duration-300
                  ${
                    added
                      ? "bg-green-500 scale-105 shadow-lg shadow-green-500/30"
                      : "bg-[#8451E1] hover:bg-[#7240D0] active:scale-95 shadow-lg shadow-[#8451E1]/20"
                  }
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : added ? (
                  <Check className="w-4 h-4 text-white" />
                ) : (
                  <ShoppingCart className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="bg-[#0e0e0e] border-[#222] text-white rounded-2xl">
          <DialogHeader className="items-center">
            <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-purple-500" />
            </div>
            <DialogTitle>Sign in to Shop</DialogTitle>
            <DialogDescription className="text-center mt-6 text-[#acacac]">
              Please sign in to add{" "}
              <span className="text-white font-medium">{item.title}</span> to
              your cart.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() => router.push(`/signin?redirect=/buyer/collections`)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg shadow-purple-500/20"
            >
              Sign In
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function CollectionsPage() {
  const { listings, loading } = useListings();
  const { searchQuery } = useSearch();
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "popular">("newest");
  const [showFilters, setShowFilters] = useState(false);

  // Filter collections by search query
  const filteredCollections = useMemo(() => {
    const collections = listings.filter(
      (listing) => listing.type === "collection"
    );

    if (!searchQuery.trim()) {
      return collections;
    }

    const query = searchQuery.toLowerCase();
    return collections.filter((collection) => {
      // Search by collection title
      if (collection.title?.toLowerCase().includes(query)) {
        return true;
      }

      // Search by brand name
      const brandName = collection.sellers?.seller_business?.[0]?.brand_name;
      if (brandName?.toLowerCase().includes(query)) {
        return true;
      }

      // Search by items within the collection
      let items: any[] = [];
      try {
        items = collection.items_json
          ? Array.isArray(collection.items_json)
            ? collection.items_json
            : JSON.parse(collection.items_json)
          : [];
      } catch (e) {}

      return items.some(
        (item) =>
          item.title?.toLowerCase().includes(query) ||
          item.description?.toLowerCase().includes(query)
      );
    });
  }, [listings, searchQuery]);

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading collections...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-black min-h-screen py-12 mt-8">
      {/* Header Section */}
      <div className="px-6 mb-12">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-2">
            Collections
          </h1>
          <p className="text-[#acacac] text-lg">
            Curated collections from top brands and sellers
          </p>
          <p className="text-[#666] text-sm mt-2">
            {filteredCollections.length}{" "}
            {filteredCollections.length === 1 ? "collection" : "collections"}{" "}
            available
          </p>
        </div>
      </div>

      {/* No Results State */}
      {filteredCollections.length === 0 && searchQuery && (
        <div className="px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center py-12">
              <Images className="w-12 h-12 text-[#333] mx-auto mb-4" />
              <p className="text-[#acacac] text-lg font-medium mb-2">
                No collections found
              </p>
              <p className="text-[#666] text-sm">
                Try searching for collection names, brand names, or product types
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Collections List */}
      {filteredCollections.length > 0 && (
        <div className="px-6">
          <div className="max-w-7xl mx-auto">
            {filteredCollections.map((collection) => {
              let items: any[] = [];
              try {
                items = collection.items_json
                  ? Array.isArray(collection.items_json)
                    ? collection.items_json
                    : JSON.parse(collection.items_json)
                  : [];
              } catch (e) {
                // Silently handle parsing error
              }

              if (items.length === 0) return null;
              const business = collection.sellers?.seller_business?.[0];

              const shippingInfo = {
                domestic: collection.eta_domestic || undefined,
                international: collection.eta_international || undefined,
              };

              return (
                <div key={collection.id} className="mb-16">
                  {/* Collection Header */}
                  <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#222]">
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-2xl md:text-3xl font-bold text-white capitalize">
                          {collection.title}
                        </h2>
                        {collection.limited_edition_badge === "show_badge" && (
                          <div className="bg-[#8451E1] px-3 py-1 rounded-lg">
                            <span className="text-white text-[10px] font-bold uppercase tracking-wider">
                              Limited
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="text-[#8451E1] text-sm font-medium">
                        {business?.brand_name || "Luxela"}
                      </p>
                      {collection.description && (
                        <p className="text-[#acacac] text-sm mt-2 max-w-2xl">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-3 text-xs text-[#666]">
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5 text-[#8451E1]" />
                          {items.length} items
                        </span>
                        {collection.release_duration && (
                          <span className="flex items-center gap-1">
                            <Zap className="w-3.5 h-3.5 text-[#8451E1]" />
                            {collection.release_duration}
                          </span>
                        )}
                      </div>
                    </div>
                    <Link
                      href={`/buyer/collection/${collection.id}`}
                      className="hidden md:flex items-center gap-2 text-[#8451E1] font-semibold hover:text-purple-400 transition-colors group"
                    >
                      View all
                      <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>

                  {/* Products Grid/Carousel */}
                  <div className="overflow-x-auto scrollbar-hide -mx-6 px-6">
                    <div className="flex gap-5">
                      {items.slice(0, 6).map((item, index) => (
                        <ProductCard
                          key={`${collection.id}-${index}`}
                          item={item}
                          collectionId={collection.id}
                          collectionTitle={collection.title}
                          brandName={business?.brand_name}
                          productId={collection.product_id || undefined}
                          shippingInfo={shippingInfo}
                        />
                      ))}
                      {items.length > 6 && (
                        <Link
                          href={`/buyer/collection/${collection.id}`}
                          className="flex-shrink-0 w-[280px] bg-[#0f0f0f] rounded-xl border-2 border-dashed border-[#333] hover:border-[#8451E1]/50 transition-colors flex items-center justify-center min-h-96 group"
                        >
                          <div className="text-center">
                            <ChevronRight className="w-8 h-8 text-[#666] mx-auto mb-2 group-hover:text-[#8451E1] transition-colors" />
                            <p className="text-[#acacac] font-medium">
                              View {items.length - 6} more
                            </p>
                          </div>
                        </Link>
                      )}
                    </div>
                  </div>

                  <div className="md:hidden mt-4">
                    <Link
                      href={`/buyer/collection/${collection.id}`}
                      className="inline-flex items-center gap-2 text-[#8451E1] font-semibold hover:text-purple-400 transition-colors"
                    >
                      View all
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}