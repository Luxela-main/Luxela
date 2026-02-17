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
 * Returns the full query object to maintain React Query's polling lifecycle
 */
export const useNotificationsCount = () => {
  const query = useUnifiedNotifications();
  const count = query.data?.unreadCount ?? 0;
  
  return {
    ...query,
    data: count,
  };
};

export const useMarkNotificationAsRead = () => {
  const utils = trpc.useUtils();

  return (trpc.buyerNotifications as any).markAsRead.useMutation({
    onSuccess: async () => {
      // Invalidate the unified notifications endpoint to update badge count
      await (utils.buyerNotifications as any).getNotifications.invalidate();
      await (utils.buyerNotifications as any).getUnreadCount.invalidate();
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const utils = trpc.useUtils();

  return (trpc.buyerNotifications as any).markAllAsRead.useMutation({
    onSuccess: async () => {
      // Invalidate both endpoints to update notifications and badge count
      await (utils.buyerNotifications as any).getNotifications.invalidate();
      await (utils.buyerNotifications as any).getUnreadCount.invalidate();
    },
  });
};

export const useToggleNotificationFavorite = () => {
  const utils = trpc.useUtils();

  return (trpc.buyerNotifications as any).toggleStar.useMutation({
    onSuccess: async () => {
      // Invalidate the unified notifications endpoint
      await (utils.buyerNotifications as any).getNotifications.invalidate();
    },
  });
};

export const useDeleteNotification = () => {
  const utils = trpc.useUtils();

  return (trpc.buyerNotifications as any).deleteNotification.useMutation({
    onSuccess: async () => {
      // Invalidate both endpoints to update notifications and badge count
      await (utils.buyerNotifications as any).getNotifications.invalidate();
      await (utils.buyerNotifications as any).getUnreadCount.invalidate();
    },
  });
};

export const useDeleteAllNotifications = () => {
  const utils = trpc.useUtils();

  return (trpc.buyerNotifications as any).clearAll.useMutation({
    onSuccess: async () => {
      // Invalidate both endpoints to update notifications and badge count
      await (utils.buyerNotifications as any).getNotifications.invalidate();
      await (utils.buyerNotifications as any).getUnreadCount.invalidate();
    },
  });
};