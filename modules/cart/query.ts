"use client";

import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";
import { useAuth } from "@/context/AuthContext";

export const useGetCart = () => {
  const { user, loading: authLoading } = useAuth();

  return trpc.cart.getCart.useQuery(undefined, {
    enabled: !!user && !authLoading,
    staleTime: 30 * 1000, // 30 seconds - cart data updates frequently
    retry: false,
    refetchOnWindowFocus: true, // Refetch when user returns to window
  });
};

export const useAddToCart = () => {
  const utils = trpc.useContext();

  return trpc.cart.addToCart.useMutation({
    onSuccess: async () => {
      // Immediately refetch the cart to show newly added items
      await utils.cart.getCart.refetch();
    },
    onError: (error: any) => {
      // Extract error message from TRPC error structure
      let errorMessage = "Failed to add item to cart";
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
        console.warn('[useAddToCart] Unable to extract standard error message from:', error);
      }
      
      console.error('[useAddToCart] Error:', { 
        message: errorMessage,
        code: errorCode,
        errorType: typeof error,
        fullError: error,
      });
      toastSvc.error(errorMessage);
    },
  });
};

export const useUpdateCartItem = () => {
  const utils = trpc.useContext();

  return trpc.cart.setItemQuantity.useMutation({
    onSuccess: async () => {
      toastSvc.success("Cart updated successfully.");
      await utils.cart.getCart.refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || error?.message || "Failed to update cart";
      toastSvc.error(errorMessage);
    },
  });
};

export const useRemoveCartItem = () => {
  const utils = trpc.useContext();

  return trpc.cart.removeItem.useMutation({
    onSuccess: async () => {
      toastSvc.success("Item removed from cart.");
      await utils.cart.getCart.refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || error?.message || "Failed to remove item";
      toastSvc.error(errorMessage);
    },
  });
};

export const useClearCart = () => {
  const utils = trpc.useContext();

  return trpc.cart.clearCart.useMutation({
    onSuccess: async () => {
      toastSvc.success("Cart cleared successfully.");
      await utils.cart.getCart.refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || error?.message || "Failed to clear cart";
      toastSvc.error(errorMessage);
    },
  });
};

export const useApplyDiscount = () => {
  const utils = trpc.useContext();

  return trpc.cart.applyDiscount.useMutation({
    onSuccess: async () => {
      toastSvc.success("Discount applied successfully.");
      await utils.cart.getCart.refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || error?.message || "Invalid discount code";
      toastSvc.error(errorMessage);
    },
  });
};

export const useCheckout = () => {
  const utils = trpc.useContext();

  return trpc.cart.checkout.useMutation({
    onSuccess: async () => {
      toastSvc.success("Order placed successfully!");
      await utils.cart.getCart.refetch();
    },
    onError: (error: any) => {
      const errorMessage = error?.data?.message || error?.message || "Checkout failed";
      toastSvc.error(errorMessage);
    },
  });
};