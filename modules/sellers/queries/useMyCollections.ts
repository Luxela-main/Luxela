import { trpc } from "@/lib/trpc";

export const useMyCollections = () => {
  return (trpc.listing as any).getMyCollections.useQuery(undefined, {
    staleTime: 1 * 1000,
    gcTime: 10 * 60 * 1000, 
    refetchInterval: 3 * 1000, 
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });
};