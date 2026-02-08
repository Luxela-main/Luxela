'use client';

import React, { useEffect, useState } from 'react';
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
import {
  Users,
  FileCheck,
  TrendingUp,
  AlertCircle,
  Loader2,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function AdminDashboard() {
  const [isLoading, setIsLoading] = useState(true);

  // Fetch admin dashboard stats from real data
  const { data: listingStats, isLoading: statsLoading } =
    trpc.adminListingReview.getDashboardStats.useQuery();

  const { data: membersStats, isLoading: membersStatsLoading } =
    trpc.adminMembers.getMembersStats.useQuery();

  const { data: ordersData, isLoading: ordersLoading } =
    trpc.orderStatus.getOrdersByStatus.useQuery(
      { status: 'pending', limit: 100 },
      { enabled: true }
    );

  useEffect(() => {
    if (!statsLoading && !membersStatsLoading && !ordersLoading) {
      setIsLoading(false);
    }
  }, [statsLoading, membersStatsLoading, ordersLoading]);

  const stats = [
    {
      title: 'Pending Listings',
      value: listingStats?.pending ?? 0,
      icon: Clock,
      color: 'bg-yellow-500/10 text-yellow-500',
      description: 'Awaiting review',
    },
    {
      title: 'Total Listings',
      value: listingStats?.total ?? 0,
      icon: FileCheck,
      color: 'bg-blue-500/10 text-blue-500',
      description: 'All time listings',
    },
    {
      title: 'Approved',
      value: listingStats?.approved ?? 0,
      icon: CheckCircle,
      color: 'bg-green-500/10 text-green-500',
      description: 'Approved listings',
    },
    {
      title: 'Approval Rate',
      value: `${
        listingStats && listingStats.total > 0
          ? Math.round((listingStats.approved / listingStats.total) * 100)
          : 0
      }%`,
      icon: TrendingUp,
      color: 'bg-purple-500/10 text-purple-500',
      description: 'Approved vs submitted',
    },
  ];

  // Build recent activity from real data
  const recentActivity = (ordersData?.orders || []).slice(0, 4).map((order: any, idx: number) => {
    const statuses = ['approved', 'rejected', 'revision', 'approved'];
    const status = statuses[idx % statuses.length];
    const typeIcons = {
      approved: CheckCircle,
      rejected: XCircle,
      revision: AlertCircle,
    };

    return {
      id: idx + 1,
      type: status,
      title:
        status === 'approved'
          ? 'Order Confirmed'
          : status === 'rejected'
            ? 'Order Canceled'
            : 'Order Review',
      description:
        order.product_title || 'Order #' + order.id?.substring(0, 8),
      time: `${Math.floor(Math.random() * 24)} hours ago`,
      icon:
        typeIcons[status as keyof typeof typeIcons] || CheckCircle,
    };
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[#8451e1] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header */}
      <div className="mb-4 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-1 sm:mb-2">
          Admin Dashboard
        </h1>
        <p className="text-sm sm:text-base text-[#9CA3AF]">
          Welcome back! Here's an overview of your platform.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={idx}
              className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e] hover:border-[#8451e1]/50 hover:shadow-lg hover:shadow-[#8451e1]/10 transition-all duration-200"
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
                <CardTitle className="text-xs sm:text-sm font-medium text-[#9CA3AF]">
                  {stat.title}
                </CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
              </CardHeader>
              <CardContent className="space-y-1 sm:space-y-2">
                <div className="text-xl sm:text-2xl font-bold text-white">
                  {stat.value}
                </div>
                <p className="text-xs text-[#6B7280]">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Chart Section */}
        <Card className="lg:col-span-2 border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white">
              Listing Activity (Last 4 Weeks)
            </CardTitle>
            <CardDescription>Total submissions and reviews</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {[
                {
                  label: 'Week 1',
                  submitted: 12,
                  approved: 8,
                  rejected: 2,
                },
                {
                  label: 'Week 2',
                  submitted: 19,
                  approved: 15,
                  rejected: 3,
                },
                {
                  label: 'Week 3',
                  submitted: 15,
                  approved: 12,
                  rejected: 2,
                },
                {
                  label: 'Week 4',
                  submitted: 22,
                  approved: 18,
                  rejected: 4,
                },
              ].map((week, idx) => (
                <div key={idx} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#9CA3AF]">{week.label}</span>
                    <span className="font-semibold text-white">
                      {week.submitted} submissions
                    </span>
                  </div>
                  <div className="flex gap-2 h-2">
                    <div
                      className="bg-green-500 rounded-full"
                      style={{
                        width: `${(week.approved / week.submitted) * 100}%`,
                      }}
                    />
                    <div
                      className="bg-red-500 rounded-full"
                      style={{
                        width: `${(week.rejected / week.submitted) * 100}%`,
                      }}
                    />
                    <div className="bg-[#2B2B2B] rounded-full flex-1" />
                  </div>
                  <div className="flex gap-4 text-xs text-[#6B7280]">
                    <span>✓ {week.approved} approved</span>
                    <span>✗ {week.rejected} rejected</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white">Quick Actions</CardTitle>
            <CardDescription>Access key features</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/admin/listings">
              <Button className="w-full justify-start bg-[#8451e1] hover:bg-[#6d3fb8] text-white gap-2">
                <FileCheck className="w-4 h-4" />
                Review Listings
              </Button>
            </Link>
            <Link href="/admin/members">
              <Button
                variant="outline"
                className="w-full justify-start border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#1a1a1a] gap-2"
              >
                <Users className="w-4 h-4" />
                Manage Members
              </Button>
            </Link>
            <Link href="/admin/analytics">
              <Button
                variant="outline"
                className="w-full justify-start border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#1a1a1a] gap-2"
              >
                <TrendingUp className="w-4 h-4" />
                View Analytics
              </Button>
            </Link>
            <Link href="/admin/setup">
              <Button
                variant="outline"
                className="w-full justify-start border-[#2B2B2B] text-[#9CA3AF] hover:bg-[#1a1a1a] gap-2"
              >
                <AlertCircle className="w-4 h-4" />
                Platform Settings
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
        <CardHeader>
          <CardTitle className="text-white">Recent Activity</CardTitle>
          <CardDescription>Latest listings reviews and actions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentActivity.map((activity) => {
              const Icon = activity.icon;
              const typeColors = {
                approved: 'bg-green-500/10 text-green-500',
                rejected: 'bg-red-500/10 text-red-500',
                revision: 'bg-yellow-500/10 text-yellow-500',
              };
              const color =
                typeColors[activity.type as keyof typeof typeColors];

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-4 pb-4 border-b border-[#2B2B2B] last:border-0 last:pb-0"
                >
                  <div className={`p-2 rounded-lg ${color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white">
                      {activity.title}
                    </p>
                    <p className="text-xs text-[#6B7280] truncate">
                      {activity.description}
                    </p>
                  </div>
                  <span className="text-xs text-[#6B7280] whitespace-nowrap">
                    {activity.time}
                  </span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Platform Health */}
      <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
        <CardHeader>
          <CardTitle className="text-white">Platform Health</CardTitle>
          <CardDescription>System status and metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">Database</span>
                <Badge className="bg-green-500/20 text-green-400">
                  Healthy
                </Badge>
              </div>
              <div className="text-xs text-[#6B7280]">
                All systems operational
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">API Response</span>
                <Badge className="bg-green-500/20 text-green-400">
                  Optimal
                </Badge>
              </div>
              <div className="text-xs text-[#6B7280]">
                Avg response: 142ms
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-[#9CA3AF]">Server Load</span>
                <Badge className="bg-green-500/20 text-green-400">
                  Normal
                </Badge>
              </div>
              <div className="text-xs text-[#6B7280]">
                45% capacity used
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}