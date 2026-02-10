import { trpc } from "@/lib/trpc";

/**
 * Hook to get ONLY unread listing notification count for badge
 * Uses lightweight optimized query that polls frequently
 */
export const useSellerNotificationsCount = () => {
  const query = trpc.sellerListingNotifications.getUnreadCount.useQuery(undefined, {
    staleTime: 1000 * 5, 
    gcTime: 1000 * 60,
    refetchInterval: 1000 * 10,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 2,
  });
  const count = query.data?.count ?? 0;
  return {
    ...query,
    data: count,
  };
};

/**
 * Lightweight version for less frequent updates
 * Useful for components that don't need real-time updates
 */
export const useSellerNotificationsCountLightweight = () => {
  const query = trpc.sellerListingNotifications.getUnreadCount.useQuery(undefined, {
    staleTime: 1000 * 10,
    gcTime: 1000 * 60 * 15,
    refetchInterval: 1000 * 30,
    refetchOnWindowFocus: true,
    retry: 2,
  });
  const count = query.data?.count ?? 0;
  return {
    ...query,
    data: count,
  };
};

/**
 * Aggressive version for real-time updates
 * Polls every 5 seconds and includes background refetch
 */
export const useSellerNotificationsCountAggressive = () => {
  const query = trpc.sellerListingNotifications.getUnreadCount.useQuery(undefined, {
    staleTime: 1000 * 2,
    gcTime: 1000 * 60 * 5,
    refetchInterval: 1000 * 5,
    refetchOnWindowFocus: true,
    refetchIntervalInBackground: true,
    retry: 2,
  });
  const count = query.data?.count ?? 0;
  return {
    ...query,
    data: count,
  };
};