import { useEffect, useRef, useCallback, useState } from 'react';
import { trpc as api } from '@/app/_trpc/client';

export interface BuyerNotification {
  id: string;
  type:
    | 'purchase'
    | 'review'
    | 'comment'
    | 'reminder'
    | 'order_confirmed'
    | 'payment_failed'
    | 'refund_issued'
    | 'delivery_confirmed'
    | 'order_shipped'
    | 'order_delayed';
  message: string;
  isRead: boolean;
  isStarred: boolean;
  createdAt: Date;
  orderId?: string | null;
  metadata?: Record<string, any>;
  isNew?: boolean;
}

interface UseBuyerNotificationPollerOptions {
  enabled?: boolean;
  pollIntervalSeconds?: number;
  onNewNotification?: (notification: BuyerNotification) => void;
  onUnreadCountChange?: (count: number) => void;
}

export function useBuyerNotificationPoller(
  options: UseBuyerNotificationPollerOptions = {}
) {
  const {
    enabled = true,
    pollIntervalSeconds = 10,
    onNewNotification,
    onUnreadCountChange,
  } = options;

  const [notifications, setNotifications] = useState<BuyerNotification[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastPolledAtRef = useRef<Date>(new Date());
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const previousUnreadCountRef = useRef<number>(0);

  const getNotificationsQuery = api.buyerNotifications.getNotifications.useQuery(
    {
      unreadOnly: false,
      limit: 10,
      offset: 0,
    },
    {
      enabled: enabled,
      refetchInterval: pollIntervalSeconds * 1000,
      refetchIntervalInBackground: true,
      staleTime: 5000,
      gcTime: 30000,
    }
  );

  const getUnreadCountQuery = api.buyerNotifications.getUnreadCount.useQuery(
    undefined,
    {
      enabled: enabled,
      refetchInterval: pollIntervalSeconds * 1000,
      refetchIntervalInBackground: true,
      staleTime: 5000,
      gcTime: 30000,
    }
  );

  const markAsReadMutation = api.buyerNotifications.markAsRead.useMutation();
  const markAllAsReadMutation = api.buyerNotifications.markAllAsRead.useMutation();

  const pollForUpdates = useCallback(async () => {
    if (!enabled || isPolling) return;

    try {
      setIsPolling(true);

      const response = await getNotificationsQuery.refetch();

      if (!response.data) {
        throw new Error('No data returned from poll');
      }

      if (response.data.notifications.length > 0) {
        lastPolledAtRef.current = new Date();

        response.data.notifications.forEach((notification) => {
          if (!notification.isRead) {
            const notifWithDate: BuyerNotification = {
              id: notification.id,
              type: 'purchase',
              message: notification.message,
              isRead: notification.isRead,
              isStarred: false,
              createdAt: new Date(notification.createdAt),
              metadata: (notification.metadata as Record<string, any> | undefined) || undefined,
            };
            onNewNotification?.(notifWithDate);
          }
        });

        setNotifications((prev) => {
          const convertedNotifications = response.data!.notifications.map((nn) => ({
            id: nn.id,
            type: 'purchase' as const,
            message: nn.message,
            isRead: nn.isRead,
            isStarred: false,
            createdAt: new Date(nn.createdAt),
            metadata: nn.metadata,
          } as BuyerNotification));
          const updatedNotifications = [
            ...convertedNotifications.filter((nn) => !nn.isRead),
            ...prev.filter(
              (n) => !convertedNotifications.find((nn) => nn.id === n.id)
            ),
          ];
          return updatedNotifications.slice(0, 50); // Keep last 50
        });
      }

      const nextPollDelay = pollIntervalSeconds * 1000;
      pollTimeoutRef.current = setTimeout(() => {
        pollForUpdates();
      }, nextPollDelay);
    } catch (error) {
      console.error('[BuyerNotificationPoller] Error polling notifications:', error);

      pollTimeoutRef.current = setTimeout(() => {
        pollForUpdates();
      }, pollIntervalSeconds * 2 * 1000);
    } finally {
      setIsPolling(false);
    }
  }, [
    enabled,
    isPolling,
    pollIntervalSeconds,
    onNewNotification,
    onUnreadCountChange,
    getNotificationsQuery,
  ]);

  useEffect(() => {
    if (!enabled) return;

    // Initial poll
    pollForUpdates();

    return () => {
      if (pollTimeoutRef.current) {
        clearTimeout(pollTimeoutRef.current);
      }
    };
  }, [enabled, pollForUpdates]);

  useEffect(() => {
    if (getUnreadCountQuery.data?.count !== undefined) {
      const newCount = getUnreadCountQuery.data.count;
      if (newCount !== unreadCount) {
        setUnreadCount(newCount);
        previousUnreadCountRef.current = newCount;
        onUnreadCountChange?.(newCount);
      }
    }
  }, [getUnreadCountQuery.data?.count, unreadCount, onUnreadCountChange]);

  const refresh = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    pollForUpdates();
  }, [pollForUpdates]);

  const markAsRead = useCallback(
    async (notificationId: string) => {
      try {
        await markAsReadMutation.mutateAsync({
          notificationId,
        });

        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, isNew: false } : n
          )
        );

        // Refetch unread count
        getUnreadCountQuery.refetch();
      } catch (error) {
        console.error('[BuyerNotificationPoller] Error marking as read:', error);
      }
    },
    [markAsReadMutation, getUnreadCountQuery]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();

      setNotifications((prev) =>
        prev.map((n) => ({ ...n, isRead: true, isNew: false }))
      );

      // Reset unread count
      setUnreadCount(0);
      previousUnreadCountRef.current = 0;
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error('[BuyerNotificationPoller] Error marking all as read:', error);
    }
  }, [markAllAsReadMutation, onUnreadCountChange]);

  return {
    notifications,
    isPolling,
    unreadCount,
    badgeCount: unreadCount,
    refresh,
    markAsRead,
    markAllAsRead,
    error: getNotificationsQuery.error,
    isPending: isPolling,
    isLoadingUnreadCount: getUnreadCountQuery.isLoading,
  };
}