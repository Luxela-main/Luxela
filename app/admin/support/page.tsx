'use client';

import React, { useEffect, useState, useMemo } from 'react';
import { trpc } from '@/lib/_trpc/client';
import { useOptimizedPolling } from '@/lib/hooks/useOptimizedPolling';
import {
  AlertCircle,
  TrendingUp,
  Clock,
  AlertTriangle,
  BarChart3,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle2,
  Circle,
  MessageCircle,
} from 'lucide-react';
import { useToast } from '@/components/hooks/useToast';
import Link from 'next/link';

interface Metrics {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  resolvedTickets: number;
  slaBreachCount: number;
  averageResolutionTime: number;
  averageResponseTime: number;
  teamUtilization: number;
  topCategories: Array<{ category: string; count: number }>;
  urgentTickets: Array<{ id: string; subject: string; priority: string; createdAt: Date }>;
}

interface SupportTicket {
  id: string;
  subject: string;
  priority: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date | null;
  buyerId?: string;
  sellerId?: string;
}


const MetricSkeleton = () => (
  <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 animate-pulse">
    <div className="h-4 bg-[#2B2B2B] rounded w-1/2 mb-4"></div>
    <div className="h-8 bg-[#2B2B2B] rounded w-1/3 mb-4"></div>
    <div className="h-2 bg-[#2B2B2B] rounded w-full"></div>
  </div>
);

