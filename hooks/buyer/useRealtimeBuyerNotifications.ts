import { useEffect } from 'react';
import { trpc } from '@/lib/trpc-client';

/**
 * Hook to fetch buyer notifications with real-time polling
 * Refetches every 5 seconds to keep notifications up-to-date
 */
export function useRealtimeBuyerNotifications() {
  const { data: notifications = [], refetch, isLoading, isFetching } = trpc.buyer.getNotifications.useQuery(
    {},
    {
      refetchInterval: 5000, // Poll every 5 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      staleTime: 3000, // Consider data stale after 3 seconds
      gcTime: 10000, // Keep in cache for 10 seconds
    }
  );

  const notificationsList = Array.isArray(notifications) ? notifications : notifications?.data || [];
  const unreadCount = notificationsList.filter((n) => !n.isRead).length;
  const favoriteCount = notificationsList.filter((n) => n.isFavorited).length;

  return {
    notifications,
    unreadCount,
    favoriteCount,
    isLoading,
    isFetching,
    refetch,
  };
}