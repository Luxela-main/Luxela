'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useSellerOrders } from '../queries/useSellerOrders';
import { useRealTimePollingMulti } from '@/modules/shared/hooks/useRealTimePolling';

interface SellerOrderPollingConfig {
  enabled?: boolean;
  interval?: number;
  onNewOrders?: (count: number) => void;
  onStatusChange?: (orderId: string, oldStatus: string, newStatus: string) => void;
  onError?: (error: Error) => void;
}

const DEFAULT_POLLING_INTERVAL = 30000;

export function useSellerOrderPolling(config: SellerOrderPollingConfig = {}): void {
  const {
    enabled = true,
    interval = DEFAULT_POLLING_INTERVAL,
    onNewOrders,
    onStatusChange,
    onError,
  } = config;

  const previousOrderCountRef = useRef<number>(0);
  const previousStatusMapRef = useRef<Map<string, string>>(new Map());

  const ordersQuery = useSellerOrders({ limit: 100, offset: 0 });

  const handlePollingSuccess = useCallback(() => {
    if (!ordersQuery.data) return;

    const currentCount = ordersQuery.data.length;
    const currentStatusMap = new Map(
      ordersQuery.data.map((order) => [order.orderId, order.orderStatus])
    );

    if (currentCount > previousOrderCountRef.current && previousOrderCountRef.current > 0) {
      const newOrderCount = currentCount - previousOrderCountRef.current;
      onNewOrders?.(newOrderCount);
    }

    previousStatusMapRef.current.forEach((oldStatus, orderId) => {
      const newStatus = currentStatusMap.get(orderId);
      if (newStatus && newStatus !== oldStatus) {
        onStatusChange?.(orderId, oldStatus, newStatus);
      }
    });

    previousOrderCountRef.current = currentCount;
    previousStatusMapRef.current = currentStatusMap;
  }, [ordersQuery.data, onNewOrders, onStatusChange]);

  useRealTimePollingMulti([ordersQuery], {
    enabled: enabled && ordersQuery.dataUpdatedAt > 0,
    interval,
    retryOnError: true,
    onSuccess: handlePollingSuccess,
    onError: (error) => {
      onError?.(error);
    },
  });
}

export function useSellerOrderDetailPolling(
  orderId: string | undefined,
  config: Omit<SellerOrderPollingConfig, 'onNewOrders'> & {
    onStatusChange?: (oldStatus: string, newStatus: string) => void;
  } = {}
): void {
  const { enabled = true, interval = DEFAULT_POLLING_INTERVAL, onStatusChange, onError } = config;

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
          lastFetchTimeRef.current = now;
        } catch (error) {
          const err = error instanceof Error ? error : new Error(String(error));
          onError?.(err);
        }
      }
    }, Math.max(1000, interval));

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [enabled, interval, orderId, onStatusChange, onError]);
}