import { useMutation, useQueryClient } from "@tanstack/react-query";
import { sellersKeys } from "./queryKeys";
import { toastSvc } from "@/services/toast";
import { getVanillaTRPCClient } from "@/lib/trpc";

export interface CreateSingleListingInput {
  title: string;
  category?: string | null;
  priceCents?: number | null;
  currency?: string | null;
  description?: string | null;
  image?: string | null;
  images?: string[];
  sizes?: string[];
  supplyCapacity?: "no_max" | "limited" | null;
  quantityAvailable?: number | null;
  limitedEditionBadge?: "show_badge" | "do_not_show" | null;
  releaseDuration?: string | null;
  materialComposition?: string | null;
  colorsAvailable?: string[] | null;
  additionalTargetAudience?: string | null;
  shippingOption?: string | null;
  etaDomestic?: string | null;
  etaInternational?: string | null;
  itemsJson?: any[] | null;
  productId?: string | null;
  collectionId?: string | null;
}

export const useCreateSingleListing = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateSingleListingInput) => {
      const client: any = getVanillaTRPCClient();
      return await client.listing.createSingle.mutate(input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sellersKeys.listings() });
      toastSvc.success("Product created successfully");
    },
    onError: (error: any) => {
      const message = error?.message || "Failed to create product";
      toastSvc.error(message);
    },
  });
};