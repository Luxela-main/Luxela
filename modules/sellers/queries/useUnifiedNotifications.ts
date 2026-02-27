import { useMemo } from "react";
import { trpc } from "@/lib/trpc";

export interface UnifiedNotification {
  id: string;
  type: string;
  title?: string;
  message: string;
  severity?: string;
  isRead: boolean;
  isStarred?: boolean;
  createdAt: string | Date;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

/**
 * Unified notifications hook that fetches from the new sellerNotifications router
 * Combines all notification types (orders, disputes, reviews, inventory, etc.)
 */
export const useUnifiedNotifications = () => {
  // Fetch all notifications from the unified endpoint
  const notificationsQuery = trpc.sellerNotifications.getNotifications.useQuery(
    {},
    {
      staleTime: 1000 * 30,
      gcTime: 1000 * 60 * 10,
      refetchInterval: 1000 * 30, // Poll every 30 seconds instead of 5 to prevent race conditions
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: 3,
      retryDelay: (attemptIndex: number) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );

  // Transform and normalize the notifications
  const unifiedNotifications = useMemo(() => {
    if (!notificationsQuery.data?.notifications) {
      return [];
    }

    return notificationsQuery.data.notifications.map((notif: any) => ({
      id: notif.id,
      type: notif.type,
      title: notif.title || undefined,
      message: notif.message,
      severity: notif.severity || "info",
      isRead: notif.isRead,
      isStarred: notif.isStarred || false,
      createdAt: notif.createdAt,
      relatedEntityId: notif.relatedEntityId,
      relatedEntityType: notif.relatedEntityType,
      actionUrl: notif.actionUrl,
      metadata: notif.metadata,
    })) as UnifiedNotification[];
  }, [notificationsQuery.data?.notifications]);

  return {
    data: unifiedNotifications,
    isLoading: notificationsQuery.isLoading,
    error: notificationsQuery.error,
    refetch: notificationsQuery.refetch,
  };
};