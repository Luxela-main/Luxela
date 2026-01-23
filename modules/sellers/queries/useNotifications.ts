import { trpc } from "@/lib/trpc";

export const useNotifications = () => {
  return (trpc.notification as any).getAll.useQuery(undefined, {
    staleTime: 30 * 1000,
  });
};

export const useMarkNotificationAsRead = () => {
  const utils = trpc.useUtils();

  return (trpc.notification as any).markAsRead.useMutation({
    onSuccess: () => {
      (utils.notification as any).getAll.invalidate();
    },
  });
};

export const useMarkAllNotificationsAsRead = () => {
  const utils = trpc.useUtils();

  return (trpc.notification as any).markAllAsRead.useMutation({
    onSuccess: () => {
      (utils.notification as any).getAll.invalidate();
    },
  });
};

export const useToggleNotificationStar = () => {
  const utils = trpc.useUtils();

  return (trpc.notification as any).toggleStar.useMutation({
    onSuccess: () => {
      (utils.notification as any).getAll.invalidate();
    },
  });
};

export const useStarredNotifications = () => {
  return (trpc.notification as any).getStarred.useQuery({});
};

export const useDeleteNotification = () => {
  const utils = trpc.useUtils();

  return (trpc.notification as any).deleteNotification.useMutation({
    onSuccess: () => {
      (utils.notification as any).getAll.invalidate();
    },
  });
};

export const useDeleteAllNotifications = () => {
  const utils = trpc.useUtils();

  return (trpc.notification as any).deleteAll.useMutation({
    onSuccess: () => {
      (utils.notification as any).getAll.invalidate();
    },
  });
};