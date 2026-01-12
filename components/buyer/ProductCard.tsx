"use client";

import Link from "next/link";
import { useState } from "react";
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

export default function ProductCard({ product }: { product: Listing }) {
  const { addToCart } = useCartState();
  const { user } = useAuth();
  const router = useRouter();

  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);

  const business = product.sellers?.seller_business?.[0];

  const handleQuickAdd = async (e: React.MouseEvent) => {
    // Prevent the Link from routing to the product detail page
    e.preventDefault();
    e.stopPropagation();

    // 1. Check if user is logged in
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    if (isAdding) return;

    setIsAdding(true);
    try {
      await addToCart(product.id, 1);
      setAdded(true);
      toastSvc.success(`${product.title} added to cart`);
      
      // Reset success checkmark after 2 seconds
      setTimeout(() => setAdded(false), 2000);
    } catch (err) {
      console.error("Failed to add to cart:", err);
      toastSvc.error("Failed to add to cart. Please try again.");
    } finally {
      setIsAdding(false);
    }
  };

  const isValidImage =
    typeof product.image === "string" &&
    product.image.length > 0 &&
    product.image !== "https://via.placeholder.com/400";

  // Parse Colors
  let colors: Array<{ colorName: string; colorHex: string }> = [];
  try {
    colors = product.colors_available ? JSON.parse(product.colors_available) : [];
  } catch (e) {
    colors = [];
  }

  return (
    <>
      <Link href={`/buyer/product/${product.id}`} className="block">
        <div className="group bg-[#161616] rounded-lg overflow-hidden hover:ring-2 hover:ring-[#9872DD]/50 transition-all duration-300 shadow-lg relative">
          
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

            {/* Limited Edition Badge */}
            {product.limited_edition_badge === "show_badge" && (
              <div className="absolute top-3 left-3 bg-purple-600 px-3 py-1 rounded shadow-md z-10">
                <span className="text-[#f2f2f2] text-[10px] font-black uppercase tracking-widest">
                  Limited
                </span>
              </div>
            )}
          </div>

          {/* Content Section */}
          <div className="p-4 bg-black">
            {/* Brand Name */}
            <p className="text-[#acacac] text-[11px] font-bold uppercase tracking-wider mb-1">
              {business?.brand_name || "Luxela Exclusive"}
            </p>

            {/* Title & Colors */}
            <div className="flex items-start justify-between gap-2 mb-4">
              <h3 className="text-[#f2f2f2] capitalize font-medium text-sm line-clamp-2 leading-snug h-10 flex-1">
                {product.title}
              </h3>
              
              {colors.length > 0 && (
                <div className="flex -space-x-1 mt-1">
                  {colors.slice(0, 3).map((color, i) => (
                    <div
                      key={i}
                      className="w-3 h-3 rounded-full border border-black shadow-sm"
                      style={{ backgroundColor: color.colorHex }}
                      title={color.colorName}
                    />
                  ))}
                  {colors.length > 3 && (
                    <span className="text-[9px] text-gray-500 pl-1">+{colors.length - 3}</span>
                  )}
                </div>
              )}
            </div>

            {/* Price & Quick Add */}
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="text-[#f2f2f2] font-bold text-base">
                  {product.currency} {(product.price_cents / 100).toLocaleString()}
                </span>
                {product.quantity_available <= 5 && product.quantity_available > 0 && (
                  <span className="text-orange-500 text-[10px] font-medium">
                    Only {product.quantity_available} left
                  </span>
                )}
              </div>

              <button
                onClick={handleQuickAdd}
                disabled={isAdding}
                className={`
                  relative flex items-center justify-center p-3 rounded-xl transition-all duration-300
                  ${added 
                    ? "bg-green-500 scale-105" 
                    : "bg-purple-600 hover:bg-purple-500 active:scale-95 shadow-[0_0_15px_rgba(168,85,247,0.2)]"
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
    </>
  );
}