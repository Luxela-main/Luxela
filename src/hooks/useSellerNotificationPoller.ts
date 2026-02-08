import { useEffect, useRef, useCallback, useState } from 'react';
import { trpc as api } from '@/app/_trpc/client';

interface SellerNotification {
  id: string;
  listingId: string;
  title: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  message: string;
  comments?: string | null;
  rejectionReason?: string | null;
  revisionRequests?: Record<string, any> | null;
  reviewedAt?: Date | null;
  isNew: boolean;
}

interface UseSellerNotificationPollerOptions {
  enabled?: boolean;
  pollIntervalSeconds?: number;
  onNewNotification?: (notification: SellerNotification) => void;
  onNotificationsUpdate?: (notifications: SellerNotification[]) => void;
}

export function useSellerNotificationPoller(
  options: UseSellerNotificationPollerOptions = {}
) {
  const {
    enabled = true,
    pollIntervalSeconds = 10,
    onNewNotification,
    onNotificationsUpdate,
  } = options;

  const [notifications, setNotifications] = useState<SellerNotification[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const lastPolledAtRef = useRef<Date>(new Date());
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const pollForNotificationsQuery = api.sellerListingNotifications.pollForNotifications.useQuery(
    {
      lastPolledAt: lastPolledAtRef.current,
    },
    {
      enabled: false, // We'll manually trigger this
      staleTime: Infinity,
      gcTime: 30000,
    }
  );

  const pollForUpdates = useCallback(async () => {
    if (!enabled || isPolling) return;

    try {
      setIsPolling(true);

      const response = await pollForNotificationsQuery.refetch();

      if (!response.data) {
        throw new Error('No data returned from poll');
      }

      if (response.data.newNotifications.length > 0) {
        lastPolledAtRef.current = new Date();

        response.data.newNotifications.forEach((notification) => {
          if (notification.isNew) {
            onNewNotification?.({
              ...notification,
              reviewedAt: notification.reviewedAt ? new Date(notification.reviewedAt) : undefined,
            });
            setUnreadCount((prev) => prev + 1);
          }
        });

        setNotifications((prev) => {
          const convertedNotifications = response.data!.newNotifications.map((nn) => ({
            ...nn,
            reviewedAt: nn.reviewedAt ? new Date(nn.reviewedAt) : undefined,
          }));
          const updatedNotifications = [
            ...convertedNotifications,
            ...prev.filter(
              (n) => !convertedNotifications.find((nn) => nn.id === n.id)
            ),
          ];
          onNotificationsUpdate?.(updatedNotifications);
          return updatedNotifications;
        });
      }

      const nextPollDelay = (response.data.pollAgainInSeconds || pollIntervalSeconds) * 1000;
      pollTimeoutRef.current = setTimeout(() => {
        pollForUpdates();
      }, nextPollDelay);
    } catch (error) {
      console.error('[SellerNotificationPoller] Error polling notifications:', error);
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
    onNotificationsUpdate,
    pollForNotificationsQuery,
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

  const refresh = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    pollForUpdates();
  }, [pollForUpdates]);

  const markAsRead = useCallback((notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, isNew: false } : n
      )
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, isNew: false }))
    );
    setUnreadCount(0);
  }, []);

  const badgeCount = unreadCount;

  return {
    notifications,
    isPolling,
    unreadCount,
    badgeCount,
    refresh,
    markAsRead,
    markAllAsRead,
    error: pollForNotificationsQuery.error,
    isPending: isPolling,
  };
}