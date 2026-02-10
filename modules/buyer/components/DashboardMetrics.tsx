'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { Package, AlertCircle, RotateCcw, Bell, TrendingUp, DollarSign, ShoppingCart, TrendingDown } from 'lucide-react';
import { useBuyerNotificationsCount } from '@/modules/buyer/queries/useBuyerNotificationsCount';
import { trpc } from '@/lib/trpc';

interface MetricCard {
  label: string;
  count: number | string;
  icon: React.ReactNode;
  href: string;
  color: 'primary' | 'secondary' | 'accent' | 'success' | 'warning';
  description?: string;
  isCurrency?: boolean;
}

// Luxela Brand Colors
const colorClasses = {
  primary: 'bg-[#8451e1]/10 border-[#8451e1]/30 text-[#b5a3ff] hover:bg-[#8451e1]/20', // Brand primary purple
  secondary: 'bg-[#927fe1]/10 border-[#927fe1]/30 text-[#927fe1] hover:bg-[#927fe1]/20', // Lighter purple
  accent: 'bg-[#e0d9f1]/10 border-[#e0d9f1]/30 text-[#c9b8f7] hover:bg-[#e0d9f1]/20', // Light accent
  success: 'bg-[#87c53d]/10 border-[#87c53d]/30 text-[#a6d96e] hover:bg-[#87c53d]/20', // Success green
  warning: 'bg-[#a3885e]/10 border-[#a3885e]/30 text-[#c4b691] hover:bg-[#a3885e]/20', // Warm brown
};

const badgeColorClasses = {
  primary: 'bg-[#8451e1] text-white', // Brand primary
  secondary: 'bg-[#927fe1] text-white', // Lighter purple
  accent: 'bg-[#e0d9f1] text-[#4d3f61]', // Light with dark text
  success: 'bg-[#87c53d] text-white', // Success
  warning: 'bg-[#a3885e] text-white', // Warm
};

const getCurrencySymbol = (currency: string): string => {
  const symbols: Record<string, string> = {
    USD: '$',
    EUR: '€',
    GBP: '£',
    NGN: '₦',
    JPY: '¥',
    INR: '₹',
  };
  return symbols[currency] || currency;
};

