'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { getVanillaTRPCClient } from '@/lib/trpc';
const trpc = getVanillaTRPCClient();
import { useToast } from '@/hooks/use-toast';
import { sellerQueryKeys } from './queryKeys';

export interface UpdateListingInput {
  id: string;
  title?: string;
  description?: string | null;
  category?: string | null;
  image?: string | null;
  images?: string[];
  priceCents?: number | null;
  currency?: string | null;
  sizes?: string[];
  supplyCapacity?: 'no_max' | 'limited' | null;
  quantityAvailable?: number | null;
  limitedEditionBadge?: 'show_badge' | 'do_not_show' | null;
  releaseDuration?: '24hrs' | '48hrs' | '72hrs' | '1week' | '2weeks' | '1month' | null;
  materialComposition?: string | null;
  colorsAvailable?: string[] | null;
  additionalTargetAudience?: 'male' | 'female' | 'unisex' | 'kids' | 'teens' | null;
  shippingOption?: 'local' | 'international' | 'both' | null;
  etaDomestic?: 'same_day' | 'next_day' | '48hrs' | '72hrs' | '5_working_days' | '1_2_weeks' | '2_3_weeks' | 'custom' | null;
  etaInternational?: 'same_day' | 'next_day' | '48hrs' | '72hrs' | '5_working_days' | '1_2_weeks' | '2_3_weeks' | 'custom' | null;
}

/**
 * Hook to update a listing with cache invalidation and notifications
 * 
 * Features:
 * - Optimistic updates to UI
 * - Auto-invalidates related queries
 * - Toast notifications for success/error
 * - Automatic cache cleanup
 * 
 * @example
 * ```tsx
 * const updateMutation = useUpdateListing();
 * 
 * const handleUpdate = async () => {
 *   updateMutation.mutate({
 *     id: listingId,
 *     title: 'New Title',
 *     priceCents: 9999,
 *     quantityAvailable: 50
 *   });
 * };
 * ```
 */
export function useUpdateListing() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (input: UpdateListingInput) => {
      const result = await (trpc.listing.updateListing as any).mutate(input);
      return result;
    },

    // Optimistic update
    onMutate: async (input: UpdateListingInput) => {
      // Cancel outgoing refetches to prevent race conditions
      await queryClient.cancelQueries({ queryKey: sellerQueryKeys.inventory() });

      // Snapshot previous state for rollback
      const previousListings = queryClient.getQueryData(sellerQueryKeys.inventory());

      // Return context for rollback
      return { previousListings };
    },

    // Success handler
    onSuccess: async (data, input) => {
      // Invalidate related queries to refetch
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: sellerQueryKeys.inventory() }),
        queryClient.invalidateQueries({ queryKey: sellerQueryKeys.inventoryByListing(input.id) }),
        queryClient.invalidateQueries({ queryKey: sellerQueryKeys.sales() }),
      ]);

      // Show success toast
      toast({
        title: 'Success',
        description: `Listing "${data.title}" updated successfully`,
        variant: 'default',
        duration: 3000,
      });
    },

    // Error handler
    onError: (error, input, context) => {
      // Rollback optimistic update if needed
      if (context?.previousListings) {
        queryClient.setQueryData(
          sellerQueryKeys.inventory(),
          context.previousListings
        );
      }

      // Show error toast
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to update listing';

      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
      });

      console.error('[useUpdateListing Error]', error);
    },

    // Final handler
    onSettled: async () => {
      // Ensure queries are in sync
      await queryClient.refetchQueries({
        queryKey: sellerQueryKeys.inventory(),
      });
    },
  });
}

/**
 * Hook to update listing price specifically
 * 
 * @example
 * ```tsx
 * const updatePrice = useUpdateListingPrice();
 * updatePrice.mutate({ id: listingId, priceCents: 5000 });
 * ```
 */
export function useUpdateListingPrice() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; priceCents: number }) => {
      return await (trpc.listing.updateListing as any).mutate({
        id: input.id,
        priceCents: input.priceCents,
      });
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.inventoryByListing(data.id) });

      toast({
        title: 'Success',
        description: `Price updated to ${data.currency} ${(data.priceCents! / 100).toFixed(2)}`,
        variant: 'default',
      });
    },

    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update price',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update listing stock/quantity
 * 
 * @example
 * ```tsx
 * const updateStock = useUpdateListingStock();
 * updateStock.mutate({ id: listingId, quantityAvailable: 100 });
 * ```
 */
export function useUpdateListingStock() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { id: string; quantityAvailable: number }) => {
      return await (trpc.listing.updateListing as any).mutate({
        id: input.id,
        quantityAvailable: input.quantityAvailable,
      });
    },

    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.inventory() });
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.inventoryByListing(data.id) });

      toast({
        title: 'Success',
        description: `Stock updated to ${data.quantityAvailable} units`,
        variant: 'default',
      });
    },

    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update stock',
        variant: 'destructive',
      });
    },
  });
}

/**
 * Hook to update listing shipping settings
 * 
 * @example
 * ```tsx
 * const updateShipping = useUpdateListingShipping();
 * updateShipping.mutate({
 *   id: listingId,
 *   shippingOption: 'both',
 *   etaDomestic: 'next_day'
 * });
 * ```
 */
export function useUpdateListingShipping() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: {
      id: string;
      shippingOption?: 'local' | 'international' | 'both';
      etaDomestic?: string;
      etaInternational?: string;
    }) => {
      return await (trpc.listing.updateListing as any).mutate({
        id: input.id,
        shippingOption: input.shippingOption,
        etaDomestic: input.etaDomestic as any,
        etaInternational: input.etaInternational as any,
      });
    },

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellerQueryKeys.inventory() });

      toast({
        title: 'Success',
        description: 'Shipping settings updated',
        variant: 'default',
      });
    },

    onError: (error) => {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update shipping',
        variant: 'destructive',
      });
    },
  });
}