"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";

const cartQueryKeys = {
  all: ["cart"] as const,
  items: () => [...cartQueryKeys.all, "items"] as const,
  summary: () => [...cartQueryKeys.all, "summary"] as const,
};

export function useCartItems() {
  return useQuery({
    queryKey: cartQueryKeys.items(),
    queryFn: async () => {
      try {
        const result = await ((trpc.cart as any).getCart as any).query();
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useCartSummary() {
  return useQuery({
    queryKey: cartQueryKeys.summary(),
    queryFn: async () => {
      try {
        const result = await ((trpc.cart as any).getCartSummary as any).query();
        return result;
      } catch (err) {
        throw err;
      }
    },
    staleTime: 30 * 1000, // 30 seconds
  });
}

export function useAddToCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { listingId: string; quantity: number }) => {
      return (trpc.cart as any).addToCart.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Added to cart");
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.summary() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { listingId: string; quantity: number }) => {
      return (trpc.cart as any).setItemQuantity.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Cart updated");
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.summary() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useRemoveFromCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (listingId: string) => {
      return (trpc.cart as any).removeItem.mutate({ listingId });
    },
    onSuccess: () => {
      toastSvc.success("Removed from cart");
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.summary() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      return (trpc.cart as any).clearCart.mutate();
    },
    onSuccess: () => {
      toastSvc.success("Cart cleared");
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.summary() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}

export function useCheckout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      paymentMethod: 'card' | 'bank_transfer' | 'crypto';
    }) => {
      return (trpc.cart as any).checkout.mutate(input);
    },
    onSuccess: () => {
      toastSvc.success("Checkout successful");
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.items() });
      queryClient.invalidateQueries({ queryKey: cartQueryKeys.summary() });
    },
    onError: (error: any) => {
      toastSvc.apiError(error);
    },
  });
}