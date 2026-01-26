"use client";

import Link from "next/link";
import { useState, useMemo } from "react";
import { Listing } from "@/types/listing";
import { ShoppingCart, Images, Check, Loader2, LogIn } from "lucide-react";
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
      // Handles JSON: "[{"colorName":"red","colorHex":""}]"
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
        <div className="group bg-[#161616] rounded-lg overflow-hidden hover:ring-2 hover:ring-[#8451E1]/50 transition-all duration-300 shadow-lg relative">
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
              <div className="absolute top-3 left-3 bg-[#8451E1CC] px-3 py-1.5 rounded-lg">
                    <span className="text-white text-xs font-medium uppercase">
                  Limited
                </span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 bg-black">
            <p className="text-[#acacac] text-[11px] font-medium uppercase tracking-wider mb-1">
              {business?.brand_name || "Luxela Exclusive"}
            </p>

            {/* Title & Colors */}
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-[#f2f2f2] capitalize font-medium text-base line-clamp-2 leading-snug h-10 flex-1">
                {product.title}
              </h3>

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
                          flex items-center justify-center rounded-full border border-black shadow-sm transition-transform hover:z-10
                          ${finalColor ? "w-3.5 h-3.5" : "w-5 h-5 bg-zinc-800"}
                        `}
                        style={{ backgroundColor: finalColor || undefined }}
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

            {/* Price & Quick Add */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[#f2f2f2] font-semibold text-sm">
                  {product.currency}{" "}
                  {(product.price_cents / 100).toLocaleString()}
                </span>
                {product.quantity_available <= 5 &&
                  product.quantity_available > 0 && (
                    <span className="text-orange-500 text-[10px] font-medium">
                      Only {product.quantity_available} left
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
        : "bg-[linear-gradient(180deg,#8451E1_0%,#8451E1_44.78%,#5C2EAF_90.62%)] hover:brightness-110 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
    }
    disabled:opacity-70 disabled:cursor-not-allowed
  `}
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
