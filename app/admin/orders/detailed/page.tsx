'use client';

import React, { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { formatNaira } from '@/lib/currency';
import {
  Loader2,
  Search,
  ChevronRight,
  MoreVertical,
  Download,
  Filter,
  Calendar,
  DollarSign,
} from 'lucide-react';
import Link from 'next/link';

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  confirmed: 'bg-blue-500/10 text-blue-500',
  processing: 'bg-purple-500/10 text-purple-500',
  shipped: 'bg-cyan-500/10 text-cyan-500',
  delivered: 'bg-green-500/10 text-green-500',
  canceled: 'bg-red-500/10 text-red-500',
  returned: 'bg-orange-500/10 text-orange-500',
};

interface Order {
  id: string;
  buyer_id?: string;
  seller_id?: string;
  product_title?: string;
  order_status?: string;
  delivery_status?: string;
  amount_cents?: number;
  currency?: string;
  order_date?: string;
  delivered_date?: string;
  tracking_number?: string;
}

export default function DetailedOrdersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [sortBy, setSortBy] = useState('date-desc');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);

  // Fetch all orders
  const { data: pendingOrders, isLoading: pendingLoading } =
    trpc.orderStatus.getOrdersByStatus.useQuery(
      { status: 'pending' as const, limit: 1000 },
      { enabled: true }
    );

  const { data: processingOrders, isLoading: processingLoading } =
    trpc.orderStatus.getOrdersByStatus.useQuery(
      { status: 'processing' as const, limit: 1000 },
      { enabled: true }
    );

  const { data: deliveredOrders, isLoading: deliveredLoading } =
    trpc.orderStatus.getOrdersByStatus.useQuery(
      { status: 'delivered' as const, limit: 1000 },
      { enabled: true }
    );

  const isLoading = pendingLoading || processingLoading || deliveredLoading;

  // Combine all orders
  const allOrders = useMemo(() => {
    const combined = [
      ...(pendingOrders?.orders || []),
      ...(processingOrders?.orders || []),
      ...(deliveredOrders?.orders || []),
    ];
    return combined;
  }, [pendingOrders, processingOrders, deliveredOrders]);

  // Filter and sort orders
  const filteredOrders = useMemo(() => {
    let filtered = allOrders;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.product_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id?.includes(searchTerm)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.order_status === statusFilter);
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      const filterDate = new Date();

      switch (dateRange) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          break;
        case 'week':
          filterDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          filterDate.setMonth(now.getMonth() - 1);
          break;
        case 'quarter':
          filterDate.setMonth(now.getMonth() - 3);
          break;
      }

      filtered = filtered.filter(
        (order) =>
          order.order_date &&
          new Date(order.order_date).getTime() >= filterDate.getTime()
      );
    }

    // Sort
    const sorted = [...filtered];
    switch (sortBy) {
      case 'date-desc':
        sorted.sort(
          (a, b) =>
            new Date(b.order_date || 0).getTime() -
            new Date(a.order_date || 0).getTime()
        );
        break;
      case 'date-asc':
        sorted.sort(
          (a, b) =>
            new Date(a.order_date || 0).getTime() -
            new Date(b.order_date || 0).getTime()
        );
        break;
      case 'amount-high':
        sorted.sort((a, b) => (b.amount_cents || 0) - (a.amount_cents || 0));
        break;
      case 'amount-low':
        sorted.sort((a, b) => (a.amount_cents || 0) - (b.amount_cents || 0));
        break;
    }

    return sorted;
  }, [allOrders, searchTerm, statusFilter, dateRange, sortBy]);

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  const toggleAllSelection = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  const handleExport = () => {
    const csv = [
      ['Order ID', 'Product', 'Amount', 'Status', 'Date', 'Delivery Status'],
      ...filteredOrders.map((order) => [
        order.id,
        order.product_title || 'N/A',
        ((order.amount_cents || 0) / 100).toFixed(2),
        order.order_status || 'N/A',
        new Date(order.order_date || '').toLocaleDateString(),
        order.delivery_status || 'N/A',
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[#8451e1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">All Orders</h1>
        <p className="text-gray-400">
          Manage and view all orders with advanced filtering and analytics
        </p>
      </div>

      {/* Filters and Controls */}
      <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
        <CardContent className="pt-6">
          <div className="space-y-4">
            {/* Primary filters */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
                <Input
                  placeholder="Search orders..."
                  className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Status filter */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="all" className="text-white">
                    All Statuses
                  </SelectItem>
                  <SelectItem value="pending" className="text-white">
                    Pending
                  </SelectItem>
                  <SelectItem value="confirmed" className="text-white">
                    Confirmed
                  </SelectItem>
                  <SelectItem value="processing" className="text-white">
                    Processing
                  </SelectItem>
                  <SelectItem value="shipped" className="text-white">
                    Shipped
                  </SelectItem>
                  <SelectItem value="delivered" className="text-white">
                    Delivered
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Date range filter */}
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  <Calendar className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by date" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="all" className="text-white">
                    All Time
                  </SelectItem>
                  <SelectItem value="today" className="text-white">
                    Today
                  </SelectItem>
                  <SelectItem value="week" className="text-white">
                    Last 7 Days
                  </SelectItem>
                  <SelectItem value="month" className="text-white">
                    Last 30 Days
                  </SelectItem>
                  <SelectItem value="quarter" className="text-white">
                    Last 90 Days
                  </SelectItem>
                </SelectContent>
              </Select>

              {/* Sort */}
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-[#1a1a1a] border-[#2a2a2a] text-white">
                  <DollarSign className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                  <SelectItem value="date-desc" className="text-white">
                    Newest First
                  </SelectItem>
                  <SelectItem value="date-asc" className="text-white">
                    Oldest First
                  </SelectItem>
                  <SelectItem value="amount-high" className="text-white">
                    Highest Amount
                  </SelectItem>
                  <SelectItem value="amount-low" className="text-white">
                    Lowest Amount
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 justify-end">
              <Button
                onClick={handleExport}
                variant="outline"
                className="border-[#1a1a1a] text-[#8451e1] hover:bg-[#1a1a1a]"
              >
                <Download className="w-4 h-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Orders Table */}
      <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">
                Orders ({filteredOrders.length})
              </CardTitle>
              <CardDescription className="text-gray-400">
                {selectedOrders.length} selected
              </CardDescription>
            </div>
            {selectedOrders.length > 0 && (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                >
                  Cancel Orders ({selectedOrders.length})
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      className="rounded border-gray-600"
                      checked={
                        selectedOrders.length === filteredOrders.length &&
                        filteredOrders.length > 0
                      }
                      onChange={toggleAllSelection}
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Order ID
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Product
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Amount
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Delivery
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        className="rounded border-gray-600"
                        checked={selectedOrders.includes(order.id)}
                        onChange={() => toggleOrderSelection(order.id)}
                      />
                    </td>
                    <td className="py-3 px-4 text-white font-mono text-xs">
                      {order.id?.substring(0, 12)}...
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {order.product_title?.substring(0, 25)}...
                    </td>
                    <td className="py-3 px-4 text-white font-semibold">
                      {formatNaira(order.amount_cents || 0, false)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`${ORDER_STATUS_COLORS[
                          order.order_status || 'pending'
                        ]}`}
                      >
                        {(order.order_status || 'pending')
                          .charAt(0)
                          .toUpperCase() +
                          (order.order_status || 'pending').slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant="outline"
                        className="border-gray-600 text-gray-300"
                      >
                        {order.delivery_status || 'N/A'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(order.order_date || '').toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-400 hover:text-white"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="bg-[#1a1a1a] border-[#2a2a2a]"
                        >
                          <DropdownMenuItem className="text-gray-300 hover:bg-[#2a2a2a]">
                            <Link
                              href={`/admin/orders/${order.id}`}
                              className="w-full"
                            >
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-300 hover:bg-[#2a2a2a]">
                            Print Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-gray-300 hover:bg-[#2a2a2a]">
                            Send Message
                          </DropdownMenuItem>
                          <DropdownMenuItem className="text-red-500 hover:bg-red-500/10">
                            Cancel Order
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {filteredOrders.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                No orders found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}