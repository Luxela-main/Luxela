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
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await utils.cart.getCart.cancel?.();

      // Get current cart data
      const previousData = utils.cart.getCart.getData?.();

      // Optimistically update the item quantity
      if (previousData) {
        utils.cart.getCart.setData?.(
          undefined,
          {
            ...previousData,
            items: previousData.items.map((item: any) =>
              item.listingId === variables.listingId
                ? { ...item, quantity: variables.quantity }
                : item
            ),
          } as any
        );
      }

      return { previousData };
    },
    onSuccess: async () => {
      toastSvc.success("Cart updated successfully.");
      // Invalidate to ensure cache matches server state
      await utils.cart.getCart.invalidate?.();
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        utils.cart.getCart.setData?.(undefined, context.previousData as any);
      }
      const errorMessage = error?.data?.message || error?.message || "Failed to update cart";
      toastSvc.error(errorMessage);
    },
  });
};

export const useRemoveCartItem = () => {
  const utils = trpc.useContext();

  return trpc.cart.removeItem.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing queries to prevent overwriting optimistic update
      await utils.cart.getCart.cancel?.();

      // Get current cart data
      const previousData = utils.cart.getCart.getData?.();

      // Optimistically remove the item from local cache
      if (previousData) {
        utils.cart.getCart.setData?.(
          undefined,
          {
            ...previousData,
            items: previousData.items.filter((item: any) => item.listingId !== variables.listingId),
          } as any
        );
      }

      return { previousData };
    },
    onSuccess: async () => {
      toastSvc.success("Item removed from cart.");
      // Invalidate to ensure cache matches server state
      await utils.cart.getCart.invalidate?.();
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        utils.cart.getCart.setData?.(undefined, context.previousData as any);
      }
      const errorMessage = error?.data?.message || error?.message || "Failed to remove item";
      toastSvc.error(errorMessage);
    },
  });
};

export const useClearCart = () => {
  const utils = trpc.useContext();

  return trpc.cart.clearCart.useMutation({
    onMutate: async () => {
      // Cancel outgoing queries
      await utils.cart.getCart.cancel?.();

      // Get current cart data
      const previousData = utils.cart.getCart.getData?.();

      // Optimistically clear the cart
      if (previousData) {
        utils.cart.getCart.setData?.(undefined, {
          ...previousData,
          items: [],
        } as any);
      }

      return { previousData };
    },
    onSuccess: async () => {
      toastSvc.success("Cart cleared successfully.");
      // Invalidate to ensure cache matches server state
      await utils.cart.getCart.invalidate?.();
    },
    onError: (error: any, variables, context) => {
      // Rollback optimistic update on error
      if (context?.previousData) {
        utils.cart.getCart.setData?.(undefined, context.previousData as any);
      }
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