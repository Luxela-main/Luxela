"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Listing } from "@/types/listing";
import { ShoppingCart, Images, Check, Loader2, LogIn, Star, Shield, Zap } from "lucide-react";
import { useCartState } from "@/modules/cart/context";
import { useAuth } from "@/context/AuthContext";
import { toastSvc } from "@/services/toast";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "../ui/button";

// Fallback map for when colorHex is empty in the database
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

export default function ProductCard({ product }: { product: Listing }) {
  const { addToCart } = useCartState();
  const { user } = useAuth();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const business = product.sellers?.seller_business?.[0];

  // Accent color for this card (consistent based on product ID)
  const accentColors = ["#ECBEE3", "#EA795B", "#BEE3EC"];
  const cardAccent = accentColors[(product.id.charCodeAt(0) + product.id.charCodeAt(product.id.length - 1)) % accentColors.length];

  const handleQuickAdd = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user || !user.id) {
      setShowAuthModal(true);
      return;
    }

    if (isAdding) return;

    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      toastSvc.success(`${product.title} added to cart`);
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      toastSvc.error("Failed to add to cart. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const LUXELA_PLACEHOLDER =
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop";

  const isValidImage =
    product.image &&
    product.image.length > 0 &&
    !product.image.includes("placeholder.com") &&
    product.image !== LUXELA_PLACEHOLDER;

  // Optimized Color Parsing & Mapping
  const colors = useMemo(() => {
    if (!product.colors_available) return [];
    try {
      // Handles JSON: "[{\"colorName\":\"red\",\"colorHex\":\"\"}]"
      const parsed = JSON.parse(product.colors_available);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      // Handles raw string: "red,green,blue"
      return product.colors_available.split(",").map((c) => ({
        colorName: c.trim(),
        colorHex: "",
      }));
    }
  }, [product.colors_available]);

  return (
    <>
      <Link href={`/buyer/product/${product.id}`} className="block">
        <div 
          className="group bg-[#161616] rounded-lg overflow-hidden transition-all duration-300 shadow-lg relative border-2 hover:shadow-lg"
          style={{
            borderColor: cardAccent + "40",
            boxShadow: `0 4px 20px ${cardAccent}10`,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = cardAccent + "80";
            (e.currentTarget as HTMLElement).style.boxShadow = `0 8px 30px ${cardAccent}30`;
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLElement).style.borderColor = cardAccent + "40";
            (e.currentTarget as HTMLElement).style.boxShadow = `0 4px 20px ${cardAccent}10`;
          }}
        >
          {/* Image Section */}
          <div className="h-80 md:h-96 bg-[#222] relative overflow-hidden">
            {isValidImage ? (
              <img
                src={product.image}
                alt={product.title}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Images className="w-12 h-12 text-gray-700" />
              </div>
            )}

            {product.limited_edition_badge === "show_badge" && (
              <div 
                className="absolute top-3 left-3 px-3 py-1.5 rounded-lg font-medium uppercase text-white text-xs"
                style={{
                  backgroundColor: cardAccent,
                  boxShadow: `0 0 15px ${cardAccent}40`,
                }}
              >
                Limited
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 bg-black">
            {/* Category & Seller Verification Row */}
            <div className="flex items-center justify-between mb-2">
              {product.category && (
                <span 
                  className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full text-white"
                  style={{
                    backgroundColor: cardAccent + "20",
                    color: cardAccent,
                    border: `1px solid ${cardAccent}40`,
                  }}
                >
                  {product.category}
                </span>
              )}
              {product.is_verified && (
                <div className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-green-500" />
                  <span className="text-[9px] text-green-500 font-medium">Verified</span>
                </div>
              )}
            </div>

            <p className="text-[#acacac] text-[11px] font-medium uppercase tracking-wider mb-1">
              {business?.brand_name || "Luxela Exclusive"}
            </p>

            {/* Title, Description & Colors */}
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex-1">
                <h3 className="text-[#f2f2f2] capitalize font-medium text-base line-clamp-2 leading-snug h-10">
                  {product.title}
                </h3>
                {product.description && (
                  <p className="text-[#acacac] text-[12px] line-clamp-1 mt-1">
                    {product.description.substring(0, 100)}{product.description.length > 100 ? "..." : ""}
                  </p>
                )}
              </div>

              {colors.length > 0 && (
                <div className="flex items-center -space-x-1.5">
                  {colors.slice(0, 3).map((color, i) => {
                    const name = color.colorName?.toLowerCase().trim() || "";
                    const hexFromDb = color.colorHex?.startsWith("#")
                      ? color.colorHex
                      : null;
                    const hexFromMap = UI_COLOR_MAP[name];
                    const finalColor = hexFromDb || hexFromMap;

                    return (
                      <div
                        key={`${product.id}-${i}`}
                        title={color.colorName}
                        className={`
                          flex items-center justify-center rounded-full border-2 shadow-sm transition-transform hover:z-10 hover:scale-125
                          ${finalColor ? "w-3.5 h-3.5" : "w-5 h-5 bg-zinc-800"}
                        `}
                        style={{ 
                          backgroundColor: finalColor || undefined,
                          borderColor: cardAccent + "60",
                        }}
                      >
                        {!finalColor && (
                          <span className="text-[8px] text-white font-bold uppercase">
                            {name.charAt(0)}
                          </span>
                        )}
                      </div>
                    );
                  })}
                  {colors.length > 3 && (
                    <span className="text-[9px] text-gray-500 pl-2">
                      +{colors.length - 3}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Rating & Sales Row */}
            {(product.rating || product.sales_count) && (
              <div className="flex items-center gap-4 mb-3 text-[11px]">
                {product.rating && product.rating > 0 && (
                  <div className="flex items-center gap-1">
                    <div className="flex gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3 h-3 ${
                            i < Math.round(product.rating || 0)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-gray-600"
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-[#acacac]">
                      {product.rating.toFixed(1)}
                      {product.review_count && (
                        <span className="ml-1">({product.review_count})</span>
                      )}
                    </span>
                  </div>
                )}
                {product.sales_count && product.sales_count > 0 && (
                  <span className="text-[#acacac] flex items-center gap-1">
                    <Zap className="w-3 h-3 text-orange-500" />
                    {product.sales_count} sold
                  </span>
                )}
              </div>
            )}

            {/* Price & Quick Add */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[#f2f2f2] font-semibold text-sm">
                  {product.currency}{" "}
                  {(product.price_cents / 100).toLocaleString()}
                </span>
                {product.supply_capacity === "limited" && product.quantity_available <= 5 && product.quantity_available > 0 && (
                  <span className="text-orange-500 text-[10px] font-medium">
                    ⚠️ Only {product.quantity_available} left
                  </span>
                )}
                {product.quantity_available === 0 && (
                  <span className="text-red-500 text-[10px] font-medium">
                    Out of Stock
                  </span>
                )}
              </div>

              <button
                onClick={handleQuickAdd}
                disabled={isAdding}
                className={`
    relative flex cursor-pointer items-center justify-center p-3 rounded-xl transition-all duration-300
    ${
      added
        ? "bg-green-500 scale-105"
        : "hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
    }
    disabled:opacity-70 disabled:cursor-not-allowed
  `}
                style={{
                  background: added 
                    ? undefined 
                    : `linear-gradient(180deg, #8451E1 0%, #8451E1 44.78%, #5C2EAF 90.62%)`,
                  boxShadow: added 
                    ? undefined 
                    : `0 0 15px ${cardAccent}40, inset 0 0 10px ${cardAccent}20`,
                }}
              >
                {isAdding ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : added ? (
                  <Check className="w-4 h-4 text-white animate-in zoom-in" />
                ) : (
                  <ShoppingCart className="w-4 h-4 text-white" />
                )}
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Auth Requirement Modal */}
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
    </>
  );
}