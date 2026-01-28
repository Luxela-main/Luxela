'use client';

import React, { useEffect, useState } from 'react';
import { trpc } from '@/lib/_trpc/client';
import { useOptimizedPolling } from '@/lib/hooks/useOptimizedPolling';
import { AlertCircle, TrendingUp, Clock, AlertTriangle, Users, BarChart3 } from 'lucide-react';
import { useToast } from '@/components/hooks/useToast';

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

export default function SupportAdminDashboard() {
  const toast = useToast();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [wsConnected, setWsConnected] = useState(false);

  const metricsQuery = trpc.supportAdmin.getDashboardMetrics.useQuery(undefined, {
    staleTime: 5000,
    gcTime: 10000,
    refetchOnWindowFocus: 'always',
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

  useEffect(() => {
    if (metricsData) {
      setMetrics({
        ...metricsData,
        urgentTickets: metricsData.urgentTickets.map(ticket => ({
          ...ticket,
          createdAt: typeof ticket.createdAt === 'string' ? new Date(ticket.createdAt) : ticket.createdAt
        }))
      });
      setLoading(false);
    } else if (isError) {
      setLoading(false);
    }
  }, [metricsData, isError]);

  useEffect(() => {
    setWsConnected(!pollingMetrics.isCircuitBroken && pollingMetrics.failureCount < 2);
  }, [pollingMetrics.isCircuitBroken, pollingMetrics.failureCount]);





  if (loading || isLoading) {
    return <div className="p-8 text-center">Loading dashboard...</div>;
  }

  if (isError) {
    return (
      <div className="min-h-screen bg-[#0E0E0E] text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-2">Failed to load dashboard</h2>
          <p className="text-[#808080] mb-4">Please refresh the page or try again later.</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-[#8451E1] text-white rounded hover:bg-[#7040d1] transition-colors"
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

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <div className="bg-gradient-to-r from-[#1a1a1a] to-[#0E0E0E] border-b border-[#2B2B2B] p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold">Support Dashboard</h1>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${wsConnected ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full ${wsConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm">
                {wsConnected ? 'Connected' : 'Disconnected'}
                {pollingMetrics.isFocused && <span className="ml-2 text-xs opacity-70">({pollingMetrics.refetchCount} updates)</span>}
              </span>
            </div>
          </div>
          <p className="text-[#DCDCDC]">Real-time support metrics and team management</p>
        </div>
      </div>

      <div className="p-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 hover:border-[#8451E1] transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#808080] text-sm mb-1">Total Tickets</p>
                <p className="text-3xl font-bold">{metrics?.totalTickets || 0}</p>
              </div>
              <BarChart3 className="text-[#8451E1]" size={24} />
            </div>
            <p className="text-xs text-[#808080]">All-time total</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 hover:border-blue-500 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#808080] text-sm mb-1">Open Tickets</p>
                <p className="text-3xl font-bold text-blue-500">{metrics?.openTickets || 0}</p>
              </div>
              <AlertCircle className="text-blue-500" size={24} />
            </div>
            <p className="text-xs text-[#808080]">Awaiting response</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 hover:border-yellow-500 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#808080] text-sm mb-1">In Progress</p>
                <p className="text-3xl font-bold text-yellow-500">{metrics?.inProgressTickets || 0}</p>
              </div>
              <Clock className="text-yellow-500" size={24} />
            </div>
            <p className="text-xs text-[#808080]">Being worked on</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6 hover:border-red-500 transition-colors">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-[#808080] text-sm mb-1">SLA Breaches</p>
                <p className={`text-3xl font-bold ${metrics && metrics.slaBreachCount > 0 ? 'text-red-500' : 'text-green-500'}`}>
                  {metrics?.slaBreachCount || 0}
                </p>
              </div>
              <AlertTriangle className={metrics && metrics.slaBreachCount > 0 ? 'text-red-500' : 'text-green-500'} size={24} />
            </div>
            <p className="text-xs text-[#808080]">Critical breaches</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6">
            <p className="text-[#808080] text-sm mb-4">Avg Response Time</p>
            <p className="text-2xl font-bold mb-2">{metrics?.averageResponseTime || 0} min</p>
            <div className="w-full bg-[#0E0E0E] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-[#8451E1] to-blue-500 h-2 rounded-full"
                style={{ width: `${Math.min((metrics?.averageResponseTime || 0) / 60 * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#808080] mt-2">Target: &lt; 60 minutes</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6">
            <p className="text-[#808080] text-sm mb-4">Avg Resolution Time</p>
            <p className="text-2xl font-bold mb-2">{metrics?.averageResolutionTime || 0} min</p>
            <div className="w-full bg-[#0E0E0E] rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full"
                style={{ width: `${Math.min((metrics?.averageResolutionTime || 0) / 480 * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-[#808080] mt-2">Target: &lt; 8 hours</p>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6">
            <p className="text-[#808080] text-sm mb-4">Team Utilization</p>
            <p className={`text-2xl font-bold mb-2 ${getStatusColor(metrics?.teamUtilization || 0)}`}>
              {metrics?.teamUtilization || 0}%
            </p>
            <div className="w-full bg-[#0E0E0E] rounded-full h-2">
              <div 
                className={`h-2 rounded-full transition-all ${
                  (metrics?.teamUtilization || 0) >= 80 ? 'bg-red-500' :
                  (metrics?.teamUtilization || 0) >= 50 ? 'bg-yellow-500' :
                  'bg-green-500'
                }`}
                style={{ width: `${metrics?.teamUtilization || 0}%` }}
              />
            </div>
            <p className="text-xs text-[#808080] mt-2">Capacity used</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4">Top Categories</h3>
            <div className="space-y-3">
              {metrics?.topCategories.map((cat, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-[#0E0E0E] rounded">
                  <span className="text-sm text-[#DCDCDC]">{cat.category.replace(/_/g, ' ')}</span>
                  <span className="text-sm font-bold text-[#8451E1]">{cat.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:col-span-2 bg-[#1a1a1a] border border-[#2B2B2B] rounded-lg p-6">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <AlertTriangle size={20} className="text-red-500" />
              Urgent Tickets
            </h3>
            <div className="space-y-2">
              {metrics?.urgentTickets && metrics.urgentTickets.length > 0 ? (
                metrics.urgentTickets.map((ticket) => (
                  <a
                    key={ticket.id}
                    href={`/admin/support/tickets/${ticket.id}`}
                    className="block p-3 bg-[#0E0E0E] hover:bg-[#1a1a1a] rounded border border-[#2B2B2B] hover:border-red-500 transition-all group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[#DCDCDC] group-hover:text-white transition-colors">
                          {ticket.subject}
                        </p>
                        <p className="text-xs text-[#808080] mt-1">
                          {new Date(ticket.createdAt).toLocaleString()}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-red-500 ml-2">URGENT</span>
                    </div>
                  </a>
                ))
              ) : (
                <p className="text-sm text-[#808080] text-center py-4">No urgent tickets</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}