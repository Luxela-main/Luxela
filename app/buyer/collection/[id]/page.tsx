"use client";

import { use, useMemo, useState } from "react";
import { useListings } from "@/context/ListingsContext";
import { useCartState } from "@/modules/cart/context";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";
import {
  ArrowLeft,
  Images,
  ShoppingCart,
  Package,
  Check,
  Loader2,
  LogIn,
  Truck,
  Palette,
  Heart,
  Share2,
  Star,
  Filter,
  ArrowUpDown,
  Zap,
  AlertCircle,
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
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo/structured-data";
import { SITE } from "@/lib/seo/config";

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getListingById, loading } = useListings();
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest">("newest");
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showSchemas, setShowSchemas] = useState(false);

  if (loading)
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading collection...</p>
        </div>
      </div>
    );

  const collection = getListingById(id);

  if (!collection)
    return (
      <div className="bg-black min-h-screen text-white p-8 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <p className="text-lg font-semibold">Collection not found</p>
          <Link
            href="/buyer/collections"
            className="inline-flex items-center gap-2 text-[#8451E1] mt-4 hover:text-purple-400"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
        </div>
      </div>
    );

  let items: any[] = [];
  try {
    const itemsJsonData = collection.items_json;
    items = itemsJsonData
      ? Array.isArray(itemsJsonData)
        ? itemsJsonData
        : JSON.parse(itemsJsonData)
      : [];
  } catch (e) {
    // Silently handle parsing error
  }

  const business = collection.sellers?.seller_business?.[0];

  // Extract all unique colors from all items
  const allColors = useMemo(() => {
    const colorMap = new Map<string, { colorName: string; colorHex: string }>();
    items.forEach((item) => {
      try {
        const colors = item.colors_available
          ? Array.isArray(item.colors_available)
            ? item.colors_available
            : JSON.parse(item.colors_available)
          : [];
        colors.forEach((color: any) => {
          if (!colorMap.has(color.colorHex)) {
            colorMap.set(color.colorHex, color);
          }
        });
      } catch (e) {}
    });
    return Array.from(colorMap.values());
  }, [items]);

  // Filter and sort items
  const sortedItems = useMemo(() => {
    let filtered = items.filter((item) => {
      if (!filterColor) return true;
      try {
        const colors = item.colors_available
          ? Array.isArray(item.colors_available)
            ? item.colors_available
            : JSON.parse(item.colors_available)
          : [];
        return colors.some((c: any) => c.colorHex === filterColor);
      } catch (e) {
        return true;
      }
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return (a.price_cents || 0) - (b.price_cents || 0);
        case "price-high":
          return (b.price_cents || 0) - (a.price_cents || 0);
        case "newest":
        default:
          return 0;
      }
    });
  }, [items, sortBy, filterColor]);

  const totalPrice = items.reduce((sum, item) => sum + (item.price_cents || 0), 0);
  const avgPrice = items.length > 0 ? totalPrice / items.length / 100 : 0;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE.url },
    { name: "Collections", url: `${SITE.url}/buyer/collections` },
    { name: collection.title || "Collection", url: `${SITE.url}/buyer/collection/${collection.id}` },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbSchema} id="collection-breadcrumb" />
      <div className="bg-black min-h-screen">
      {/* Header with Back Button */}
      <div className="px-6 py-6 border-b border-[#222] sticky top-0 bg-black/95 backdrop-blur-sm z-40">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/buyer/collections"
            className="inline-flex items-center gap-2 text-[#acacac] hover:text-white transition-colors mb-6"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Collections
          </Link>
        </div>
      </div>

      {/* Collection Hero Section */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Collection Image */}
          {collection.image && (
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-12 border border-[#222] shadow-2xl">
              <img
                src={collection.image}
                alt={collection.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
              
              {/* Hero Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[#8451E1] text-sm font-bold uppercase tracking-wider mb-2">
                      {business?.brand_name || "Luxela"}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold text-white capitalize mb-3">
                      {collection.title}
                    </h1>
                    {collection.limited_edition_badge === "show_badge" && (
                      <div className="inline-flex items-center gap-2 bg-[#8451E1] px-4 py-2 rounded-lg">
                        <Zap className="w-4 h-4 text-white" />
                        <span className="text-white text-xs font-bold uppercase tracking-wider">
                          Limited Edition Collection
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-3">
                    <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/10">
                      <Heart className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors backdrop-blur-sm border border-white/10">
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collection Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Description */}
            <div className="md:col-span-2">
              <h2 className="text-lg font-semibold text-white mb-3">
                About This Collection
              </h2>
              {collection.description && (
                <p className="text-[#acacac] leading-relaxed text-sm">
                  {collection.description}
                </p>
              )}
              {collection.supply_capacity && (
                <p className="text-[#666] text-xs mt-4 flex items-center gap-2">
                  <Package className="w-3.5 h-3.5 text-[#8451E1]" />
                  Supply Capacity: {collection.supply_capacity}
                </p>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-[#0f0f0f] rounded-xl border border-[#222] p-6">
              <h3 className="text-sm font-semibold text-white mb-4">
                Collection Stats
              </h3>
              <div className="space-y-4">
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-1">
                    Total Items
                  </p>
                  <p className="text-2xl font-bold text-white">
                    {items.length}
                  </p>
                </div>
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-1">
                    Avg Price
                  </p>
                  <p className="text-2xl font-bold text-[#8451E1]">
                    {collection.currency || "NGN"} {avgPrice.toLocaleString()}
                  </p>
                </div>
                {collection.release_duration && (
                  <div>
                    <p className="text-[#666] text-xs uppercase tracking-wider mb-1">
                      Duration
                    </p>
                    <p className="text-sm text-white font-medium">
                      {collection.release_duration}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-1">
                    Shipping
                  </p>
                  <p className="text-xs text-[#acacac]">
                    {collection.eta_domestic || "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8 pb-6 border-b border-[#222]">
            <h2 className="text-2xl font-bold text-white">
              Items in Collection
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Color Filter */}
              {allColors.length > 0 && (
                <div className="flex items-center gap-2">
                  <Palette className="w-4 h-4 text-[#666]" />
                  <select
                    value={filterColor || ""}
                    onChange={(e) => setFilterColor(e.target.value || null)}
                    className="bg-[#0f0f0f] border border-[#222] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#8451E1] transition-colors"
                  >
                    <option value="">All Colors</option>
                    {allColors.map((color) => (
                      <option key={color.colorHex} value={color.colorHex}>
                        {color.colorName}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Sort */}
              <div className="flex items-center gap-2">
                <ArrowUpDown className="w-4 h-4 text-[#666]" />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "price-low" | "price-high" | "newest"
                    )
                  }
                  className="bg-[#0f0f0f] border border-[#222] text-white text-sm px-3 py-2 rounded-lg focus:outline-none focus:border-[#8451E1] transition-colors"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <span className="text-[#666] text-sm">
                {sortedItems.length} items
              </span>
            </div>
          </div>

          {/* Items Grid */}
          {sortedItems.length === 0 ? (
            <div className="text-center py-12">
              <Images className="w-12 h-12 text-[#333] mx-auto mb-4" />
              <p className="text-[#acacac] text-lg font-medium">
                No items found
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-12">
              {sortedItems.map((item: any, index: number) => (
                <CollectionItemCard
                  key={index}
                  item={item}
                  collectionId={collection.id}
                  productId={collection.product_id}
                  brandName={business?.brand_name}
                  index={index}
                  itemNumber={items.indexOf(item) + 1}
                  onSelect={setSelectedItem}
                />
              ))}
            </div>
          )}

          {/* Shipping & Return Info */}
          <div className="bg-[#0f0f0f] rounded-xl border border-[#222] p-8 mb-12">
            <h3 className="text-lg font-semibold text-white mb-6">
              Shipping & Policy Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {collection.eta_domestic && (
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-2">
                    Domestic Shipping
                  </p>
                  <p className="text-white font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#8451E1]" />
                    {collection.eta_domestic}
                  </p>
                </div>
              )}
              {collection.eta_international && (
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-2">
                    International Shipping
                  </p>
                  <p className="text-white font-medium flex items-center gap-2">
                    <Truck className="w-4 h-4 text-[#8451E1]" />
                    {collection.eta_international}
                  </p>
                </div>
              )}
              {collection.shipping_option && (
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-2">
                    Shipping Option
                  </p>
                  <p className="text-white font-medium">{collection.shipping_option}</p>
                </div>
              )}
              {collection.refund_policy && (
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-2">
                    Refund Policy
                  </p>
                  <p className="text-white font-medium">{collection.refund_policy}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          collection={collection}
          brandName={business?.brand_name}
          onClose={() => setSelectedItem(null)}
        />
      )}
    </div>
    </>
  );
}

function CollectionItemCard({
  item,
  collectionId,
  productId,
  brandName,
  index,
  itemNumber,
  onSelect,
}: {
  item: any;
  collectionId: string;
  productId?: string | null;
  brandName?: string;
  index: number;
  itemNumber: number;
  onSelect: (item: any) => void;
}) {
  const { addToCart } = useCartState();
  const { user } = useAuth();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (isAdding || !productId) return;

    setIsAdding(true);
    try {
      await addToCart(productId, 1);
      setAdded(true);
      toastSvc.success(`${item.title || item.name} added to cart`);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      toastSvc.error("Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const isValidImage =
    typeof item.image === "string" &&
    item.image.length > 0 &&
    !item.image.includes("placeholder.com");

  let colors: Array<{ colorName: string; colorHex: string }> = [];
  try {
    if (item.colors_available) {
      colors = Array.isArray(item.colors_available)
        ? item.colors_available
        : JSON.parse(item.colors_available);
    }
  } catch (e) {}

  let sizes: string[] = [];
  try {
    if (item.sizes) {
      sizes = Array.isArray(item.sizes) ? item.sizes : JSON.parse(item.sizes);
    }
  } catch (e) {}

  const stockStatus =
    item.quantity_available === 0
      ? "Out of Stock"
      : item.quantity_available <= 5
        ? `${item.quantity_available} left`
        : "In Stock";

  const stockColor =
    item.quantity_available === 0
      ? "text-red-500"
      : item.quantity_available <= 5
        ? "text-orange-500"
        : "text-green-500";

  return (
    <>
      <div className="group">
        <div
          onClick={() => onSelect(item)}
          className="cursor-pointer bg-[#0f0f0f] rounded-xl overflow-hidden border border-[#222] hover:border-[#8451E1]/50 transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(132,81,225,0.15)]"
        >
          {/* Image */}
          <div className="h-72 md:h-80 bg-[#1a1a1a] relative overflow-hidden">
            {isValidImage ? (
              <img
                src={item.image}
                alt={item.title || item.name}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-[#1a1a1a]">
                <Images className="w-10 h-10 text-gray-700" />
                <span className="text-gray-600 text-xs">No Preview</span>
              </div>
            )}

            {/* Index Badge */}
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
              <span className="text-white text-[11px] font-bold tracking-tight">
                #{itemNumber}
              </span>
            </div>

            {/* Stock Status */}
            <div className={`absolute bottom-3 left-3 text-xs font-semibold px-2.5 py-1 rounded-lg ${stockColor} bg-black/50 backdrop-blur-sm border border-white/10`}>
              {stockStatus}
            </div>
          </div>

          {/* Info */}
          <div className="p-4 bg-black">
            <p className="text-[#999] text-[10px] font-bold uppercase tracking-widest mb-2">
              {brandName || "Exclusive"}
            </p>

            <h3 className="text-[#f2f2f2] capitalize font-semibold text-sm line-clamp-2 leading-snug mb-3 h-10">
              {item.title || item.name || `Item ${itemNumber}`}
            </h3>

            {/* Colors & Sizes */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#222] text-[10px]">
              {colors.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1">
                    {colors.slice(0, 2).map((color, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-[#333]"
                        style={{ backgroundColor: color.colorHex }}
                        title={color.colorName}
                      />
                    ))}
                    {colors.length > 2 && (
                      <span className="text-[#666] ml-1">+{colors.length - 2}</span>
                    )}
                  </div>
                </div>
              )}
              {sizes.length > 0 && (
                <span className="text-[#666] ml-auto">{sizes.length} sizes</span>
              )}
            </div>

            {/* Material */}
            {item.material_composition && (
              <p className="text-[#666] text-[9px] line-clamp-1 mb-3">
                {item.material_composition}
              </p>
            )}

            {/* Price & Action */}
            <div className="flex items-center justify-between">
              <span className="text-[#f2f2f2] font-bold text-sm">
                {item.currency || "NGN"}{" "}
                {(
                  (item.priceCents || item.price_cents || 0) / 100
                ).toLocaleString()}
              </span>

              {productId && (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding || item.quantity_available === 0}
                  className={`
                    flex items-center justify-center p-2 rounded-lg transition-all duration-300
                    ${
                      added
                        ? "bg-green-500 scale-105 shadow-lg shadow-green-500/30"
                        : "bg-[#8451E1] hover:bg-[#7240D0] active:scale-95"
                    }
                    disabled:opacity-50
                  `}
                >
                  {isAdding ? (
                    <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                  ) : added ? (
                    <Check className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <ShoppingCart className="w-3.5 h-3.5 text-white" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="bg-[#0e0e0e] border-[#222] text-white rounded-2xl shadow-2xl">
          <DialogHeader className="items-center text-center">
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4">
              <LogIn className="w-7 h-7 text-purple-500" />
            </div>
            <DialogTitle className="text-xl">Join Luxela</DialogTitle>
            <DialogDescription className="text-[#acacac] text-sm pt-2">
              Sign in to add{" "}
              <span className="text-white font-medium">
                {item.title || item.name}
              </span>{" "}
              to your cart.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() =>
                router.push(
                  `/signin?redirect=/buyer/collection/${collectionId}`
                )
              }
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 rounded-lg transition-all shadow-lg shadow-purple-500/20"
            >
              Log In
            </button>
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full text-[#666] text-sm font-medium hover:text-white transition-colors"
            >
              Browse more
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ItemDetailModal({
  item,
  collection,
  brandName,
  onClose,
}: {
  item: any;
  collection: any;
  brandName?: string;
  onClose: () => void;
}) {
  let colors: Array<{ colorName: string; colorHex: string }> = [];
  try {
    if (item.colors_available) {
      colors = Array.isArray(item.colors_available)
        ? item.colors_available
        : JSON.parse(item.colors_available);
    }
  } catch (e) {}

  let sizes: string[] = [];
  try {
    if (item.sizes) {
      sizes = Array.isArray(item.sizes) ? item.sizes : JSON.parse(item.sizes);
    }
  } catch (e) {}

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="bg-[#0e0e0e] border-[#222] text-white rounded-2xl max-w-2xl max-h-96 overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{item.title || item.name}</DialogTitle>
          <DialogDescription className="text-[#8451E1] text-sm">
            {brandName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-6">
          {/* Image */}
          {item.image && (
            <div className="h-64 bg-[#1a1a1a] rounded-lg overflow-hidden">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Details */}
          <div className="space-y-4 text-sm">
            <div>
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1">
                Price
              </p>
              <p className="text-xl font-bold text-[#8451E1]">
                {item.currency || "NGN"}{" "}
                {((item.price_cents || 0) / 100).toLocaleString()}
              </p>
            </div>

            {colors.length > 0 && (
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider mb-2">
                  Available Colors
                </p>
                <div className="flex flex-wrap gap-2">
                  {colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border border-[#333]"
                      style={{ backgroundColor: color.colorHex }}
                      title={color.colorName}
                    />
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider mb-2">
                  Available Sizes
                </p>
                <p className="text-white">{sizes.join(", ")}</p>
              </div>
            )}

            {item.material_composition && (
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider mb-1">
                  Material
                </p>
                <p className="text-white">{item.material_composition}</p>
              </div>
            )}

            <div>
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1">
                Stock
              </p>
              <p className="text-white">
                {item.quantity_available} units available
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}