import { trpc } from "@/lib/trpc";

export const useNotifications = () => {
  return (trpc.notification as any).getAll.useQuery(undefined, {
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

  return (trpc.notification as any).markAsRead.useMutation({
    onSuccess: async () => {
      await (utils.notification as any).getAll.invalidate();
      await (utils.notification as any).getStarred.invalidate();
      await (utils.notification as any).getAll.refetch();
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const utils = trpc.useUtils();

  return (trpc.notification as any).markAllAsRead.useMutation({
    onSuccess: async () => {
      await (utils.notification as any).getAll.invalidate();
      await (utils.notification as any).getAll.refetch();
    },
  });
};

export const useToggleNotificationStar = () => {
  const utils = trpc.useUtils();

  return (trpc.notification as any).toggleStar.useMutation({
    onSuccess: async () => {
      await (utils.notification as any).getAll.invalidate();
      await (utils.notification as any).getStarred.invalidate();
      await (utils.notification as any).getAll.refetch();
    },
  });
};

export const useStarredNotifications = () => {
  return (trpc.notification as any).getStarred.useQuery(undefined, {
    staleTime: 1000 * 30,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 5,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
  });
};

export const useDeleteNotification = () => {
  const utils = trpc.useUtils();

  return (trpc.notification as any).deleteNotification.useMutation({
    onSuccess: async () => {
      await (utils.notification as any).getAll.invalidate();
      await (utils.notification as any).getStarred.invalidate();
      await (utils.notification as any).getAll.refetch();
    },
  });
};

export const useDeleteAllNotifications = () => {
  const utils = trpc.useUtils();

  return (trpc.notification as any).deleteAll.useMutation({
    onSuccess: async () => {
      await (utils.notification as any).getAll.invalidate();
      await (utils.notification as any).getStarred.invalidate();
      await (utils.notification as any).getAll.refetch();
    },
  });
};