export const DashboardMetrics: React.FC = () => {
  // Fetch notification count (already returns number via hook)
  const { data: notificationCount = 0 } = useBuyerNotificationsCount();

  // Fetch active orders (ongoing status)
  const { data: ordersData } = trpc.buyer.getPurchaseHistory.useQuery(
    { page: 1, limit: 100 },
    { select: (data) => data?.data || [] }
  );

  // Fetch support tickets
  const { data: ticketsData } = trpc.support.getTickets.useQuery(
    { status: 'open' as any },
    { select: (data) => data || [] }
  );

  // Calculate metrics
  const metrics = useMemo<MetricCard[]>(() => {
    const activeOrders = (ordersData || []).filter(
      (order: any) =>
        order.deliveryStatus !== 'delivered' &&
        order.deliveryStatus !== 'canceled' &&
        order.orderStatus !== 'canceled'
    ).length;

    const openTickets = (ticketsData || []).filter(
      (ticket: any) =>
        ticket.status === 'open' || ticket.status === 'in_progress'
    ).length;

    // Calculate financial metrics
    const allOrders = ordersData || [];
    const totalSpentCents = allOrders.reduce((sum: number, order: any) => sum + (order.amountCents || 0), 0);
    const totalSpent = (totalSpentCents / 100).toFixed(2);
    const currency = allOrders[0]?.currency || 'NGN';
    const currencySymbol = getCurrencySymbol(currency);

    // Calculate this month's spending
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthSpentCents = allOrders
      .filter((order: any) => new Date(order.createdAt) >= monthStart)
      .reduce((sum: number, order: any) => sum + (order.amountCents || 0), 0);
    const thisMonthSpent = (thisMonthSpentCents / 100).toFixed(2);

    // Calculate average order value
    const avgOrderValue = allOrders.length > 0 ? (totalSpentCents / allOrders.length / 100).toFixed(2) : '0.00';
    const purchaseCount = allOrders.length;

    return [
      {
        label: 'Total Spent',
        count: `${currencySymbol}${totalSpent}`,
        icon: <DollarSign className="w-6 h-6" />,
        href: '/buyer/dashboard/orders',
        color: 'primary',
        description: 'All-time purchases',
        isCurrency: true,
      },
      {
        label: 'This Month',
        count: `${currencySymbol}${thisMonthSpent}`,
        icon: <TrendingUp className="w-6 h-6" />,
        href: '/buyer/dashboard/orders',
        color: 'secondary',
        description: 'Monthly spending',
        isCurrency: true,
      },
      {
        label: 'Avg Order Value',
        count: `${currencySymbol}${avgOrderValue}`,
        icon: <ShoppingCart className="w-6 h-6" />,
        href: '/buyer/dashboard/orders',
        color: 'accent',
        description: 'Per purchase',
        isCurrency: true,
      },
      {
        label: 'Total Purchases',
        count: purchaseCount,
        icon: <Package className="w-6 h-6" />,
        href: '/buyer/dashboard/orders',
        color: 'success',
        description: 'Orders placed',
      },
      {
        label: 'Active Orders',
        count: activeOrders,
        icon: <TrendingDown className="w-6 h-6" />,
        href: '/buyer/dashboard/orders',
        color: 'primary',
        description: 'In progress',
      },
      {
        label: 'Notifications',
        count: notificationCount,
        icon: <Bell className="w-6 h-6" />,
        href: '/buyer/dashboard/notifications',
        color: 'warning',
        description: 'Unread messages',
      },
      {
        label: 'Support Tickets',
        count: openTickets,
        icon: <AlertCircle className="w-6 h-6" />,
        href: '/buyer/dashboard/support-tickets',
        color: 'secondary',
        description: 'Open requests',
      },
    ];
  }, [ordersData, notificationCount, ticketsData]);

  return (
    <div>
      {/* Financial Metrics Section */}
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-white mb-4">Financial Overview</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {metrics.slice(0, 4).map((metric) => (
            <Link
              key={metric.label}
              href={metric.href}
              className={`relative p-5 rounded-xl border transition-all duration-200 ${colorClasses[metric.color]} hover:shadow-lg active:scale-95`}
            >
              {/* Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-black/30">{metric.icon}</div>
              </div>

              {/* Label */}
              <h3 className="font-semibold text-white mb-1">{metric.label}</h3>

              {/* Value */}
              <p className="text-2xl font-bold text-white mb-2">{metric.count}</p>

              {/* Description */}
              {metric.description && (
                <p className="text-xs opacity-70">{metric.description}</p>
              )}
            </Link>
          ))}
        </div>
      </div>

      {/* Activity Metrics Section */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-4">Activity Status</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {metrics.slice(4).map((metric) => (
            <Link
              key={metric.label}
              href={metric.href}
              className={`relative p-5 rounded-xl border transition-all duration-200 ${colorClasses[metric.color]} hover:shadow-lg active:scale-95`}
            >
              {/* Icon */}
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 rounded-lg bg-black/30">{metric.icon}</div>
                {typeof metric.count === 'number' && metric.count > 0 && (
                  <span className={`px-3 py-1 rounded-full text-sm font-bold ${badgeColorClasses[metric.color]}`}>
                    {metric.count > 99 ? '99+' : metric.count}
                  </span>
                )}
              </div>

              {/* Label */}
              <h3 className="font-semibold text-white mb-1">{metric.label}</h3>

              {/* Description */}
              {metric.description && (
                <p className="text-xs opacity-70">{metric.description}</p>
              )}

              {/* Trend Indicator */}
              {typeof metric.count === 'number' && metric.count > 0 && (
                <div className="mt-3 pt-3 border-t border-current/20 flex items-center gap-1 text-xs">
                  <TrendingUp className="w-3 h-3" />
                  <span>{metric.count} item{metric.count !== 1 ? 's' : ''}</span>
                </div>
              )}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardMetrics;