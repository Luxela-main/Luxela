'use client';

import { useState, useEffect } from 'react';
import { Bell, Star, Trash2, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useToast } from '@/hooks/use-toast';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';

type NotificationType = 'purchase' | 'review' | 'comment' | 'reminder' | 'order_confirmed' | 'payment_failed' | 'refund_issued' | 'delivery_confirmed' | 'listing_approved' | 'listing_rejected' | 'listing_revision_requested' | 'dispute_opened' | 'dispute_resolved' | 'return_initiated' | 'return_completed' | 'payment_processed';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  timestamp: string;
  isRead: boolean;
  isFavorited: boolean;
}

const notificationIcons: Record<NotificationType, string> = {
  purchase: '🛍️',
  review: '⭐',
  comment: '💬',
  reminder: '🔔',
  order_confirmed: '✅',
  payment_failed: '❌',
  refund_issued: '💰',
  delivery_confirmed: '📦',
  listing_approved: '✔️',
  listing_rejected: '⛔',
  listing_revision_requested: '📝',
  dispute_opened: '⚖️',
  dispute_resolved: '✅',
  return_initiated: '↩️',
  return_completed: '✅',
  payment_processed: '💳',
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const { data: notificationsData } = trpc.buyer.getNotifications.useQuery({}, {
    retry: 1,
  });

  const { toast } = useToast();

  useEffect(() => {
    if (notificationsData) {
      setNotifications(notificationsData.data);
      setIsLoading(false);
    }
  }, [notificationsData]);

  const handleMarkAsRead = async (id: string) => {
    try {
      setNotifications(notifications.map(n => (n.id === id ? { ...n, isRead: true } : n)));
      toast({
        title: 'Marked as read',
        description: 'Notification marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark as read',
        variant: 'destructive',
      });
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      setNotifications(notifications.map(n => ({ ...n, isRead: true })));
      toast({
        title: 'All marked as read',
        description: 'All notifications marked as read',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to mark all as read',
        variant: 'destructive',
      });
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      setNotifications(
        notifications.map(n =>
          n.id === id ? { ...n, isFavorited: !n.isFavorited } : n
        )
      );
      toast({
        title: 'Updated',
        description: 'Notification favorite status updated',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update favorite status',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteNotification = async (id: string) => {
    try {
      setNotifications(notifications.filter(n => n.id !== id));
      toast({
        title: 'Deleted',
        description: 'Notification deleted',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete notification',
        variant: 'destructive',
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Breadcrumb items={[
          { label: 'Dashboard', href: '/buyer/dashboard' },
          { label: 'Notifications' },
        ]} />

        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-white">Notifications</h1>
            {unreadCount > 0 && (
              <div className="bg-[#6B7280] text-white px-3 py-1 rounded-full text-sm font-bold">
                {unreadCount} unread
              </div>
            )}
          </div>

          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className="text-[#8451e1] hover:text-[#7043d8] text-sm mb-4 cursor-pointer transition"
            >
              Mark all as read
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Bell className="text-[#8451e1]" size={32} />
            </div>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg p-12 text-center">
            <Bell className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 text-lg">No notifications yet</p>
            <p className="text-gray-500 text-sm mt-2">You'll receive notifications about your orders and account activity</p>
          </div>
        ) : (
          <div className="space-y-3">
            {notifications.map(notification => (
              <div
                key={notification.id}
                className={`bg-[#1a1a1a] rounded-lg p-4 transition cursor-pointer hover:bg-[#252525] ${
                  !notification.isRead ? 'border-l-4 border-[#8451e1]' : ''
                }`}
              >
                <div
                  onClick={() => {
                    setExpandedId(expandedId === notification.id ? null : notification.id);
                    if (!notification.isRead) {
                      handleMarkAsRead(notification.id);
                    }
                  }}
                  className="flex items-start gap-4"
                >
                  <div className="text-2xl mt-1">{notificationIcons[notification.type]}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h3 className="text-white font-semibold">{notification.title}</h3>
                        <p className="text-gray-400 text-sm mt-1 line-clamp-2">
                          {notification.message}
                        </p>
                      </div>
                      {!notification.isRead && (
                        <div className="w-2 h-2 bg-[#6B7280] rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                    <p className="text-gray-500 text-xs mt-2">
                      {new Date(notification.timestamp).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>

                {expandedId === notification.id && (
                  <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <p className="text-gray-300 text-sm mb-4">{notification.message}</p>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggleFavorite(notification.id)}
                        className="bg-[#252525] hover:bg-[#353535] text-white p-2 rounded cursor-pointer transition flex items-center gap-2 text-sm"
                      >
                        <Star size={16} fill={notification.isFavorited ? 'currentColor' : 'none'} />
                        {notification.isFavorited ? 'Favorited' : 'Add to favorites'}
                      </button>
                      <button
                        onClick={() => handleDeleteNotification(notification.id)}
                        className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded cursor-pointer transition flex items-center gap-2 text-sm"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  </div>
                )}

                <div className="absolute right-4 top-4 flex gap-2">
                  <button
                    onClick={() => handleToggleFavorite(notification.id)}
                    className="text-gray-400 hover:text-[#8451e1] cursor-pointer transition"
                  >
                    <Star size={16} fill={notification.isFavorited ? 'currentColor' : 'none'} />
                  </button>
                  <button
                    onClick={() => handleDeleteNotification(notification.id)}
                    className="text-gray-400 hover:text-red-400 cursor-pointer transition"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}