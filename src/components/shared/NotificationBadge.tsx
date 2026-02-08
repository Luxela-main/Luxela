'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface NotificationBadgeProps {
  count: number;
  className?: string;
  variant?: 'default' | 'primary' | 'danger' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  maxDisplayCount?: number;
  showZero?: boolean;
}


export const NotificationBadge = React.memo(({
  count,
  className,
  variant = 'default',
  size = 'md',
  maxDisplayCount = 99,
  showZero = false,
}: NotificationBadgeProps) => {
  if (count === 0 && !showZero) {
    return null;
  }

  const displayCount = count > maxDisplayCount ? `${maxDisplayCount}+` : count;

  const baseStyles = 'inline-flex items-center justify-center font-semibold rounded-full';

  const variantStyles = {
    default: 'bg-gray-200 text-gray-900',
    primary: 'bg-blue-500 text-white',
    danger: 'bg-red-500 text-white',
    warning: 'bg-yellow-500 text-white',
  };

  const sizeStyles = {
    sm: 'h-5 w-5 text-xs',
    md: 'h-6 w-6 text-sm',
    lg: 'h-7 w-7 text-base',
  };

  return (
    <span
      className={cn(
        baseStyles,
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      role="status"
      aria-label={`${count} unread notification${count !== 1 ? 's' : ''}`}
    >
      {displayCount}
    </span>
  );
});

NotificationBadge.displayName = 'NotificationBadge';

interface NotificationBellProps extends NotificationBadgeProps {
  icon?: React.ReactNode;
  onClick?: () => void;
  isLoading?: boolean;
}

export const NotificationBell = React.memo(({
  count,
  icon,
  onClick,
  isLoading = false,
  className,
  variant = 'danger',
  ...badgeProps
}: NotificationBellProps) => {
  return (
    <button
      onClick={onClick}
      className={cn(
        'relative inline-flex items-center justify-center p-2 rounded-lg',
        'hover:bg-gray-100 dark:hover:bg-gray-800',
        'transition-colors duration-200',
        isLoading && 'opacity-50 cursor-not-allowed',
        className
      )}
      disabled={isLoading}
      aria-label="Notifications"
    >
      {icon ? (
        icon
      ) : (
        <svg
          className="w-5 h-5"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
      )}

      {count > 0 && (
        <NotificationBadge
          count={count}
          variant={variant}
          size="sm"
          className="absolute -top-1 -right-1"
          {...badgeProps}
        />
      )}
    </button>
  );
});

NotificationBell.displayName = 'NotificationBell';