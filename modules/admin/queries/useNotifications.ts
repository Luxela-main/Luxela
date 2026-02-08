import { trpc } from "@/lib/trpc";

export const useAdminNotificationsCount = () => {
  const { data } = trpc.adminNotifications.getUnreadCount.useQuery(undefined, {
    staleTime: 1000 * 5,
    gcTime: 1000 * 60 * 10,
    refetchInterval: 1000 * 10,
    refetchOnWindowFocus: true,
    refetchOnReconnect: true,
    retry: 3,
    retryDelay: (attemptIndex: number) =>
      Math.min(1000 * 2 ** attemptIndex, 30000),
  });

  return data?.count ?? 0
};