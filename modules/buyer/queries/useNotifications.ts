import { trpc } from "@/lib/trpc";

/**
 * Unified notifications query from buyerNotifications router
 * Returns { notifications, total, unreadCount } for real-time updates
 */
export const useUnifiedNotifications = () => {
  return (trpc.buyerNotifications as any).getNotifications.useQuery(
    { limit: 100, offset: 0 },
    {
      staleTime: 1000 * 5,
      gcTime: 1000 * 60 * 10,
      refetchInterval: 1000 * 5,
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );
};

export const useNotifications = () => {
  return trpc.buyer.getNotifications.useQuery(
    { page: 1, limit: 100 },
    {
      staleTime: 1000 * 5,
      gcTime: 1000 * 60 * 10, 
      refetchInterval: 1000 * 5, 
      refetchOnWindowFocus: true, 
      refetchOnReconnect: true,
      retry: 3, 
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000), 
    }
  );
};

/**
 * Get real-time unread notification count
 * Uses unified notifications endpoint for accurate count
 */
export const useNotificationsCount = () => {
  const { data } = useUnifiedNotifications();
  // unreadCount comes directly from the API response
  return data?.unreadCount ?? 0;
};

export const useMarkNotificationAsRead = () => {
  const utils = trpc.useUtils();

  return (trpc.buyer as any).markNotificationAsRead.useMutation({
    onSuccess: async () => {
      await (utils.buyer as any).getNotifications.invalidate();
      await (utils.buyer as any).getNotifications.refetch();
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const utils = trpc.useUtils();

  return (trpc.buyer as any).markAllNotificationsAsRead.useMutation({
    onSuccess: async () => {
      await (utils.buyer as any).getNotifications.invalidate();
      await (utils.buyer as any).getNotifications.refetch();
    },
  });
};

export const useToggleNotificationFavorite = () => {
  const utils = trpc.useUtils();

  return (trpc.buyer as any).toggleNotificationFavorite.useMutation({
    onSuccess: async () => {
      await (utils.buyer as any).getNotifications.invalidate();
      await (utils.buyer as any).getNotifications.refetch();
    },
  });
};

export const useDeleteNotification = () => {
  const utils = trpc.useUtils();

  return (trpc.buyer as any).deleteNotification.useMutation({
    onSuccess: async () => {
      await (utils.buyer as any).getNotifications.invalidate();
      await (utils.buyer as any).getNotifications.refetch();
    },
  });
};

export const useDeleteAllNotifications = () => {
  const utils = trpc.useUtils();

  return (trpc.buyer as any).deleteAllNotifications.useMutation({
    onSuccess: async () => {
      await (utils.buyer as any).getNotifications.invalidate();
      await (utils.buyer as any).getNotifications.refetch();
    },
  });
};