'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
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
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { formatNaira } from '@/lib/currency';
import {
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowRight,
  Search,
  Filter,
  ChevronRight,
  Clock,
  DollarSign,
  Users,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  confirmed: 'bg-blue-500/10 text-blue-500',
  processing: 'bg-purple-500/10 text-purple-500',
  shipped: 'bg-cyan-500/10 text-cyan-500',
  delivered: 'bg-green-500/10 text-green-500',
  canceled: 'bg-red-500/10 text-red-500',
  returned: 'bg-orange-500/10 text-orange-500',
};

const CHART_COLORS = ['#8451e1', '#0ea5e9', '#10b981', '#f59e0b', '#ef4444'];

interface OrderStats {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  returnsRequests: number;
  totalRevenue: number;
  averageOrderValue: number;
  disputeCount: number;
  resolutionRate: number;
}

interface OrderData {
  id: string;
  buyerId: string;
  sellerId: string;
  listingId: string;
  productTitle: string;
  orderStatus: string;
  deliveryStatus: string;
  amountCents: number;
  currency: string;
  orderDate: string;
  deliveredDate?: string;
  trackingNumber?: string;
}

export default function AdminOrdersDashboard() {
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [deliveryFilter, setDeliveryFilter] = useState('all');

  
  const { data: ordersData, isLoading: ordersLoading } =
    trpc.orderStatus.getOrdersByStatus.useQuery(
      { status: 'pending' as const, limit: 1000 },
      { enabled: true }
    );

  const { data: allOrders } = trpc.orderStatus.getOrdersByStatus.useQuery(
    { status: 'delivered' as const, limit: 1000 },
    { enabled: true }
  );

  useEffect(() => {
    if (!ordersLoading) {
      setIsLoading(false);
    }
  }, [ordersLoading]);

  
  const stats = useMemo(() => {
    const orders = ordersData?.orders || [];
    
    const totalOrders = orders.length;
    const pendingOrders = orders.filter(
      (o) => o.order_status === 'pending'
    ).length;
    const completedOrders = orders.filter(
      (o) => o.order_status === 'delivered'
    ).length;
    const returnsRequests = orders.filter(
      (o) => o.order_status === 'returned'
    ).length;

    const totalRevenue = orders.reduce(
      (sum, order) => sum + (order.amount_cents || 0),
      0
    );
    const averageOrderValue =
      totalOrders > 0 ? totalRevenue / totalOrders : 0;

    return {
      totalOrders,
      pendingOrders,
      completedOrders,
      returnsRequests,
      totalRevenue: totalRevenue / 100, 
      averageOrderValue: averageOrderValue / 100,
      disputeCount: returnsRequests,
      resolutionRate: totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0,
    };
  }, [ordersData]);

  
  const statusChartData = useMemo(() => {
    const orders = ordersData?.orders || [];
    const statusCounts: Record<string, number> = {
      pending: 0,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      canceled: 0,
      returned: 0,
    };

    orders.forEach((order) => {
      const status = order.order_status || 'pending';
      if (status in statusCounts) {
        statusCounts[status]++;
      }
    });

    return Object.entries(statusCounts)
      .filter(([_, count]) => count > 0)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value,
      }));
  }, [ordersData]);

  
  const revenueTrendData = useMemo(() => {
    const orders = ordersData?.orders || [];
    const dailyRevenue: Record<string, number> = {};

    orders.forEach((order) => {
      const date = new Date(order.order_date).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
      const amount = (order.amount_cents || 0) / 100;
      dailyRevenue[date] = (dailyRevenue[date] || 0) + amount;
    });

    return Object.entries(dailyRevenue)
      .sort((a, b) => new Date(a[0]).getTime() - new Date(b[0]).getTime())
      .slice(-7)
      .map(([date, revenue]) => ({
        date,
        revenue: parseFloat(revenue.toFixed(2)),
      }));
  }, [ordersData]);

  
  const filteredOrders = useMemo(() => {
    let filtered = ordersData?.orders || [];

    if (searchTerm) {
      filtered = filtered.filter(
        (order) =>
          order.product_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.id.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((order) => order.order_status === statusFilter);
    }

    if (deliveryFilter !== 'all') {
      filtered = filtered.filter((order) => order.delivery_status === deliveryFilter);
    }

    return filtered;
  }, [ordersData, searchTerm, statusFilter, deliveryFilter]);

  const StatCard = ({
    icon: Icon,
    title,
    value,
    description,
    color,
  }: {
    icon: React.ElementType;
    title: string;
    value: string | number;
    description: string;
    color: string;
  }) => (
    <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e] hover:border-[#8451e1]/50 transition-all">
      <CardContent className="pt-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs sm:text-sm font-medium text-[#9CA3AF] mb-1">{title}</p>
            <p className="text-xl sm:text-3xl font-bold text-white">{value}</p>
            <p className="text-xs text-[#6B7280] mt-2">{description}</p>
          </div>
          <div className={`p-2 sm:p-3 rounded-lg ${color}`}>
            <Icon className="w-4 h-4 sm:w-5 sm:h-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[#8451e1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {}
      <div className="mb-4 sm:mb-6 flex flex-col gap-2">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Orders Management</h1>
        <p className="text-sm sm:text-base text-[#9CA3AF]">
          Monitor all orders, disputes, and delivery status in real-time
        </p>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={Package}
          title="Total Orders"
          value={stats.totalOrders}
          description="All orders in system"
          color="bg-blue-500/10 text-blue-500"
        />
        <StatCard
          icon={Clock}
          title="Pending Orders"
          value={stats.pendingOrders}
          description="Awaiting shipment"
          color="bg-yellow-500/10 text-yellow-500"
        />
        <StatCard
          icon={CheckCircle}
          title="Completed Orders"
          value={stats.completedOrders}
          description="Successfully delivered"
          color="bg-green-500/10 text-green-500"
        />
        <StatCard
          icon={DollarSign}
          title="Total Revenue"
          value={formatNaira(stats.totalRevenue, true)}
          description="All orders combined"
          color="bg-purple-500/10 text-purple-500"
        />
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {}
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white">Order Status Distribution</CardTitle>
            <CardDescription className="text-gray-400">
              Breakdown of orders by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={80}
                    fill="#8451e1"
                    dataKey="value"
                  >
                    {statusChartData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>

        {}
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend (Last 7 Days)</CardTitle>
            <CardDescription className="text-gray-400">
              Daily revenue from completed orders
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueTrendData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={revenueTrendData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="date" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8451e1"
                    strokeWidth={2}
                    dot={{ fill: '#8451e1', r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Disputes & Returns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Return Requests</span>
              <span className="text-2xl font-bold text-orange-500">
                {stats.returnsRequests}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Dispute Count</span>
              <span className="text-2xl font-bold text-red-500">
                {stats.disputeCount}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Resolution Rate</span>
              <span className="text-2xl font-bold text-green-500">
                {stats.resolutionRate.toFixed(1)}%
              </span>
            </div>
            <Link href="/admin/disputes">
              <Button className="w-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/30">
                Manage Disputes
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Fulfillment Performance
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Completion Rate</span>
              <span className="text-2xl font-bold text-green-500">
                {(
                  ((stats.completedOrders + stats.returnsRequests) /
                    stats.totalOrders) *
                  100
                ).toFixed(1)}
                %
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Avg Order Value</span>
              <span className="text-2xl font-bold text-cyan-500">
                {formatNaira(stats.averageOrderValue, true)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Processing Orders</span>
              <span className="text-2xl font-bold text-blue-500">
                {ordersData?.orders?.filter((o) => o.order_status === 'processing')
                  .length || 0}
              </span>
            </div>
            <Button className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30">
              View Performance Report
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>

      {}
      <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Orders</CardTitle>
              <CardDescription className="text-gray-400">
                Showing {filteredOrders.length} of {ordersData?.orders?.length || 0} orders
              </CardDescription>
            </div>
            <Link href="/admin/orders/detailed">
              <Button variant="outline" className="border-[#1a1a1a] text-[#8451e1] hover:bg-[#1a1a1a]">
                View All Orders
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by order ID or product..."
                className="pl-10 bg-[#1a1a1a] border-[#2a2a2a] text-white placeholder-gray-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40 bg-[#1a1a1a] border-[#2a2a2a] text-white">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2a2a2a]">
                <SelectItem value="all" className="text-white">
                  All Statuses
                </SelectItem>
                <SelectItem value="pending" className="text-white">
                  Pending
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
          </div>

          {}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#1a1a1a]">
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
                    Date
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.slice(0, 10).map((order) => (
                  <tr
                    key={order.id}
                    className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-mono text-xs">
                      {order.id?.substring(0, 8)}...
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {order.product_title?.substring(0, 30)}...
                    </td>
                    <td className="py-3 px-4 text-white">
                      {formatNaira(order.amount_cents || 0, false)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`${ORDER_STATUS_COLORS[
                          order.order_status || 'pending'
                        ]}`}
                      >
                        {(order.order_status || 'pending').charAt(0).toUpperCase() +
                          (order.order_status || 'pending').slice(1)}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(order.order_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/orders/${order.id}`}>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-[#8451e1] hover:bg-[#8451e1]/10"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
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
