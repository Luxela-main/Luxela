"use client";

import { usePayoutStats, usePayoutHistory } from "@/modules/seller/queries";
import { usePayoutRealtimeUpdates } from "@/modules/seller/hooks";
import { BarChart3, TrendingUp, Loader } from "lucide-react";

export function PayoutStats() {
  const { isConnected } = usePayoutRealtimeUpdates({ enabled: true });
  
  const { data: payoutStats, isLoading: statsLoading } = usePayoutStats();
  const { data: payoutHistory = [], isLoading: historyLoading } = usePayoutHistory();

  const generateChartData = () => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const now = new Date();
    const chartData = months.map((month, idx) => {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
      const monthTransactions = (payoutHistory || []).filter((tx) => {
        const txDate = new Date(tx.date);
        return txDate.getMonth() === monthDate.getMonth() && txDate.getFullYear() === monthDate.getFullYear();
      });
      const total = monthTransactions.reduce((sum, tx) => sum + (typeof tx.amount === 'string' ? parseFloat(tx.amount) : (tx as any).amountCents / 100), 0);
      return { month, amount: total };
    });
    return chartData;
  };

  const chartData = generateChartData();
  const maxAmount = Math.max(...chartData.map((d) => d.amount), 1);

  const calculateBreakdown = () => {
    const breakdown: Record<string, number> = {};
    (payoutHistory || []).forEach((tx) => {
      const type = (tx as any).type || 'other';
      const amount = typeof tx.amount === 'string' ? parseFloat(tx.amount) : (tx as any).amountCents / 100;
      breakdown[type] = (breakdown[type] || 0) + amount;
    });
    const total = Object.values(breakdown).reduce((a, b) => a + b, 0) || 1;
    return [
      { name: "Sales", amount: `₦${(breakdown.income || 0).toLocaleString()}`, percentage: Math.round((breakdown.income || 0) / total * 100), color: "bg-purple-600" },
      { name: "Refunds", amount: `₦${(breakdown.refund || 0).toLocaleString()}`, percentage: Math.round((breakdown.refund || 0) / total * 100), color: "bg-red-600" },
      { name: "Adjustments", amount: `₦${(breakdown.adjustment || 0).toLocaleString()}`, percentage: Math.round((breakdown.adjustment || 0) / total * 100), color: "bg-blue-600" },
    ];
  };

  const revenueBreakdown = calculateBreakdown();

  return (
    <div className="space-y-6">
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-semibold text-white">Earnings Overview</h3>
            {isConnected && <span className="text-xs px-2 py-1 bg-green-600/20 text-green-400 rounded-full">● Live</span>}
          </div>
          <div className="flex items-center gap-2 text-green-400">
            {statsLoading || historyLoading ? (
              <Loader size={20} className="animate-spin" />
            ) : (
              <>
                <TrendingUp size={20} />
                <span className="text-sm font-medium">{payoutStats?.monthlyGrowthPercentage ? `+${payoutStats.monthlyGrowthPercentage.toFixed(1)}%` : '0%'}</span>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-end justify-between gap-3 h-64">
            {chartData.map((data, index) => (
              <div
                key={index}
                className="flex-1 flex flex-col items-center justify-end gap-2"
              >
                <div
                  className="w-full bg-gradient-to-t from-purple-600 to-purple-500 rounded-t-lg hover:from-purple-500 hover:to-purple-400 transition-all duration-200 cursor-pointer group relative"
                  style={{
                    height: `${(data.amount / maxAmount) * 100}%`,
                  }}
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    ₦{(data.amount / 1000).toFixed(0)}k
                  </div>
                </div>
                <span className="text-xs text-gray-400">{data.month}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-4 text-sm text-gray-400 pt-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <span>Monthly Earnings</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <BarChart3 size={20} className="text-purple-400" />
            Revenue Breakdown
          </h3>

          <div className="space-y-4">
            {revenueBreakdown.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-300">{item.name}</span>
                  <span className="text-sm font-semibold text-white">{item.amount}</span>
                </div>
                <div className="w-full bg-[#0a0a0a] rounded-full h-2">
                  <div
                    className={`h-full rounded-full ${item.color} transition-all duration-300`}
                    style={{ width: `${item.percentage}%` }}
                  ></div>
                </div>
                <span className="text-xs text-gray-500 mt-1">{item.percentage}%</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Performance Metrics</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Available Balance</p>
                <p className="text-xl font-bold text-white mt-1">₦{(payoutStats?.availableBalance || 0).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-400">Ready</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Total Paid Out</p>
                <p className="text-xl font-bold text-white mt-1">₦{(payoutStats?.totalPaidOut || 0).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-400">✓ Completed</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Pending Payouts</p>
                <p className="text-xl font-bold text-white mt-1">₦{(payoutStats?.pendingPayouts || 0).toLocaleString()}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-yellow-400">⏳ Processing</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Monthly Growth</p>
                <p className="text-xl font-bold text-white mt-1">{payoutStats?.monthlyGrowthPercentage ? `+${payoutStats.monthlyGrowthPercentage.toFixed(1)}%` : '0%'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-blue-400">📈 Trend</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Quick Summary</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#0a0a0a] rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Available</p>
            <p className="text-xl font-bold text-white">₦{(payoutStats?.availableBalance || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-[#0a0a0a] rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Pending</p>
            <p className="text-xl font-bold text-white">₦{(payoutStats?.pendingPayouts || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-[#0a0a0a] rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Paid Out</p>
            <p className="text-xl font-bold text-white">₦{(payoutStats?.totalPaidOut || 0).toLocaleString()}</p>
          </div>
          <div className="p-4 bg-[#0a0a0a] rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Total Earnings</p>
            <p className="text-xl font-bold text-white">₦{((payoutStats?.availableBalance || 0) + (payoutStats?.pendingPayouts || 0) + (payoutStats?.totalPaidOut || 0)).toLocaleString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
}