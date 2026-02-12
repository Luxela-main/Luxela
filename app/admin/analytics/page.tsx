'use client';

import React, { useState } from 'react';
import { trpc } from '@/lib/trpc';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Loader2,
  Download,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { formatNaira } from '@/lib/currency';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

type DateRange = 'week' | 'month' | 'quarter' | 'year';

export default function AnalyticsDashboard() {
  const [dateRange, setDateRange] = useState<DateRange>('month');

  
  const daysMap: Record<DateRange, number> = {
    week: 7,
    month: 30,
    quarter: 90,
    year: 365,
  };

  const days = daysMap[dateRange];

  
  const { data: metricsData, isLoading: metricsLoading } =
    trpc.adminAnalytics.getMetrics.useQuery({ days });

  const { data: revenueTrendData, isLoading: revenueTrendLoading } =
    trpc.adminAnalytics.getRevenueTrend.useQuery({ days });

  const { data: userAcquisitionData, isLoading: userAcquisitionLoading } =
    trpc.adminAnalytics.getUserAcquisition.useQuery({ days });

  const { data: topListingsData, isLoading: topListingsLoading } =
    trpc.adminAnalytics.getTopListings.useQuery({
      limit: 10,
      days,
    });

  const isLoading =
    metricsLoading ||
    revenueTrendLoading ||
    userAcquisitionLoading ||
    topListingsLoading;

  const analyticsData = metricsData || {
    totalRevenue: 0,
    revenueChange: 0,
    totalUsers: 0,
    usersChange: 0,
    totalOrders: 0,
    ordersChange: 0,
    conversionRate: 0,
    conversionChange: 0,
    avgOrderValue: 0,
    avgOrderValueChange: 0,
  };

  const MetricCard = ({
    icon: Icon,
    label,
    value,
    change,
    isPositive,
    format = 'number',
  }: {
    icon: React.ElementType;
    label: string;
    value: number | string;
    change: number;
    isPositive?: boolean;
    format?: 'number' | 'currency' | 'percent';
  }) => {
    const formattedValue =
      format === 'currency'
        ? formatNaira(Number(value), true)
        : format === 'percent'
          ? `${value}%`
          : value;

    const changeColor =
      change > 0
        ? 'text-green-500'
        : change < 0
          ? 'text-red-500'
          : 'text-gray-400';
    const changeIcon = change > 0 ? TrendingUp : change < 0 ? TrendingDown : null;
    const ChangeIcon = changeIcon;

    return (
      <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs sm:text-sm font-medium text-[#9CA3AF] mb-2">
                {label}
              </p>
              <p className="text-2xl sm:text-3xl font-bold text-white">
                {formattedValue}
              </p>
              <div className={`text-xs mt-2 flex items-center gap-1 ${changeColor}`}>
                {ChangeIcon && <ChangeIcon className="w-3 h-3" />}
                <span>{Math.abs(change)}% vs last period</span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10 text-blue-500">
              <Icon className="w-5 h-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

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
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2">
            Analytics Dashboard
          </h1>
          <p className="text-sm sm:text-base text-[#9CA3AF]">
            Real-time platform performance metrics and insights
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto flex-wrap">
          {(['week', 'month', 'quarter', 'year'] as DateRange[]).map((range) => (
            <Button
              key={range}
              variant={dateRange === range ? 'default' : 'outline'}
              size="sm"
              onClick={() => setDateRange(range)}
              className={
                dateRange === range
                  ? 'bg-[#8451e1] text-white'
                  : 'border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#1a1a1a]'
              }
            >
              {range.charAt(0).toUpperCase() + range.slice(1)}
            </Button>
          ))}
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={analyticsData.totalRevenue}
          change={analyticsData.revenueChange}
          format="currency"
        />
        <MetricCard
          icon={ShoppingCart}
          label="Total Orders"
          value={analyticsData.totalOrders}
          change={analyticsData.ordersChange}
        />
        <MetricCard
          icon={Users}
          label="Total Users"
          value={analyticsData.totalUsers}
          change={analyticsData.usersChange}
        />
        <MetricCard
          icon={Eye}
          label="Avg Order Value"
          value={analyticsData.avgOrderValue}
          change={analyticsData.avgOrderValueChange}
          format="currency"
        />
        <MetricCard
          icon={BarChart3}
          label="Conversion Rate"
          value={analyticsData.conversionRate}
          change={analyticsData.conversionChange}
          format="percent"
        />
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {}
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white">Revenue Trend</CardTitle>
            <CardDescription className="text-gray-400">
              Daily revenue over the selected period
            </CardDescription>
          </CardHeader>
          <CardContent>
            {revenueTrendData && revenueTrendData.length > 0 ? (
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
                  <Legend />
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

        {}
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white">User Acquisition</CardTitle>
            <CardDescription className="text-gray-400">
              New buyers and sellers over time
            </CardDescription>
          </CardHeader>
          <CardContent>
            {userAcquisitionData && userAcquisitionData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userAcquisitionData}>
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
                  <Legend />
                  <Bar dataKey="buyers" stackId="a" fill="#10b981" />
                  <Bar dataKey="sellers" stackId="a" fill="#8451e1" />
                </BarChart>
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
      <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
        <CardHeader>
          <CardTitle className="text-white">Top Performing Listings</CardTitle>
          <CardDescription className="text-gray-400">
            Most ordered items in the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#2B2B2B]">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Product Name
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Sales
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Revenue
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Conversion
                  </th>
                </tr>
              </thead>
              <tbody>
                {topListingsData && topListingsData.length > 0 ? (
                  topListingsData.map((product) => (
                    <tr
                      key={product.id}
                      className="border-b border-[#2B2B2B] hover:bg-[#0e0e0e] transition-colors"
                    >
                      <td className="py-3 px-4 text-white">
                        {product.title}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {product.sales}
                      </td>
                      <td className="py-3 px-4 text-gray-300">
                        {formatNaira(product.revenue, true)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className="bg-green-500/20 text-green-400">
                          {product.conversionRate.toFixed(2)}%
                        </Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-10 text-center text-gray-400">
                      No data available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {}
      <div className="flex justify-end">
        <Button className="bg-[#8451e1] hover:bg-[#6d3fb8] text-white gap-2">
          <Download className="w-4 h-4" />
          Export Report
        </Button>
      </div>
    </div>
  );
}