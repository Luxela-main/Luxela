import { trpc } from "@/lib/trpc";

export const useSellerProfile = () => {
  return trpc.seller.getProfile.useQuery(undefined, {
    staleTime: 2 * 60 * 1000,
    retry: 2,
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    gcTime: 10 * 60 * 1000, 
  });
};