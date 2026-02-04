import { trpc } from "@/lib/trpc";

export const useMyCollections = () => {
  return (trpc.listing as any).getMyCollections.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: undefined, // Disable auto-refetch
    refetchOnWindowFocus: false, // Disable window focus refetch
    refetchOnReconnect: true,
    retry: 2,
    retryDelay: 1000,
  });
};