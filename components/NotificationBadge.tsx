'use client';

import React, { useMemo } from 'react';
import { Bell, AlertTriangle } from 'lucide-react';
import { useNotificationBadge } from '@/hooks/useNotifications';

interface NotificationBadgeProps {
  userType: 'buyer' | 'seller' | 'admin';
  className?: string;
  onClick?: () => void;
}

/**
 * Notification badge component for showing unread notification count
 * Real-time polling updates every 5 seconds
 */
export function NotificationBadge({
  userType,
  className = '',
  onClick,
}: NotificationBadgeProps) {
  const badge = useNotificationBadge(userType);
  const { count, criticalCount } = badge as any;

  // Determine badge color based on notification severity
  const badgeColor = useMemo(() => {
    if (criticalCount && criticalCount > 0) {
      return 'bg-red-600';
    }
    if (count > 0) {
      return 'bg-blue-500';
    }
    return 'bg-gray-400';
  }, [count, criticalCount]);

  // Determine icon color
  const iconColor = useMemo(() => {
    if (criticalCount && criticalCount > 0) {
      return 'text-red-600';
    }
    if (count > 0) {
      return 'text-blue-500';
    }
    return 'text-gray-600';
  }, [count, criticalCount]);

  // Display text for badge
  const displayText = useMemo(() => {
    if (count === 0) return '';
    return count > 99 ? '99+' : String(count);
  }, [count]);

  return (
    <button
      onClick={onClick}
      className={`relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors ${className}`}
      aria-label={`Notifications (${count} unread${criticalCount > 0 ? `, ${criticalCount} critical` : ''})`}
      title={`${count} unread notifications${criticalCount > 0 ? ` (${criticalCount} critical)` : ''}`}
    >
      {/* Bell icon */}
      <Bell className={`w-5 h-5 ${iconColor}`} />

      {/* Main count badge */}
      {count > 0 && (
        <span
          className={`absolute top-0 right-0 inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white rounded-full ${badgeColor} animate-pulse`}
        >
          {displayText}
        </span>
      )}

      {/* Critical indicator for admin */}
      {criticalCount && criticalCount > 0 && userType === 'admin' && (
        <span
          className="absolute top-1 right-1 inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"
          title={`${criticalCount} critical notifications`}
        />
      )}
    </button>
  );
}

export default NotificationBadge;