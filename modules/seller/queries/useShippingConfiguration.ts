import { trpc } from '@/lib/trpc';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export const useShippingConfiguration = (sellerId: string) => {
  const queryClient = useQueryClient();

  // Get reference shipping rates
  const getShippingRates = trpc.shipping.getShippingRates.useQuery(undefined, {
    staleTime: 1000 * 60 * 5,
  });

  // Get seller-specific shipping rates
  const getSellerShippingRates = trpc.shipping.getSellerShippingRates.useQuery(
    { sellerId },
    { enabled: !!sellerId, staleTime: 1000 * 60 * 5 }
  );

  // Create shipping rate
  const createShippingRate = useMutation({
    mutationFn: async (data: {
      sellerId: string;
      shippingZone: string;
      minWeight: number;
      maxWeight: number;
      rateCents: number;
      currency?: string;
      estimatedDays: number;
      shippingType: 'same_day' | 'next_day' | 'express' | 'standard' | 'domestic' | 'international' | 'both';
      active?: boolean;
    }) => await (trpc.shipping.createShippingRate as any).mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping', 'rates'] });
    },
  });

  // Update shipping rate
  const updateShippingRate = useMutation({
    mutationFn: async (data: {
      rateId: string;
      baseCost?: number;
      costPerKg?: number;
      estimatedDays?: number;
      enabled?: boolean;
    }) => await (trpc.shipping.updateShippingRate as any).mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping', 'rates'] });
    },
  });

  // Delete shipping rate
  const deleteShippingRate = useMutation({
    mutationFn: async (rateId: string) => await (trpc.shipping.deleteShippingRate as any).mutate({ rateId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shipping', 'rates'] });
    },
  });

  // Calculate shipping cost from database
  const calculateShippingCostFromRate = useMutation({
    mutationFn: async (data: { sellerId: string; weight: number; zone: string }) =>
      await (trpc.shipping.calculateShippingCostFromRate as any).mutate(data),
  });

  // Calculate standard shipping cost
  const calculateShippingCost = useMutation({
    mutationFn: async (data: {
      weight: number;
      fromZipCode: string;
      toZipCode: string;
      country?: string;
    }) => await (trpc.shipping.calculateShippingCost as any).mutate(data),
  });

  return {
    getShippingRates,
    getSellerShippingRates,
    createShippingRate,
    updateShippingRate,
    deleteShippingRate,
    calculateShippingCost,
    calculateShippingCostFromRate,
  };
};