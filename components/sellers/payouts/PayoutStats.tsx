"use client";

import { BarChart3, TrendingUp } from "lucide-react";

export function PayoutStats() {
  // Sample data for the chart
  const chartData = [
    { month: "Jan", amount: 12000 },
    { month: "Feb", amount: 19000 },
    { month: "Mar", amount: 15000 },
    { month: "Apr", amount: 25000 },
    { month: "May", amount: 22000 },
    { month: "Jun", amount: 28000 },
  ];

  const maxAmount = Math.max(...chartData.map((d) => d.amount));

  const revenueBreakdown = [
    { name: "Product Sales", amount: "₦950,000", percentage: 65, color: "bg-purple-600" },
    { name: "Digital Services", amount: "₦380,000", percentage: 26, color: "bg-blue-600" },
    { name: "Consulting", amount: "₦120,000", percentage: 9, color: "bg-green-600" },
  ];

  return (
    <div className="space-y-6">
      {/* Earnings Chart */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-white">Earnings Overview</h3>
          <div className="flex items-center gap-2 text-green-400">
            <TrendingUp size={20} />
            <span className="text-sm font-medium">+15.3%</span>
          </div>
        </div>

        {/* Chart */}
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

        {/* Legend */}
        <div className="flex items-center gap-4 text-sm text-gray-400 pt-4 border-t border-[#2a2a2a]">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-purple-600 rounded-full"></div>
            <span>Monthly Earnings</span>
          </div>
        </div>
      </div>

      {/* Revenue Breakdown */}
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

        {/* Performance Metrics */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
          <h3 className="text-lg font-semibold text-white mb-6">Performance Metrics</h3>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Average Order Value</p>
                <p className="text-xl font-bold text-white mt-1">₦8,450</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-400">↑ 12%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Total Orders</p>
                <p className="text-xl font-bold text-white mt-1">342</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-400">↑ 8%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Conversion Rate</p>
                <p className="text-xl font-bold text-white mt-1">3.2%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-red-400">↓ 2%</p>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-[#0a0a0a] rounded-lg">
              <div>
                <p className="text-sm text-gray-400">Refund Rate</p>
                <p className="text-xl font-bold text-white mt-1">0.8%</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-green-400">↓ 0.3%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions Summary */}
      <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-6">
        <h3 className="text-lg font-semibold text-white mb-6">Quick Summary</h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-[#0a0a0a] rounded-lg">
            <p className="text-xs text-gray-400 mb-2">This Month</p>
            <p className="text-xl font-bold text-white">₦128,000</p>
          </div>
          <div className="p-4 bg-[#0a0a0a] rounded-lg">
            <p className="text-xs text-gray-400 mb-2">Last Month</p>
            <p className="text-xl font-bold text-white">₦115,000</p>
          </div>
          <div className="p-4 bg-[#0a0a0a] rounded-lg">
            <p className="text-xs text-gray-400 mb-2">This Year</p>
            <p className="text-xl font-bold text-white">₦1.2M</p>
          </div>
          <div className="p-4 bg-[#0a0a0a] rounded-lg">
            <p className="text-xs text-gray-400 mb-2">All Time</p>
            <p className="text-xl font-bold text-white">₦3.8M</p>
          </div>
        </div>
      </div>
    </div>
  );
}