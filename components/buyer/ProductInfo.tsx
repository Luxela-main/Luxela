"use client";

import { useState, useMemo } from "react";
import Link from "next/link";
import { Listing } from "@/types/listing";
import { Minus, Plus, ShoppingCart, Check, LogIn } from "lucide-react";
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

  const { user } = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { addToCart } = useCartState();

  const sizes = useMemo(() => {
    if (!product.sizes_json) return [];
    try {
      return JSON.parse(product.sizes_json);
    } catch (e) {
      return [];
    }
  }, [product.sizes_json]);

  const colors = useMemo(() => {
    if (!product.colors_available) return [];
    let parsed: any[] = [];
    try {
      parsed = JSON.parse(product.colors_available);
    } catch (e) {
      parsed = product.colors_available.split(',').map(c => ({
        colorName: c.trim(),
        colorHex: ""
      }));
    }

    return parsed.map(c => {
      const name = c.colorName?.toLowerCase().trim() || "";
      const hexFromDb = c.colorHex?.startsWith("#") ? c.colorHex : null;
      const hexFromMap = UI_COLOR_MAP[name];
      return {
        ...c,
        displayHex: hexFromDb || hexFromMap || null
      };
    });
  }, [product.colors_available]);

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

  const incrementQuantity = () => {
    if (quantity < product.quantity_available) setQuantity(quantity + 1);
  };

  const decrementQuantity = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div>
        <h1 className="text-xl font-medium mb-2">
          {product.title} <span className="text-sm">by</span>
        </h1>
        <Link
          href={`/buyer/brand/${business?.brand_name?.toLowerCase().replace(/\s+/g, "-")}`}
          className="text-[#9872DD] hover:text-[#8451E1] text-sm transition-colors"
        >
          {business?.brand_name}
        </Link>
      </div>

      {/* Price */}
      <div className="flex items-baseline gap-3">
        <span className="text-xl font-bold text-white">
          {(product.price_cents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}
        </span>
        <span className="text-sm text-gray-400">{product.currency}</span>
      </div>

      <div className="flex gap-3">
        {product.limited_edition_badge === "show_badge" && (
          <span className="px-3 py-1.5 bg-[#9872DD]/20 text-[#9872DD] text-xs font-medium rounded-full">
            Limited Edition
          </span>
        )}
        {product.quantity_available <= 10 && product.quantity_available > 0 && (
          <span className="px-3 py-1.5 bg-orange-500/20 text-orange-400 text-xs font-medium rounded-full">
            Only {product.quantity_available} left
          </span>
        )}
        {product.category && (
          <span className="px-3 py-1.5 bg-gray-800 text-gray-300 text-xs font-medium rounded-full">
            {product.category.replace(/_/g, " ")}
          </span>
        )}
      </div>

      {/* Color Selection */}
      {colors.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-3 text-white">
            Color: <span className="text-gray-400 capitalize">{colors[selectedColor]?.colorName}</span>
          </h3>
          <div className="flex flex-wrap gap-3">
            {colors.map((color: any, index: number) => (
              <button
                key={index}
                onClick={() => setSelectedColor(index)}
                className={`relative w-12 h-12 rounded-full border-2 transition-all flex items-center justify-center ${
                  selectedColor === index
                    ? "border-[#9872DD] scale-110"
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
        <div>
          <h3 className="text-sm font-medium mb-3 text-white">Select size</h3>
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

      {/* Quantity Selector */}
      <div>
        <h3 className="text-sm font-medium mb-3 text-white">Quantity</h3>
        <div className="flex items-center gap-4 bg-[#161616] rounded-lg p-2 w-fit">
          <button
            onClick={decrementQuantity}
            disabled={quantity <= 1}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1f1f1f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="w-12 text-center font-medium text-white">{quantity}</span>
          <button
            onClick={incrementQuantity}
            disabled={quantity >= product.quantity_available}
            className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[#1f1f1f] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-white"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row justify-between gap-3 pt-4">
        <button
          onClick={handleBuyNow}
          disabled={addingToCart}
          className="w-full cursor-pointer text-sm bg-purple-500 hover:bg-purple-600 text-white py-4 rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {addingToCart ? "Processing..." : (
            <>
              Buy now
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
              </svg>
            </>
          )}
        </button>

        <button
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="w-full px-6 cursor-pointer py-4 bg-[#161616] hover:bg-[#1f1f1f] rounded-xl transition-all border border-gray-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center group"
        >
          {addedToCart ? (
            <span className="text-sm text-green-500 flex items-center gap-2 font-medium">
              <Check className="w-5 h-5" /> Added to Cart
            </span>
          ) : (
            <>
              <span className="text-sm text-purple-500 font-medium">Add to Cart</span>
              <ShoppingCart className="w-5 h-5 ml-2 text-purple-500 group-hover:scale-110 transition-transform" />
            </>
          )}
        </button>
      </div>

      {/* Additional Info */}
      <div className="pt-6 space-y-3 text-sm border-t border-gray-800">
        {product.material_composition && (
          <div className="flex justify-between">
            <span className="text-gray-400">Material:</span>
            <span className="text-white capitalize">{product.material_composition}</span>
          </div>
        )}
        {product.shipping_option && (
          <div className="flex justify-between">
            <span className="text-gray-400">Shipping:</span>
            <span className="text-white capitalize">{product.shipping_option.replace(/_/g, " ")}</span>
          </div>
        )}
        {product.eta_domestic && (
          <div className="flex justify-between">
            <span className="text-gray-400">Delivery (Domestic):</span>
            <span className="text-white">{product.eta_domestic}</span>
          </div>
        )}
      </div>

      {/* Auth Requirement Modal */}
      <Dialog open={showAuthModal} onOpenChange={setShowAuthModal}>
        <DialogContent className="bg-[#141414] border-[#212121] text-white sm:max-w-md rounded-2xl">
          <DialogHeader className="flex flex-col items-center">
            <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-6 h-6 text-purple-500" />
            </div>
            <DialogTitle className="text-lg font-medium">Sign in Required</DialogTitle>
            <DialogDescription className="text-[#ACACAC] text-center pt-2">
              To add <span className="text-white font-medium">{product.title}</span> to your cart, please sign in to your Luxela account.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <button
              onClick={() => router.push(`/signin?redirect=/buyer/product/${product.id}`)}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 rounded-xl transition-all"
            >
              Sign In to Continue
            </button>
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