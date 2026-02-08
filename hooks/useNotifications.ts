'use client';

import { useEffect, useState, useCallback } from 'react';
import { trpc } from '@/lib/trpc';

export interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  severity?: string;
  isRead: boolean;
  isStarred: boolean;
  relatedEntityId: string | null;
  relatedEntityType: string | null;
  actionUrl: string | null;
  createdAt: Date;
  metadata?: Record<string, any>;
}

export interface NotificationResponse {
  notifications: Notification[];
  total: number;
  unreadCount: number;
  criticalCount?: number;
}

const POLL_INTERVAL = 5000; // 5 seconds for real-time updates

/**
 * Hook for buyer notifications with real-time polling
 */
export function useBuyerNotifications() {
  const [isPolling, setIsPolling] = useState(true);

  const { data, isLoading, error, refetch } = trpc.buyerNotifications.getNotifications.useQuery(
    {},
    {
      refetchInterval: isPolling ? POLL_INTERVAL : false,
      staleTime: 0,
      enabled: true,
    }
  );

  const markAsReadMutation = trpc.buyerNotifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsReadMutation = trpc.buyerNotifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const toggleStarMutation = trpc.buyerNotifications.toggleStar.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteNotificationMutation = trpc.buyerNotifications.deleteNotification.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const unreadCountQuery = trpc.buyerNotifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: isPolling ? POLL_INTERVAL : false,
      staleTime: 0,
      enabled: true,
    }
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [markAllAsReadMutation]);

  const toggleStar = useCallback(async (notificationId: string, starred: boolean = true) => {
    try {
      await toggleStarMutation.mutateAsync({ notificationId, starred });
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  }, [toggleStarMutation]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [deleteNotificationMutation]);

  return {
    notifications: data?.notifications || [],
    unreadCount: unreadCountQuery.data?.count || 0,
    total: data?.total || 0,
    isLoading: isLoading || unreadCountQuery.isLoading,
    error: error || unreadCountQuery.error,
    refetch,
    markAsRead,
    markAllAsRead,
    toggleStar,
    deleteNotification,
    isPolling,
    setIsPolling,
  };
}

/**
 * Hook for seller notifications with real-time polling
 */
export function useSellerNotifications() {
  const [isPolling, setIsPolling] = useState(true);

  const { data, isLoading, error, refetch } = trpc.sellerNotifications.getNotifications.useQuery(
    {},
    {
      refetchInterval: isPolling ? POLL_INTERVAL : false,
      staleTime: 0,
      enabled: true,
    }
  );

  const markAsReadMutation = trpc.sellerNotifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsReadMutation = trpc.sellerNotifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const toggleStarMutation = trpc.sellerNotifications.toggleStar.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteNotificationMutation = trpc.sellerNotifications.deleteNotification.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const unreadCountQuery = trpc.sellerNotifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: isPolling ? POLL_INTERVAL : false,
      staleTime: 0,
      enabled: true,
    }
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [markAllAsReadMutation]);

  const toggleStar = useCallback(async (notificationId: string, starred: boolean = true) => {
    try {
      await toggleStarMutation.mutateAsync({ notificationId, starred });
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  }, [toggleStarMutation]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [deleteNotificationMutation]);

  return {
    notifications: data?.notifications || [],
    unreadCount: unreadCountQuery.data?.count || 0,
    total: data?.total || 0,
    isLoading: isLoading || unreadCountQuery.isLoading,
    error: error || unreadCountQuery.error,
    refetch,
    markAsRead,
    markAllAsRead,
    toggleStar,
    deleteNotification,
    isPolling,
    setIsPolling,
  };
}

/**
 * Hook for admin notifications with real-time polling
 */
export function useAdminNotifications() {
  const [isPolling, setIsPolling] = useState(true);

  const { data, isLoading, error, refetch } = trpc.adminNotifications.getNotifications.useQuery(
    {},
    {
      refetchInterval: isPolling ? POLL_INTERVAL : false,
      staleTime: 0,
      enabled: true,
    }
  );

  const markAsReadMutation = trpc.adminNotifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const markAllAsReadMutation = trpc.adminNotifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const toggleStarMutation = trpc.adminNotifications.toggleStar.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const deleteNotificationMutation = trpc.adminNotifications.deleteNotification.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const unreadCountQuery = trpc.adminNotifications.getUnreadCount.useQuery(
    undefined,
    {
      refetchInterval: isPolling ? POLL_INTERVAL : false,
      staleTime: 0,
      enabled: true,
    }
  );

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      await markAsReadMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }, [markAsReadMutation]);

  const markAllAsRead = useCallback(async () => {
    try {
      await markAllAsReadMutation.mutateAsync();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }, [markAllAsReadMutation]);

  const toggleStar = useCallback(async (notificationId: string, starred: boolean = true) => {
    try {
      await toggleStarMutation.mutateAsync({ notificationId, starred });
    } catch (error) {
      console.error('Failed to toggle star:', error);
    }
  }, [toggleStarMutation]);

  const deleteNotification = useCallback(async (notificationId: string) => {
    try {
      await deleteNotificationMutation.mutateAsync({ notificationId });
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  }, [deleteNotificationMutation]);

  return {
    notifications: data?.notifications || [],
    unreadCount: unreadCountQuery.data?.count || 0,
    total: data?.total || 0,
    isLoading: isLoading || unreadCountQuery.isLoading,
    error: error || unreadCountQuery.error,
    refetch,
    markAsRead,
    markAllAsRead,
    toggleStar,
    deleteNotification,
    isPolling,
    setIsPolling,
  };
}

/**
 * Specialized hook for notification badge component with optimized polling
 */
export function useNotificationBadge(userType: 'buyer' | 'seller' | 'admin') {
  const buyerQuery = trpc.buyerNotifications.getUnreadCount.useQuery(
    undefined,
    {
      enabled: userType === 'buyer',
      refetchInterval: POLL_INTERVAL,
      staleTime: 0,
    }
  );

  const sellerQuery = trpc.sellerNotifications.getUnreadCount.useQuery(
    undefined,
    {
      enabled: userType === 'seller',
      refetchInterval: POLL_INTERVAL,
      staleTime: 0,
    }
  );

  const adminQuery = trpc.adminNotifications.getUnreadCount.useQuery(
    undefined,
    {
      enabled: userType === 'admin',
      refetchInterval: POLL_INTERVAL,
      staleTime: 0,
    }
  );

  switch (userType) {
    case 'buyer':
      return {
        count: buyerQuery.data?.count || 0,
        isLoading: buyerQuery.isLoading,
        error: buyerQuery.error,
      };
    case 'seller':
      return {
        count: sellerQuery.data?.count || 0,
        isLoading: sellerQuery.isLoading,
        error: sellerQuery.error,
      };
    case 'admin':
      return {
        count: adminQuery.data?.count || 0,
        isLoading: adminQuery.isLoading,
        error: adminQuery.error,
      };
    default:
      return { count: 0, isLoading: false, error: null };
  }
}