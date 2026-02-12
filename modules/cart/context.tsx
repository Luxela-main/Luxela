"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
import {
  useGetCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useApplyDiscount,
  useCheckout,
} from "./query";
import { DiscountType, CheckoutRequest, CartItemType } from "./model";
import { useListings } from "@/context/ListingsContext";

type CartContextType = {
  cart: any;
  items: CartItemType[];
  discount: DiscountType | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  addToCart: (listingId: string, quantity: number) => Promise<void>;
  updateQuantity: (listingId: string, quantity: number) => Promise<void>;
  removeItem: (listingId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
  checkout: (data: CheckoutRequest) => Promise<void>;
  itemCount: number;
  subtotal: number;
  total: number;
  discountAmount: number;
  hasUnapprovedItems?: boolean;
};

export const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export const useCartState = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartState must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const { data, isLoading, isError, error } = useGetCart();
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();
  const applyDiscountMutation = useApplyDiscount();
  const checkoutMutation = useCheckout();

  const cart = data?.cart;

  const { listings, approvedListings, validateProductForCart, getApprovedListingById } = useListings();

  const items = useMemo(() => {
    const rawItems = data?.items || [];

    // Items already have product details from backend (name, image from listings table)
    // Use those directly instead of looking up in approvedListings
    const enrichedItems = rawItems.map((item) => {
      // Fallback to approvedListings lookup if backend didn't provide name/image
      const product = approvedListings.find((l) => l.id === item.listingId);
      
      return {
        ...item,
        // Use backend-provided name first, fallback to product lookup, then generic fallback
        name: item.name || product?.title || `Product ${item.listingId.slice(0, 5)}`,
        // Use backend-provided image first, fallback to product lookup
        image: item.image || product?.image,
        price: item.unitPriceCents / 100,
      };
    });
    return enrichedItems.sort((a, b) => a.listingId.localeCompare(b.listingId));
  }, [data?.items, approvedListings]);

  const discount = data?.discount || null;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );

  const discountAmount = discount
    ? (discount.percentOff ?? 0) > 0
      ? (subtotal * (discount.percentOff ?? 0)) / 100
      : discount.amountOffCents ?? 0
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  const addToCart = async (listingId: string, quantity: number) => {
    let validation = validateProductForCart(listingId);

    if (quantity <= 0) {
      throw new Error("Invalid quantity. Please select at least 1 item.");
    }

    if (!validation.valid) {
      try {
        const listing = await getApprovedListingById(listingId, true);
        if (!listing) {
          console.warn("[CartContext.addToCart] Product not found in context, falling back to backend validation:", { listingId });
        } else {
          if ((listing.quantity_available || 0) <= 0) {
            throw new Error("This product is currently out of stock");
          }
          validation.valid = true;
        }
      } catch (error: any) {
        if (!error.message?.includes("not found") && !error.message?.includes("not available")) {
          const message = error instanceof Error ? error.message : (validation.reason || "This product cannot be added to your cart");
          console.error("[CartContext.addToCart] Validation error:", { listingId, message });
          throw error instanceof Error ? error : new Error(message);
        }
        console.warn("[CartContext.addToCart] Allowing backend validation for uncached product:", { listingId });
      }
    }

    try {
      console.log("[CartContext.addToCart] Attempting to add to cart:", { listingId, quantity });
      await addToCartMutation.mutateAsync({ listingId, quantity });
    } catch (error: any) {
      // Extract error message from TRPC error structure
      let errorMessage = "Failed to add to cart";
      let errorCode = "UNKNOWN";
      
      // TRPC error structure: { data: { code, message }, message, shape }
      if (error?.data?.message) {
        errorMessage = error.data.message;
        errorCode = error.data.code || "UNKNOWN";
      } else if (error?.message && error.message !== '{}') {
        errorMessage = error.message;
        errorCode = error.code || "UNKNOWN";
      } else if (typeof error === 'string' && error !== '{}') {
        errorMessage = error;
      } else if (error?.shape?.message) {
        // Fallback to shape.message if available
        errorMessage = error.shape.message;
        errorCode = error.shape.code || "UNKNOWN";
      } else if (error && typeof error === 'object') {
        // Last resort: log full error for debugging
        console.warn("[CartContext.addToCart] Unable to extract standard error message from:", error);
      }
      
      console.error("[CartContext.addToCart] Caught error:", {
        listingId,
        quantity,
        message: errorMessage,
        code: errorCode,
        fullError: error
      });
      throw error instanceof Error ? error : new Error(errorMessage);
    }
  };

  const updateQuantity = async (listingId: string, quantity: number) => {
    if (quantity === 0) {
      await removeItem(listingId);
    } else if (quantity > 0) {
      await updateCartItemMutation.mutateAsync({ listingId, quantity });
    }
  };

  const removeItem = async (listingId: string) => {
    await removeCartItemMutation.mutateAsync({ listingId });
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  const applyDiscount = async (code: string) => {
    await applyDiscountMutation.mutateAsync({ code });
  };

  const checkout = async (data: CheckoutRequest) => {
    if (items.length === 0) {
      throw new Error("Your cart is empty. Please add products before checkout.");
    }

    // Backend will validate item availability during checkout
    await checkoutMutation.mutateAsync(data);
  };

  const normalizedError: Error | null = error instanceof Error ? error : null;

  // No need to check isListingApproved here - backend validates availability
  const hasUnapprovedItems = false;

  const value: CartContextType = {
    cart,
    items,
    discount,
    isLoading,
    isError,
    error: normalizedError,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    checkout,
    itemCount,
    subtotal,
    total,
    discountAmount,
    hasUnapprovedItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};