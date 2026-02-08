'use client';

import { useOrders } from '@/modules/buyer/queries/useOrders';
import { useNotificationPolling } from '@/modules/shared/hooks';
import { useEffect } from 'react';
import { toast } from 'react-toastify';

/**
 * Example component showing real-time polling for buyer orders
 * Automatically fetches order updates every 30 seconds
 */
export function OrdersWithRealTime() {
  // Enable polling with 30-second interval (default)
  const ordersQuery = useOrders({
    enablePolling: true,
    pollingInterval: 30000,
  });

  // Set up notification polling for status changes
  useNotificationPolling({
    enabled: true,
    interval: 30000,
    onOrderStatusChange: (orderId, newStatus) => {
      console.log(`Order ${orderId} status changed to ${newStatus}`);
      toast.info(`Order #${orderId} status: ${newStatus}`, {
        autoClose: 4000,
      });
    },
    batchNotifications: true,
    maxBatchSize: 3,
  });

  if (ordersQuery.isLoading) return <div>Loading orders...</div>;
  if (ordersQuery.isError) return <div>Error loading orders</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-4">Your Orders</h2>
      <p className="text-gray-600 text-sm mb-4">
        ✓ Real-time updates enabled - refreshing every 30 seconds
      </p>

      {ordersQuery.data && ordersQuery.data.length > 0 ? (
        <div className="space-y-4">
          {ordersQuery.data.map((order: any) => (
            <div
              key={order.id}
              className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold">Order #{order.id}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    Status: <span className="font-medium">{order.status}</span>
                  </p>
                  <p className="text-sm text-gray-600">
                    Total: ${order.totalPrice || '0.00'}
                  </p>
                </div>
                <span className="px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                  {order.status}
                </span>
              </div>
              {order.trackingNumber && (
                <p className="text-xs text-gray-500 mt-2">
                  Tracking: {order.trackingNumber}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No orders found</p>
      )}

      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-900">
          💡 <strong>Real-time Feature:</strong> This page automatically updates
          every 30 seconds. Changes made by sellers (shipment updates, tracking
          numbers) will appear instantly.
        </p>
      </div>
    </div>
  );
}

export default OrdersWithRealTime;