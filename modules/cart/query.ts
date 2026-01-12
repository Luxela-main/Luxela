"use client";

import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { useAuth } from "@/context/AuthContext";

/**
 * HOOK: Fetch the current user's cart
 * Corresponds to: getCart
 */
export const useGetCart = () => {
  const { user, loading: authLoading } = useAuth();

  return trpc.cart.getCart.useQuery(undefined, {
    // ONLY run this query if user exists AND auth is done loading
    enabled: !!user && !authLoading,

    staleTime: 1000 * 60 * 5, // 5 minutes

    // Prevents constant retries on 401/error
    retry: false,

    // Optional: keeps the console cleaner during dev
    refetchOnWindowFocus: false,
  });
};

/**
 * HOOK: Add an item to the cart
 * Corresponds to: addToCart
 */
export const useAddToCart = () => {
  const utils = trpc.useContext();

  return trpc.cart.addToCart.useMutation({
    onSuccess: () => {
      // toastSvc.success("Item added to cart successfully.");
      utils.cart.getCart.invalidate();
    },
    onError: (error) => {
      toastSvc.error(error.message || "Failed to add item to cart");
    },
  });
};

/**
 * HOOK: Set or Update quantity
 * Corresponds to: setItemQuantity
 */
export const useUpdateCartItem = () => {
  const utils = trpc.useContext();

  return trpc.cart.setItemQuantity.useMutation({
    onSuccess: () => {
      toastSvc.success("Cart updated successfully.");
      utils.cart.getCart.invalidate();
    },
    onError: (error) => {
      toastSvc.error(error.message || "Failed to update cart");
    },
  });
};

/**
 * HOOK: Remove a specific item from the cart
 * Corresponds to: removeItem
 */
export const useRemoveCartItem = () => {
  const utils = trpc.useContext();

  return trpc.cart.removeItem.useMutation({
    onSuccess: () => {
      toastSvc.success("Item removed from cart.");
      utils.cart.getCart.invalidate();
    },
    onError: (error) => {
      toastSvc.error(error.message || "Failed to remove item");
    },
  });
};

/**
 * HOOK: Clear all items and discounts
 * Corresponds to: clearCart
 */
export const useClearCart = () => {
  const utils = trpc.useContext();

  return trpc.cart.clearCart.useMutation({
    onSuccess: () => {
      toastSvc.success("Cart cleared successfully.");
      utils.cart.getCart.invalidate();
    },
    onError: (error) => {
      toastSvc.error(error.message || "Failed to clear cart");
    },
  });
};

/**
 * HOOK: Apply a discount code
 * Corresponds to: applyDiscount
 */
export const useApplyDiscount = () => {
  const utils = trpc.useContext();

  return trpc.cart.applyDiscount.useMutation({
    onSuccess: () => {
      toastSvc.success("Discount applied successfully.");
      utils.cart.getCart.invalidate();
    },
    onError: (error) => {
      toastSvc.error(error.message || "Invalid discount code");
    },
  });
};

/**
 * HOOK: Process checkout
 * Corresponds to: checkout
 */
export const useCheckout = () => {
  const utils = trpc.useContext();

  return trpc.cart.checkout.useMutation({
    onSuccess: () => {
      toastSvc.success("Order placed successfully!");
      utils.cart.getCart.invalidate();
    },
    onError: (error) => {
      toastSvc.error(error.message || "Checkout failed");
    },
  });
};
