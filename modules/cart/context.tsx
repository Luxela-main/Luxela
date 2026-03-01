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

// Helper to serialize error objects for proper console logging
function serializeErrorForLogging(error: any): Record<string, unknown> {
  if (!error) return { value: error };
  
  const result: Record<string, unknown> = {};
  
  // Extract standard Error properties (they're non-enumerable)
  if (error instanceof Error) {
    result.name = error.name;
    result.message = error.message;
    result.stack = error.stack;
  }
  
  // Extract all enumerable properties
  for (const key of Object.keys(error)) {
    const val = error[key];
    // Avoid circular references and deep nesting
    if (val === error) {
      result[key] = '[Circular]';
    } else if (val instanceof Error) {
      result[key] = serializeErrorForLogging(val);
    } else if (typeof val === 'object' && val !== null) {
      try {
        result[key] = JSON.parse(JSON.stringify(val));
      } catch {
        result[key] = '[Object]';
      }
    } else {
      result[key] = val;
    }
  }
  
  // Also extract non-enumerable properties via Object.getOwnPropertyNames
  const allProps = Object.getOwnPropertyNames(error);
  for (const key of allProps) {
    if (!(key in result)) {
      try {
        const descriptor = Object.getOwnPropertyDescriptor(error, key);
        if (descriptor && 'value' in descriptor) {
          const val = descriptor.value;
          if (typeof val !== 'function') {
            result[key] = val;
          }
        }
      } catch {
        // Skip properties we can't access
      }
    }
  }
  
  return result;
}

// Helper to safely extract error message from various error types
function extractErrorMessage(error: any, fallback: string = "An error occurred"): string {
  if (!error) return fallback;
  
  // Handle TRPC errors (most common structure from tRPC mutations)
  if (error?.data?.message && typeof error.data.message === 'string') return error.data.message;
  if (error?.shape?.message && typeof error.shape.message === 'string') return error.shape.message;
  
  // Handle standard Error instances and error-like objects
  if (error?.message && typeof error.message === 'string' && error.message !== '{}') {
    return error.message;
  }
  
  // Handle string errors
  if (typeof error === 'string' && error.trim() !== '' && error !== '{}') {
    return error;
  }
  
  // Handle Error instances
  if (error instanceof Error && error.message) {
    return error.message;
  }
  
  // Try to extract from JSON serialization for plain objects
  try {
    const jsonStr = JSON.stringify(error);
    // Only parse if it looks like it might contain useful info
    if (jsonStr && jsonStr !== '{}' && jsonStr !== 'null' && jsonStr !== 'undefined') {
      const parsed = JSON.parse(jsonStr);
      if (parsed.message && typeof parsed.message === 'string') return parsed.message;
      if (parsed.error) return typeof parsed.error === 'string' ? parsed.error : JSON.stringify(parsed.error);
      if (parsed.reason && typeof parsed.reason === 'string') return parsed.reason;
      // If we got here, object has properties but no message - return JSON for debugging
      return `${fallback} (${jsonStr})`;
    }
  } catch {
    // Ignore JSON parsing errors
  }
  
  // Final fallback: if error is an empty object or unparseable, return fallback
  return fallback;
}

type CartContextType = {
  cart: any;
  items: CartItemType[];
  discount: DiscountType | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  addToCart: (listingId: string, quantity: number, selectedSize?: string, selectedColor?: string, selectedColorHex?: string) => Promise<void>;
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

  const { listings, approvedListings, validateProductForCart, getApprovedListingById, invalidateCachedListing } = useListings();

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

  const addToCart = async (listingId: string, quantity: number, selectedSize?: string, selectedColor?: string, selectedColorHex?: string) => {
    let validation = validateProductForCart(listingId);

    if (quantity <= 0) {
      throw new Error("Invalid quantity. Please select at least 1 item.");
    }

    if (!validation.valid) {
      console.log("[CartContext.addToCart] Initial validation failed:", { 
        listingId, 
        validationReason: validation.reason,
        validationListing: validation.listing ? {
          id: validation.listing.id,
          title: validation.listing.title,
          quantityAvailable: validation.listing.quantity_available,
          source: 'from validateProductForCart'
        } : null,
        approvedListingsCount: approvedListings.length 
      });
      console.log("[CartContext.addToCart] Fetching fresh listing data with skipCache...");
      try {
        const listing = await getApprovedListingById(listingId, true, true);
        if (!listing) {
          // Product not found in catalog - throw error with clear message
          console.warn("[CartContext.addToCart] Product not found in catalog:", { listingId });
          throw new Error(validation.reason || "This product is not available or has been removed from the catalog");
        } else {
          console.log("[CartContext.addToCart] Fresh listing data fetched:", { 
            listingId, 
            quantityAvailable: listing.quantity_available,
            title: listing.title 
          });
          if ((listing.quantity_available || 0) <= 0) {
            console.error("[CartContext.addToCart] Product out of stock:", { 
              listingId, 
              quantityAvailable: listing.quantity_available 
            });
            // Invalidate cache to ensure fresh data on next attempt
            invalidateCachedListing(listingId);
            throw new Error("This product is currently out of stock");
          }
          validation.valid = true;
        }
      } catch (error: any) {
        // Handle "not found" / "not available" errors silently - allow backend to validate
        const errorMessage = extractErrorMessage(error, '');
        const isNotFoundError = 
          typeof errorMessage === 'string' && 
          (errorMessage.includes("not found") || errorMessage.includes("not available") || errorMessage.includes("not approved"));
        
        if (!isNotFoundError) {
          // Re-throw actual errors (out of stock, etc.)
          const message = extractErrorMessage(error, validation.reason || "This product cannot be added to your cart");
          console.error("[CartContext.addToCart] Validation error:", { 
            listingId, 
            message, 
            errorType: error?.constructor?.name || typeof error,
            error: serializeErrorForLogging(error)
          });
          throw new Error(message);
        }
        
        // For "not found" errors, allow backend to do final validation
        console.warn("[CartContext.addToCart] Allowing backend validation for uncached product:", { listingId, errorMessage });
      }
    }

    try {
      console.log("[CartContext.addToCart] Attempting to add to cart:", { listingId, quantity, selectedSize, selectedColor, selectedColorHex });
      await addToCartMutation.mutateAsync({ listingId, quantity, selectedSize, selectedColor, selectedColorHex });
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
      
      // Ensure we always have a valid string message
      if (!errorMessage || typeof errorMessage !== 'string') {
        errorMessage = "Failed to add to cart";
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