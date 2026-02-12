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
  AlertTriangle,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Search,
  Filter,
  ChevronRight,
  MessageSquare,
  Zap,
  TrendingUp,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';
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
} from 'recharts';

const DISPUTE_STATUS_COLORS: Record<string, string> = {
  open: 'bg-red-500/10 text-red-500',
  under_review: 'bg-yellow-500/10 text-yellow-500',
  resolved: 'bg-green-500/10 text-green-500',
  closed: 'bg-gray-500/10 text-gray-400',
};

interface DisputeStats {
  totalDisputes: number;
  openDisputes: number;
  underReviewDisputes: number;
  resolvedDisputes: number;
  avgResolutionTime: number;
  escalationRate: number;
  customerSatisfaction: number;
}

export default function DisputesManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [selectedDispute, setSelectedDispute] = useState<string | null>(null);

  
  const { data: ticketsData, isLoading: ticketsLoading } =
    trpc.supportAdmin.getAllTickets.useQuery();

  const isLoading = ticketsLoading;

  
  const stats = useMemo(() => {
    const tickets = ticketsData || [];
    const returnRequests = tickets.filter(
      (t) => t.category === 'refund_request' || t.category === 'return_request'
    );

    const open = returnRequests.filter((t) => t.status === 'open').length;
    const underReview = returnRequests.filter(
      (t) => t.status === 'in_progress'
    ).length;
    const resolved = returnRequests.filter((t) => t.status === 'resolved').length;

    
    const resolvedTickets = returnRequests.filter(
      (t) => t.resolvedAt && t.createdAt
    );
    const avgResolutionTime =
      resolvedTickets.length > 0
        ? resolvedTickets.reduce((sum, t) => {
            const created = new Date(t.createdAt).getTime();
            const resolved = new Date(t.resolvedAt!).getTime();
            return sum + (resolved - created);
          }, 0) /
          resolvedTickets.length /
          (1000 * 60 * 60) 
        : 0;

    return {
      totalDisputes: returnRequests.length,
      openDisputes: open,
      underReviewDisputes: underReview,
      resolvedDisputes: resolved,
      avgResolutionTime: Math.round(avgResolutionTime),
      escalationRate: returnRequests.filter(
        (t) => t.priority === 'urgent' || t.priority === 'high'
      ).length,
      customerSatisfaction: resolved > 0 ? (resolved / returnRequests.length) * 100 : 0,
    };
  }, [ticketsData]);

  
  const filteredDisputes = useMemo(() => {
    let filtered = (ticketsData || []).filter(
      (t) => t.category === 'refund_request' || t.category === 'return_request'
    );

    if (searchTerm) {
      filtered = filtered.filter(
        (d) =>
          d.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          d.id.includes(searchTerm)
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((d) => d.status === statusFilter);
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter((d) => d.priority === priorityFilter);
    }

    return filtered;
  }, [ticketsData, searchTerm, statusFilter, priorityFilter]);

  
  const statusChartData = [
    { name: 'Open', value: stats.openDisputes },
    { name: 'In Review', value: stats.underReviewDisputes },
    { name: 'Resolved', value: stats.resolvedDisputes },
  ].filter((item) => item.value > 0);

  
  const resolutionTimelineData = [
    { day: 'Mon', disputes: 12 },
    { day: 'Tue', disputes: 19 },
    { day: 'Wed', disputes: 15 },
    { day: 'Thu', disputes: 25 },
    { day: 'Fri', disputes: 22 },
    { day: 'Sat', disputes: 8 },
    { day: 'Sun', disputes: 5 },
  ];

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
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white">Disputes & Returns</h1>
        <p className="text-sm sm:text-base text-[#9CA3AF]">
          Manage customer disputes, returns, and resolution tracking
        </p>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard
          icon={AlertTriangle}
          title="Total Disputes"
          value={stats.totalDisputes}
          description="All disputes and returns"
          color="bg-red-500/10 text-red-500"
        />
        <StatCard
          icon={Clock}
          title="Open Cases"
          value={stats.openDisputes}
          description="Awaiting action"
          color="bg-yellow-500/10 text-yellow-500"
        />
        <StatCard
          icon={CheckCircle}
          title="Resolved"
          value={stats.resolvedDisputes}
          description="Successfully closed"
          color="bg-green-500/10 text-green-500"
        />
        <StatCard
          icon={TrendingUp}
          title="Avg Resolution Time"
          value={`${stats.avgResolutionTime}h`}
          description="Hours to resolve"
          color="bg-cyan-500/10 text-cyan-500"
        />
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {}
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Disputes by Status
            </CardTitle>
            <CardDescription className="text-gray-400">
              Current distribution of disputes
            </CardDescription>
          </CardHeader>
          <CardContent>
            {statusChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={statusChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="name" stroke="#666" />
                  <YAxis stroke="#666" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1a1a1a',
                      border: '1px solid #2a2a2a',
                      borderRadius: '8px',
                      color: '#fff',
                    }}
                  />
                  <Bar dataKey="value" fill="#8451e1" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-400">
                No disputes data
              </div>
            )}
          </CardContent>
        </Card>

        {}
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Weekly Disputes Trend
            </CardTitle>
            <CardDescription className="text-gray-400">
              Disputes filed per day this week
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={resolutionTimelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="day" stroke="#666" />
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
                  dataKey="disputes"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-500" />
              Escalations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">High Priority Cases</span>
              <Badge className="bg-orange-500/10 text-orange-500">
                {stats.escalationRate}
              </Badge>
            </div>
            <Button className="w-full bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 border border-orange-500/30">
              View Escalations
            </Button>
          </CardContent>
        </Card>

        <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-blue-500" />
              Customer Satisfaction
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-400">Resolution Rate</span>
              <Badge className="bg-green-500/10 text-green-500">
                {stats.customerSatisfaction.toFixed(1)}%
              </Badge>
            </div>
            <Button className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30">
              View Feedback
            </Button>
          </CardContent>
        </Card>
      </div>

      {}
      <Card className="border-[#2B2B2B] bg-gradient-to-br from-[#1a1a1a] to-[#0e0e0e]">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Active Disputes</CardTitle>
              <CardDescription className="text-gray-400">
                Showing {filteredDisputes.length} disputes
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {}
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search disputes..."
                className="pl-10 bg-[#1a1a1a] border-[#2B2B2B] text-white placeholder-gray-500 text-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-[#1a1a1a] border-[#2B2B2B] text-white text-sm">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2B2B2B]">
                <SelectItem value="all" className="text-white">
                  All Status
                </SelectItem>
                <SelectItem value="open" className="text-white">
                  Open
                </SelectItem>
                <SelectItem value="in_progress" className="text-white">
                  In Review
                </SelectItem>
                <SelectItem value="resolved" className="text-white">
                  Resolved
                </SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full sm:w-40 bg-[#1a1a1a] border-[#2B2B2B] text-white text-sm">
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#2B2B2B]">
                <SelectItem value="all" className="text-white">
                  All Priority
                </SelectItem>
                <SelectItem value="urgent" className="text-white">
                  Urgent
                </SelectItem>
                <SelectItem value="high" className="text-white">
                  High
                </SelectItem>
                <SelectItem value="medium" className="text-white">
                  Medium
                </SelectItem>
                <SelectItem value="low" className="text-white">
                  Low
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
                    Case ID
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Subject
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Status
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Priority
                  </th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">
                    Opened
                  </th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">
                    Action
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredDisputes.slice(0, 10).map((dispute) => (
                  <tr
                    key={dispute.id}
                    className="border-b border-[#1a1a1a] hover:bg-[#1a1a1a]/50 transition-colors"
                  >
                    <td className="py-3 px-4 text-white font-mono text-xs">
                      {dispute.id?.substring(0, 10)}...
                    </td>
                    <td className="py-3 px-4 text-gray-300">
                      {dispute.subject?.substring(0, 35)}...
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        className={`${
                          DISPUTE_STATUS_COLORS[dispute.status] ||
                          'bg-gray-500/10 text-gray-400'
                        }`}
                      >
                        {(dispute.status || 'open')
                          .replace('_', ' ')
                          .charAt(0)
                          .toUpperCase() +
                          (dispute.status || 'open').slice(1).replace('_', ' ')}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={
                          dispute.priority === 'urgent' ||
                          dispute.priority === 'high'
                            ? 'default'
                            : 'secondary'
                        }
                        className={
                          dispute.priority === 'urgent'
                            ? 'bg-red-500/10 text-red-500'
                            : dispute.priority === 'high'
                              ? 'bg-orange-500/10 text-orange-500'
                              : 'bg-gray-500/10 text-gray-400'
                        }
                      >
                        {dispute.priority}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-gray-400 text-xs">
                      {new Date(dispute.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Link href={`/admin/disputes/${dispute.id}`}>
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
            {filteredDisputes.length === 0 && (
              <div className="text-center py-10 text-gray-400">
                No disputes found matching your filters.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}