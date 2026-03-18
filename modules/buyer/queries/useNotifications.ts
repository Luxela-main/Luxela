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
    onMutate: async (variables: { notificationId: string }) => {
      // Cancel outgoing queries
      await (utils.buyerNotifications as any).getNotifications.cancel();

      // Get current data
      const previousData = (utils.buyerNotifications as any).getNotifications.getData({});

      // Optimistically update the data
      if (previousData) {
        (utils.buyerNotifications as any).getNotifications.setData(
          {},
          {
            ...previousData,
            notifications: previousData.notifications.map((notif: any) =>
              notif.id === variables.notificationId
                ? { ...notif, isRead: true }
                : notif
            ),
            unreadCount: Math.max(0, (previousData.unreadCount ?? 0) - 1),
          }
        );
      }

      return { previousData };
    },
    onError: (err: any, variables: any, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        (utils.buyerNotifications as any).getNotifications.setData(
          {},
          context.previousData
        );
      }
    },
    onSettled: async () => {
      // Always refetch to ensure cache is in sync with server
      await (utils.buyerNotifications as any).getNotifications.invalidate();
      await (utils.buyerNotifications as any).getUnreadCount.invalidate();
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const utils = trpc.useUtils();

  return (trpc.buyerNotifications as any).markAllAsRead.useMutation({
    onMutate: async () => {
      // Cancel outgoing queries
      await (utils.buyerNotifications as any).getNotifications.cancel();

      // Get current data
      const previousData = (utils.buyerNotifications as any).getNotifications.getData({});

      // Optimistically mark all as read
      if (previousData) {
        (utils.buyerNotifications as any).getNotifications.setData(
          {},
          {
            ...previousData,
            notifications: previousData.notifications.map((notif: any) =>
              notif.isRead ? notif : { ...notif, isRead: true }
            ),
            unreadCount: 0,
          }
        );
      }

      return { previousData };
    },
    onError: (err: any, variables: any, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        (utils.buyerNotifications as any).getNotifications.setData(
          {},
          context.previousData
        );
      }
    },
    onSettled: async () => {
      // Always refetch to ensure cache is in sync with server
      await (utils.buyerNotifications as any).getNotifications.invalidate();
      await (utils.buyerNotifications as any).getUnreadCount.invalidate();
    },
  });
};

export const useToggleNotificationFavorite = () => {
  const utils = trpc.useUtils();

  return (trpc.buyerNotifications as any).toggleStar.useMutation({
    onMutate: async (variables: { notificationId: string; starred: boolean }) => {
      // Cancel outgoing queries
      await (utils.buyerNotifications as any).getNotifications.cancel();

      // Get current data
      const previousData = (utils.buyerNotifications as any).getNotifications.getData({});

      // Optimistically update the data
      if (previousData) {
        (utils.buyerNotifications as any).getNotifications.setData(
          {},
          {
            ...previousData,
            notifications: previousData.notifications.map((notif: any) =>
              notif.id === variables.notificationId
                ? { ...notif, isStarred: variables.starred }
                : notif
            ),
          }
        );
      }

      return { previousData };
    },
    onError: (err: any, variables: any, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        (utils.buyerNotifications as any).getNotifications.setData(
          {},
          context.previousData
        );
      }
    },
    onSettled: async () => {
      // Always refetch to ensure cache is in sync with server
      await (utils.buyerNotifications as any).getNotifications.invalidate();
    },
  });
};

export const useDeleteNotification = () => {
  const utils = trpc.useUtils();

  return (trpc.buyerNotifications as any).deleteNotification.useMutation({
    onMutate: async (variables: { notificationId: string }) => {
      // Cancel outgoing queries
      await (utils.buyerNotifications as any).getNotifications.cancel();

      // Get current data
      const previousData = (utils.buyerNotifications as any).getNotifications.getData({});

      // Optimistically remove the notification
      if (previousData) {
        const deletedNotif = previousData.notifications.find((n: any) => n.id === variables.notificationId);
        (utils.buyerNotifications as any).getNotifications.setData(
          {},
          {
            ...previousData,
            notifications: previousData.notifications.filter(
              (notif: any) => notif.id !== variables.notificationId
            ),
            total: Math.max(0, (previousData.total ?? 0) - 1),
            unreadCount: deletedNotif?.isRead 
              ? previousData.unreadCount 
              : Math.max(0, (previousData.unreadCount ?? 0) - 1),
          }
        );
      }

      return { previousData };
    },
    onError: (err: any, variables: any, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        (utils.buyerNotifications as any).getNotifications.setData(
          {},
          context.previousData
        );
      }
    },
    onSettled: async () => {
      // Always refetch to ensure cache is in sync with server
      await (utils.buyerNotifications as any).getNotifications.invalidate();
      await (utils.buyerNotifications as any).getUnreadCount.invalidate();
    },
  });
};

export const useDeleteAllNotifications = () => {
  const utils = trpc.useUtils();

  return (trpc.buyerNotifications as any).clearAll.useMutation({
    onMutate: async () => {
      // Cancel any outgoing queries
      await (utils.buyerNotifications as any).getNotifications.cancel();
      await (utils.buyerNotifications as any).getUnreadCount.cancel();

      // Get current data for rollback
      const previousData = (utils.buyerNotifications as any).getNotifications.getData({});

      // Set optimistic data
      (utils.buyerNotifications as any).getNotifications.setData(
        {},
        { notifications: [], total: 0, unreadCount: 0 }
      );

      return { previousData };
    },
    onError: (err: any, variables: any, context: any) => {
      // Rollback on error
      if (context?.previousData) {
        (utils.buyerNotifications as any).getNotifications.setData(
          {},
          context.previousData
        );
      }
    },
    onSettled: async () => {
      // Always refetch to ensure cache is in sync with server
      await (utils.buyerNotifications as any).getNotifications.invalidate();
      await (utils.buyerNotifications as any).getUnreadCount.invalidate();
    },
  });
};