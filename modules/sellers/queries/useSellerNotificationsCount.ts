import { trpc } from "@/lib/trpc";

/**
 * Hook to get ONLY unread notification count for badge
 * Uses lightweight optimized query that polls frequently
 */
export const useSellerNotificationsCount = () => {
  return trpc.sellerNotifications.getUnreadCount.useQuery(undefined, {
    staleTime: 1000 * 5, 
    gcTime: 1000 * 60,
    refetchInterval: 1000 * 10,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
};