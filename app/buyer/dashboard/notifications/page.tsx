'use client';

import { useState, useMemo } from 'react';
import { Bell, Search, Trash2, Star, MessageSquare } from 'lucide-react';
import {
  useNotifications,
  useMarkNotificationAsRead,
  useToggleNotificationFavorite,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '@/modules/buyer/queries/useNotifications';
import { toast } from 'sonner';

export default function BuyerDashboardNotificationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedNotification, setSelectedNotification] = useState<string | null>(null);

  const { data: notificationsData, isLoading, error } = useNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();
  const toggleFavoriteMutation = useToggleNotificationFavorite();
  const deleteNotificationMutation = useDeleteNotification();
  const deleteAllMutation = useDeleteAllNotifications();

  const notifications = notificationsData?.data || [];
  const unreadCount = notifications.filter((n: any) => !n.isRead).length;

  const typeColors: Record<string, { bg: string; text: string; badge: string }> = {
    purchase: { bg: 'bg-purple-500/10', text: 'text-purple-300', badge: 'bg-purple-500' },
    review: { bg: 'bg-blue-500/10', text: 'text-blue-300', badge: 'bg-blue-500' },
    comment: { bg: 'bg-green-500/10', text: 'text-green-300', badge: 'bg-green-500' },
    reminder: { bg: 'bg-amber-500/10', text: 'text-amber-300', badge: 'bg-amber-500' },
    order_confirmed: { bg: 'bg-purple-500/10', text: 'text-purple-300', badge: 'bg-purple-500' },
    payment_failed: { bg: 'bg-red-500/10', text: 'text-red-300', badge: 'bg-red-500' },
    refund_issued: { bg: 'bg-green-500/10', text: 'text-green-300', badge: 'bg-green-500' },
    delivery_confirmed: { bg: 'bg-blue-500/10', text: 'text-blue-300', badge: 'bg-blue-500' },
    order_cancelled: { bg: 'bg-red-500/10', text: 'text-red-300', badge: 'bg-red-500' },
    order_shipped: { bg: 'bg-blue-500/10', text: 'text-blue-300', badge: 'bg-blue-500' },
    order_out_for_delivery: { bg: 'bg-amber-500/10', text: 'text-amber-300', badge: 'bg-amber-500' },
    payment_processed: { bg: 'bg-green-500/10', text: 'text-green-300', badge: 'bg-green-500' },
    default: { bg: 'bg-gray-500/10', text: 'text-gray-300', badge: 'bg-gray-500' },
  };

  const filteredNotifications = useMemo(() => {
    let filtered = notifications.filter((n: any) => {
      const matchesSearch =
        !searchTerm ||
        n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (n.message && n.message.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFilter = filterType === 'all' || n.type === filterType;

      return matchesSearch && matchesFilter;
    });

    if (sortBy === 'oldest') {
      filtered = [...filtered].reverse();
    } else if (sortBy === 'unread') {
      filtered = [...filtered].sort((a: any, b: any) => (a.isRead ? 1 : -1));
    }

    return filtered;
  }, [notifications, searchTerm, filterType, sortBy]);

  const selectedNotificationData = selectedNotification
    ? filteredNotifications.find((n: any) => n.id === selectedNotification)
    : null;

  const handleMarkAsRead = (id: string, currentIsRead: boolean) => {
    markAsReadMutation.mutate(
      { notificationId: id, isRead: !currentIsRead },
      {
        onSuccess: () => {
          toast.success(!currentIsRead ? 'Marked as read' : 'Marked as unread');
        },
        onError: () => {
          toast.error('Failed to update notification');
        },
      }
    );
  };

  const handleToggleFavorite = (id: string) => {
    toggleFavoriteMutation.mutate(
      { notificationId: id },
      {
        onSuccess: () => {
          toast.success('Notification favorited');
        },
        onError: () => {
          toast.error('Failed to favorite notification');
        },
      }
    );
  };

  const handleDelete = (id: string) => {
    deleteNotificationMutation.mutate(
      { notificationId: id },
      {
        onSuccess: () => {
          toast.success('Notification deleted');
          setSelectedNotification(null);
        },
        onError: () => {
          toast.error('Failed to delete notification');
        },
      }
    );
  };

  const handleDeleteAll = () => {
    if (window.confirm('Are you sure you want to delete all notifications?')) {
      deleteAllMutation.mutate(undefined, {
        onSuccess: () => {
          toast.success('All notifications deleted');
          setSelectedNotification(null);
        },
        onError: () => {
          toast.error('Failed to delete notifications');
        },
      });
    }
  };

  const getTypeColor = (type: string) => {
    return typeColors[type] || typeColors.default;
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      purchase: 'Purchase',
      review: 'Review',
      comment: 'Comment',
      reminder: 'Reminder',
      order_confirmed: 'Order Confirmed',
      payment_failed: 'Payment Failed',
      refund_issued: 'Refund Issued',
      delivery_confirmed: 'Delivery Confirmed',
      order_cancelled: 'Order Cancelled',
      order_shipped: 'Order Shipped',
      order_out_for_delivery: 'Out for Delivery',
      payment_processed: 'Payment Processed',
    };
    return labels[type] || type;
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Breadcrumb Navigation */}
      <div className="px-8 py-4 bg-[#0a0a0a] border-b border-gray-800">
        <div className="flex items-center gap-2 text-sm">
          <a href="/buyer/dashboard" className="text-gray-400 hover:text-white transition-colors duration-200 cursor-pointer">
            Dashboard
          </a>
          <span className="text-gray-600">/</span>
          <span className="text-white">Notifications</span>
        </div>
      </div>

      {/* Header */}
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#2d1a3d] border-b border-[#8451E1] px-8 py-6">
        <div className="flex items-center gap-3 mb-2">
          <Bell className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold">Notifications</h1>
        </div>
        <p className="text-gray-400">You have {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}</p>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-8 h-[calc(100vh-240px)]">
        {/* Left: Search & Filter */}
        <div className="lg:col-span-1 flex flex-col gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-3 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-purple-500/30 rounded-lg pl-10 pr-4 py-2 text-white placeholder-gray-500 focus:border-purple-500 focus:outline-none transition-colors duration-200 cursor-text"
            />
          </div>

          {/* Type Filter */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Filter by Type</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none transition-colors duration-200 cursor-pointer"
            >
              <option value="all">All Types</option>
              <option value="order_confirmed">Order Updates</option>
              <option value="comment">Messages</option>
              <option value="reminder">Reminders</option>
              <option value="review">Reviews</option>
            </select>
          </div>

          {/* Sort */}
          <div className="space-y-2">
            <label className="text-sm text-gray-400">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-full bg-[#1a1a1a] border border-purple-500/30 rounded-lg px-4 py-2 text-white focus:border-purple-500 focus:outline-none transition-colors duration-200 cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="unread">Unread First</option>
            </select>
          </div>

          {/* Delete All Button */}
          <button
            onClick={handleDeleteAll}
            disabled={filteredNotifications.length === 0 || deleteAllMutation.isPending}
            className="w-full bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-lg px-4 py-2 font-medium transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            Delete All
          </button>
        </div>

        {/* Middle: Notifications List */}
        <div className="lg:col-span-1 overflow-y-auto space-y-2 pr-2">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-purple-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-400">Failed to load notifications</div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-400">No notifications found</div>
          ) : (
            filteredNotifications.map((notification: any) => {
              const colors = getTypeColor(notification.type);
              return (
                <div
                  key={notification.id}
                  onClick={() => setSelectedNotification(notification.id)}
                  className={`p-4 rounded-lg border transition-all duration-200 cursor-pointer ${
                    selectedNotification === notification.id
                      ? 'border-purple-500 bg-purple-500/10'
                      : 'border-gray-700/50 bg-[#1a1a1a] hover:bg-[#2a2a2a] hover:border-purple-500/50'
                  } ${!notification.isRead ? 'bg-[#1f1a2e]' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-white truncate">{notification.title}</h3>
                        {!notification.isRead && <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 animate-pulse"></div>}
                      </div>
                      <p className="text-xs text-gray-400 truncate">{notification.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-block text-xs px-2 py-1 rounded ${colors.bg} ${colors.text} font-medium capitalize`}>
                          {getTypeLabel(notification.type)}
                        </span>
                        <span className="text-xs text-gray-500">{new Date(notification.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Right: Notification Details */}
        <div className="lg:col-span-1">
          {selectedNotificationData ? (
            <div className="bg-[#1a1a1a] border border-purple-500/30 rounded-lg p-6 h-full flex flex-col">
              <div className="flex-1 overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">{selectedNotificationData.title}</h2>

                {/* Metadata */}
                <div className="space-y-3 mb-6 pb-6 border-b border-gray-700/50">
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Type</p>
                    <p className={`text-sm font-medium capitalize ${getTypeColor(selectedNotificationData.type).text}`}>
                      {getTypeLabel(selectedNotificationData.type)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Status</p>
                    <p className="text-sm font-medium text-gray-300">{selectedNotificationData.isRead ? 'Read' : 'Unread'}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                    <p className="text-sm font-medium text-gray-300">
                      {new Date(selectedNotificationData.timestamp).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Message */}
                <div className="mb-6">
                  <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Message</p>
                  <p className="text-gray-200 leading-relaxed">{selectedNotificationData.message}</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-6 border-t border-gray-700/50">
                <button
                  onClick={() => handleMarkAsRead(selectedNotificationData.id, selectedNotificationData.isRead)}
                  disabled={markAsReadMutation.isPending}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 font-medium transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                >
                  {selectedNotificationData.isRead ? 'Mark Unread' : 'Mark Read'}
                </button>
                <button
                  onClick={() => handleToggleFavorite(selectedNotificationData.id)}
                  disabled={toggleFavoriteMutation.isPending}
                  className="flex-1 bg-amber-600/20 hover:bg-amber-600/30 text-amber-400 border border-amber-500/50 rounded-lg px-4 py-2 font-medium transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <Star className="w-4 h-4 inline mr-1" />
                  {selectedNotificationData.isFavorited ? 'Unfavorite' : 'Favorite'}
                </button>
                <button
                  onClick={() => handleDelete(selectedNotificationData.id)}
                  disabled={deleteNotificationMutation.isPending}
                  className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 rounded-lg px-4 py-2 font-medium transition-colors duration-200 disabled:opacity-50 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-[#1a1a1a] border border-purple-500/30 rounded-lg p-6 h-full flex items-center justify-center">
              <p className="text-gray-400">Select a notification to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}