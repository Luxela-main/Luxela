'use client';

import { useState, useEffect } from 'react';
import {
  Filter,
  MoreVertical,
  X,
  Download,
  TrendingUp,
  Package,
  Clock,
  CheckCircle,
  Truck,
  MessageCircle,
  RefreshCw,
} from 'lucide-react';
import SearchBar from '@/components/search-bar';
import { Button } from '@/components/ui/button';
import { useSales, useSaleById } from '@/modules/sellers';
import { LoadingState } from '@/components/sellers/LoadingState';
import { ErrorState } from '@/components/sellers/ErrorState';
import { getStatusFromTab } from '@/constants';
import { useToast } from '@/hooks/use-toast';
import { trpc } from '@/lib/trpc';

export default function Sales() {
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isConfirmingDelivery, setIsConfirmingDelivery] = useState(false);
  const itemsPerPage = 10;

  const { data: salesData, isLoading, error, refetch } = useSales(getStatusFromTab(activeTab));
  const { data: selectedOrderData } = useSaleById(selectedOrder || '');
  const { toast } = useToast();

  const confirmDeliveryMutation = trpc.sellers.confirmDelivery.useMutation();

  if (isLoading) {
    return <LoadingState message="Loading sales data..." />;
  }

  if (error) {
    return (
      <ErrorState
        message="Failed to load sales data. Please try again."
        onRetry={() => refetch()}
      />
    );
  }

  const sales = salesData || [];
  const filteredSales = sales.filter((order) =>
    search ? order.product?.toLowerCase().includes(search.toLowerCase()) : true
  );

  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);

  const handleConfirmDelivery = async () => {
    if (!selectedOrder) return;

    setIsConfirmingDelivery(true);
    try {
      await confirmDeliveryMutation.mutateAsync({ orderId: selectedOrder });
      toast({
        title: 'Success',
        description: 'Delivery confirmed! The buyer has been notified.',
      });
      setSelectedOrder(null);
      refetch();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to confirm delivery',
        variant: 'destructive',
      });
    } finally {
      setIsConfirmingDelivery(false);
    }
  };

  const getStatusIcon = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered') return <CheckCircle className="text-green-500" size={16} />;
    if (s === 'shipped' || s === 'in_transit')
      return <Truck className="text-blue-500" size={16} />;
    if (s === 'processing')
      return <Clock className="text-yellow-500" size={16} />;
    return <Package className="text-gray-500" size={16} />;
  };

  const getStatusColor = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered') return 'text-green-400';
    if (s === 'shipped' || s === 'in_transit') return 'text-blue-400';
    if (s === 'processing') return 'text-yellow-400';
    return 'text-gray-400';
  };

  const getStatusBg = (status: string) => {
    const s = status?.toLowerCase();
    if (s === 'delivered') return 'bg-green-500/10 border-green-500/30';
    if (s === 'shipped' || s === 'in_transit') return 'bg-blue-500/10 border-blue-500/30';
    if (s === 'processing') return 'bg-yellow-500/10 border-yellow-500/30';
    return 'bg-gray-500/10 border-gray-500/30';
  };

  const tabs = ['All', 'Processing', 'Shipped', 'In transit', 'Delivered', 'Canceled', 'Returned'];

  const totalSales = sales.reduce((sum, order) => sum + (order.amountCents || 0), 0) / 100;
  const deliveredCount = sales.filter((o) => o.deliveryStatus === 'delivered').length;

  return (
    <div className="min-h-screen bg-[#0e0e0e] pb-8">
      <div className="px-4 sm:px-6 lg:px-8 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8 pb-6 border-b-2 border-[#ECBEE3]">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white">Sales</h1>
            <p className="text-[#EA795B] mt-1 text-sm font-medium">Manage and track all your sales</p>
          </div>
          <div className="w-full sm:w-64 lg:w-80">
            <SearchBar search={search} setSearch={setSearch} />
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-l-[#ECBEE3] hover:border-l-[#EA795B] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Sales</p>
                <p className="text-white text-xl sm:text-2xl font-bold mt-2">
                  ${totalSales.toLocaleString('en-US', { maximumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="text-[#8451e1]" size={32} />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-l-[#BEE3EC] hover:border-l-[#BEECE3] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Total Orders</p>
                <p className="text-white text-xl sm:text-2xl font-bold mt-2">{sales.length}</p>
              </div>
              <Package className="text-blue-500" size={32} />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-4 border-l-4 border-l-[#EA795B] hover:border-l-[#ECE3BE] transition-colors">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Delivered</p>
                <p className="text-white text-xl sm:text-2xl font-bold mt-2">{deliveredCount}</p>
              </div>
              <CheckCircle className="text-green-500" size={32} />
            </div>
          </div>

          <div className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-sm">Pending</p>
                <p className="text-white text-xl sm:text-2xl font-bold mt-2">
                  {sales.length - deliveredCount}
                </p>
              </div>
              <Clock className="text-yellow-500" size={32} />
            </div>
          </div>
        </div>

        {/* Tabs and Controls */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0 w-full sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => {
                  setActiveTab(tab);
                  setCurrentPage(1);
                }}
                className={`px-3 sm:px-4 py-2 rounded-lg cursor-pointer transition text-xs sm:text-sm font-medium whitespace-nowrap ${
                  activeTab === tab
                    ? 'bg-[#8451e1] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525] border border-[#2a2a2a]'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          <div className="flex gap-2 w-full sm:w-auto">
            <button className="flex-1 sm:flex-none bg-[#1a1a1a] border border-[#333] text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center sm:justify-start gap-2 cursor-pointer hover:bg-[#252525] transition text-xs sm:text-sm">
              <Filter size={16} />
              <span className="hidden sm:inline">Filter</span>
            </button>
            <button className="flex-1 sm:flex-none bg-[#8451e1] text-white px-3 sm:px-4 py-2 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:bg-[#7043d8] transition text-xs sm:text-sm">
              <Download size={16} />
              <span className="hidden sm:inline">Export</span>
            </button>
          </div>
        </div>

        {/* Sales Table - Desktop */}
        <div className="hidden md:block bg-[#1a1a1a] rounded-lg overflow-hidden border border-[#2a2a2a]">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#2a2a2a] bg-[#141414]">
            <div className="col-span-1 text-gray-400 text-xs font-semibold uppercase">
              <input type="checkbox" className="w-4 h-4 rounded border-gray-600" />
            </div>
            <div className="col-span-1 text-gray-400 text-xs font-semibold uppercase">Order</div>
            <div className="col-span-2 text-gray-400 text-xs font-semibold uppercase">Product</div>
            <div className="col-span-1 text-gray-400 text-xs font-semibold uppercase">Amount</div>
            <div className="col-span-1 text-gray-400 text-xs font-semibold uppercase">Status</div>
            <div className="col-span-2 text-gray-400 text-xs font-semibold uppercase">Delivery</div>
            <div className="col-span-2 text-gray-400 text-xs font-semibold uppercase">Date</div>
            <div className="col-span-1 text-gray-400 text-xs font-semibold uppercase">Action</div>
          </div>

          {/* Rows */}
          {paginatedSales.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="mx-auto mb-4 text-gray-600" size={48} />
              <p className="text-gray-400">No orders found</p>
            </div>
          ) : (
            paginatedSales.map((order, index) => (
              <div
                key={index}
                className="grid grid-cols-12 gap-4 p-4 border-b border-[#2a2a2a] hover:bg-[#252525] transition cursor-pointer"
                onClick={() => setSelectedOrder(order.orderId)}
              >
                <div className="col-span-1">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-600" />
                </div>
                <div className="col-span-1 text-white text-sm font-medium truncate">
                  {order.orderId?.slice(0, 8)}
                </div>
                <div className="col-span-2 text-gray-300 text-sm truncate">{order.product}</div>
                <div className="col-span-1 text-[#8451e1] font-bold">
                  ${((order.amountCents || 0) / 100).toFixed(2)}
                </div>
                <div className="col-span-1">
                  <div className="flex items-center gap-1">
                    {getStatusIcon(order.deliveryStatus)}
                    <span className={`text-xs font-medium ${getStatusColor(order.deliveryStatus)}`}>
                      {order.deliveryStatus?.replace('_', ' ')}
                    </span>
                  </div>
                </div>
                <div className="col-span-2">
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusBg(
                      order.payoutStatus
                    )}`}
                  >
                    {order.payoutStatus === 'paid'
                      ? '✓ Paid'
                      : order.payoutStatus === 'processing'
                        ? '⏱ Processing'
                        : '🔒 In Escrow'}
                  </span>
                </div>
                <div className="col-span-2 text-gray-400 text-sm">
                  {new Date(order.orderDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </div>
                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order.orderId);
                    }}
                    className="text-gray-400 hover:text-white transition"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Sales Cards - Mobile */}
        <div className="md:hidden space-y-3">
          {paginatedSales.length === 0 ? (
            <div className="bg-[#1a1a1a] rounded-lg p-8 text-center border border-[#2a2a2a]">
              <Package className="mx-auto mb-4 text-gray-600" size={40} />
              <p className="text-gray-400">No orders found</p>
            </div>
          ) : (
            paginatedSales.map((order, index) => (
              <div
                key={index}
                className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] hover:bg-[#252525] transition cursor-pointer"
                onClick={() => setSelectedOrder(order.orderId)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-white font-semibold text-sm truncate">
                      Order #{order.orderId?.slice(0, 8)}
                    </h3>
                    <p className="text-gray-400 text-xs mt-1">{order.product}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrder(order.orderId);
                    }}
                    className="text-gray-400 hover:text-white transition flex-shrink-0"
                  >
                    <MoreVertical size={16} />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-3">
                  <div>
                    <p className="text-gray-400 text-xs">Amount</p>
                    <p className="text-[#8451e1] font-bold">
                      ${((order.amountCents || 0) / 100).toFixed(2)}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs">Date</p>
                    <p className="text-white text-xs font-medium">
                      {new Date(order.orderDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <span className="flex items-center gap-1 px-2 py-1 rounded text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30">
                    {getStatusIcon(order.deliveryStatus)}
                    {order.deliveryStatus?.replace('_', ' ')}
                  </span>
                  <span
                    className={`inline-block px-2 py-1 rounded text-xs font-medium border ${getStatusBg(
                      order.payoutStatus
                    )}`}
                  >
                    {order.payoutStatus === 'paid'
                      ? '✓ Paid'
                      : order.payoutStatus === 'processing'
                        ? '⏱ Processing'
                        : '🔒 Escrow'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8 flex-wrap">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 sm:px-4 py-2 bg-[#1a1a1a] text-white rounded-lg cursor-pointer transition hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              Previous
            </button>

            {Array.from({ length: Math.min(totalPages, 5) }).map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg cursor-pointer transition text-xs sm:text-sm font-medium ${
                  currentPage === i + 1
                    ? 'bg-[#8451e1] text-white'
                    : 'bg-[#1a1a1a] text-gray-400 hover:bg-[#252525]'
                }`}
              >
                {i + 1}
              </button>
            ))}

            {totalPages > 5 && <span className="text-gray-400 text-xs sm:text-sm">...</span>}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 sm:px-4 py-2 bg-[#1a1a1a] text-white rounded-lg cursor-pointer transition hover:bg-[#252525] disabled:opacity-50 disabled:cursor-not-allowed text-xs sm:text-sm"
            >
              Next
            </button>
          </div>
        )}

        {/* Order Details Modal */}
        {selectedOrder && selectedOrderData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-[#1a1a1a] rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-[#1a1a1a] p-4 sm:p-6 border-b border-[#2a2a2a] flex justify-between items-center">
                <div>
                  <h2 className="text-lg sm:text-2xl font-bold text-white">Order Details</h2>
                  <p className="text-gray-400 text-xs sm:text-sm mt-1">
                    Order #{selectedOrderData.orderId?.slice(0, 8)}
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
                {/* Status */}
                <div className={`${getStatusBg(selectedOrderData.deliveryStatus)} border rounded-lg p-4`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-white font-semibold">Delivery Status</h3>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(selectedOrderData.deliveryStatus)}
                      <span className={`font-medium ${getStatusColor(selectedOrderData.deliveryStatus)}`}>
                        {selectedOrderData.deliveryStatus?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order Summary */}
                <div className="border border-[#333] rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-4">Order Summary</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Order ID</span>
                      <span className="text-white font-medium">{selectedOrderData.orderId}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Product</span>
                      <span className="text-white">{selectedOrderData.product}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Customer</span>
                      <span className="text-white">{selectedOrderData.customer}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Quantity</span>
                      <span className="text-white">{selectedOrderData.quantity || 1}</span>
                    </div>
                    <div className="pt-3 border-t border-[#2a2a2a]">
                      <div className="flex justify-between">
                        <span className="text-white font-semibold">Amount</span>
                        <span className="text-[#8451e1] font-bold">
                          ${((selectedOrderData.amountCents || 0) / 100).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Payment Status */}
                <div className="border border-[#333] rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-4">Payment Status</h3>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Method</span>
                      <span className="text-white">{selectedOrderData.paymentMethod || 'Card'}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-400">Payout Status</span>
                      <span
                        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border ${getStatusBg(
                          selectedOrderData.payoutStatus
                        )}`}
                      >
                        {selectedOrderData.payoutStatus === 'paid'
                          ? '✓ Paid'
                          : selectedOrderData.payoutStatus === 'processing'
                            ? '⏱ Processing'
                            : '🔒 In Escrow'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Shipping Address */}
                <div className="border border-[#333] rounded-lg p-4">
                  <h3 className="text-white font-semibold mb-3">Shipping Address</h3>
                  <p className="text-gray-300 text-sm">{selectedOrderData.shippingAddress || 'N/A'}</p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-3">
                  {selectedOrderData.deliveryStatus !== 'delivered' && (
                    <button
                      onClick={handleConfirmDelivery}
                      disabled={isConfirmingDelivery}
                      className="flex-1 bg-[#8451e1] hover:bg-[#7043d8] text-white px-4 py-2 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isConfirmingDelivery ? (
                        <>
                          <RefreshCw className="animate-spin" size={16} />
                          Confirming...
                        </>
                      ) : (
                        <>
                          <CheckCircle size={16} />
                          Confirm Delivery
                        </>
                      )}
                    </button>
                  )}

                  <button className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer">
                    <MessageCircle size={16} />
                    Message Buyer
                  </button>

                  <button className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg font-medium transition flex items-center justify-center gap-2 cursor-pointer">
                    <Download size={16} />
                    <span className="hidden sm:inline">Details</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}