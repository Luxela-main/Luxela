'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';
import { OrderCard } from '@/components/buyer/dashboard/OrderCard';
import type { Order, OrderFilterType } from '@/types/buyer';
import {
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Loader,
  ChevronDown,
  Package,
} from 'lucide-react';
import { useToast } from '@/components/hooks/useToast';
import Link from 'next/link';

type OrderStatusFilter = 'all' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'canceled' | 'returned';

export default function OrdersPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [statusFilter, setStatusFilter] = useState<OrderStatusFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'price-high' | 'price-low'>('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 12;

  // Apply filters and sorting
  useEffect(() => {
    let filtered = orders;

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.orderStatus === statusFilter);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.orderId.toLowerCase().includes(q) ||
          order.productTitle.toLowerCase().includes(q) ||
          ((order as any).trackingNumber?.toLowerCase() || '').includes(q)
      );
    }

    // Sorting
    filtered = [...filtered].sort((a, b) => {
      const dateA = new Date((a as any).createdAt || (a as any).orderDate).getTime();
      const dateB = new Date((b as any).createdAt || (b as any).orderDate).getTime();
      const priceA = ((a as any).totalPriceCents || (a as any).amountCents || 0) / 100;
      const priceB = ((b as any).totalPriceCents || (b as any).amountCents || 0) / 100;

      switch (sortBy) {
        case 'newest':
          return dateB - dateA;
        case 'oldest':
          return dateA - dateB;
        case 'price-high':
          return priceB - priceA;
        case 'price-low':
          return priceA - priceB;
        default:
          return 0;
      }
    });

    setFilteredOrders(filtered);
    setCurrentPage(1);
  }, [orders, statusFilter, searchQuery, sortBy]);

  const { data: ordersData, isLoading: isDataLoading, error: queryError, refetch } = trpc.buyer.getPurchaseHistory.useQuery(
    { page: 1, limit: 50 },
    {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      staleTime: 10000,
      gcTime: 60000,
    }
  );

  const toastHandler = useToast();
  
  const formatPrice = (cents: number): string => {
    return (cents / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const { startPolling } = useRealtimeOrders({
    enabled: true,
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnWindowFocus: true,
    refetchOnInteraction: true,
    adaptiveRefresh: true,
    maxRetries: 5,
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
        productTitle: item.productTitle || 'N/A',
        productImage: item.productImage,
        productCategory: item.productCategory,
        customerName: item.customerName || '',
        customerEmail: item.customerEmail || '',
        quantity: item.quantity || 1,
        orderStatus: item.orderStatus || 'pending',
        trackingNumber: item.trackingNumber,
        carrier: item.carrier,
        shippingOption: item.shippingOption || 'standard',
        createdAt: item.createdAt || new Date().toISOString(),
        deliveredDate: item.deliveredDate,
        trackingUrl: item.trackingUrl,
        isRefunded: item.isRefunded,
        ...item,
      }));
      setOrders(mappedOrders);
      setIsLoading(false);
    }
    if (queryError) {
      setError(queryError?.message || 'Failed to load orders');
      setIsLoading(false);
    }
  }, [ordersData, queryError]);

  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const statusOptions: { value: OrderStatusFilter; label: string }[] = [
    { value: 'all', label: 'All Orders' },
    { value: 'pending', label: 'Pending' },
    { value: 'confirmed', label: 'Confirmed' },
    { value: 'processing', label: 'Processing' },
    { value: 'shipped', label: 'In Transit' },
    { value: 'delivered', label: 'Delivered' },
    { value: 'canceled', label: 'Canceled' },
    { value: 'returned', label: 'Returned' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] via-[#0a0a0a] to-[#000000]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <Breadcrumb
            items={[
              { label: 'Dashboard', href: '/buyer/dashboard' },
              { label: 'Orders' },
            ]}
          />

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mt-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">My Orders</h1>
              <p className="text-gray-400 text-sm">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</p>
            </div>
            <button
              onClick={async () => {
                setIsRefreshing(true);
                try {
                  await refetch();
                  toastHandler.success('Orders refreshed successfully');
                } catch (err) {
                  toastHandler.error('Failed to refresh orders');
                } finally {
                  setIsRefreshing(false);
                }
              }}
              disabled={isRefreshing}
              aria-label="Refresh orders"
              title="Refresh orders"
              className="p-2.5 rounded-lg bg-[#8451E1]/10 hover:bg-[#8451E1]/20 border border-[#8451E1]/30 hover:border-[#8451E1]/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-5 h-5 text-[#8451E1] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* Search and Filter Bar */}
        <div className="mb-8 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#8451E1]/60" />
              <input
                type="text"
                placeholder="Search by order ID, product name, or tracking number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-[#1a1a2e]/50 border border-[#8451E1]/20 text-white placeholder-gray-500 rounded-lg focus:outline-none focus:border-[#8451E1]/60 focus:ring-2 focus:ring-[#8451E1]/20 transition"
              />
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#1a1a2e]/50 border border-[#8451E1]/20 hover:border-[#8451E1]/60 text-[#8451E1] rounded-lg transition whitespace-nowrap"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>

          {/* Filter Panel */}
          {showFilters && (
            <div className="bg-[#1a1a2e]/30 border border-[#8451E1]/20 rounded-lg p-4 space-y-4">
              {/* Status Filter */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Status</label>
                <div className="flex flex-wrap gap-2">
                  {statusOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => setStatusFilter(option.value)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        statusFilter === option.value
                          ? 'bg-[#8451E1] text-white border border-[#8451E1]'
                          : 'bg-[#0a0a0a] border border-[#8451E1]/20 text-gray-400 hover:border-[#8451E1]/60 hover:text-white'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Sort Filter */}
              <div>
                <label className="block text-sm font-semibold text-white mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-[#0a0a0a] border border-[#8451E1]/20 text-white rounded-lg focus:outline-none focus:border-[#8451E1]/60 transition"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="price-high">Price: High to Low</option>
                  <option value="price-low">Price: Low to High</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 text-[#8451E1] animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Loading your orders...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-300 font-semibold mb-1">Failed to load orders</h3>
              <p className="text-red-400/70 text-sm">{error}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition whitespace-nowrap text-sm font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredOrders.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="w-16 h-16 rounded-full bg-[#8451E1]/10 flex items-center justify-center mx-auto mb-4">
              <Package className="w-8 h-8 text-[#8451E1]/60" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">No orders yet</h3>
            <p className="text-gray-400 mb-6">You haven't placed any orders matching these filters</p>
            <a
              href="/buyer/browse"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white font-semibold rounded-lg transition"
            >
              <span>Start Shopping</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}

        {/* Orders Grid */}
        {!isLoading && filteredOrders.length > 0 && !error && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-10">
              {paginatedOrders.map((order) => (
                <OrderCard
                  key={order.orderId}
                  order={order}
                  onViewDetails={(orderId) => router.push(`/buyer/dashboard/orders/${orderId}`)}
                />
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-4 px-4 py-6 bg-[#1a1a2e]/30 border border-[#8451E1]/20 rounded-xl">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 bg-[#8451E1]/10 hover:bg-[#8451E1]/20 text-[#8451E1] border border-[#8451E1]/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  ← Previous
                </button>

                <div className="flex items-center gap-2">
                  {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`w-10 h-10 rounded-lg font-medium transition ${
                        currentPage === page
                          ? 'bg-[#8451E1] text-white border border-[#8451E1]'
                          : 'bg-[#0a0a0a] text-gray-400 border border-[#8451E1]/20 hover:border-[#8451E1]/60 hover:text-white'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 bg-[#8451E1]/10 hover:bg-[#8451E1]/20 text-[#8451E1] border border-[#8451E1]/30 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition font-medium"
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}