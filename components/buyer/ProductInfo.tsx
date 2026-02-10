"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { Listing } from "@/types/listing";
import { Minus, Plus, ShoppingCart, Check, LogIn, Heart } from "lucide-react";
import { addToFavorites, removeFromFavorites, isFavorite } from "@/server/actions/favorites";
import { useCartState } from "@/modules/cart/context";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/hooks/useToast";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

interface ProductInfoProps {
  product: Listing;
  business: any;
}

const UI_COLOR_MAP: { [key: string]: string } = {
  red: "#ef4444",
  green: "#22c55e",
  blue: "#3b82f6",
  yellow: "#eab308",
  pink: "#ec4899",
  purple: "#a855f7",
  orange: "#f97316",
  black: "#000000",
  white: "#ffffff",
  brown: "#78350f",
  gray: "#6b7280",
};

export default function ProductInfo({ product, business }: ProductInfoProps) {
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<number>(0);
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isFav, setIsFav] = useState(false);
  const [loadingFav, setLoadingFav] = useState(false);

  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { addToCart } = useCartState();

  // Check if product is favorited
  useEffect(() => {
    const checkFavorite = async () => {
      if (!user) return;
      try {
        const result = await isFavorite(product.id);
        setIsFav(result.isFavorite);
      } catch (error) {
        console.error('Error checking favorite status:', error);
      }
    };

    checkFavorite();
  }, [product.id, user]);

  const sizes = useMemo(() => {
    // Handle sizes_json from listing data
    const sizesData = product.sizes_json;
    if (!sizesData) return [];
    try {
      // If it's a string, parse it
      if (typeof sizesData === 'string') return JSON.parse(sizesData);
      // If it's already an array, return it
      return Array.isArray(sizesData) ? sizesData : [];
    } catch (e) {
      return [];
    }
  }, [product.sizes_json]);

  const colors = useMemo(() => {
    // Handle both formats - colors_available (from collections) and colors (from product detail endpoint)
    const colorsData = product.colors || product.colors_available;
    if (!colorsData) return [];
    let parsed: any[] = [];
    try {
      // If it's a string, parse it
      if (typeof colorsData === 'string') {
        parsed = JSON.parse(colorsData);
      } else if (Array.isArray(colorsData)) {
        // If it's already an array, use it directly
        parsed = colorsData;
      } else {
        return [];
      }
    } catch (e) {
      // Fallback: try to split by comma if it's a string
      if (typeof colorsData === 'string') {
        parsed = colorsData.split(",").map((c) => ({
          colorName: c.trim(),
          colorHex: "",
        }));
      } else {
        return [];
      }
    }

    return parsed.map((c) => {
      const name = c.colorName?.toLowerCase().trim() || "";
      const hexFromDb = c.colorHex?.startsWith("#") ? c.colorHex : null;
      const hexFromMap = UI_COLOR_MAP[name];
      return {
        ...c,
        displayHex: hexFromDb || hexFromMap || null,
      };
    });
  }, [product.colors, product.colors_available]);

  const performAddToCart = async (qty: number = 1) => {
    // 1. Auth Guard
    if (!user) {
      setShowAuthModal(true);
      return false;
    }

    if (sizes.length > 0 && !selectedSize) {
      toast.warning("Please select a size");
      return false;
    }

    setAddingToCart(true);
    try {
      await addToCart(product.id, qty);
      return true;
    } catch (error: any) {
      // 2. TRPC Unauthorized Catch
      const isAuthError =
        error.message?.includes("signed in") ||
        error.data?.code === "UNAUTHORIZED";

      if (isAuthError) {
        setShowAuthModal(true);
      } else {
        console.error("Failed to add to cart:", error);
        toast.warning("Failed to add item to cart. Please try again.");
      }
      return false;
    } finally {
      setAddingToCart(false);
    }
  };

  const handleAddToCart = async () => {
    const success = await performAddToCart(quantity);
    if (success) {
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
    }
  };

  const handleBuyNow = async () => {
    const success = await performAddToCart(quantity);
    if (success) {
      router.push("/cart");
    }
  };

  const handleToggleFavorite = async () => {
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    try {
      setLoadingFav(true);
      if (isFav) {
        const result = await removeFromFavorites(product.id);
        if (result.success) {
          setIsFav(false);
          toast.success('Removed from favorites');
        } else {
          toast.error(result.error || 'Failed to remove from favorites');
        }
      } else {
        const result = await addToFavorites(product.id);
        if (result.success) {
          setIsFav(true);
          toast.success('Added to favorites');
        } else {
          toast.error(result.error || 'Failed to add to favorites');
        }
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
      toast.error('Failed to update favorites');
    } finally {
      setLoadingFav(false);
    }
  };

  const incrementQuantity = () => {
    if (quantity < product.quantity_available) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <div className="space-y-8">
      {/* Title & Brand Section - Premium */}
      <section className="rounded-2xl border border-[#1a1a1a] bg-gradient-to-br from-[#0f0f0f] to-[#0a0a0a] p-8 flex flex-col gap-6">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
            Premium Collection
          </p>
          <h1 className="text-3xl lg:text-4xl font-light mb-3 leading-tight">
            {product.title}
          </h1>
          <Link
            href={`/buyer/brand/${business?.brand_name
              ?.toLowerCase()
              .replace(/\s+/g, "-")}`}
            className="text-[#8451E1] hover:text-[#9665F5] text-sm font-medium transition-colors uppercase tracking-wide"
          >
            by {business?.brand_name}
          </Link>
        </div>

        {/* Price - Premium Display with Favorite Button */}
        <div className="border-t border-b border-[#1a1a1a] py-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold mb-2">
                Price
              </p>
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-light text-white">
                  {(product.price_cents / 100).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                </span>
                <span className="text-sm text-gray-400 font-medium">
                  {product.currency}
                </span>
              </div>
            </div>
            <button
              onClick={handleToggleFavorite}
              disabled={loadingFav}
              className="flex items-center justify-center w-12 h-12 rounded-full border border-[#1a1a1a] hover:border-[#8451E1] transition-all disabled:opacity-50 disabled:cursor-not-allowed group"
              title={isFav ? 'Remove from favorites' : 'Add to favorites'}
            >
              <Heart
                className={`w-6 h-6 transition-all ${
                  isFav
                    ? 'fill-red-500 text-red-500'
                    : 'text-gray-400 group-hover:text-red-500'
                }`}
              />
            </button>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          {product.limited_edition_badge === "show_badge" && (
            <span className="px-4 py-2 bg-gradient-to-r from-[#8451E1]/20 to-[#7240D0]/20 text-[#8451E1] text-xs font-semibold rounded-full border border-[#8451E1]/30 uppercase tracking-wide">
              ✨ Limited Edition
            </span>
          )}
          {product.quantity_available <= 10 &&
            product.quantity_available > 0 && (
              <span className="px-4 py-2 bg-orange-500/10 text-orange-400 text-xs font-semibold rounded-full border border-orange-500/30 uppercase tracking-wide">
                ⚠️ Only {product.quantity_available} left
              </span>
            )}
          {product.category && (
            <span className="px-4 py-2 bg-gray-800/50 text-gray-300 text-xs font-semibold rounded-full border border-gray-700 uppercase tracking-wide">
              {product.category.replace(/_/g, " ")}
            </span>
          )}
        </div>
      </section>

      {/* Product Options Section */}
      <section className="border border-[#1a1a1a] flex flex-col gap-0 rounded-2xl bg-[#0a0a0a] overflow-hidden">
        {/* Color Selection */}
        {colors.length > 0 && (
          <div className="border-b border-[#1a1a1a] p-6">
            <h3 className="text-xs font-semibold mb-4 text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8451E1]"></span>
              Color: <span className="text-gray-400 font-normal capitalize">
                ({colors[selectedColor]?.colorName})
              </span>
            </h3>
            <div className="flex flex-wrap gap-3">
              {colors.map((color: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedColor(index)}
                  className={`relative w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                    selectedColor === index
                      ? "border-[#8451E1] scale-110"
                      : "border-gray-800 hover:border-gray-600"
                  }`}
                  title={color.colorName}
                >
                  <div
                    className="w-[85%] h-[85%] rounded-full flex items-center justify-center overflow-hidden shadow-inner"
                    style={{ backgroundColor: color.displayHex || "#1a1a1a" }}
                  >
                    {!color.displayHex && (
                      <span className="text-[10px] text-white font-bold uppercase">
                        {color.colorName?.charAt(0)}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Size Selection */}
        {sizes.length > 0 && (
          <div className="border-b border-[#1a1a1a] p-6">
            <h3 className="text-xs font-semibold mb-4 text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8451E1]"></span>
              Select Size
            </h3>
            <div className="grid grid-cols-5 gap-3">
              {sizes.map((size: string) => (
                <button
                  key={size}
                  onClick={() => setSelectedSize(size)}
                  className={`py-3 rounded-lg border text-sm font-medium transition-all ${
                    selectedSize === size
                      ? "bg-white text-black border-white"
                      : "border-gray-800 text-gray-400 hover:border-gray-600"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Material/Composition */}
        {product.material_composition && (
          <div className="border-b border-[#1a1a1a] p-6">
            <h3 className="text-xs font-semibold mb-3 text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8451E1]"></span>
              Material Composition
            </h3>
            <div className="px-4 py-3 rounded-lg bg-[#161616]/50 border border-[#1a1a1a] text-gray-300 capitalize text-sm">
              {product.material_composition}
            </div>
          </div>
        )}

        {/* Target Audience */}
        {product.additional_target_audience && (
          <div className="border-b border-[#1a1a1a] p-6">
            <h3 className="text-xs font-semibold mb-3 text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8451E1]"></span>
              Target Audience
            </h3>
            <div className="px-4 py-3 rounded-lg bg-[#161616]/50 border border-[#1a1a1a] text-gray-300 capitalize text-sm">
              {product.additional_target_audience}
            </div>
          </div>
        )}

        {/* Shipping */}
        {product.shipping_option && (
          <div className="border-b border-[#1a1a1a] p-6">
            <h3 className="text-xs font-semibold mb-3 text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8451E1]"></span>
              Shipping Available
            </h3>
            <div className="px-4 py-3 rounded-lg bg-[#161616]/50 border border-[#1a1a1a] text-gray-300 capitalize text-sm mb-4">
              {product.shipping_option === "local"
                ? "Local Only"
                : product.shipping_option === "international"
                ? "International Only"
                : "Local & International"}
            </div>
            {/* Shipping ETA */}
            <div className="space-y-2 text-sm">
              {product.eta_domestic && (
                <div className="flex justify-between text-gray-400">
                  <span>Domestic Delivery:</span>
                  <span className="text-gray-300 capitalize font-medium">
                    {product.eta_domestic.replace(/_/g, " ")}
                  </span>
                </div>
              )}
              {product.eta_international &&
                product.shipping_option !== "local" && (
                  <div className="flex justify-between text-gray-400">
                    <span>International Delivery:</span>
                    <span className="text-gray-300 capitalize font-medium">
                      {product.eta_international.replace(/_/g, " ")}
                    </span>
                  </div>
                )}
            </div>
          </div>
        )}

        {/* Refund Policy */}
        {product.refund_policy && (
          <div className="border-b border-[#1a1a1a] p-6">
            <h3 className="text-xs font-semibold mb-3 text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500"></span> Refund
              Policy
            </h3>
            <div className="px-4 py-3 rounded-lg bg-[#161616]/50 border border-[#1a1a1a] text-gray-300 text-sm">
              {product.refund_policy === "no_refunds"
                ? "No Refunds"
                : product.refund_policy === "48hrs"
                ? "48 Hours"
                : product.refund_policy === "72hrs"
                ? "72 Hours"
                : product.refund_policy === "5_working_days"
                ? "5 Working Days"
                : product.refund_policy === "1week"
                ? "1 Week"
                : product.refund_policy === "14days"
                ? "14 Days"
                : product.refund_policy === "30days"
                ? "30 Days"
                : product.refund_policy === "60days"
                ? "60 Days"
                : product.refund_policy === "store_credit"
                ? "Store Credit"
                : product.refund_policy}
            </div>
          </div>
        )}

        {/* Supply Capacity */}
        {product.supply_capacity && (
          <div className="border-b border-[#1a1a1a] p-6">
            <h3 className="text-xs font-semibold mb-3 text-white uppercase tracking-widest flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-[#8451E1]"></span>
              Availability
            </h3>
            <div className="px-4 py-3 rounded-lg bg-[#161616]/50 border border-[#1a1a1a] text-gray-300 capitalize text-sm">
              {product.supply_capacity === "limited"
                ? "Limited Supply"
                : "Unlimited Supply"}
            </div>
          </div>
        )}

        {/* Quantity */}
        <div className="border-b border-[#1a1a1a] p-6">
          <h3 className="text-xs font-semibold mb-4 text-white uppercase tracking-widest flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#8451E1]"></span>
            Quantity
          </h3>
          <div className="flex items-center gap-4">
            <button
              onClick={decrementQuantity}
              disabled={quantity <= 1}
              className="w-12 h-12 flex items-center text-sm justify-center rounded-xl bg-[#1a1a1a] border border-[#1a1a1a] hover:bg-[#222] hover:border-[#333] disabled:opacity-20 disabled:cursor-not-allowed transition-all text-white"
            >
              <Minus className="w-5 h-5" />
            </button>

            <div className="flex-1 max-w-[160px] h-12 flex items-center justify-center bg-[#1a1a1a] border border-[#1a1a1a] rounded-xl">
              <span className="font-semibold text-sm text-white tracking-wide">
                {quantity}
              </span>
            </div>

            <button
              onClick={incrementQuantity}
              disabled={quantity >= product.quantity_available}
              className={`
        w-12 h-12 text-sm flex items-center justify-center rounded-xl transition-all duration-300
        ${
          quantity >= product.quantity_available
            ? "bg-zinc-800 opacity-50 cursor-not-allowed"
            : "bg-[linear-gradient(180deg,#8451E1_0%,#8451E1_44.78%,#5C2EAF_90.62%)] hover:brightness-110 active:scale-95 shadow-[0_0_20px_rgba(132,81,225,0.4)]"
        }
      `}
            >
              <Plus className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row justify-between gap-4 pt-8 px-6 pb-6">
          <Button
            onClick={handleBuyNow}
            disabled={addingToCart}
            className="flex-1 cursor-pointer text-sm text-white py-4 h-12 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:from-[#9665F5] hover:to-[#8451E1] shadow-lg shadow-[#8451E1]/20 uppercase tracking-wide"
          >
            {addingToCart ? (
              "Processing..."
            ) : (
              <>
                Buy Now
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </>
            )}
          </Button>

          <Button
            onClick={handleAddToCart}
            disabled={addingToCart}
            className="flex-1 px-6 cursor-pointer py-4 bg-[#1a1a1a] h-12 hover:bg-[#242424] rounded-xl transition-all border border-[#2a2a2a] hover:border-[#8451E1]/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group uppercase tracking-wide"
          >
            {addedToCart ? (
              <span className="text-sm text-green-400 flex items-center gap-2 font-semibold">
                <Check className="w-5 h-5" /> Added
              </span>
            ) : (
              <>
                <ShoppingCart className="w-4 h-4 mr-2 text-[#8451E1]" />
                <span className="text-sm text-[#8451E1] font-semibold">
                  Add to Cart
                </span>
              </>
            )}
          </Button>
        </div>
      </section>

      {/* Auth Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="bg-[#141414] border-[#212121] text-white sm:max-w-md rounded-2xl">
          <DialogHeader className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-purple-500" />
            </div>
            <DialogTitle className="text-lg font-medium">
              Sign in Required
            </DialogTitle>
            <DialogDescription className="text-[#ACACAC] text-center pt-2">
              To add{" "}
              <span className="text-white font-medium">{product.title}</span> to
              your cart, please sign in to your Luxela account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() =>
                router.push(`/signin?redirect=/buyer/product/${product.id}`)
              }
              className="w-full text-white h-12 font-medium py-3 rounded-xl transition-all"
            >
              Sign In to Continue
            </Button>
            <button
              onClick={() => setShowAuthModal(false)}
              className="w-full bg-transparent hover:bg-white/5 text-[#ACACAC] font-medium py-3 rounded-xl transition-all"
            >
              Maybe Later
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}