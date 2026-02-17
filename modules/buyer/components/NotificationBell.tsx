'use client';

import { useState, useRef, useEffect } from 'react';
import { Bell, X } from 'lucide-react';
import { useUnifiedNotifications, useMarkNotificationAsRead } from '@/modules/buyer/queries/useNotifications';
import Link from 'next/link';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { data: notificationsData, isLoading } = useUnifiedNotifications();
  const markAsReadMutation = useMarkNotificationAsRead();

  // Use unified response: { notifications, total, unreadCount }
  const notifications = notificationsData?.notifications || [];
  const unreadCount = notificationsData?.unreadCount ?? 0;

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  const handleNotificationClick = (notificationId: string, isRead: boolean) => {
    if (!isRead) {
      markAsReadMutation.mutate({ notificationId, isRead: true });
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'order_confirmed':
      case 'payment_processed':
        return 'text-purple-400';
      case 'refund_issued':
        return 'text-green-400';
      case 'payment_failed':
        return 'text-red-400';
      case 'order_shipped':
        return 'text-blue-400';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <div className="relative" ref={dropdownRef}>
        {/* Bell Icon Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="relative p-2 hover:bg-purple-500/10 rounded-lg transition-colors duration-200 cursor-pointer"
          aria-label="Notifications"
        >
        <Bell className="w-6 h-6 text-gray-300 hover:text-purple-400 transition-colors" />
        
        {/* Badge Count */}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold h-5 w-5 flex items-center justify-center rounded-full border-2 border-[#0E0E0E] animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="fixed inset-x-0 sm:absolute sm:right-0 sm:inset-auto bottom-0 sm:bottom-auto sm:mt-2 sm:w-96 w-full bg-[#1a1a1a] border border-purple-500/30 rounded-t-lg sm:rounded-lg shadow-xl z-50">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-purple-500/20">
            <h3 className="text-lg font-bold text-white">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-gray-700/50 rounded transition-colors"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center p-8">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-purple-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                No notifications yet
              </div>
            ) : (
              notifications.slice(0, 5).map((notification: any) => (
                <div
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification.id, notification.isRead)}
                  className={`p-3 border-b border-gray-700/30 hover:bg-gray-900/50 cursor-pointer transition-colors ${
                    !notification.isRead ? 'bg-gray-900/30' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {notification.title}
                      </p>
                      <p className="text-xs text-gray-400 truncate mt-1">
                        {notification.message}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs font-medium ${getNotificationColor(notification.type)}`}>
                          {notification.type.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {!notification.isRead && (
                          <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer - View All Link */}
          {notifications.length > 0 && (
            <div className="p-4 border-t border-purple-500/20">
              <Link
                href="/buyer/dashboard/notifications"
                onClick={() => setIsOpen(false)}
                className="block w-full text-center bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-4 py-2 font-medium transition-colors text-sm"
              >
                View All Notifications
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
    </>
  );
}