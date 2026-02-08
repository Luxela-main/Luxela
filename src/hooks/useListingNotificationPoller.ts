import { useEffect, useRef, useCallback, useState } from 'react';
import { trpc as api } from '@/app/_trpc/client';

interface ListingNotification {
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

interface UseListingNotificationPollerOptions {
  enabled?: boolean;
  pollIntervalSeconds?: number;
  onNewNotification?: (notification: ListingNotification) => void;
  onNotificationsUpdate?: (notifications: ListingNotification[]) => void;
}

/**
 * Custom hook for polling listing notification updates
 * Enables real-time notifications via polling (compatible with Vercel)
 * 
 * Usage:
 * ```tsx
 * const { notifications, isPolling, unreadCount } = useListingNotificationPoller({
 *   enabled: true,
 *   pollIntervalSeconds: 10,
 *   onNewNotification: (notification) => {
 *     toast.success(notification.message);
 *   }
 * });
 * ```
 */
export function useListingNotificationPoller(
  options: UseListingNotificationPollerOptions = {}
) {
  const {
    enabled = true,
    pollIntervalSeconds = 10,
    onNewNotification,
    onNotificationsUpdate,
  } = options;

  const [notifications, setNotifications] = useState<ListingNotification[]>([]);
  const [isPolling, setIsPolling] = useState(false);
  const lastPolledAtRef = useRef<Date>(new Date());
  const pollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // TRPC query to poll for notifications
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
        // Update last polled time
        lastPolledAtRef.current = new Date();

        // Process new notifications
        response.data.newNotifications.forEach((notification) => {
          if (notification.isNew) {
            // Call user-provided callback for new notifications
            onNewNotification?.({
              ...notification,
              reviewedAt: notification.reviewedAt ? new Date(notification.reviewedAt) : undefined,
            });
          }
        });

        // Update notifications state
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

      // Schedule next poll
      const nextPollDelay = (response.data.pollAgainInSeconds || pollIntervalSeconds) * 1000;
      pollTimeoutRef.current = setTimeout(() => {
        pollForUpdates();
      }, nextPollDelay);
    } catch (error) {
      console.error('[NotificationPoller] Error polling notifications:', error);

      // Retry on error after longer delay
      pollTimeoutRef.current = setTimeout(() => {
        pollForUpdates();
      }, (pollIntervalSeconds * 2) * 1000);
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

  // Start polling on mount
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

  // Manual refresh function
  const refresh = useCallback(() => {
    if (pollTimeoutRef.current) {
      clearTimeout(pollTimeoutRef.current);
    }
    pollForUpdates();
  }, [pollForUpdates]);

  // Calculate unread count
  const unreadCount = notifications.filter((n) => n.isNew).length;

  return {
    notifications,
    isPolling,
    unreadCount,
    refresh,
    error: pollForNotificationsQuery.error,
    isPending: isPolling,
  };
}