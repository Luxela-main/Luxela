'use client';

import { Order } from '@/types/buyer';
import { CheckCircle, Clock, Truck, AlertCircle, X, Star } from 'lucide-react';
import Link from 'next/link';

interface OrderCardProps {
  order: Order;
  onViewDetails?: (orderId: string) => void;
}

const statusConfig = {
  pending: { color: 'from-yellow-500 to-amber-500', icon: Clock, label: 'Pending' },
  confirmed: { color: 'from-blue-500 to-cyan-500', icon: Clock, label: 'Confirmed' },
  processing: { color: 'from-blue-500 to-cyan-500', icon: Clock, label: 'Processing' },
  shipped: { color: 'from-purple-500 to-pink-500', icon: Truck, label: 'In Transit' },
  delivered: { color: 'from-emerald-500 to-green-500', icon: CheckCircle, label: 'Delivered' },
  canceled: { color: 'from-red-500 to-orange-500', icon: X, label: 'Canceled' },
  returned: { color: 'from-red-500 to-orange-500', icon: AlertCircle, label: 'Returned' },
};

export function OrderCard({ order, onViewDetails }: OrderCardProps) {
  const status = (order.orderStatus as keyof typeof statusConfig) || 'pending';
  const config = statusConfig[status];
  const Icon = config.icon;

  const getPrice = () => {
    const cents = (order as any).totalPriceCents || (order as any).amountCents || 0;
    return (cents / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getFormattedDate = (date: Date | string | undefined) => {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(d);
  };

  const orderDate = (order as any).createdAt || (order as any).orderDate;
  const deliveryDate = (order as any).deliveredDate;

  return (
    <Link href={`/buyer/dashboard/orders/${order.orderId}`}>
      <div className="group relative h-full bg-gradient-to-br from-[#1a1a2e]/60 to-[#0f0f1a]/60 backdrop-blur-xl border border-[#8451E1]/30 rounded-xl p-5 sm:p-6 hover:border-[#8451E1]/70 transition-all duration-300 hover:shadow-lg hover:shadow-[#8451E1]/20 cursor-pointer hover:-translate-y-1">
        {/* Top section - Status and Date */}
        <div className="flex items-start justify-between mb-4 gap-3">
          <div className="flex items-center gap-2">
            <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gradient-to-r ${config.color} bg-opacity-20 border border-current border-opacity-30`}>
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">{config.label}</span>
            </div>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {orderDate ? getFormattedDate(orderDate) : 'N/A'}
          </span>
        </div>

        {/* Product Image and Info */}
        <div className="flex gap-4 mb-4">
          {(order.productImages?.[0] || order.productImage) && (
            <div className="relative w-16 h-20 sm:w-20 sm:h-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#1a1a1a] border border-[#8451E1]/20">
              <img
                src={order.productImages?.[0] || order.productImage || ''}
                alt={order.productTitle}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            </div>
          )}
          
          {(order.productImages?.length || 0) > 1 && (
            <div className="absolute top-3 right-3 bg-black/70 px-2 py-1 rounded text-xs font-semibold text-white">
              +{(order.productImages?.length || 0) - 1}
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-white text-sm sm:text-base line-clamp-2 mb-2 group-hover:text-[#8451E1] transition-colors">
              {order.productTitle}
            </h3>
            
            <div className="flex flex-col gap-1.5 text-xs text-gray-400">
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Order ID:</span>
                <span className="font-mono">{order.orderId.slice(0, 10)}...</span>
              </div>
              
              <div className="flex items-center justify-between gap-2">
                <span className="text-gray-500">Qty:</span>
                <span className="font-medium">{order.quantity || 1}</span>
              </div>

              {(order as any).trackingNumber && (
                <div className="flex items-center justify-between gap-2">
                  <span className="text-gray-500">Track:</span>
                  <span className="font-mono text-[11px]">{(order as any).trackingNumber.slice(0, 8)}...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-[#8451E1]/0 via-[#8451E1]/30 to-[#8451E1]/0 mb-4" />

        {/* Footer - Price and Action */}
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1">
            <p className="text-xs text-gray-500 mb-1">Amount</p>
            <p className="text-sm sm:text-base font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
              ₦{getPrice()}
            </p>
          </div>

          <button
            onClick={(e) => {
              e.preventDefault();
              onViewDetails?.(order.orderId);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-[#8451E1] bg-[#8451E1]/10 hover:bg-[#8451E1]/20 border border-[#8451E1]/30 hover:border-[#8451E1]/60 rounded-lg transition-all duration-300 whitespace-nowrap"
          >
            <span>View</span>
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>

        {/* Delivery date if applicable */}
        {deliveryDate && status === 'delivered' && (
          <div className="mt-3 pt-3 border-t border-[#8451E1]/20">
            <p className="text-xs text-gray-400">
              <span className="text-gray-500">Delivered:</span> {getFormattedDate(deliveryDate)}
            </p>
          </div>
        )}

        {/* Quick Review CTA for delivered orders */}
        {status === 'delivered' && (
          <div className="mt-3 pt-3 border-t border-[#8451E1]/20">
            <button
              onClick={(e) => {
                e.preventDefault();
                // Will be handled by parent component
              }}
              className="w-full inline-flex items-center justify-center gap-1.5 px-2 py-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 hover:border-amber-400/60 rounded-lg transition-all duration-300"
              title="Leave a review"
            >
              <Star className="w-3 h-3" />
              <span>Leave Review</span>
            </button>
          </div>
        )}
      </div>
    </Link>
  );
}