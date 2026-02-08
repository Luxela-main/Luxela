'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';
import type { Order, OrderFilterType, TrackingStep } from '@/types/buyer';
import {
  Clock,
  CheckCircle,
  Package,
  XCircle,
  Truck,
  ChevronRight,
  X,
  Download,
  MessageCircle,
  RefreshCw,
  AlertCircle,
  Loader,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [filter, setFilter] = useState<OrderFilterType | 'shipped'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const itemsPerPage = 10;

  const handleFilterChange = (newFilter: OrderFilterType | 'shipped') => {
    setFilter(newFilter);
    if (newFilter !== 'all') {
      if (newFilter === 'delivered') {
        router.push('/buyer/dashboard/orders/delivered');
      } else if (newFilter === 'ongoing') {
        router.push('/buyer/dashboard/orders/processing');
      } else if (newFilter === 'shipped') {
        router.push('/buyer/dashboard/orders/shipped');
      } else if (newFilter === 'canceled') {
        router.push('/buyer/dashboard/orders/returned');
      }
    }
  };

  // Query with proper error handling
  const { data: ordersData, isLoading: isDataLoading, error: queryError, refetch } = trpc.buyer.getPurchaseHistory.useQuery(
    { page: currentPage, limit: itemsPerPage },
    {
      retry: 2,
      retryDelay: 1000,
    }
  );

  const confirmDeliveryMutation = trpc.checkout.confirmDelivery.useMutation();
  const { toast } = useToast();

  // Map API response to Order types
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
      setError('Failed to load orders. Please try again.');
      console.error('Orders query error:', queryError);
    }
  }, [ordersData, isDataLoading, queryError]);

  // Filter orders based on selected filter
  useEffect(() => {
    let filtered = orders;

    if (filter === 'ongoing') {
      filtered = orders.filter((o) =>
        ['pending', 'confirmed', 'processing'].includes(o.orderStatus)
      );
    } else if (filter === 'shipped') {
      filtered = orders.filter((o) => o.orderStatus === 'shipped');
    } else if (filter === 'delivered') {
      filtered = orders.filter((o) => o.orderStatus === 'delivered');
    } else if (filter === 'canceled') {
      filtered = orders.filter((o) => o.orderStatus === 'canceled' || o.orderStatus === 'returned');
    }

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, filter]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const selectedOrderData = selectedOrder ? orders.find((o) => o.orderId === selectedOrder) : null;

  const getStatusIcon = (status: string) => {
    if (status === 'delivered') return <CheckCircle className="text-green-500" size={20} />;
    if (status === 'canceled' || status === 'returned') return <XCircle className="text-red-500" size={20} />;
    if (status === 'shipped') return <Truck className="text-blue-500" size={20} />;
    return <Clock className="text-yellow-500" size={20} />;
  };

  const getStatusColor = (status: string) => {
    if (status === 'delivered') return 'text-green-400';
    if (status === 'canceled' || status === 'returned') return 'text-red-400';
    if (status === 'shipped') return 'text-blue-400';
    return 'text-yellow-400';
  };

  const getStatusBgColor = (status: string) => {
    if (status === 'delivered') return 'bg-green-500/10';
    if (status === 'canceled' || status === 'returned') return 'bg-red-500/10';
    if (status === 'shipped') return 'bg-blue-500/10';
    return 'bg-yellow-500/10';
  };

  const handleConfirmDelivery = useCallback(async () => {
    if (!selectedOrder) return;

    setIsConfirmingDelivery(true);
    try {
      await confirmDeliveryMutation.mutateAsync({ orderId: selectedOrder });
      toast({
        title: 'Success',
        description: 'Delivery confirmed! The seller has been notified.',
      });
      setSelectedOrder(null);
      await refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to confirm delivery',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmingDelivery(false);
    }
  }, [selectedOrder, confirmDeliveryMutation, toast, refetch]);

  const getTrackingSteps = (order: Order): TrackingStep[] => {
    const steps: TrackingStep[] = [
      { label: 'Order Placed', completed: true, date: order.createdAt },
      {
        label: 'Processing',
        completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus),
        date: undefined,
      },
      {
        label: 'Shipped',
        completed: ['shipped', 'delivered'].includes(order.orderStatus),
        date: undefined,
      },
      {
        label: 'In Transit',
        completed: ['shipped', 'delivered'].includes(order.orderStatus),
        date: undefined,
      },
      {
        label: 'Delivered',
        completed: order.orderStatus === 'delivered',
        date: order.deliveredDate,
      },
    ];
    return steps;
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="max-w-6xl mx-auto px-4 sm:px-3 lg:px-8 py-6 sm:py-8">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/buyer/dashboard' },
            { label: 'Orders' },
          ]}
        />

        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-4 sm:mb-6">My Orders</h1>

          <div className="flex gap-2 sm:gap-3 mb-6 flex-wrap">
            {(['all', 'ongoing', 'shipped', 'delivered', 'canceled'] as const).map((f) => (
              <button
                key={f}
                onClick={() => handleFilterChange(f)}
                className={`px-3 sm:px-4 py-2 rounded cursor-pointer transition text-xs sm:text-sm font-medium ${
                  filter === f
                    ? 'bg-[#8451e1] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                }`}
              >
                {f === 'all' && 'All Orders'}
                {f === 'ongoing' && 'In Progress'}
                {f === 'shipped' && 'Shipping'}
                {f === 'delivered' && 'Delivered'}
                {f === 'canceled' && 'Canceled/Returned'}
              </button>
            ))}
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <div className="flex-1">
              <p className="text-red-400 font-semibold">Error Loading Orders</p>
              <p className="text-red-300 text-sm">{error}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="ml-auto px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
            >
              Retry
            </button>
          </div>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin">
              <Loader className="text-[#8451e1]" size={32} />
            </div>
          </div>
        ) : paginatedOrders.length === 0 ? (
          <div className="bg-[#1a1a1a] rounded-lg p-8 sm:p-12 text-center">
            <Package className="mx-auto mb-4 text-gray-600" size={48} />
            <p className="text-gray-400 text-lg">No orders yet</p>
            <p className="text-gray-500 text-sm mt-2">Start shopping to see your orders here</p>
          </div>
        ) : (
          <>
            <div className="space-y-3 sm:space-y-4 mb-8">
              {paginatedOrders.map((order) => (
                <div
                  key={order.orderId}
                  className="bg-[#1a1a1a] rounded-lg p-4 sm:p-6 hover:bg-[#252525] transition cursor-pointer border-l-4 border-[#6B7280]"
                  onClick={() => setSelectedOrder(order.orderId)}
                >
                  <div className="flex items-start justify-between mb-4 gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 sm:gap-3 mb-2 flex-wrap">
                        <h3 className="text-white font-semibold text-sm sm:text-lg truncate">
                          Order #{order.orderId.slice(0, 8)}
                        </h3>
                        <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${getStatusBgColor(order.orderStatus)}`}>
                          {getStatusIcon(order.orderStatus)}
                          <span className={`text-xs sm:text-sm font-medium ${getStatusColor(order.orderStatus)}`}>
                            {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                          </span>
                        </div>
                      </div>
                      <p className="text-gray-400 text-xs sm:text-sm">
                        {order.orderDate.toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                    </div>
                    <button className="text-[#8451e1] hover:text-[#7043d8] cursor-pointer transition flex-shrink-0">
                      <ChevronRight size={24} />
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest">Product</p>
                      <p className="text-white font-medium mt-1 text-xs sm:text-sm truncate">
                        {order.productTitle || 'Fashion Item'}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest">Amount</p>
                      <p className="text-[#8451e1] font-bold text-sm sm:text-lg mt-1">
                        ${(order.amountCents / 100).toFixed(2)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-400 text-xs uppercase tracking-widest">Expected Delivery</p>
                      <p className="text-white font-medium mt-1 text-xs sm:text-sm">
                        {order.estimatedArrival
                          ? new Date(order.estimatedArrival).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'TBD'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#2a2a2a]">
                    <button className="text-[#8451e1] hover:text-[#7043d8] text-xs sm:text-sm cursor-pointer transition">
                      View Details →
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2 flex-wrap">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 sm:px-4 py-2 bg-[#1a1a1a] text-white rounded cursor-pointer transition hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  Previous
                </button>

                {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
                  <button
                    key={i + 1}
                    onClick={() => setCurrentPage(i + 1)}
                    className={`w-8 h-8 sm:w-10 sm:h-10 rounded cursor-pointer transition text-xs sm:text-sm ${
                      currentPage === i + 1
                        ? 'bg-[#8451e1] text-white'
                        : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}

                {totalPages > 5 && (
                  <span className="text-gray-400 text-xs sm:text-sm">...</span>
                )}

                <button
                  onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 sm:px-4 py-2 bg-[#1a1a1a] text-white rounded cursor-pointer transition hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}

        {/* Order Details Modal */}
        {selectedOrder && selectedOrderData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#1a1a1a] p-4 sm:p-6 border-b border-[#2a2a2a] flex justify-between items-center">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Order Details</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    Order #{selectedOrderData.orderId.slice(0, 8)}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white transition p-1"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="p-4 sm:p-6 space-y-6">
                {/* Status Section */}
                <div className={`${getStatusBgColor(selectedOrderData.orderStatus)} border border-[#333] rounded-lg p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-white font-semibold">Order Status</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedOrderData.orderStatus)}
                      <span className={`font-medium ${getStatusColor(selectedOrderData.orderStatus)}`}>
                        {selectedOrderData.orderStatus.charAt(0).toUpperCase() + selectedOrderData.orderStatus.slice(1)}
                      </span>
                    </div>
                  </div>
                  <p className="text-gray-300 text-sm">
                    {selectedOrderData.orderStatus === 'delivered'
                      ? 'Your order has been delivered'
                      : selectedOrderData.orderStatus === 'shipped'
                        ? 'Your order is on its way'
                        : 'We are preparing your order'}
                  </p>
                </div>

                {/* Tracking Timeline */}
                <div>
                  <h3 className="text-white font-semibold mb-4">Tracking</h3>
                  <div className="space-y-3">
                    {getTrackingSteps(selectedOrderData).map((step, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                              step.completed
                                ? 'bg-[#8451e1] border-[#8451e1]'
                                : 'border-[#333] bg-transparent'
                            }`}
                          >
                            {step.completed && (
                              <CheckCircle className="text-white" size={16} />
                            )}
                          </div>
                          {idx < getTrackingSteps(selectedOrderData).length - 1 && (
                            <div
                              className={`w-0.5 h-8 ${
                                step.completed ? 'bg-[#8451e1]' : 'bg-[#333]'
                              }`}
                            />
                          )}
                        </div>
                        <div className="pt-1">
                          <p className="text-white font-medium text-sm">{step.label}</p>
                          {step.date && (
                            <p className="text-gray-400 text-xs mt-0.5">
                              {step.date.toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border border-[#333] rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-4">Order Summary</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Product</span>
                      <span className="text-white">{selectedOrderData.productTitle || 'Fashion Item'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Category</span>
                      <span className="text-white capitalize">{selectedOrderData.productCategory || 'Fashion'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Price</span>
                      <span className="text-white">${(selectedOrderData.amountCents / 100).toFixed(2)}</span>
                    </div>
                    <div className="pt-2 border-t border-[#2a2a2a]">
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Total</span>
                        <span className="text-[#8451e1] font-bold">
                          ${(selectedOrderData.amountCents / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Info */}
                <div className="border border-[#333] rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-4">Payment Information</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Method</span>
                      <span className="text-white capitalize">{selectedOrderData.paymentMethod?.replace(/_/g, ' ') || 'Credit Card'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payment Status</span>
                      <span className="inline-flex items-center text-green-400">
                        <span className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                        Completed
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Payout Status</span>
                      <span className="text-white capitalize">{selectedOrderData.payoutStatus?.replace(/_/g, ' ') || 'In Escrow'}</span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border border-[#333] rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Shipping Address</h3>
                  <p className="text-gray-300 text-sm">
                    {selectedOrderData.shippingAddress || '123 Fashion Street, Style City, SC 12345'}
                  </p>
                </div>

                {/* Tracking Number */}
                {selectedOrderData.trackingNumber && (
                  <div className="border border-[#333] rounded-lg p-4">
                    <h3 className="text-white font-semibold mb-3">Tracking Number</h3>
                    <p className="text-gray-300 text-sm font-mono">{selectedOrderData.trackingNumber}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 flex-wrap">
                  {selectedOrderData.orderStatus === 'shipped' && (
                    <button
                      onClick={handleConfirmDelivery}
                      disabled={isConfirmingDelivery}
                      className="flex-1 sm:flex-none bg-[#8451e1] hover:bg-[#7043d8] text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isConfirmingDelivery ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Confirm Received
                        </>
                      )}
                    </button>
                  )}

                  <button className="flex-1 sm:flex-none bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2">
                    <MessageCircle size={16} />
                    Contact Seller
                  </button>

                  {selectedOrderData.orderId && (
                    <button className="flex-1 sm:flex-none bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2">
                      <Download size={16} />
                      <span className="hidden sm:inline">Invoice</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}