'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { sellerQueryKeys } from '../queries/queryKeys';

export interface PayoutRealtimeConfig {
  enabled?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
}

export const usePayoutRealtimeUpdates = (config: PayoutRealtimeConfig = {}) => {
  const {
    enabled = true,
    reconnectAttempts = 5,
    reconnectDelay = 1000,
    maxReconnectDelay = 30000,
  } = config;

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const queryClient = useQueryClient();

  const sellerId = typeof window !== 'undefined' ? localStorage.getItem('seller_id') : null;

  const connect = useCallback(() => {
    if (!enabled || !sellerId) return;

    try {
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:8081`;

      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('[Payout WS] Connected');
        reconnectAttemptsRef.current = 0;

        ws.send(JSON.stringify({
          type: 'subscribe',
          sellerId,
          timestamp: Date.now(),
        }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handlePayoutMessage(message);
        } catch (error) {
          console.error('[Payout WS] Message parse error:', error);
        }
      };

      ws.onerror = (error) => {
        console.error('[Payout WS] Error:', error);
      };

      ws.onclose = () => {
        console.log('[Payout WS] Disconnected, attempting reconnect...');
        attemptReconnect();
      };

      wsRef.current = ws;
    } catch (error) {
      console.error('[Payout WS] Connection failed:', error);
      attemptReconnect();
    }
  }, [enabled, sellerId]);

  const handlePayoutMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'balance_update':
        console.log('[Payout WS] Balance update:', message.data);
        queryClient.invalidateQueries({
          queryKey: sellerQueryKeys.payoutStats(),
        });
        break;

      case 'transaction_update':
        console.log('[Payout WS] Transaction update:', message.data);
        queryClient.invalidateQueries({
          queryKey: sellerQueryKeys.payoutHistory(),
        });
        queryClient.invalidateQueries({
          queryKey: sellerQueryKeys.payoutStats(),
        });
        break;

      case 'payout_status':
        console.log('[Payout WS] Status:', message.data);
        queryClient.invalidateQueries({
          queryKey: sellerQueryKeys.payoutStats(),
        });
        queryClient.invalidateQueries({
          queryKey: sellerQueryKeys.payoutHistory(),
        });

        if (message.data.status === 'completed') {
          console.log(`✓ Payout completed: ₦${message.data.amount}`);
        } else if (message.data.status === 'failed') {
          console.error(`✗ Payout failed: ${message.data.statusMessage}`);
        }
        break;

      case 'subscribed':
        console.log('[Payout WS] Subscription confirmed');
        break;

      case 'heartbeat':
        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({
            type: 'heartbeat',
            sellerId,
            timestamp: Date.now(),
          }));
        }
        break;

      default:
        console.log('[Payout WS] Unknown message type:', message.type);
    }
  }, [queryClient, sellerId]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectAttempts) {
      console.error('[Payout WS] Max reconnection attempts reached');
      return;
    }

    reconnectAttemptsRef.current += 1;
    const delay = Math.min(
      reconnectDelay * Math.pow(2, reconnectAttemptsRef.current - 1),
      maxReconnectDelay
    );

    console.log(`[Payout WS] Reconnecting in ${delay}ms (attempt ${reconnectAttemptsRef.current})`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, delay);
  }, [connect, reconnectAttempts, reconnectDelay, maxReconnectDelay]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    if (enabled && sellerId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [enabled, sellerId, connect, disconnect]);

  return {
    isConnected: wsRef.current?.readyState === WebSocket.OPEN,
    disconnect,
    reconnect: connect,
  };
};