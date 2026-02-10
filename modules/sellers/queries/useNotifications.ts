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
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
      await utils.sellerNotifications.getNotifications.refetch();
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const utils = trpc.useUtils();

  return trpc.sellerNotifications.markAllAsRead.useMutation({
    onSuccess: async () => {
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
      await utils.sellerNotifications.getNotifications.refetch();
    },
  });
};

export const useToggleNotificationStar = () => {
  const utils = trpc.useUtils();

  return trpc.sellerNotifications.toggleStar.useMutation({
    onSuccess: async () => {
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
      await utils.sellerNotifications.getNotifications.refetch();
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
      await utils.sellerNotifications.getNotifications.refetch();
    },
  });
};

export const useDeleteAllNotifications = () => {
  const utils = trpc.useUtils();

  return trpc.sellerNotifications.deleteAllNotifications.useMutation({
    onSuccess: async () => {
      await utils.sellerNotifications.getNotifications.invalidate();
      await utils.sellerNotifications.getUnreadCount.invalidate();
      await utils.sellerNotifications.getNotifications.refetch();
    },
  });
};