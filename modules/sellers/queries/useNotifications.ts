import { trpc } from "@/lib/trpc";

export const useNotifications = () => {
  return trpc.sellerNotifications.getNotifications.useQuery({}, {
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 5,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex: number) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
};

export const useMarkNotificationAsRead = () => {
  const utils = trpc.useUtils();

  return trpc.sellerNotifications.markAsRead.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await utils.sellerNotifications.getNotifications.cancel();

      // Get current data
      const previousData = utils.sellerNotifications.getNotifications.getData({});

      // Optimistically update the data
      if (previousData) {
        utils.sellerNotifications.getNotifications.setData(
          {},
          {
            notifications: previousData.notifications.map((notif: any) =>
              notif.id === variables.notificationId
                ? { ...notif, isRead: true }
                : notif
            ),
          }
        );
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.sellerNotifications.getNotifications.setData(
          {},
          context.previousData
        );
      }
    },
    onSuccess: async () => {
      // Invalidate counts but not the full list - we already have optimistic data
      await utils.sellerNotifications.getUnreadCount.invalidate();
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const utils = trpc.useUtils();

  return trpc.sellerNotifications.markAllAsRead.useMutation({
    onSuccess: async () => {
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
    },
  });
};

export const useToggleNotificationStar = () => {
  const utils = trpc.useUtils();

  return trpc.sellerNotifications.toggleStar.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await utils.sellerNotifications.getNotifications.cancel();

      // Get current data
      const previousData = utils.sellerNotifications.getNotifications.getData({});

      // Optimistically update the data
      if (previousData) {
        utils.sellerNotifications.getNotifications.setData(
          {},
          {
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
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.sellerNotifications.getNotifications.setData(
          {},
          context.previousData
        );
      }
    },
    onSuccess: async () => {
      // Revalidate after a short delay to ensure server has processed the mutation
      // This ensures the next refetch gets the latest data from the server
      setTimeout(() => {
        utils.sellerNotifications.getNotifications.invalidate();
      }, 500);
    },
  });
};

export const useStarredNotifications = () => {
  return trpc.sellerNotifications.getNotifications.useQuery({}, {
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 5,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useDeleteNotification = () => {
  const utils = trpc.useUtils();

  return trpc.sellerNotifications.deleteNotification.useMutation({
    onMutate: async (variables) => {
      // Cancel outgoing queries
      await utils.sellerNotifications.getNotifications.cancel();

      // Get current data
      const previousData = utils.sellerNotifications.getNotifications.getData({});

      // Optimistically remove the notification
      if (previousData) {
        utils.sellerNotifications.getNotifications.setData(
          {},
          {
            notifications: previousData.notifications.filter(
              (notif: any) => notif.id !== variables.notificationId
            ),
          }
        );
      }

      return { previousData };
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        utils.sellerNotifications.getNotifications.setData(
          {},
          context.previousData
        );
      }
    },
    onSuccess: async () => {
      // Invalidate counts
      await utils.sellerNotifications.getUnreadCount.invalidate();
    },
  });
};

export const useDeleteAllNotifications = () => {
  const utils = trpc.useUtils();

  return trpc.sellerNotifications.deleteAllNotifications.useMutation({
    onMutate: async () => {
      // Cancel any outgoing queries
      await (utils.sellerNotifications as any).getNotifications.cancel();
      await (utils.sellerNotifications as any).getUnreadCount.cancel();

      // Set optimistic data
      (utils.sellerNotifications as any).getNotifications.setData({}, []);
      (utils.sellerNotifications as any).getUnreadCount.setData({}, { count: 0 });
    },
    onError: async () => {
      // Refetch to restore correct state on error
      await (utils.sellerNotifications as any).getNotifications.invalidate();
      await (utils.sellerNotifications as any).getUnreadCount.invalidate();
    },
    onSuccess: async () => {
      await (utils.sellerNotifications as any).getNotifications.invalidate();
      await (utils.sellerNotifications as any).getUnreadCount.invalidate();
    },
  });
};