'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { trpc } from '@/lib/_trpc/client';
import { NotificationCategory, NotificationSeverity } from '@/server/routers/admin-notifications.types';
import { useRouter } from 'next/navigation';
import {
  AlertCircle,
  Bell,
  CheckCircle,
  Clock,
  Filter,
  Loader,
  Search,
  Zap,
  AlertTriangle,
  Users,
  Ticket,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

// Extended type to handle serialized createdAt from TRPC (ISO string)
interface Notification {
  id: string;
  category: 'urgent_ticket' | 'sla_breach' | 'escalation' | 'team_capacity' | 'system_alert' | 'new_reply';
  severity: NotificationSeverity;
  title: string;
  message: string;
  relatedEntityId: string | null;
  relatedEntityType: 'ticket' | 'team_member' | 'system' | null;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string | Date; 
  metadata?: Record<string, any>;
}

const categoryConfig = {
  urgent_ticket: {
    label: 'Urgent Tickets',
    color: 'text-red-400',
    bgColor: 'bg-slate-800/60 border-[#2B2B2B]',
    icon: AlertCircle,
  },
  sla_breach: {
    label: 'SLA Breaches',
    color: 'text-orange-400',
    bgColor: 'bg-slate-800/60 border-[#2B2B2B]',
    icon: Clock,
  },
  escalation: {
    label: 'Escalations',
    color: 'text-yellow-400',
    bgColor: 'bg-slate-800/60 border-[#2B2B2B]',
    icon: Zap,
  },
  team_capacity: {
    label: 'Team Capacity',
    color: 'text-blue-400',
    bgColor: 'bg-slate-800/60 border-[#2B2B2B]',
    icon: Users,
  },
  system_alert: {
    label: 'System Alerts',
    color: 'text-purple-400',
    bgColor: 'bg-slate-800/60 border-[#2B2B2B]',
    icon: AlertTriangle,
  },
  new_reply: {
    label: 'New Replies',
    color: 'text-green-400',
    bgColor: 'bg-slate-800/60 border-[#2B2B2B]',
    icon: Ticket,
  },
};

const severityConfig = {
  critical: {
    label: 'Critical',
    color: 'text-red-500',
    badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
  },
  warning: {
    label: 'Warning',
    color: 'text-orange-500',
    badge: 'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  },
  info: {
    label: 'Info',
    color: 'text-blue-500',
    badge: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  },
};

function formatTime(date: string | Date) {
  const now = new Date();
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const diff = now.getTime() - dateObj.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return dateObj.toLocaleDateString();
}

function NotificationItem({
  notification,
  onRead,
}: {
  notification: Notification;
  onRead: (id: string) => void;
}) {
  const router = useRouter();
  const config = categoryConfig[notification.category as keyof typeof categoryConfig];
  const severityConfig_ = severityConfig[notification.severity as keyof typeof severityConfig];
  const IconComponent = config.icon;

  const handleClick = () => {
    onRead(notification.id);
    if (notification.actionUrl) {
      router.push(notification.actionUrl);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={cn(
        'p-4 border rounded-lg cursor-pointer transition-all hover:shadow-lg hover:shadow-black/50 backdrop-blur-sm',
        config.bgColor,
        !notification.isRead && 'border-l-4 border-l-current'
      )}
    >
      <div className="flex items-start gap-3">
        <IconComponent className={cn('w-5 h-5 mt-0.5 flex-shrink-0', config.color)} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <p className="font-semibold text-gray-100">{notification.title}</p>
              <p className="text-sm text-gray-400 mt-1">{notification.message}</p>
            </div>
            <span className={cn('px-2 py-1 rounded text-xs font-medium whitespace-nowrap', severityConfig_.badge)}>
              {severityConfig_.label}
            </span>
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-500">
            <span>{formatTime(new Date(notification.createdAt))}</span>
            {!notification.isRead && (
              <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function CategorySection({
  category,
  notifications,
  onRead,
}: {
  category: string;
  notifications: Notification[];
  onRead: (id: string) => void;
}) {
  const config = categoryConfig[category as keyof typeof categoryConfig];

  if (notifications.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <config.icon className={cn('w-5 h-5', config.color)} />
        <h3 className="font-semibold text-gray-100">
          {config.label}
          <span className="ml-2 text-sm font-normal text-gray-500">
            ({notifications.length})
          </span>
        </h3>
      </div>
      <div className="space-y-2 ml-7">
        {notifications.map((notif) => (
          <NotificationItem
            key={notif.id}
            notification={notif}
            onRead={onRead}
          />
        ))}
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const router = useRouter();
  const [filter, setFilter] = useState<{
    category?: NotificationCategory;
    severity?: NotificationSeverity;
    unreadOnly: boolean;
  }>({ unreadOnly: false });
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedNotif, setSelectedNotif] = useState<string | null>(null);

  // Fetch notifications with real-time auto-refetch
  const { data: notificationsData, isLoading: isLoadingNotifications, refetch } = trpc.adminNotifications.getNotifications.useQuery({
    category: filter.category,
    severity: filter.severity,
    unreadOnly: filter.unreadOnly,
    limit: 500,
  }, {
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  });

  // Fetch unread count
  const { data: unreadData } = trpc.adminNotifications.getUnreadCount.useQuery(undefined, {
    refetchInterval: 10000, 
  });

  // Mark as read mutation
  const markAsReadMutation = trpc.adminNotifications.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Mark all as read mutation
  const markAllAsReadMutation = trpc.adminNotifications.markAllAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  // Filter notifications based on search
  const filteredNotifications = useMemo(() => {
    if (!notificationsData?.notifications) return [];

    return notificationsData.notifications.filter(
      (notif) =>
        notif.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        notif.message.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [notificationsData?.notifications, searchTerm]);

  // Group by category
  const groupedByCategory = useMemo(() => {
    const groups: Record<string, Notification[]> = {
      urgent_ticket: [],
      sla_breach: [],
      escalation: [],
      team_capacity: [],
      system_alert: [],
      new_reply: [],
    };

    (filteredNotifications as Notification[]).forEach((notif: Notification) => {
      if (notif.category in groups) {
        groups[notif.category].push(notif);
      }
    });

    return groups;
  }, [filteredNotifications]);

  const handleMarkAsRead = useCallback((notifId: string) => {
    markAsReadMutation.mutate({ notificationId: notifId });
  }, [markAsReadMutation]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] via-[#1a1a1a] to-[#0e0e0e]">
      {/* Header */}
      <div className="border-b border-[#2B2B2B] bg-black/30 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-lg border border-blue-500/50">
                <Bell className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Notifications</h1>
                <p className="text-gray-400 mt-1">
                  Stay on top of critical alerts and updates
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-white">
                {unreadData?.count || 0}
              </div>
              <p className="text-sm text-gray-400">Unread</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Toolbar */}
        <div className="bg-slate-800/50 rounded-lg border border-[#2B2B2B] p-4 mb-6 backdrop-blur-sm">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            {/* Search */}
            <div className="flex-1 min-w-0">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Search
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-[#2B2B2B] bg-slate-700 text-white rounded-lg w-full placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
            </div>

            {/* Severity Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Severity
              </label>
              <select
                value={filter.severity || ''}
                onChange={(e) =>
                  setFilter({
                    ...filter,
                    severity: e.target.value
                      ? (e.target.value as NotificationSeverity)
                      : undefined,
                  })
                }
                className="px-4 py-2 border border-[#2B2B2B] bg-slate-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="">All Severities</option>
                <option value="critical">Critical</option>
                <option value="warning">Warning</option>
                <option value="info">Info</option>
              </select>
            </div>

            {/* Unread Filter */}
            <div>
              <button
                onClick={() => setFilter({ ...filter, unreadOnly: !filter.unreadOnly })}
                className={cn(
                  'px-4 py-2 rounded-lg border transition-colors',
                  filter.unreadOnly
                    ? 'bg-purple-600 text-white border-purple-600'
                    : 'bg-slate-700 text-gray-300 border-[#2B2B2B] hover:bg-slate-600'
                )}
              >
                <Filter className="w-4 h-4 inline mr-2" />
                Unread Only
              </button>
            </div>

            {/* Mark All as Read */}
            {notificationsData && notificationsData.unreadCount > 0 && (
              <button
                onClick={() => markAllAsReadMutation.mutate(undefined)}
                disabled={markAllAsReadMutation.isPending}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 transition-colors"
              >
                <CheckCircle className="w-4 h-4 inline mr-2" />
                Mark All Read
              </button>
            )}
          </div>
        </div>

        {/* Notifications Content */}
        {isLoadingNotifications ? (
          <div className="flex items-center justify-center py-12">
            <Loader className="w-6 h-6 text-blue-400 animate-spin" />
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 text-gray-700 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-100">No notifications</h3>
            <p className="text-gray-400 mt-1">
              {searchTerm
                ? 'Try adjusting your search filters'
                : 'You are all caught up!'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedByCategory).map(([category, notifications]) => (
              <CategorySection
                key={category}
                category={category as any}
                notifications={notifications}
                onRead={handleMarkAsRead}
              />
            ))}
          </div>
        )}

        {/* Pagination Info */}
        {notificationsData && (
          <div className="mt-8 pt-6 border-t border-[#2B2B2B] text-center text-sm text-gray-400">
            Showing {filteredNotifications.length} of {notificationsData.total} notifications • Auto-refreshing every 5 seconds
          </div>
        )}
      </div>
    </div>
  );
}