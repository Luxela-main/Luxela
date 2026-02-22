'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from 'recharts';
import {
  DollarSign, ShoppingCart, BarChart3, Star,
  TrendingUp, AlertCircle
} from 'lucide-react';
import { getDashboardMetrics, type DashboardMetrics } from './actions';
import { trpc as api } from '@/lib/_trpc/client';
import { formatCurrency } from '@/lib/utils';

const COLORS = ['#fbbf24', '#f97316', '#ef4444', '#ec4899', '#a855f7'];
const RATING_COLORS = COLORS;

export default function DashboardPage() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadMetrics();
  }, []);

  const loadMetrics = async () => {
    try {
      const data = await getDashboardMetrics('month');
      setMetrics(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl animate-pulse"></div>
        </div>
        <div className="text-center relative z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
        {/* Animated background blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-600/5 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-600/5 rounded-full blur-3xl"></div>
        </div>
        <div className="relative z-10 backdrop-blur-xl bg-red-500/5 border border-red-500/20 rounded-2xl p-8 max-w-md text-center shadow-2xl">
          <div className="text-red-400 font-semibold text-lg mb-2">⚠️ Error</div>
          <p className="text-red-300/80 text-sm">{error}</p>
        </div>
      </div>
    );
  }

  // Use real revenue data from metrics
  const revenueData = (metrics?.revenueData || []).map(d => ({
    date: new Date(d.date + 'T00:00:00Z').toLocaleDateString('en-US', { weekday: 'short' }),
    revenue: parseFloat(d.revenue),
  }));

  // Use real rating distribution data
  const ratingData = metrics?.ratingDistribution 
    ? Object.entries(metrics.ratingDistribution)
        .map(([rating, count]) => ({
          name: `${rating}★`,
          value: count,
        }))
        .filter(d => d.value > 0)
    : [];

  // Top products data
  const topProducts = metrics?.trendingProducts.slice(0, 6).map(p => ({
    name: p.name.substring(0, 15),
    revenue: p.revenue,
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-[#8451E1]/8 rounded-full blur-3xl animate-blob"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-blue-600/5 rounded-full blur-3xl animate-blob animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-cyan-600/3 rounded-full blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-10 min-h-screen p-4 sm:p-5 md:p-6 lg:p-8"
      >
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6 sm:mb-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-[#8451E1] via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-1 sm:mb-2">Dashboard</h1>
              <p className="text-slate-400 text-sm sm:text-base">Welcome back! Here's your store performance</p>
            </motion.div>
          </div>

          {/* KPI Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 md:gap-5 lg:gap-6 mb-6 sm:mb-8"
          >
            {/* Revenue Card */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="group backdrop-blur-xl bg-gradient-to-br from-[#8451E1]/20 to-[#6d28d9]/10 border border-[#8451E1]/20 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-[#8451E1]/40 transition-all duration-300 cursor-pointer min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[220px] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-[#c084fc] text-xs sm:text-sm md:text-base font-medium mb-1 sm:mb-2 md:mb-3">Total Revenue</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold bg-gradient-to-r from-[#8451E1] to-[#a855f7] bg-clip-text text-transparent break-words">{formatCurrency(metrics?.totalRevenue || 0, { truncate: true })}</p>
                </div>
                <div className="bg-gradient-to-br from-[#8451E1]/30 to-[#733AD4]/10 p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0">
                  <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-[#8451E1]" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs sm:text-sm font-semibold">{(metrics?.revenueChange ?? 0) > 0 ? '+' : ''}{(metrics?.revenueChange ?? 0).toFixed(1)}%</span>
              </div>
            </motion.div>

            {/* Orders Card */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="group backdrop-blur-xl bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/20 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-blue-500/40 transition-all duration-300 cursor-pointer min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[220px] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-blue-300 text-xs sm:text-sm md:text-base font-medium mb-1 sm:mb-2 md:mb-3">Total Orders</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent break-words">{metrics?.totalOrders}</p>
                </div>
                <div className="bg-gradient-to-br from-blue-500/30 to-blue-600/10 p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-blue-300" />
                </div>
              </div>
              <div className="flex items-center gap-2 mt-3 sm:mt-4">
                <TrendingUp className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-400 text-xs sm:text-sm font-semibold">{(metrics?.ordersChange ?? 0) > 0 ? '+' : ''}{(metrics?.ordersChange ?? 0).toFixed(1)}%</span>
              </div>
            </motion.div>

            {/* Average Order Value Card */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="group backdrop-blur-xl bg-gradient-to-br from-amber-600/20 to-amber-900/10 border border-amber-500/20 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-amber-500/40 transition-all duration-300 cursor-pointer min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[220px] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-amber-300 text-xs sm:text-sm md:text-base font-medium mb-1 sm:mb-2 md:mb-3">Avg Order Value</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold bg-gradient-to-r from-amber-200 to-yellow-200 bg-clip-text text-transparent break-words">{formatCurrency(metrics?.averageOrderValue || 0, { truncate: true })}</p>
                </div>
                <div className="bg-gradient-to-br from-amber-500/30 to-amber-600/10 p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0">
                  <BarChart3 className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-amber-300" />
                </div>
              </div>
              <div className="text-amber-300/80 text-xs font-medium mt-3 sm:mt-4">Per transaction average</div>
            </motion.div>

            {/* Customer Satisfaction Card */}
            <motion.div
              whileHover={{ y: -8 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="group backdrop-blur-xl bg-gradient-to-br from-emerald-600/20 to-emerald-900/10 border border-emerald-500/20 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-emerald-500/40 transition-all duration-300 cursor-pointer min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[220px] flex flex-col justify-between"
            >
              <div className="flex justify-between items-start gap-2 sm:gap-3 md:gap-4">
                <div className="flex-1 min-w-0">
                  <p className="text-emerald-300 text-xs sm:text-sm md:text-base font-medium mb-1 sm:mb-2 md:mb-3">Satisfaction Rate</p>
                  <p className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold bg-gradient-to-r from-emerald-200 to-teal-200 bg-clip-text text-transparent break-words">{(metrics?.customerSatisfaction ?? 0).toFixed(1)}%</p>
                </div>
                <div className="bg-gradient-to-br from-emerald-500/30 to-emerald-600/10 p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0">
                  <Star className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-emerald-300" />
                </div>
              </div>
              <div className="text-emerald-300/80 text-xs font-medium mt-3 sm:mt-4">Based on {metrics?.customerReviews.length || 0} reviews</div>
            </motion.div>

            {/* Funds in Escrow Card */}
            <EscrowBalanceCard />
          </motion.div>

          {/* Charts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 md:gap-6 mb-6 sm:mb-8"
          >
            {/* Revenue Trend Chart */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-white/20 transition-all duration-300 cursor-pointer">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-[#8451E1] to-[#a855f7] bg-clip-text text-transparent mb-3 sm:mb-4 md:mb-6">Revenue Trend</h2>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                  <YAxis stroke="rgba(255,255,255,0.5)" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }}
                    labelStyle={{ color: '#fff' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#8451E1"
                    strokeWidth={3}
                    dot={{ fill: '#8451E1', r: 5 }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Rating Distribution Chart */}
            <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-white/20 transition-all duration-300 cursor-pointer">
              <h2 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold bg-gradient-to-r from-emerald-200 to-cyan-200 bg-clip-text text-transparent mb-3 sm:mb-4 md:mb-6">Rating Distribution</h2>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={ratingData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}`}
                    outerRadius={80}
                    fill="#8451E1"
                    dataKey="value"
                  >
                    {ratingData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={RATING_COLORS[index % RATING_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Bottom Row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
          >
            {/* Inventory Alerts */}
            <div className="lg:col-span-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-white/20 transition-all duration-300 cursor-pointer">
              <h2 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-red-200 to-orange-200 bg-clip-text text-transparent mb-3 sm:mb-4">Inventory Alerts</h2>
              <div className="space-y-3">
                {metrics?.inventoryAlerts.length === 0 ? (
                  <p className="text-slate-300 text-sm">✓ All stock levels normal</p>
                ) : (
                  metrics?.inventoryAlerts.map((alert, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }} className="bg-gradient-to-r from-red-500/10 to-red-600/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border-l-4 border-red-500/50 cursor-pointer">
                      <p className="text-xs sm:text-sm font-semibold text-red-300">{alert.name}</p>
                      <p className="text-xs text-red-300/90 mt-0.5 sm:mt-1">Stock: {alert.currentStock} / Min: {alert.minStock}</p>
                    </motion.div>
                  ))
                )}
              </div>
            </div>

            {/* Trending Products */}
            <div className="lg:col-span-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-white/20 transition-all duration-300 cursor-pointer">
              <h2 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-blue-200 to-cyan-200 bg-clip-text text-transparent mb-3 sm:mb-4">Top Products</h2>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart
                  data={topProducts}
                  layout="vertical"
                  margin={{ top: 5, right: 20, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis type="number" stroke="rgba(255,255,255,0.5)" />
                  <YAxis dataKey="name" type="category" width={75} stroke="rgba(255,255,255,0.5)" />
                  <Tooltip contentStyle={{ backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px' }} />
                  <Bar dataKey="revenue" fill="#3b82f6" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Recent Reviews */}
            <div className="lg:col-span-1 backdrop-blur-xl bg-white/5 border border-white/10 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-white/20 transition-all duration-300 cursor-pointer">
              <h2 className="text-sm sm:text-base md:text-lg font-bold bg-gradient-to-r from-yellow-200 to-amber-200 bg-clip-text text-transparent mb-3 sm:mb-4">Recent Reviews</h2>
              <div className="space-y-4">
                {metrics?.customerReviews.slice(0, 5).map((review, i) => (
                  <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="bg-gradient-to-r from-yellow-500/10 to-amber-500/5 p-3 sm:p-4 rounded-lg sm:rounded-xl border border-yellow-500/20 cursor-pointer">
                    <div className="flex items-start justify-between mb-2 gap-2">
                      <p className="font-semibold text-yellow-200 text-xs sm:text-sm">{review.customerName || 'Anonymous'}</p>
                      <div className="flex gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${
                              i < review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-600'
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-yellow-200/90 line-clamp-2">{review.comment}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}

/**
 * Escrow Balance Card Component
 * Displays funds currently held in escrow and active holds
 */
function EscrowBalanceCard() {
  const { data: escrowData, isLoading } = api.escrow.getSellerEscrowBalance.useQuery(
    { currency: 'NGN' },
    { enabled: true }
  );

  const { data: activeHolds } = api.escrow.getSellerActiveHolds.useQuery(
    { currency: 'NGN' },
    { enabled: true }
  );

  const escrowBalance = (escrowData?.balanceCents || 0) / 100;

  if (isLoading) {
    return (
      <motion.div
        whileHover={{ y: -8 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="group backdrop-blur-xl bg-gradient-to-br from-amber-600/20 to-amber-900/10 border border-amber-500/20 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-amber-500/40 transition-all duration-300 cursor-pointer min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[220px]"
      >
        <div className="animate-pulse space-y-3 sm:space-y-4">
          <div className="h-4 bg-amber-500/20 rounded w-1/2"></div>
          <div className="h-8 bg-amber-500/20 rounded w-3/4"></div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -8 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      className="group backdrop-blur-xl bg-gradient-to-br from-amber-600/20 to-orange-900/10 border border-amber-500/20 rounded-lg sm:rounded-xl md:rounded-2xl p-3 sm:p-4 md:p-5 lg:p-6 shadow-xl hover:border-amber-500/40 transition-all duration-300 cursor-pointer min-h-[160px] sm:min-h-[180px] md:min-h-[200px] lg:min-h-[220px] flex flex-col justify-between"
    >
      {/* Header with icon */}
      <div className="flex justify-between items-start gap-2 sm:gap-3 md:gap-4 mb-3 sm:mb-4">
        <div className="flex-1 min-w-0">
          <p className="text-amber-300 text-xs sm:text-sm md:text-base font-medium mb-1 sm:mb-2 md:mb-3">💰 Funds in Escrow</p>
          <p className="text-base sm:text-lg md:text-xl lg:text-3xl font-bold bg-gradient-to-r from-amber-200 to-orange-200 bg-clip-text text-transparent break-words">
            {formatCurrency(escrowBalance * 100, { truncate: true })}
          </p>
        </div>
        <div className="bg-gradient-to-br from-amber-500/30 to-orange-600/10 p-2 sm:p-2.5 md:p-3 rounded-lg md:rounded-xl flex-shrink-0">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 text-amber-300" />
        </div>
      </div>

      {/* Active holds info */}
      <div className="pt-3 sm:pt-4 border-t border-amber-500/20">
        <div className="space-y-1.5 sm:space-y-2 max-h-24 overflow-y-auto">
          {(!activeHolds || activeHolds.length === 0) ? (
            <p className="text-xs text-amber-300/70">✓ No active escrow holds</p>
          ) : (
            <>
              <p className="text-xs font-semibold text-amber-300 mb-2">
                {activeHolds.length} Active Hold{activeHolds.length !== 1 ? 's' : ''}
              </p>
              {activeHolds.slice(0, 2).map((hold) => (
                <div key={hold.holdId} className="text-xs bg-amber-500/10 p-2 rounded border border-amber-500/20">
                  <div className="flex justify-between items-center">
                    <span className="text-amber-200 font-medium">
                      Order {hold.orderId.slice(0, 8)}
                    </span>
                    <span className="text-amber-300 font-semibold">
                      {formatCurrency(hold.amountCents, { truncate: true })}
                    </span>
                  </div>
                  <p className="text-amber-300/70 mt-1">
                    Releases in {hold.daysRemaining} days
                  </p>
                </div>
              ))}
              {activeHolds.length > 2 && (
                <p className="text-xs text-amber-300/70 pt-1 italic">
                  +{activeHolds.length - 2} more hold{activeHolds.length - 2 !== 1 ? 's' : ''}
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Info tooltip */}
      <div className="mt-3 sm:mt-4 pt-3 sm:pt-4 border-t border-amber-500/20">
        <p className="text-xs text-amber-300/70 flex items-start gap-1.5 sm:gap-2">
          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
          <span>Auto-releases to your account after 30 days</span>
        </p>
      </div>
    </motion.div>
  );
}