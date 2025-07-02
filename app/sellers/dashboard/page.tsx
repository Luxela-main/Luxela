"use client"

import type React from "react"
import withAuth from "@/app/hoc/withAuth"

import { useState } from "react"
import { Wallet, ShoppingBag, Package, RefreshCcw, Shirt } from "lucide-react"
import SearchBar from "@/components/search-bar"
import { dashboardData } from "@/lib/data"
import { Button } from "@/components/ui/button"

function Dashboard() {
  const [timeframe, setTimeframe] = useState("Month")
  const [visitorTimeframe, setVisitorTimeframe] = useState("Month")
  const [search, setSearch] = useState('')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold">Dashboard</h1>
          <p className="text-gray-400 mt-1">
            Monitor your sales, track payouts, and manage your listings—all in one place
          </p>
        </div>
        <div className="w-80">
          <SearchBar search={search} setSearch={setSearch} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          title="Total Revenue"
          value={dashboardData.stats.totalRevenue.value}
          change={dashboardData.stats.totalRevenue.change}
          changeType={dashboardData.stats.totalRevenue.changeType}
          subtext={dashboardData.stats.totalRevenue.subtext}
          icon={<Wallet className="h-5 w-5" />}
        />
        <StatCard
          title="Total Sales"
          value={dashboardData.stats.totalSales.value}
          change={dashboardData.stats.totalSales.change}
          changeType={dashboardData.stats.totalSales.changeType}
          subtext={dashboardData.stats.totalSales.subtext}
          icon={<ShoppingBag className="h-5 w-5" />}
        />
        <StatCard
          title="Total Orders"
          value={dashboardData.stats.totalOrders.value}
          change={dashboardData.stats.totalOrders.change}
          changeType={dashboardData.stats.totalOrders.changeType}
          subtext={dashboardData.stats.totalOrders.subtext}
          icon={<Package className="h-5 w-5" />}
        />
        <StatCard
          title="Refunded"
          value={dashboardData.stats.refunded.value}
          change={dashboardData.stats.refunded.change}
          changeType={dashboardData.stats.refunded.changeType}
          subtext={dashboardData.stats.refunded.subtext}
          icon={<RefreshCcw className="h-5 w-5" />}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Revenue Report</h3>
            <div className="flex items-center">
              <div className="flex items-center mr-4">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                <span className="text-sm text-gray-400">Income</span>
              </div>
              <Button variant="outline" className="bg-[#222] border-[#333] text-white hover:bg-[#333] hover:text-white">
                {timeframe}
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  className="ml-2"
                >
                  <path
                    d="M6 9L12 15L18 9"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Button>
            </div>
          </div>
          <div className="h-64 relative">
            <div className="absolute inset-0 flex items-end">
              {dashboardData.revenueReport.map((item, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-6 bg-blue-500 rounded-t"
                    style={{
                      height: `${(item.income / 110000) * 100}%`,
                    }}
                  ></div>
                  <span className="text-xs text-gray-400 mt-2">{item.month}</span>
                </div>
              ))}
            </div>
            <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-right pr-2">
              <span className="text-xs text-gray-400">400k</span>
              <span className="text-xs text-gray-400">350k</span>
              <span className="text-xs text-gray-400">300k</span>
              <span className="text-xs text-gray-400">250k</span>
              <span className="text-xs text-gray-400">200k</span>
              <span className="text-xs text-gray-400">150k</span>
              <span className="text-xs text-gray-400">100k</span>
              <span className="text-xs text-gray-400">50k</span>
              <span className="text-xs text-gray-400">10k</span>
              <span className="text-xs text-gray-400">0</span>
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] rounded-lg p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Visitors Traffic</h3>
            <Button variant="outline" className="bg-[#222] border-[#333] text-white hover:bg-[#333] hover:text-white">
              {visitorTimeframe}
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="ml-2"
              >
                <path
                  d="M6 9L12 15L18 9"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Button>
          </div>
          <div className="flex justify-center">
            <div className="relative w-48 h-48">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#333"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset="0"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#3B82F6"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 30) / 100}
                  transform="rotate(-90 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#B8A179"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 40) / 100}
                  transform="rotate(30 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#9CA3AF"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 20) / 100}
                  transform="rotate(174 50 50)"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="transparent"
                  stroke="#FFC0CB"
                  strokeWidth="20"
                  strokeDasharray="251.2"
                  strokeDashoffset={251.2 - (251.2 * 10) / 100}
                  transform="rotate(246 50 50)"
                />
              </svg>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {dashboardData.visitorTraffic.map((item, index) => (
              <div key={index} className="flex items-center">
                <div
                  className={`w-3 h-3 rounded-full mr-2 ${index === 0
                    ? "bg-blue-500"
                    : index === 1
                      ? "bg-[#B8A179]"
                      : index === 2
                        ? "bg-gray-400"
                        : "bg-pink-200"
                    }`}
                ></div>
                <span className="text-sm text-gray-400">
                  {item.source} <span className="ml-1">{item.percentage}%</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-[#1a1a1a] rounded-lg overflow-hidden">
        <div className="flex justify-between items-center p-4">
          <h3 className="text-lg font-medium">Top Selling Product</h3>
          <Button variant="outline" className="bg-transparent border-[#333] hover:bg-[#222] hover:text-white text-sm">
            View All
          </Button>
        </div>
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-[#333] text-gray-400 text-sm">
          <div className="flex items-center">
            <input
              type="checkbox"
              className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
            />
            <span>Product Name</span>
          </div>
          <div>Category</div>
          <div>Price</div>
          <div>Quantity sold</div>
          <div>Status</div>
          <div>Action</div>
        </div>

        {dashboardData.topSellingProducts.map((product, index) => (
          <div key={index} className="border-b border-[#333]">
            <div className="grid grid-cols-6 gap-4 p-4 items-center">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  className="mr-3 h-4 w-4 rounded border-gray-600 text-purple-600 focus:ring-purple-500"
                />
                <div className="flex items-center">
                  <div className="bg-[#222] p-1 rounded-md mr-2">
                    <Shirt className="h-5 w-5" />
                  </div>
                  <span>{product.name}</span>
                </div>
              </div>
              <div>{product.category}</div>
              <div>{product.price}</div>
              <div>{product.quantitySold}</div>
              <div>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${product.status === "In stock"
                    ? "bg-green-100 text-green-800"
                    : product.status === "Low stock"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-red-100 text-red-800"
                    }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full mr-1 ${product.status === "In stock"
                      ? "bg-green-600"
                      : product.status === "Low stock"
                        ? "bg-yellow-600"
                        : "bg-red-600"
                      }`}
                  ></span>
                  {product.status}
                </span>
              </div>
              <div>
                <Button
                  variant="outline"
                  className="bg-transparent border-[#333] hover:bg-[#222] hover:text-white text-sm"
                >
                  View
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center mt-6 text-sm">
        <div className="text-gray-400">Result 1 - 5 of 15</div>
        <div className="flex space-x-2">
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md flex items-center">
            <span className="mr-1">Previous</span>
          </button>
          <button className="bg-purple-600 text-white px-3 py-1 rounded-md">1</button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md">2</button>
          <button className="text-gray-400 px-3 py-1">...</button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md">4</button>
          <button className="border border-[#333] text-gray-400 px-3 py-1 rounded-md flex items-center">
            <span className="mr-1">Next</span>
          </button>
        </div>
      </div>
    </div>
  )
}

interface StatCardProps {
  title: string
  value: string
  change: string
  changeType: "positive" | "negative" | "neutral"
  subtext: string
  icon: React.ReactNode
}

function StatCard({ title, value, change, changeType, subtext, icon }: StatCardProps) {
  const changeColor =
    changeType === "positive" ? "text-green-500" : changeType === "negative" ? "text-red-500" : "text-green-500"

  return (
    <div className="bg-[#1a1a1a] rounded-lg p-4">
      <div className="flex items-center mb-4">
        <div className="bg-[#222] p-2 rounded-md">{icon}</div>
        <span className="ml-2 text-sm text-gray-400">{title}</span>
      </div>
      <div className="mb-2">
        <span className="text-2xl font-bold">{value}</span>
      </div>
      <div className="flex items-center text-xs">
        <span className={changeColor}>{change}</span>
        <span className="ml-2 text-gray-400">{subtext}</span>
      </div>
    </div>
  )
}


export default withAuth(Dashboard)
