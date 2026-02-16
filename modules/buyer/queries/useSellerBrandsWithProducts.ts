import { trpc } from "@/lib/trpc-client";

/**
 * Fetch all seller's brands with their associated products
 * Products are fetched from listings and organized by brand
 */
export function useSellerBrandsWithProducts(
  sellerId: string | null,
  options?: {
    page?: number;
    limit?: number;
    enabled?: boolean;
  }
) {
  const { page = 1, limit = 20, enabled = true } = options || {};

  // Using getAllBrands to fetch all brands (filter by sellerId in component if needed)
  return trpc.brands.getAllBrands.useQuery(
    {
      page,
      limit,
      search: undefined,
      sortBy: 'followers',
    },
    {
      enabled: enabled && !!sellerId,
    }
  );
}

/**
 * Fetch a specific seller's brand with its products
 * Use this to get a single brand's products
 */
export function useSellerBrandWithProducts(
  brandId: string | null,
  sellerId: string | null,
  options?: {
    enabled?: boolean;
  }
) {
  const { enabled = true } = options || {};

  const { data, isLoading, error } = useSellerBrandsWithProducts(sellerId, {
    limit: 100,
    enabled: enabled && !!sellerId,
  });

  // Filter to get only the requested brand
  const brand = data?.brands?.find((b: any) => b.id === brandId);

  return {
    brand,
    isLoading,
    error,
  };
}