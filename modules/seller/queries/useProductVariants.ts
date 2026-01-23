import { trpc } from '@/lib/trpc';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const useProductVariants = (productId?: string) => {
  const queryClient = useQueryClient();

  // Get all variants
  const getAllVariants = trpc.variants.getVariants.useQuery(undefined, {
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Get variants for specific product
  const getVariantsByProduct = () => {
    return trpc.variants.getVariantsByProduct.useQuery(
      { productId: productId! },
      { enabled: !!productId, staleTime: 1000 * 60 * 5 }
    );
  };

  // Create variant
  const createVariant = useMutation({
    mutationFn: async (data: {
      productId: string;
      name: string;
      value: string;
      stock: number;
      price?: number;
      sku?: string;
    }) => await (trpc.variants.createVariant as any).mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });

  // Update variant
  const updateVariant = useMutation({
    mutationFn: async (data: {
      variantId: string;
      name?: string;
      value?: string;
      stock?: number;
      price?: number;
      sku?: string;
    }) => await (trpc.variants.updateVariant as any).mutate(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });

  // Delete variant
  const deleteVariant = useMutation({
    mutationFn: async (variantId: string) => await (trpc.variants.deleteVariant as any).mutate({ variantId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['variants'] });
    },
  });

  return {
    getAllVariants,
    getVariantsByProduct,
    createVariant,
    updateVariant,
    deleteVariant,
  };
};