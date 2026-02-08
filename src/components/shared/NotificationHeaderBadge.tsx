'use client';

import { useBuyerNotificationsCount } from '@/modules/buyer/queries/useBuyerNotificationsCount';
import { useSellerNotificationsCount } from '@/modules/seller/queries/useSellerNotificationsCount';
import { NotificationBell } from './NotificationBadge';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

interface NotificationHeaderBadgeProps {
  userRole?: 'buyer' | 'seller' | 'admin';
  onNotificationClick?: () => void;
}

export const NotificationHeaderBadge = ({
  userRole = 'buyer',
  onNotificationClick,
}: NotificationHeaderBadgeProps) => {
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  const buyerUnreadCount = useBuyerNotificationsCount();
  const sellerUnreadCount = useSellerNotificationsCount();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const unreadCount = userRole === 'seller' ? sellerUnreadCount : buyerUnreadCount;

  const handleClick = () => {
    if (onNotificationClick) {
      onNotificationClick();
    } else {
      const notificationPath =
        userRole === 'seller'
          ? '/seller/notifications'
          : '/buyer/notifications';
      router.push(notificationPath);
    }
  };

  return (
    <NotificationBell
      count={unreadCount}
      onClick={handleClick}
      variant={userRole === 'seller' ? 'primary' : 'danger'}
      maxDisplayCount={99}
      className="ml-2"
    />
  );
};

export const NotificationHeaderBadgeWithTooltip = ({
  userRole = 'buyer',
  onNotificationClick,
}: NotificationHeaderBadgeProps) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const buyerUnreadCount = useBuyerNotificationsCount();
  const sellerUnreadCount = useSellerNotificationsCount();

  const unreadCount = userRole === 'seller' ? sellerUnreadCount : buyerUnreadCount;

  return (
    <div className="relative group">
      <NotificationHeaderBadge
        userRole={userRole}
        onNotificationClick={onNotificationClick}
      />

      {unreadCount > 0 && (
        <div className="absolute right-0 top-full mt-2 bg-gray-900 text-white text-sm rounded-md px-3 py-2 pointer-events-none group-hover:pointer-events-auto opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50">
          {unreadCount} new notification{unreadCount !== 1 ? 's' : ''}
          <div className="absolute -top-1 right-2 w-2 h-2 bg-gray-900 transform rotate-45" />
        </div>
      )}
    </div>
  );
};

export const NotificationMiniBadge = ({
  userRole = 'buyer',
}: Omit<NotificationHeaderBadgeProps, 'onNotificationClick'>) => {
  const buyerUnreadCount = useBuyerNotificationsCount();
  const sellerUnreadCount = useSellerNotificationsCount();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  const unreadCount = userRole === 'seller' ? sellerUnreadCount : buyerUnreadCount;

  if (unreadCount === 0) return null;

  return (
    <div className="inline-flex items-center justify-center h-5 w-5 bg-red-500 text-white text-xs font-semibold rounded-full">
      {unreadCount > 99 ? '99+' : unreadCount}
    </div>
  );
};