'use client';

import { useEffect, useRef, useCallback } from 'react';
import { toast } from 'react-toastify';

interface NotificationPollingConfig {
  enabled?: boolean;
  interval?: number; // in milliseconds
  onNewNotification?: (notification: any) => void;
  onOrderStatusChange?: (orderId: string, newStatus: string) => void;
  onShipmentUpdate?: (orderId: string, trackingNumber: string) => void;
  batchNotifications?: boolean;
  maxBatchSize?: number;
}

const DEFAULT_POLLING_INTERVAL = 30000; // 30 seconds

/**
 * Hook for real-time notification polling with smart batching
 * Combines multiple notifications into single toasts when needed
 */
export function useNotificationPolling(config: NotificationPollingConfig = {}): void {
  const {
    enabled = true,
    interval = DEFAULT_POLLING_INTERVAL,
    onNewNotification,
    onOrderStatusChange,
    onShipmentUpdate,
    batchNotifications = true,
    maxBatchSize = 5,
  } = config;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastPollTimeRef = useRef<number>(0);
  const notificationQueueRef = useRef<any[]>([]);
  const toastIdRef = useRef<string | number | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  const processNotificationQueue = useCallback(() => {
    if (notificationQueueRef.current.length === 0) return;

    const notifications = notificationQueueRef.current.splice(0, maxBatchSize);
    const isBatched = notifications.length > 1;

    if (batchNotifications && isBatched) {
      // Show batched notification
      const message = `You have ${notifications.length} new updates`;
      toastIdRef.current = toast.info(message, {
        autoClose: 5000,
        position: 'top-right',
      });
    } else {
      // Show individual notifications
      notifications.forEach((notif) => {
        const message = notif.message || 'New update';
        const type = (notif.type || 'info') as 'info' | 'success' | 'warning' | 'error';

        const opts = { autoClose: 4000, position: 'top-right' as const };
        if (type === 'success') {
          toast.success(message, opts);
        } else if (type === 'error') {
          toast.error(message, opts);
        } else if (type === 'warning') {
          toast.warning(message, opts);
        } else {
          toast.info(message, opts);
        }
        onNewNotification?.(notif);
      });
    }
  }, [batchNotifications, maxBatchSize, onNewNotification]);

  const handleOrderStatusChange = useCallback(
    (orderId: string, newStatus: string) => {
      notificationQueueRef.current.push({
        type: 'info',
        message: `Order #${orderId} status updated to ${newStatus}`,
        orderId,
        status: newStatus,
        timestamp: Date.now(),
      });

      onOrderStatusChange?.(orderId, newStatus);
    },
    [onOrderStatusChange]
  );

  const handleShipmentUpdate = useCallback(
    (orderId: string, trackingNumber: string) => {
      notificationQueueRef.current.push({
        type: 'success',
        message: `Order #${orderId} shipped! Tracking: ${trackingNumber}`,
        orderId,
        trackingNumber,
        timestamp: Date.now(),
      });

      onShipmentUpdate?.(orderId, trackingNumber);
    },
    [onShipmentUpdate]
  );

  useEffect(() => {
    if (!enabled) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastFetchTimeRef.current = Date.now();

    // Start polling
    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;

      if (timeSinceLastFetch >= interval) {
        // Process queued notifications
        processNotificationQueue();
        lastFetchTimeRef.current = now;
      }
    }, Math.max(1000, interval));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, processNotificationQueue]);

  return;
}

/**
 * Hook for order-specific status polling
 * Shows visual indicators when order status changes
 */
export function useOrderStatusPolling(orderId: string, config: NotificationPollingConfig = {}) {
  const {
    enabled = true,
    interval = DEFAULT_POLLING_INTERVAL,
    onOrderStatusChange,
  } = config;

  const previousStatusRef = useRef<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastFetchTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!enabled || !orderId) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    lastFetchTimeRef.current = Date.now();

    intervalRef.current = setInterval(async () => {
      const now = Date.now();
      const timeSinceLastFetch = now - lastFetchTimeRef.current;

      if (timeSinceLastFetch >= interval) {
        try {
          // This would fetch the order and check status
          // Implementation depends on your query setup
          onOrderStatusChange?.(orderId, previousStatusRef.current || 'unknown');
          lastFetchTimeRef.current = now;
        } catch (error) {
          console.error('Error polling order status:', error);
        }
      }
    }, Math.max(1000, interval));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, orderId, onOrderStatusChange]);
}

/**
 * Hook for real-time delivery confirmation notifications
 */
export function useDeliveryConfirmationPolling(orderId: string | null, config: NotificationPollingConfig = {}) {
  const { enabled = true, onNewNotification } = config;

  const hasShownRef = useRef<boolean>(false);

  useEffect(() => {
    if (!enabled || !orderId || hasShownRef.current) return;

    // Show notification when delivery is confirmed
    // This would be triggered by actual delivery confirmation
    const handleDeliveryConfirmed = () => {
      toast.success(`Order #${orderId} has been delivered!`, {
        autoClose: 5000,
        position: 'top-right',
      });

      onNewNotification?.({
        type: 'success',
        message: `Order #${orderId} delivered`,
        orderId,
        timestamp: Date.now(),
      });

      hasShownRef.current = true;
    };

    // Set up listener (this would connect to your actual delivery confirmation event)
    // For now, this is a placeholder for the actual implementation
    return () => {
      hasShownRef.current = false;
    };
  }, [enabled, orderId, onNewNotification]);
}