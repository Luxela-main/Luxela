'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { trpc } from '@/app/_trpc/client';
import {
  useMarkNotificationAsRead,
  useMarkAllNotificationsAsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '@/modules/buyer/queries/useNotifications';
import {
  Loader2,
  Bell,
  CheckCircle2,
  AlertCircle,
  Package,
  TrendingDown,
  MessageSquare,
  Trash2,
  Eye,
  Filter,
  Search,
  Heart,
} from 'lucide-react';
import Link from 'next/link';
import { toastSvc } from '@/services/toast';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';

// Debounce utility
const debounce = (func: Function, wait: number) => {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  return function executedFunction(...args: any[]) {
    const later = () => {
      timeoutId = null;
      func(...args);
    };
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(later, wait);
  };
};

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: Date;
  relatedEntityId?: string | undefined;
  metadata?: Record<string, any>;
}

type NotificationCategory = 'all' | 'orders' | 'shipping' | 'returns_refunds' | 'products' | 'communication' | 'account_system';

// Map specific notification types to generalized categories
const getCategoryForType = (type: string): string => {
  const lowerType = type?.toLowerCase() || '';
  
  if (lowerType.includes('order') || lowerType.startsWith('order_')) return 'orders';
  if (lowerType.includes('shipment') || lowerType.includes('delivery') || lowerType.includes('transit')) return 'shipping';
  if (lowerType.includes('return') || lowerType.includes('refund')) return 'returns_refunds';
  if (lowerType.includes('price_drop') || lowerType.includes('back_in_stock') || lowerType.includes('low_inventory') || lowerType.includes('favorite')) return 'products';
  if (lowerType.includes('review') || lowerType.includes('reply') || lowerType.includes('message')) return 'communication';
  return 'account_system'; // For brand_followed, disputes, payments, listings, system alerts, etc.
};

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([]);
  const [selectedType, setSelectedType] = useState<NotificationCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);

  
  const { 
    data: notificationsData, 
    isLoading: isLoadingNotifications,
    refetch: refetchNotifications 
  } = trpc.buyerNotifications.getNotifications.useQuery(
    {
      limit: 50,
      offset: 0,
    },
    {
      enabled: !!user && !authLoading,
      staleTime: 1000 * 30, 
    }
  );

  
  const markAsReadMutation = useMarkNotificationAsRead();
  
  // Handle errors with custom error handling
  const originalMarkAsReadMutate = markAsReadMutation.mutateAsync;
  const wrappedMarkAsReadMutate = useCallback(async (notificationId: string) => {
    try {
      await originalMarkAsReadMutate({ notificationId });
    } catch (error: any) {
      refetchNotifications();
      toastSvc.error(error?.message || 'Failed to update notification');
    }
  }, [originalMarkAsReadMutate, refetchNotifications]);

  
  const deleteNotificationMutation = useDeleteNotification();
  
  // Handle errors with custom error handling
  const originalDeleteMutate = deleteNotificationMutation.mutateAsync;
  const wrappedDeleteMutate = useCallback(async (notificationId: string) => {
    try {
      await originalDeleteMutate({ notificationId });
      toastSvc.success('Notification deleted');
    } catch (error: any) {
      refetchNotifications();
      toastSvc.error(error?.message || 'Failed to delete notification');
    }
  }, [originalDeleteMutate, refetchNotifications]);

  
  const markAllAsReadMutation = useMarkAllNotificationsAsRead();
  
  // Handle success/error with custom logic
  const originalMarkAllMutate = markAllAsReadMutation.mutateAsync;
  const wrappedMarkAllMutate = useCallback(async () => {
    try {
      await originalMarkAllMutate();
      refetchNotifications();
      toastSvc.success('All notifications marked as read');
    } catch (error: any) {
      toastSvc.error(error?.message || 'Failed to mark all as read');
    }
  }, [originalMarkAllMutate, refetchNotifications]);

  const deleteAllMutation = useDeleteAllNotifications();
  
  // Handle success/error for delete all
  const originalDeleteAllMutate = deleteAllMutation.mutateAsync;
  const wrappedDeleteAllMutate = useCallback(async () => {
    // Optimistic update - clear all notifications immediately
    setNotifications([]);
    setFilteredNotifications([]);
    setUnreadCount(0);

    try {
      await originalDeleteAllMutate();
      await refetchNotifications();
      toastSvc.success('All notifications deleted');
    } catch (error: any) {
      // On error, refetch to restore state
      await refetchNotifications();
      toastSvc.error(error?.message || 'Failed to delete all notifications');
    }
  }, [originalDeleteAllMutate, refetchNotifications]);

  
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/signin');
    }
  }, [authLoading, user, router]);

  
  useEffect(() => {
    if (notificationsData?.notifications) {
      
      const convertedNotifications: Notification[] = notificationsData.notifications.map((notification: any) => {
        
        const relatedEntityId = notification.relatedEntityId === null ? undefined : notification.relatedEntityId;
        
        return {
          id: notification.id,
          type: notification.type,
          title: notification.title,
          message: notification.message,
          isRead: notification.isRead,
          createdAt: new Date(notification.createdAt),
          relatedEntityId,
          metadata: notification.metadata,
        };
      });
      setNotifications(convertedNotifications);
      setUnreadCount(notificationsData.unreadCount || 0);
    }
  }, [notificationsData]);

  
  useEffect(() => {
    let filtered = notifications;

    
    if (selectedType !== 'all') {
      filtered = filtered.filter((n) => getCategoryForType(n.type) === selectedType);
    }

    
    if (searchTerm) {
      filtered = filtered.filter(
        (n) =>
          n.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          n.message?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredNotifications(filtered);
  }, [notifications, selectedType, searchTerm]);

  const handleMarkAsRead = useCallback(
    debounce(async (notificationId: string) => {
      // Optimistic update - update UI immediately
      setNotifications((prev) =>
        prev.map((n) =>
          n.id === notificationId ? { ...n, isRead: true } : n
        )
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Then mutate in background
      try {
        await wrappedMarkAsReadMutate(notificationId);
      } catch (error) {
        // Error already handled in mutation onError
      }
    }, 300),
    [wrappedMarkAsReadMutate]
  );

  const handleDeleteNotification = useCallback(
    debounce(async (notificationId: string) => {
      // Optimistic update - remove from UI immediately
      const deletedNotification = notifications.find((n) => n.id === notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      
      // Update unread count if the deleted notification was unread
      if (deletedNotification?.isRead === false) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }

      // Then mutate in background
      try {
        await wrappedDeleteMutate(notificationId);
      } catch (error) {
        // Error already handled in mutation onError
      }
    }, 300),
    [notifications, wrappedDeleteMutate]
  );

  const handleMarkAllAsRead = async () => {
    await wrappedMarkAllMutate();
  };

  const getNotificationIcon = (type?: string, metadata?: Record<string, any>) => {
    const lowerType = type?.toLowerCase() || '';
    
    // System alerts - check if it's a brand follow/unfollow (has brand action in metadata)
    if (lowerType.includes('system_alert')) {
      if (metadata?.action === 'brand_followed' || metadata?.action === 'brand_unfollowed') {
        return <Heart className="w-5 h-5 text-pink-400" />;
      }
      // Other system alerts
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
    
    // Order-related
    if (lowerType.includes('order') || lowerType.includes('shipment') || lowerType.includes('delivery')) {
      if (lowerType.includes('delivered') || lowerType.includes('out_for_delivery')) {
        return <CheckCircle2 className="w-5 h-5 text-green-400" />;
      }
      return <Package className="w-5 h-5 text-blue-400" />;
    }
    
    // Price and product
    if (lowerType.includes('price_drop') || lowerType.includes('back_in_stock')) {
      return <TrendingDown className="w-5 h-5 text-orange-400" />;
    }
    
    // Review and communication
    if (lowerType.includes('review') || lowerType.includes('reply')) {
      return <MessageSquare className="w-5 h-5 text-purple-400" />;
    }
    
    // Refunds and returns
    if (lowerType.includes('refund') || lowerType.includes('return')) {
      return <CheckCircle2 className="w-5 h-5 text-yellow-400" />;
    }
    
    // Payment
    if (lowerType.includes('payment')) {
      return <AlertCircle className="w-5 h-5 text-yellow-400" />;
    }
    
    // Dispute
    if (lowerType.includes('dispute') || lowerType.includes('escalation') || lowerType.includes('sla_breach')) {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
    
    // Listing
    if (lowerType.includes('listing')) {
      return <Package className="w-5 h-5 text-cyan-400" />;
    }
    
    // Default
    return <Bell className="w-5 h-5 text-[#8451E1]" />;
  };

  const getTypeColor = (type?: string, metadata?: Record<string, any>): string => {
    const lowerType = type?.toLowerCase() || '';
    
    // System alerts - brand follow/unfollow get pink theme
    if (lowerType.includes('system_alert')) {
      if (metadata?.action === 'brand_followed' || metadata?.action === 'brand_unfollowed') {
        return 'bg-pink-500/10 border-pink-500/30';
      }
      // Other system alerts
      return 'bg-yellow-500/10 border-yellow-500/30';
    }
    
    // Order-related
    if (lowerType.includes('order') || lowerType.includes('order_confirmed') || lowerType.includes('order_processing') || lowerType.includes('order_pending')) {
      return 'bg-blue-500/10 border-blue-500/30';
    }
    
    if (lowerType.includes('shipment') || lowerType.includes('delivery') || lowerType.includes('transit') || lowerType.includes('in_transit') || lowerType.includes('out_for_delivery')) {
      return 'bg-green-500/10 border-green-500/30';
    }
    
    // Price and product
    if (lowerType.includes('price_drop') || lowerType.includes('back_in_stock') || lowerType.includes('low_inventory')) {
      return 'bg-orange-500/10 border-orange-500/30';
    }
    
    // Review and communication
    if (lowerType.includes('review') || lowerType.includes('reply')) {
      return 'bg-purple-500/10 border-purple-500/30';
    }
    
    // Refunds and returns
    if (lowerType.includes('refund') || lowerType.includes('return')) {
      return 'bg-yellow-500/10 border-yellow-500/30';
    }
    
    // Payment
    if (lowerType.includes('payment')) {
      if (lowerType.includes('failed')) {
        return 'bg-red-500/10 border-red-500/30';
      }
      return 'bg-yellow-500/10 border-yellow-500/30';
    }
    
    // Dispute
    if (lowerType.includes('dispute') || lowerType.includes('escalation') || lowerType.includes('sla_breach')) {
      return 'bg-red-500/10 border-red-500/30';
    }
    
    // Listing
    if (lowerType.includes('listing')) {
      return 'bg-cyan-500/10 border-cyan-500/30';
    }
    
    // Default
    return 'bg-[#8451E1]/10 border-[#8451E1]/30';
  };

  if (authLoading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-black via-[#0a0a0a] to-[#0f0a1a] min-h-screen">
      {}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-20 right-1/4 w-80 h-80 bg-[#8451E1]/15 rounded-full blur-3xl opacity-40 animate-blob"></div>
        <div className="absolute bottom-40 left-1/4 w-96 h-96 bg-[#5C2EAF]/10 rounded-full blur-3xl opacity-30 animate-blob animation-delay-2s"></div>
      </div>

      <div className="relative z-10">
        {}
        <div className="px-6 py-6 border-b border-[#8451E1]/10 sticky top-0 bg-gradient-to-b from-black/98 via-black/95 to-black/80 backdrop-blur-xl z-40 shadow-lg shadow-[#8451E1]/10">
          <div className="max-w-7xl mx-auto">
            <Breadcrumb items={[
              { label: 'Dashboard', href: '/buyer/dashboard' },
              { label: 'Notifications' }
            ]} />

            <div className="flex items-center justify-between mb-6 mt-6">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-white via-[#f0f0f0] to-[#d0d0d0] bg-clip-text text-transparent mb-2 flex items-center gap-3">
                  <Bell className="w-8 h-8 text-[#8451E1]" />
                  Notifications
                </h1>
                <p className="text-[#acacac] text-sm">
                  {unreadCount > 0 ? `You have ${unreadCount} unread notification${unreadCount !== 1 ? 's' : ''}` : 'All notifications read'}
                </p>
              </div>
              <div className="flex gap-3 flex-wrap">
                {unreadCount > 0 && (
                  <button
                    onClick={() => handleMarkAllAsRead()}
                    disabled={markAllAsReadMutation.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white text-sm font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 cursor-pointer"
                  >
                    Mark All as Read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button
                    onClick={() => {
                      wrappedDeleteAllMutate();
                    }}
                    disabled={deleteAllMutation.isPending}
                    className="px-4 py-2 bg-gradient-to-r from-red-600 to-red-700 hover:shadow-lg hover:shadow-red-600/30 text-white text-sm font-semibold rounded-lg transition-all duration-300 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear All
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {}
        <div className="px-4 md:px-6 py-6 md:py-8 max-w-7xl mx-auto">
          <div className="flex flex-col gap-4 mb-8">
            {}
            <div className="w-full relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <input
                type="text"
                placeholder="Search notifications..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a2e]/80 border border-[#8451E1]/30 rounded-lg text-white placeholder-[#666] focus:border-[#8451E1]/70 focus:outline-none text-sm"
              />
            </div>

            {}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-[#8451E1] flex-shrink-0" />
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as NotificationCategory)}
                className="flex-1 md:flex-none px-3 md:px-4 py-2.5 bg-[#1a1a2e]/80 border border-[#8451E1]/30 rounded-lg text-white text-sm focus:border-[#8451E1]/70 focus:outline-none cursor-pointer"
              >
                <option value="all">📬 All Notifications</option>
                <option value="orders">📦 Orders</option>
                <option value="shipping">🚚 Shipping & Delivery</option>
                <option value="returns_refunds">↩️ Returns & Refunds</option>
                <option value="products">🛒 Products & Inventory</option>
                <option value="communication">💬 Reviews & Messages</option>
                <option value="account_system">⚙️ Account & System</option>
              </select>
            </div>
          </div>

          {}
          {isLoadingNotifications ? (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
              <p className="text-[#acacac]">Loading notifications...</p>
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-12 h-12 text-[#8451E1]/40 mx-auto mb-4" />
              <p className="text-[#acacac] text-lg font-medium">
                {notifications.length === 0 ? 'No notifications yet' : 'No notifications match your filters'}
              </p>
              <p className="text-[#666] text-sm mt-2">
                {notifications.length === 0 ? 'Check back soon for updates' : 'Try adjusting your search or filters'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredNotifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-3 md:p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:shadow-[#8451E1]/20 ${
                    notification.isRead
                      ? 'bg-[#0f0f1a]/50 border-[#8451E1]/10'
                      : 'bg-gradient-to-br from-[#1a1a2e]/80 to-[#0f0f1a]/80 border-[#8451E1]/30'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                    <div className={`p-2 md:p-2.5 rounded-lg flex-shrink-0 ${getTypeColor(notification.type, notification.metadata)}`}>
                      {getNotificationIcon(notification.type, notification.metadata)}
                    </div>

                    <div className="flex-1 w-full min-w-0">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-4">
                        <div className="flex-1 min-w-0 w-full">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <h3 className={`font-semibold break-words ${notification.isRead ? 'text-[#999]' : 'text-white'} text-sm md:text-base`}>
                              {notification.title}
                            </h3>
                            {!notification.isRead && (
                              <span className="inline-block w-2 h-2 bg-[#8451E1] rounded-full flex-shrink-0"></span>
                            )}
                          </div>
                          <p className={`text-xs md:text-sm break-words whitespace-pre-wrap ${notification.isRead ? 'text-[#666]' : 'text-[#acacac]'}`}>
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#666] mt-2 flex-shrink-0">
                            {new Date(notification.createdAt).toLocaleDateString()} at{' '}
                            {new Date(notification.createdAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    </div>

                    {}
                    <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-start">
                      {!notification.isRead && (
                        <button
                          onClick={() => handleMarkAsRead(notification.id)}
                          disabled={markAsReadMutation.isPending}
                          className="p-2 hover:bg-[#8451E1]/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer hover:scale-110 active:scale-95"
                          title="Mark as read"
                        >
                          <Eye className="w-4 h-4 text-[#8451E1]" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        disabled={deleteNotificationMutation.isPending}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors disabled:opacity-50 cursor-pointer hover:scale-110 active:scale-95"
                        title="Delete notification"
                      >
                        <Trash2 className="w-4 h-4 text-red-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}