import { trpc as api } from '@/app/_trpc/client';

export const useBuyerNotificationsCount = () => {
  const { data } = api.buyerNotifications.getUnreadCount.useQuery(
    undefined,
    {
      staleTime: 1000 * 5,
      gcTime: 1000 * 60 * 10,
      refetchInterval: 1000 * 10,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  return data?.count ?? 0;
};

export const useBuyerNotificationsCountLightweight = () => {
  const { data } = api.buyerNotifications.getUnreadCount.useQuery(
    undefined,
    {
      staleTime: 1000 * 10,
      gcTime: 1000 * 60 * 15,
      refetchInterval: 1000 * 30,
      refetchOnWindowFocus: true,
      retry: 2,
      retryDelay: 1000,
    }
  );

  return data?.count ?? 0;
};

export const useBuyerNotificationsCountAggressive = () => {
  const { data, isLoading } = api.buyerNotifications.getUnreadCount.useQuery(
    undefined,
    {
      staleTime: 1000 * 2,
      gcTime: 1000 * 60 * 5,
      refetchInterval: 1000 * 5,
      refetchOnWindowFocus: true,
      refetchIntervalInBackground: true,
      retry: 3,
      retryDelay: 500,
    }
  );

  return {
    unreadCount: data?.count ?? 0,
    isLoading,
  };
};