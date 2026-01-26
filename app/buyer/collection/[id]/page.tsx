"use client";

import { use, useState } from "react";
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

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getListingById, loading } = useListings();

  if (loading)
    return (
      <div className="bg-black min-h-screen flex items-center justify-center text-white">
        Loading...
      </div>
    );

  const collection = getListingById(id);

  if (!collection)
    return (
      <div className="bg-black min-h-screen text-white p-8">
        Collection not found
      </div>
    );

  let items: any[] = [];
  try {
    items = collection.items_json ? JSON.parse(collection.items_json) : [];
  } catch (e) {
    console.error("Error parsing items:", e);
  }

  const business = collection.sellers?.seller_business?.[0];

  return (
    <div className="bg-black min-h-screen px-6 py-8">
      {/* Back Button */}
      <Link
        href="/buyer/collections"
        className="inline-flex items-center gap-2 text-gray-400 hover:text-white mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Collections
      </Link>

      {/* Collection Header */}
      <div className="mb-8">
        <p className="text-[#acacac] text-sm md:text-lg uppercase mb-2 tracking-widest font-bold">
          {business?.brand_name}
        </p>
        <h1 className="text-4xl font-bold text-white mb-4">
          {collection.title}
        </h1>
        {collection.description && (
          <p className="text-gray-300 text-lg max-w-3xl leading-relaxed">
            {collection.description}
          </p>
        )}
        <div className="flex items-center gap-4 mt-4">
          <div className="flex items-center gap-2">
            <Package className="w-4 h-4 text-[#8451E1]" />
            <span className="text-gray-400">
              {items.length} {items.length === 1 ? "item" : "items"}
            </span>
          </div>
          {collection.release_duration && (
            <span className="text-gray-400">
              • {collection.release_duration}
            </span>
          )}
        </div>
      </div>

      {collection.image && (
        <div className="relative w-full max-w-6xl h-80 rounded-xl overflow-hidden mb-12 border border-[#212121]">
          <img
            src={collection.image}
            alt={collection.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
          {collection.limited_edition_badge === "show_badge" && (
            <div className="absolute top-6 left-6 bg-[#8451E1] px-4 py-2 rounded-lg shadow-lg">
              <span className="text-white text-xs font-black uppercase tracking-widest">
                Limited Edition
              </span>
            </div>
          )}
        </div>
      )}

      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white">
          Items in this Collection
        </h2>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {items.map((item: any, index: number) => (
          <CollectionItemCard
            key={index}
            item={item}
            collectionId={collection.id}
            productId={collection.product_id}
            brandName={business?.brand_name}
            index={index}
          />
        ))}
      </div>
    </div>
  );
}

function CollectionItemCard({
  item,
  collectionId,
  productId,
  brandName,
  index,
}: {
  item: any;
  collectionId: string;
  productId?: string | null;
  brandName?: string;
  index: number;
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

  const LUXELA_PLACEHOLDER =
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";

  const isValidImage =
    typeof item.image === "string" &&
    item.image.length > 0 &&
    !item.image.includes("placeholder.com") &&
    item.image !== LUXELA_PLACEHOLDER;

  let colors: Array<{ colorName: string; colorHex: string }> = [];
  try {
    if (item.colors_available) {
      colors =
        typeof item.colors_available === "string"
          ? JSON.parse(item.colors_available)
          : item.colors_available;
    }
  } catch (e) {}

  return (
    <>
      <Link
        href={productId ? `/buyer/product/${productId}` : "#"}
        className={!productId ? "pointer-events-none" : ""}
      >
        <div
          className={`group bg-[#161616] rounded-lg overflow-hidden border border-transparent ${
            productId
              ? "hover:ring-2 hover:ring-[#8451E1]/50 cursor-pointer"
              : ""
          } transition-all duration-300 shadow-lg`}
        >
          <div className="h-80 md:h-96 bg-[#222] p-0 flex relative overflow-hidden">
            {isValidImage ? (
              <img
                src={item.image}
                alt={item.title || item.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-[#1a1a1a]">
                <Images className="w-12 h-12 text-gray-700" />
                <span className="text-gray-600 text-xs">No Preview</span>
              </div>
            )}

            <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/10">
              <span className="text-white text-[10px] font-bold tracking-tighter">
                #{index + 1}
              </span>
            </div>
          </div>

          <div className="p-4 bg-black">
            <p className="text-[#acacac] text-[10px] font-bold uppercase tracking-widest mb-1">
              {brandName || "Exclusive"}
            </p>

            <div className="flex items-start justify-between gap-3 mb-4">
              <h3 className="text-[#f2f2f2] capitalize font-medium text-sm line-clamp-2 leading-snug h-10">
                {item.title || item.name || `Item ${index + 1}`}
              </h3>

              {colors.length > 0 && (
                <div className="flex -space-x-1 mt-1">
                  {colors.slice(0, 3).map((color, i) => (
                    <div
                      key={i}
                      className="w-3.5 h-3.5 rounded-full border border-black shadow-sm"
                      style={{ backgroundColor: color.colorHex }}
                      title={color.colorName}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[#f2f2f2] font-bold text-base">
                {item.currency || "NGN"}{" "}
                {(
                  (item.priceCents || item.price_cents || 0) / 100
                ).toLocaleString()}
              </span>

              {productId && (
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className={`
                    flex items-center justify-center p-3 rounded-xl transition-all duration-300
                    ${
                      added
                        ? "bg-green-500 scale-105"
                        : "bg-[#8451E1] hover:bg-[#7240D0] active:scale-95"
                    }
                    disabled:opacity-50
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
              )}
            </div>
          </div>
        </div>
      </Link>

      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="bg-[#0E0E0E] border-[#212121] text-white rounded-2xl shadow-2xl">
          <DialogHeader className="items-center text-center">
            <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center mb-4 rotate-3">
              <LogIn className="w-7 h-7 text-purple-500 -rotate-3" />
            </div>
            <DialogTitle className="text-xl">JOIN LUXELA</DialogTitle>
            <DialogDescription className="text-[#ACACAC] text-sm pt-2">
              Sign in to add{" "}
              <span className="text-white font-medium">
                {item.title || item.name}
              </span>{" "}
              to your collection.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-6">
            <button
              onClick={() =>
                router.push(
                  `/signin?redirect=/buyer/collections/${collectionId}`
                )
              }
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-4 rounded-xl transition-all shadow-lg shadow-purple-500/20"
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