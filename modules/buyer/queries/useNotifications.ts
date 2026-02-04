import { trpc } from "@/lib/trpc";

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

export const useNotificationsCount = () => {
  const { data } = useNotifications();
  const unreadCount = data?.data?.filter((n) => !n.isRead).length ?? 0;
  return unreadCount;
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