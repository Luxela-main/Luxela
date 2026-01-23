import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { trpc } from '@/lib/trpc';
import { queryKeys } from './queryKeys';

export const useShipping = () => {
  const queryClient = useQueryClient();

  // Calculate shipping cost
  const calculateShippingCost = useQuery({
    queryKey: queryKeys.shipping.costs(),
    queryFn: async () => {
      // This will be called with specific params
      return null;
    },
    enabled: false,
  });

  // Mutation to calculate shipping
  const calculateShipping = useMutation({
    mutationFn: async (input: {
      weight: number;
      fromZipCode: string;
      toZipCode: string;
      country?: string;
    }) => {
      const result = await ((trpc.shipping as any).calculateShippingCost as any).query(input);
      return result;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.shipping.costs(),
        data
      );
    },
    onError: (error: any) => {
      console.error('Shipping calculation error:', error);
    },
  });

  // Get shipping rates
  const getShippingRates = useQuery({
    queryKey: queryKeys.shipping.rates(),
    queryFn: async () => {
      return await ((trpc.shipping as any).getShippingRates as any).query();
    },
  });

  // Estimate multiple shipping options
  const estimateOptions = useMutation({
    mutationFn: async (input: {
      weight: number;
      fromZipCode: string;
      toZipCode: string;
      country?: string;
    }) => {
      return await ((trpc.shipping as any).estimateShippingOptions as any).query(input);
    },
    onSuccess: (data) => {
      queryClient.setQueryData(
        queryKeys.shipping.options(),
        data
      );
    },
  });

  // Validate shipping address
  const validateAddress = useMutation({
    mutationFn: async (input: {
      zipCode: string;
      country?: string;
    }) => {
      return await ((trpc.shipping as any).validateShippingAddress as any).query(input);
    },
  });

  // Get shipping zones reference
  const getShippingZones = useQuery({
    queryKey: queryKeys.shipping.zones(),
    queryFn: async () => {
      return await ((trpc.shipping as any).getShippingZones as any).query();
    },
  });

  return {
    calculateShipping: calculateShipping.mutate,
    calculateShippingAsync: calculateShipping.mutateAsync,
    isCalculating: calculateShipping.isPending,
    shippingCost: calculateShipping.data,
    shippingError: calculateShipping.error,

    getShippingRates: getShippingRates.data,
    isLoadingRates: getShippingRates.isLoading,
    ratesError: getShippingRates.error,

    estimateOptions: estimateOptions.mutate,
    estimateOptionsAsync: estimateOptions.mutateAsync,
    isEstimating: estimateOptions.isPending,
    shippingOptions: estimateOptions.data,
    estimateError: estimateOptions.error,

    validateAddress: validateAddress.mutate,
    validateAddressAsync: validateAddress.mutateAsync,
    isValidating: validateAddress.isPending,
    addressValidation: validateAddress.data,
    validationError: validateAddress.error,

    shippingZones: getShippingZones.data,
    isLoadingZones: getShippingZones.isLoading,
    zonesError: getShippingZones.error,
  };
};