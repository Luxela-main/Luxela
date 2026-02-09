"use client";

import { use, useMemo, useState, useEffect } from "react";
import { useListings } from "@/context/ListingsContext";
import { useCartState } from "@/modules/cart/context";
import { useAuth } from "@/context/AuthContext";
import { useCollectionProducts } from "@/modules/buyer/queries/useCollectionProducts";
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
  const { getListingById, loading, fetchListingDetailsById } = useListings();
  const { data: collectionProductsData, products, isLoading: productsLoading } = useCollectionProducts({ collectionId: id });
  const [sortBy, setSortBy] = useState<"price-low" | "price-high" | "newest">("newest");
  const [filterColor, setFilterColor] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showSchemas, setShowSchemas] = useState(false);
  const [collectionDetails, setCollectionDetails] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);

  const isLoadingPage = loading || productsLoading || isLoadingDetails;
  const collection = collectionDetails || collectionProductsData || getListingById(id);

  useEffect(() => {
    const loadDetails = async () => {
      try {
        setIsLoadingDetails(true);
        const details = await fetchListingDetailsById(id);
        if (details) {
          setCollectionDetails(details);
        }
      } catch (error) {
        console.error('[Collection Page] Error:', error);
      } finally {
        setIsLoadingDetails(false);
      }
    };
    loadDetails();
  }, [id, fetchListingDetailsById]);

  // Use products from the new hook with all images
  let items: any[] = [];
  if (products && products.length > 0) {
    // Map products to items, using listing prices
    items = products.map((product) => {
      // Find the corresponding listing for pricing
      const listing = collectionProductsData?.listings?.find((l: any) => l.productId === product.id);
      const priceCents = listing?.priceCents || 0;
      const currency = listing?.currency || product.currency || 'NGN';
      
      return {
        id: product.id,
        title: product.name,
        name: product.name,
        priceCents: priceCents,
        price_cents: priceCents,
        currency: currency,
        image: product.images?.[0]?.imageUrl || null,
        colors_available: product.variants || [],
        sizes: product.variants?.map((v: any) => v.size).filter((s: any, i: number, arr: any[]) => arr.indexOf(s) === i) || [],
        material_composition: product.description,
        quantity_available: product.inventory?.reduce((sum: number, inv: any) => sum + (inv.quantity || 0), 0) || 0,
        inStock: product.inStock,
        images: product.images || [],
        itemsJson: listing?.itemsJson || product.itemsJson,
      };
    });
  }

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

  // Early return checks must come after all hooks
  if (isLoadingPage)
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading collection...</p>
        </div>
      </div>
    );

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

  const totalPrice = items.reduce((sum, item) => sum + (item.price_cents || 0), 0);
  const avgPrice = items.length > 0 ? totalPrice / items.length / 100 : 0;

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE.url },
    { name: "Collections", url: `${SITE.url}/buyer/collections` },
    { name: collectionProductsData?.name ?? "Collection", url: `${SITE.url}/buyer/collection/${id}` },
  ]);

  return (
    <>
      <JsonLdScript data={breadcrumbSchema} id="collection-breadcrumb" />
      <div className="bg-gradient-to-br from-black via-[#0a0a0a] to-[#0f0a1a] min-h-screen overflow-hidden relative">
        {/* Background animated elements */}
        <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#8451E1]/15 rounded-full blur-3xl opacity-40 animate-blob"></div>
          <div className="absolute bottom-40 left-1/4 w-96 h-96 bg-[#5C2EAF]/10 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2s"></div>
        </div>
        <div className="relative z-10">
      {/* Header with Back Button */}
      <div className="px-6 py-6 border-b border-[#8451E1]/10 sticky top-0 bg-gradient-to-b from-black/98 via-black/95 to-black/80 backdrop-blur-xl z-40 shadow-lg shadow-[#8451E1]/10">
        <div className="max-w-7xl mx-auto">
          <Link
            href="/buyer/collections"
            className="inline-flex items-center gap-2 text-[#acacac] hover:text-[#8451E1] transition-all duration-300 mb-6 hover:gap-3 group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-300" />
            Back to Collections
          </Link>
        </div>
      </div>

      {/* Collection Hero Section */}
      <div className="px-6 py-12">
        <div className="max-w-7xl mx-auto">
          {/* Collection Image */}
          {collectionProductsData?.brandHero && (
            <div className="relative w-full h-72 md:h-96 rounded-2xl overflow-hidden mb-12 border border-[#8451E1]/30 shadow-2xl shadow-[#8451E1]/20 hover:shadow-[0_0_50px_rgba(132,81,225,0.35)] transition-all duration-500 group">
              <img
                src={collectionProductsData.brandHero}
                alt={collectionProductsData?.name ?? "Collection"}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent" />
              
              {/* Hero Overlay Content */}
              <div className="absolute bottom-0 left-0 right-0 p-8">
                <div className="flex items-end justify-between">
                  <div>
                    <p className="text-[#8451E1] text-sm font-bold uppercase tracking-wider mb-2">
                      {collectionProductsData?.brandName ?? "Luxela"}
                    </p>
                    <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-[#d0d0d0] bg-clip-text text-transparent capitalize mb-3 drop-shadow-lg">
                      {collectionProductsData?.name}
                    </h1>

                  </div>
                  <div className="flex gap-3">
                    <button className="p-3 bg-gradient-to-br from-[#8451E1]/30 to-[#5C2EAF]/30 hover:from-[#8451E1]/50 hover:to-[#5C2EAF]/50 rounded-lg transition-all duration-300 backdrop-blur-sm border border-[#8451E1]/40 hover:border-[#8451E1]/70 hover:shadow-lg hover:shadow-[#8451E1]/30 hover:scale-110">
                      <Heart className="w-5 h-5 text-white" />
                    </button>
                    <button className="p-3 bg-gradient-to-br from-[#8451E1]/30 to-[#5C2EAF]/30 hover:from-[#8451E1]/50 hover:to-[#5C2EAF]/50 rounded-lg transition-all duration-300 backdrop-blur-sm border border-[#8451E1]/40 hover:border-[#8451E1]/70 hover:shadow-lg hover:shadow-[#8451E1]/30 hover:scale-110">
                      <Share2 className="w-5 h-5 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Collection Info */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in">
            {/* Description */}
            <div className="md:col-span-2 bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl rounded-2xl border border-[#8451E1]/30 p-6 md:p-8 shadow-xl shadow-[#8451E1]/10 hover:border-[#8451E1]/50 transition-all duration-500 hover:shadow-[0_0_30px_rgba(132,81,225,0.2)]">
              <h2 className="text-lg font-semibold bg-gradient-to-r from-white to-[#d0d0d0] bg-clip-text text-transparent mb-3 flex items-center gap-2">
                <div className="w-1 h-6 bg-gradient-to-b from-[#8451E1] to-[#5C2EAF] rounded-full"></div>
                About This Collection
              </h2>
              {(collectionProductsData?.description ?? collection?.description) && (
                <p className="text-[#acacac] leading-relaxed text-sm group hover:text-[#d0d0d0] transition-colors duration-300">
                  {collectionProductsData?.description ?? collection?.description}
                </p>
              )}
            </div>

            {/* Stats Card */}
            <div className="bg-gradient-to-br from-[#1a1a2e]/90 to-[#0f0f1a]/90 backdrop-blur-xl rounded-2xl border border-[#8451E1]/40 p-6 md:p-8 shadow-xl shadow-[#8451E1]/20 hover:shadow-[0_0_40px_rgba(132,81,225,0.35)] transition-all duration-500 hover:border-[#8451E1]/70 hover:scale-105">
              <h3 className="text-sm font-semibold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent mb-6 uppercase tracking-wide">
                Collection Stats
              </h3>
              <div className="space-y-6">
                <div className="pb-6 border-b border-[#8451E1]/10">
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold">
                    Total Items
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                    {items.length}
                  </p>
                </div>
                <div>
                  <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold">
                    Avg Price
                  </p>
                  <p className="text-3xl font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                    {items.length > 0 ? `NGN ${avgPrice.toLocaleString()}` : "N/A"}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6 mb-10 pb-8 border-b border-[#8451E1]/20">
            <h2 className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-white to-[#999] bg-clip-text text-transparent">
              Items in Collection
            </h2>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Color Filter */}
              {allColors.length > 0 && (
                <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/30 hover:border-[#8451E1]/70 transition-all duration-300 hover:shadow-lg hover:shadow-[#8451E1]/20 hover:bg-gradient-to-br hover:from-[#1a1a2e] hover:to-[#0f0f1a]">
                  <Palette className="w-4 h-4 text-[#8451E1]" />
                  <select
                    value={filterColor || ""}
                    onChange={(e) => setFilterColor(e.target.value || null)}
                    className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer appearance-none"
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
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl border border-[#8451E1]/30 hover:border-[#8451E1]/70 transition-all duration-300 hover:shadow-lg hover:shadow-[#8451E1]/20">
                <ArrowUpDown className="w-4 h-4 text-[#8451E1]" />
                <select
                  value={sortBy}
                  onChange={(e) =>
                    setSortBy(
                      e.target.value as "price-low" | "price-high" | "newest"
                    )
                  }
                  className="bg-transparent text-white text-sm font-medium focus:outline-none cursor-pointer appearance-none"
                >
                  <option value="newest">Newest</option>
                  <option value="price-low">Price: Low to High</option>
                  <option value="price-high">Price: High to Low</option>
                </select>
              </div>

              <div className="px-4 py-2.5 rounded-lg bg-gradient-to-r from-[#8451E1]/20 to-[#5C2EAF]/20 border border-[#8451E1]/40 text-[#8451E1] text-sm font-semibold">
                {sortedItems.length} items
              </div>
            </div>
          </div>

          {/* Items Grid */}
          {sortedItems.length === 0 ? (
            <div className="text-center py-20 animate-fade-in">
              <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8451E1]/30 to-[#5C2EAF]/20 flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#8451E1]/20">
                <Images className="w-10 h-10 text-[#8451E1]/60" />
              </div>
              <p className="text-[#acacac] text-lg font-medium mb-2">
                No items found
              </p>
              <p className="text-[#666] text-sm">
                Try adjusting your filters
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-12">
              {sortedItems.map((item: any, index: number) => (
                <CollectionItemCard
                  key={index}
                  item={item}
                  collectionId={id}
                  productId={item.id}
                  brandName={collectionProductsData?.brandName ?? undefined}
                  index={index}
                  itemNumber={items.indexOf(item) + 1}
                  onSelect={setSelectedItem}
                />
              ))}
            </div>
          )}


        </div>
      </div>

      {/* Item Detail Modal */}
      {selectedItem && (
        <ItemDetailModal
          item={selectedItem}
          collection={collection}
          brandName={collectionProductsData?.brandName ?? undefined}
          onClose={() => setSelectedItem(null)}
        />
      )}
        </div>
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
    item.quantity_available === 0 || !item.inStock
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
      <div className="group h-full animate-fade-in">
        <div
          onClick={() => onSelect(item)}
          className="cursor-pointer h-full bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 backdrop-blur-xl rounded-2xl overflow-hidden border border-[#8451E1]/30 hover:border-[#8451E1]/80 transition-all duration-500 shadow-xl hover:shadow-[0_0_40px_rgba(132,81,225,0.35)] hover:-translate-y-2 hover:scale-105 flex flex-col group"
        >
          {/* Image */}
          <div className="h-72 md:h-80 bg-[#1a1a1a] relative overflow-hidden flex-shrink-0">
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
            <div className="absolute top-3 right-3 bg-gradient-to-r from-[#8451E1]/70 to-[#5C2EAF]/70 backdrop-blur-md px-3 py-1.5 rounded-lg border border-[#8451E1]/50 shadow-lg shadow-[#8451E1]/30">
              <span className="text-white text-[11px] font-bold tracking-tight">
                #{itemNumber}
              </span>
            </div>

            {/* Stock Status */}
            <div className={`absolute bottom-3 left-3 text-xs font-semibold px-3 py-1.5 rounded-lg ${stockColor} backdrop-blur-md border transition-all duration-300 ${
              item.quantity_available === 0 ? 'bg-red-500/20 border-red-500/40' :
              item.quantity_available <= 5 ? 'bg-orange-500/20 border-orange-500/40' :
              'bg-green-500/20 border-green-500/40'
            }`}>
              {stockStatus}
            </div>
          </div>

          {/* Info */}
          <div className="p-4 md:p-5 bg-black flex flex-col flex-grow">
            <p className="text-[#8451E1] text-[10px] font-bold uppercase tracking-widest mb-2.5">
              {brandName ?? "Exclusive"}
            </p>

            <h3 className="text-[#f2f2f2] capitalize font-semibold text-sm line-clamp-2 leading-snug mb-3 h-10 flex-grow">
              {item.title || item.name || `Item ${itemNumber}`}
            </h3>

            {/* Colors & Sizes */}
            <div className="flex items-center gap-2 mb-3 pb-3 border-b border-[#8451E1]/20 text-[10px]">
              {colors.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex -space-x-1">
                    {colors.slice(0, 2).map((color, i) => (
                      <div
                        key={i}
                        className="w-2.5 h-2.5 rounded-full border border-[#8451E1]/30 shadow-lg"
                        style={{ backgroundColor: color.colorHex }}
                        title={color.colorName}
                      />
                    ))}
                    {colors.length > 2 && (
                      <span className="text-[#8451E1] ml-1 font-semibold">+{colors.length - 2}</span>
                    )}
                  </div>
                </div>
              )}
              {sizes.length > 0 && (
                <span className="text-[#8451E1] ml-auto font-semibold">{sizes.length} sizes</span>
              )}
            </div>

            {/* Material */}
            {item.material_composition && (
              <p className="text-[#999] text-[9px] line-clamp-1 mb-3">
                {item.material_composition}
              </p>
            )}

            {/* Price & Action */}
            <div className="flex items-center justify-between mt-auto pt-3">
              <span className="text-[#f2f2f2] font-bold text-sm bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                {item.currency ?? "NGN"}{" "}
                {(
                  (item.priceCents ?? item.price_cents ?? 0) / 100
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
                        : "bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 hover:scale-110 active:scale-95"
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
        <DialogContent className="bg-gradient-to-br from-[#0e0e0e] to-[#1a0a2e] border-[#8451E1]/30 text-white rounded-2xl shadow-2xl shadow-[#8451E1]/20">
          <DialogHeader className="items-center text-center">
            <div className="w-14 h-14 bg-gradient-to-br from-[#8451E1]/30 to-[#5C2EAF]/30 rounded-2xl flex items-center justify-center mb-4 border border-[#8451E1]/50">
              <LogIn className="w-7 h-7 text-[#8451E1]" />
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
              className="w-full bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white font-semibold py-4 rounded-lg transition-all duration-300"
            >
              Log In
            </button>
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full text-[#999] text-sm font-medium hover:text-[#8451E1] transition-colors duration-300"
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
      <DialogContent className="bg-gradient-to-br from-[#0e0e0e] to-[#1a0a2e] border-[#8451E1]/30 text-white rounded-2xl max-w-2xl max-h-96 overflow-y-auto shadow-2xl shadow-[#8451E1]/20">
        <DialogHeader>
          <DialogTitle className="text-2xl bg-gradient-to-r from-white to-[#999] bg-clip-text text-transparent">{item.title || item.name}</DialogTitle>
          <DialogDescription className="text-[#8451E1] text-sm font-medium">
            {brandName}
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 py-6">
          {/* Image */}
          {item.image && (
            <div className="h-64 bg-[#1a1a1a] rounded-xl overflow-hidden border border-[#8451E1]/20 shadow-lg">
              <img
                src={item.image}
                alt={item.title}
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          )}

          {/* Details */}
          <div className="space-y-4 text-sm">
            <div className="bg-[#1a1a2e]/50 rounded-lg p-3 border border-[#8451E1]/20">
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1 font-semibold">
                Price
              </p>
              <p className="text-2xl font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                {item.currency ?? "NGN"}{" "}
                {((item.priceCents ?? item.price_cents ?? 0) / 100).toLocaleString()}
              </p>
            </div>

            {colors.length > 0 && (
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider mb-3 font-semibold">
                  Available Colors
                </p>
                <div className="flex flex-wrap gap-2.5">
                  {colors.map((color, i) => (
                    <div
                      key={i}
                      className="w-7 h-7 rounded-full border-2 border-[#8451E1]/50 shadow-lg hover:scale-110 transition-transform"
                      style={{ backgroundColor: color.colorHex }}
                      title={color.colorName}
                    />
                  ))}
                </div>
              </div>
            )}

            {sizes.length > 0 && (
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider mb-2 font-semibold">
                  Available Sizes
                </p>
                <p className="text-white font-medium">{sizes.join(", ")}</p>
              </div>
            )}

            {item.material_composition && (
              <div>
                <p className="text-[#666] text-xs uppercase tracking-wider mb-1 font-semibold">
                  Material
                </p>
                <p className="text-[#acacac]">{item.material_composition}</p>
              </div>
            )}

            <div className="bg-green-500/10 rounded-lg p-3 border border-green-500/30">
              <p className="text-[#666] text-xs uppercase tracking-wider mb-1 font-semibold">
                Stock Status
              </p>
              <p className="text-green-400 font-semibold">
                {item.quantity_available} units available
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Add global styles for animations
if (typeof document !== 'undefined') {
  const styleId = 'collection-page-styles';
  if (!document.getElementById(styleId)) {
    const style = document.createElement('style');
    style.id = styleId;
    style.textContent = `
      @keyframes fadeIn {
        from {
          opacity: 0;
          transform: translateY(10px);
        }
        to {
          opacity: 1;
          transform: translateY(0);
        }
      }
      
      @keyframes blob {
        0%, 100% {
          transform: translate(0, 0) scale(1);
        }
        33% {
          transform: translate(30px, -50px) scale(1.1);
        }
        66% {
          transform: translate(-20px, 20px) scale(0.9);
        }
      }
      
      .animate-fade-in {
        animation: fadeIn 0.6s ease-out forwards;
        opacity: 0;
      }
      
      .animate-blob {
        animation: blob 7s infinite;
      }
      
      .animation-delay-2s {
        animation-delay: 2s;
      }
    `;
    document.head.appendChild(style);
  }
}