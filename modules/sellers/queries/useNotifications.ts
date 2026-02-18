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
    onSuccess: async () => {
      // Invalidate the cache - refetch happens automatically
      await utils.sellerNotifications.getNotifications.invalidate();
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
    onSuccess: async () => {
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
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
    onSuccess: async () => {
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
    },
  });
};

export const useDeleteAllNotifications = () => {
  const utils = trpc.useUtils();

  return trpc.sellerNotifications.deleteAllNotifications.useMutation({
    onMutate: async () => {
      // Cancel any outgoing queries
      await utils.sellerNotifications.getNotifications.cancel();
      await utils.sellerNotifications.getUnreadCount.cancel();

      // Set optimistic data
      utils.sellerNotifications.getNotifications.setData({}, []);
      utils.sellerNotifications.getUnreadCount.setData({}, { count: 0 });

      return { previousNotifications: utils.sellerNotifications.getNotifications.getData({}) };
    },
    onError: async (err, variables, context) => {
      // Rollback on error
      if (context?.previousNotifications) {
        utils.sellerNotifications.getNotifications.setData({}, context.previousNotifications);
      }
      // Refetch to ensure consistency
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
    },
    onSuccess: async () => {
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
    },
  });
};