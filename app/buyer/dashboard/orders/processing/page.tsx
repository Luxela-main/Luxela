'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';
import type { Order } from '@/types/buyer';
import { Search, AlertCircle, Loader, Truck, Clock, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function ProcessingOrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const itemsPerPage = 10;

  
  const { data: ordersData, isLoading: isDataLoading, error: queryError, refetch } = trpc.buyer.getPurchaseHistory.useQuery(
    { status: 'ongoing', page: currentPage, limit: itemsPerPage },
    { retry: 2, retryDelay: 1000 }
  );

  
  const { startPolling } = useRealtimeOrders({
    enabled: true,
    refetchInterval: 30000, 
    refetchOnWindowFocus: true, 
    refetchOnInteraction: true, 
  });

  
  useEffect(() => {
    startPolling();
  }, [startPolling]);

  
  useEffect(() => {
    if (ordersData?.data) {
      const mappedOrders: Order[] = ordersData.data.map((item: any) => ({
        orderId: item.orderId,
        buyerId: item.buyerId || '',
        sellerId: item.sellerId || '',
        listingId: item.listingId || '',
        productTitle: item.productTitle,
        productImage: item.productImage,
        productCategory: item.productCategory,
        customerName: item.customerName || '',
        customerEmail: item.customerEmail || '',
        recipientEmail: item.recipientEmail,
        paymentMethod: item.paymentMethod || 'credit_card',
        amountCents: item.priceCents || item.amountCents || 0,
        currency: item.currency || 'NGN',
        payoutStatus: item.payoutStatus || 'in_escrow',
        orderStatus: item.orderStatus,
        deliveryStatus: item.deliveryStatus,
        shippingAddress: item.shippingAddress,
        trackingNumber: item.trackingNumber,
        estimatedArrival: item.estimatedArrival ? new Date(item.estimatedArrival) : undefined,
        deliveredDate: item.deliveredDate ? new Date(item.deliveredDate) : undefined,
        orderDate: new Date(item.orderDate),
        createdAt: new Date(item.createdAt || item.orderDate),
        updatedAt: new Date(item.updatedAt || item.orderDate),
      }));
      setOrders(mappedOrders);
      setError(null);
    }
    setIsLoading(isDataLoading);
    if (queryError) {
      setError('Failed to load processing orders.');
    }
  }, [ordersData, isDataLoading, queryError]);

  
  useEffect(() => {
    const filtered = orders.filter((order) =>
      order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.productTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.trackingNumber?.toLowerCase() || '').includes(searchTerm.toLowerCase())
    );
    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, searchTerm]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const getStatusLabel = (status: string) => {
    if (status === 'shipped') return 'Shipping';
    if (status === 'processing') return 'Processing';
    return 'Pending';
  };

  return (
    <div>
      <Breadcrumb
        items={[
          { label: 'Dashboard', href: '/buyer/dashboard' },
          { label: 'Orders', href: '/buyer/dashboard/orders' },
          { label: 'Processing Orders' },
        ]}
      />

      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white transition text-sm cursor-pointer"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <h1 className="text-white text-2xl font-semibold pb-0">Processing Orders</h1>
      </div>

      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#7e7e7e]" />
          <input
            type="text"
            placeholder="Search by product name, Order ID, or Tracking No."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-[#1a1a1a] border border-[#212121] text-white placeholder:text-[#7e7e7e] rounded-lg focus:outline-none focus:border-[#8451e1]"
          />
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-400">{error}</p>
          <button
            onClick={() => refetch()}
            className="ml-auto px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center items-center py-12">
          <Loader className="text-[#8451e1] animate-spin" size={32} />
        </div>
      ) : paginatedOrders.length === 0 ? (
        <div className="bg-[#1a1a1a] rounded-lg p-12 text-center">
          <p className="text-gray-400 text-lg">No processing orders found</p>
        </div>
      ) : (
        <>
          <div className="space-y-4">
            {paginatedOrders.map((order) => (
              <Link key={order.orderId} href={`/buyer/dashboard/orders/${order.orderId}`}>
                <div className="bg-[#1a1a1a] rounded-lg p-6 border border-[#212121] hover:border-[#8451e1] transition cursor-pointer">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 text-[#d4af37] text-sm">
                      {order.orderStatus === 'shipped' ? (
                        <Truck size={16} />
                      ) : (
                        <Clock size={16} />
                      )}
                      <span>
                        {getStatusLabel(order.orderStatus)}
                        {order.estimatedArrival ? ` Est. Delivery ${order.estimatedArrival.toLocaleDateString()}` : ''}
                      </span>
                    </div>
                    <span className="text-[#8451e1] text-sm hover:underline">View order details →</span>
                  </div>

                  {order.productImage && (
                    <div className="mb-4">
                      <img
                        src={order.productImage}
                        alt={order.productTitle}
                        className="w-24 h-28 object-cover rounded bg-[#212121]"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t border-[#212121]">
                    <div className="flex items-center gap-8 flex-wrap">
                      <div>
                        <span className="text-[#7e7e7e] text-sm">Product:</span>
                        <span className="text-white font-medium ml-2">{order.productTitle}</span>
                      </div>
                      <div>
                        <span className="text-[#7e7e7e] text-sm">Amount:</span>
                        <span className="text-white font-medium ml-2">${(order.amountCents / 100).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-[#7e7e7e] text-sm">Order ID:</span>
                        <span className="text-white font-medium ml-2">{order.orderId.slice(0, 8)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="px-4 py-2 bg-[#1a1a1a] text-white rounded disabled:opacity-50"
              >
                Previous
              </button>
              {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-10 h-10 rounded ${
                    currentPage === i + 1
                      ? 'bg-[#8451e1] text-white'
                      : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-[#1a1a1a] text-white rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}