export default function SupportAdminDashboard() {
  const toast = useToast();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'recent' | 'priority' | 'status'>('recent');
  const [wsConnected, setWsConnected] = useState(false);
  const [expandedTicket, setExpandedTicket] = useState<string | null>(null);

  const metricsQuery = trpc.supportAdmin.getDashboardMetrics.useQuery(undefined, {
    staleTime: 5000,
    gcTime: 10000,
    refetchOnWindowFocus: 'always',
  });

  const ticketsQuery = trpc.supportAdmin.getAllTickets.useQuery(undefined, {
    staleTime: 5000,
    gcTime: 10000,
  });

  const pollingMetrics = useOptimizedPolling(metricsQuery, {
    initialInterval: 10000,
    maxInterval: 60000,
    minInterval: 3000,
    enableBackoff: true,
    pauseWhenUnfocused: true,
    maxFailedAttempts: 3,
    circuitBreakerTimeout: 30000,
  });

  const { data: metricsData, isLoading, isError } = metricsQuery;
  const { data: ticketsData } = ticketsQuery;

  useEffect(() => {
    if (metricsData) {
      setMetrics({
        ...metricsData,
        urgentTickets: metricsData.urgentTickets.map((ticket: { id: string; subject: string; priority: string; createdAt: string | number | Date }) => ({
          id: ticket.id,
          subject: ticket.subject,
          priority: ticket.priority,
          createdAt: ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt),
        })) as Array<{ id: string; subject: string; priority: string; createdAt: Date }>,
      });
      setLoading(false);
    } else if (isError) {
      setLoading(false);
    }
  }, [metricsData, isError]);

  useEffect(() => {
    setWsConnected(!pollingMetrics.isCircuitBroken && pollingMetrics.failureCount < 2);
  }, [pollingMetrics.isCircuitBroken, pollingMetrics.failureCount]);

  
  const filteredTickets = useMemo(() => {
    if (!ticketsData) return [];

    let filtered = (ticketsData || []).map((ticket: { createdAt: string | number | Date; updatedAt: string | number | Date; resolvedAt: string | number | Date | null }) => ({
      ...ticket,
      createdAt: new Date(ticket.createdAt),
      updatedAt: new Date(ticket.updatedAt),
      resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : null,
    })) as SupportTicket[];

    
    if (searchTerm) {
      filtered = filtered.filter(
        (t) =>
          t.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          t.id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    
    if (filterStatus !== 'all') {
      filtered = filtered.filter((t) => t.status === filterStatus);
    }

    
    if (filterPriority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filterPriority);
    }

    
    if (sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'priority') {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      filtered.sort(
        (a, b) =>
          (priorityOrder[a.priority as keyof typeof priorityOrder] || 99) -
          (priorityOrder[b.priority as keyof typeof priorityOrder] || 99)
      );
    } else if (sortBy === 'status') {
      const statusOrder = { open: 0, in_progress: 1, resolved: 2, closed: 3 };
      filtered.sort(
        (a, b) =>
          (statusOrder[a.status as keyof typeof statusOrder] || 99) -
          (statusOrder[b.status as keyof typeof statusOrder] || 99)
      );
    }

    return filtered;
  }, [ticketsData, searchTerm, filterStatus, filterPriority, sortBy]);

  if (loading || isLoading) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <div className="h-10 bg-[#2B2B2B] rounded w-1/3 mb-2 animate-pulse"></div>
            <div className="h-4 bg-[#2B2B2B] rounded w-1/2 animate-pulse"></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {[...Array(4)].map((_, i) => (
              <MetricSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (isError) {
    const isForbidden = metricsQuery.error?.data?.code === 'FORBIDDEN';
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">
            {isForbidden ? 'Admin Access Required' : 'Failed to load dashboard'}
          </h2>
          <p className="text-[#808080] mb-4">
            {isForbidden
              ? 'Your account does not have admin privileges. If you just granted yourself admin access, please refresh the page.'
              : 'Please refresh the page or try again later.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#8451E1] text-white rounded hover:bg-[#7040d1] transition-colors cursor-pointer"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!metrics) {
    return <div className="p-8 text-center">No data available</div>;
  }

  const getStatusColor = (percentage: number) => {
    if (percentage >= 80) return 'text-red-500';
    if (percentage >= 50) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-blue-500/10 text-blue-400 border border-blue-500/30';
      case 'in_progress':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
      case 'resolved':
        return 'bg-green-500/10 text-green-400 border border-green-500/30';
      case 'closed':
        return 'bg-[#2B2B2B] text-[#808080] border border-[#3B3B3B]';
      default:
        return 'bg-[#2B2B2B] text-[#DCDCDC] border border-[#3B3B3B]';
    }
  };

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-500/10 text-red-400 border border-red-500/30';
      case 'high':
        return 'bg-orange-500/10 text-orange-400 border border-orange-500/30';
      case 'medium':
        return 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30';
      case 'low':
        return 'bg-green-500/10 text-green-400 border border-green-500/30';
      default:
        return 'bg-[#2B2B2B] text-[#DCDCDC] border border-[#3B3B3B]';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <Circle className="w-4 h-4" />;
      case 'in_progress':
        return <Zap className="w-4 h-4" />;
      case 'resolved':
        return <CheckCircle2 className="w-4 h-4" />;
      default:
        return <Circle className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      {}
      <div className="px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        <div className="max-w-7xl mx-auto">
          {}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-1 sm:mb-2">
                  Support Dashboard
                </h1>
                <p className="text-sm sm:text-base text-[#DCDCDC]">
                  Real-time support metrics and ticket management
                </p>
              </div>
              <div
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm ${
                  wsConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}
                />
                <span>
                  {wsConnected ? 'Connected' : 'Disconnected'}
                  {pollingMetrics.isFocused && (
                    <span className="ml-2 text-xs opacity-70">({pollingMetrics.refetchCount} updates)</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
            {}
            <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 sm:p-6 hover:border-[#8451E1] transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[#808080] text-xs sm:text-sm mb-1">Total Tickets</p>
                  <p className="text-2xl sm:text-3xl font-bold">{metrics?.totalTickets || 0}</p>
                </div>
                <BarChart3 className="text-[#8451E1] w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              </div>
              <p className="text-xs text-[#808080]">All-time total</p>
            </div>

            {}
            <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 sm:p-6 hover:border-blue-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[#808080] text-xs sm:text-sm mb-1">Open Tickets</p>
                  <p className="text-2xl sm:text-3xl font-bold text-blue-500">{metrics?.openTickets || 0}</p>
                </div>
                <AlertCircle className="text-blue-500 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              </div>
              <p className="text-xs text-[#808080]">Awaiting response</p>
            </div>

            {}
            <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 sm:p-6 hover:border-yellow-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[#808080] text-xs sm:text-sm mb-1">In Progress</p>
                  <p className="text-2xl sm:text-3xl font-bold text-yellow-500">{metrics?.inProgressTickets || 0}</p>
                </div>
                <Clock className="text-yellow-500 w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
              </div>
              <p className="text-xs text-[#808080]">Being worked on</p>
            </div>

            {}
            <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 sm:p-6 hover:border-red-500 transition-colors">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-[#808080] text-xs sm:text-sm mb-1">SLA Breaches</p>
                  <p
                    className={`text-2xl sm:text-3xl font-bold ${
                      metrics && metrics.slaBreachCount > 0 ? 'text-red-500' : 'text-green-500'
                    }`}
                  >
                    {metrics?.slaBreachCount || 0}
                  </p>
                </div>
                <AlertTriangle
                  className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${
                    metrics && metrics.slaBreachCount > 0 ? 'text-red-500' : 'text-green-500'
                  }`}
                />
              </div>
              <p className="text-xs text-[#808080]">Critical breaches</p>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6 mb-6 sm:mb-8">
            <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 sm:p-6">
              <p className="text-[#808080] text-xs sm:text-sm mb-4">Avg Response Time</p>
              <p className="text-xl sm:text-2xl font-bold mb-2">{metrics?.averageResponseTime || 0} min</p>
              <div className="w-full bg-[#0E0E0E] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-[#8451E1] to-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(((metrics?.averageResponseTime || 0) / 60) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#808080] mt-2">Target: &lt; 60 minutes</p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 sm:p-6">
              <p className="text-[#808080] text-xs sm:text-sm mb-4">Avg Resolution Time</p>
              <p className="text-xl sm:text-2xl font-bold mb-2">{metrics?.averageResolutionTime || 0} min</p>
              <div className="w-full bg-[#0E0E0E] rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(((metrics?.averageResolutionTime || 0) / 480) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-[#808080] mt-2">Target: &lt; 8 hours</p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 sm:p-6">
              <p className="text-[#808080] text-xs sm:text-sm mb-4">Team Utilization</p>
              <p className={`text-xl sm:text-2xl font-bold mb-2 ${getStatusColor(metrics?.teamUtilization || 0)}`}>
                {metrics?.teamUtilization || 0}%
              </p>
              <div className="w-full bg-[#0E0E0E] rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all ${
                    (metrics?.teamUtilization || 0) >= 80
                      ? 'bg-red-500'
                      : (metrics?.teamUtilization || 0) >= 50
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                  }`}
                  style={{ width: `${metrics?.teamUtilization || 0}%` }}
                />
              </div>
              <p className="text-xs text-[#808080] mt-2">Capacity used</p>
            </div>
          </div>

          {}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 sm:gap-6">
            {}
            <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <TrendingUp size={20} className="text-[#8451E1]" />
                Top Categories
              </h3>
              <div className="space-y-2">
                {metrics?.topCategories && metrics.topCategories.length > 0 ? (
                  metrics.topCategories.map((cat, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-[#0E0E0E] rounded">
                      <span className="text-xs sm:text-sm text-[#DCDCDC] truncate">
                        {cat.category.replace(/_/g, ' ')}
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-[#8451E1] flex-shrink-0 ml-2">
                        {cat.count}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm text-[#808080] text-center py-4">No categories</p>
                )}
              </div>
            </div>

            {}
            <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 sm:p-6">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-500" />
                Recent Urgent Tickets
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {metrics?.urgentTickets && metrics.urgentTickets.length > 0 ? (
                  metrics.urgentTickets.slice(0, 5).map((ticket) => (
                    <Link
                      key={ticket.id}
                      href={`/admin/support/tickets?selected=${ticket.id}`}
                      className="block p-3 bg-[#0E0E0E] hover:bg-[#1a1a1a] rounded border border-[#2B2B2B] hover:border-red-500 transition-all group cursor-pointer"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-medium text-[#DCDCDC] group-hover:text-white transition-colors truncate">
                            {ticket.subject}
                          </p>
                          <p className="text-xs text-[#808080] mt-1">
                            {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                        <span className="text-xs font-bold text-red-500 flex-shrink-0 whitespace-nowrap ml-2">
                          URGENT
                        </span>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm text-[#808080] text-center py-4">No urgent tickets</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {}
      <div className="px-4 sm:px-6 lg:px-8 py-6 sm:py-8 border-t border-[#2B2B2B]">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-xl sm:text-2xl font-bold mb-6">All Support Tickets</h2>

          {}
          <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-4 mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {}
              <div className="relative sm:col-span-2 lg:col-span-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080]" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-[#0E0E0E] border border-[#2B2B2B] rounded-lg pl-10 pr-4 py-2 text-xs sm:text-sm text-white placeholder-[#808080] focus:outline-none focus:border-[#8451E1] transition-colors"
                />
              </div>

              {}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080] pointer-events-none" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full appearance-none bg-[#0E0E0E] border border-[#2B2B2B] rounded-lg pl-10 pr-8 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8451E1] transition-colors cursor-pointer"
                >
                  <option value="all">All Status</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080] pointer-events-none" />
              </div>

              {}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080] pointer-events-none" />
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="w-full appearance-none bg-[#0E0E0E] border border-[#2B2B2B] rounded-lg pl-10 pr-8 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8451E1] transition-colors cursor-pointer"
                >
                  <option value="all">All Priority</option>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080] pointer-events-none" />
              </div>

              {}
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080] pointer-events-none" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="w-full appearance-none bg-[#0E0E0E] border border-[#2B2B2B] rounded-lg pl-10 pr-8 py-2 text-xs sm:text-sm text-white focus:outline-none focus:border-[#8451E1] transition-colors cursor-pointer"
                >
                  <option value="recent">Most Recent</option>
                  <option value="priority">By Priority</option>
                  <option value="status">By Status</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#808080] pointer-events-none" />
              </div>
            </div>

            {}
            <div className="mt-4 text-xs sm:text-sm text-[#808080]">
              Showing {filteredTickets.length} of {ticketsData?.length || 0} tickets
            </div>
          </div>

          {}
          <div className="hidden md:block bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs sm:text-sm">
                <thead className="bg-[#0E0E0E] border-b border-[#2B2B2B]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[#808080] font-semibold">ID</th>
                    <th className="px-4 py-3 text-left text-[#808080] font-semibold">Subject</th>
                    <th className="px-4 py-3 text-left text-[#808080] font-semibold">Status</th>
                    <th className="px-4 py-3 text-left text-[#808080] font-semibold">Priority</th>
                    <th className="px-4 py-3 text-left text-[#808080] font-semibold">Created</th>
                    <th className="px-4 py-3 text-center text-[#808080] font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredTickets.length > 0 ? (
                    filteredTickets.map((ticket, idx) => (
                      <tr
                        key={ticket.id}
                        className={`border-b border-[#2B2B2B] hover:bg-[#0E0E0E] transition-colors ${
                          idx % 2 === 0 ? 'bg-[#1a1a1a]' : 'bg-[#0F0F0F]'
                        }`}
                      >
                        <td className="px-4 py-3 text-[#DCDCDC] font-mono text-xs truncate max-w-32">
                          {ticket.id.slice(0, 8)}...
                        </td>
                        <td className="px-4 py-3 text-[#DCDCDC] truncate max-w-xs">{ticket.subject}</td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                              ticket.status
                            )}`}
                          >
                            {getStatusIcon(ticket.status)}
                            {ticket.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getPriorityBadgeColor(
                              ticket.priority
                            )}`}
                          >
                            {ticket.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-[#808080] text-xs">
                          {new Date(ticket.createdAt).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Link
                            href={`/admin/support/tickets?selected=${ticket.id}`}
                            className="text-[#8451E1] hover:text-[#9d63ff] transition-colors inline-block"
                          >
                            View
                          </Link>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-[#808080]">
                        No tickets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {}
          <div className="md:hidden space-y-3">
            {filteredTickets.length > 0 ? (
              filteredTickets.map((ticket) => (
                <div key={ticket.id} className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg overflow-hidden">
                  <button
                    onClick={() => setExpandedTicket(expandedTicket === ticket.id ? null : ticket.id)}
                    className="w-full px-4 py-3 flex items-center justify-between hover:bg-[#0E0E0E] transition-colors text-left cursor-pointer"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#DCDCDC] truncate">{ticket.subject}</p>
                      <div className="flex gap-2 mt-2 flex-wrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${getStatusBadgeColor(
                            ticket.status
                          )}`}
                        >
                          {getStatusIcon(ticket.status)}
                          {ticket.status.replace('_', ' ')}
                        </span>
                        <span
                          className={`inline-flex px-2 py-1 rounded text-xs font-medium ${getPriorityBadgeColor(
                            ticket.priority
                          )}`}
                        >
                          {ticket.priority}
                        </span>
                      </div>
                    </div>
                    {expandedTicket === ticket.id ? (
                      <ChevronUp className="w-5 h-5 text-[#808080] flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-[#808080] flex-shrink-0" />
                    )}
                  </button>

                  {expandedTicket === ticket.id && (
                    <div className="px-4 py-3 bg-[#0E0E0E] border-t border-[#2B2B2B] space-y-2">
                      <div>
                        <p className="text-xs text-[#808080] mb-1">ID</p>
                        <p className="text-xs text-[#DCDCDC] font-mono break-all">{ticket.id}</p>
                      </div>
                      <div>
                        <p className="text-xs text-[#808080] mb-1">Created</p>
                        <p className="text-xs text-[#DCDCDC]">
                          {new Date(ticket.createdAt).toLocaleString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                      <Link
                        href={`/admin/support/tickets/${ticket.id}`}
                        className="block mt-3 px-4 py-2 bg-[#8451E1] text-white rounded text-xs font-medium text-center hover:bg-[#7040d1] transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-8 text-center">
                <MessageCircle className="w-8 h-8 text-[#808080] mx-auto mb-3" />
                <p className="text-sm text-[#808080]">No tickets found</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}