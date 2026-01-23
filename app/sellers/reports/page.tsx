"use client"

import { useState } from "react"
import { BarChart3, TrendingUp, Calendar, Download, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { trpc } from "@/lib/trpc"
import { formatCurrency } from "@/lib/utils"

interface SalesMetrics {
  totalSales: number
  totalRevenue: number
  averageOrderValue: number
  conversionRate: number
}

const generateMetrics = (orders: any[]): SalesMetrics => {
  const totalSales = orders.length
  const totalRevenue = orders.reduce((sum, order) => sum + (order.amountCents || 0), 0)
  const averageOrderValue = totalSales > 0 ? totalRevenue / totalSales : 0

  return {
    totalSales,
    totalRevenue,
    averageOrderValue,
    conversionRate: 0, // Would need visitor data
  }
}

export default function Reports() {
  const [timeRange, setTimeRange] = useState("all")
  const [orderStatus, setOrderStatus] = useState("all")

  // Fetch all sales data
  const { data: allSalesData = [], isLoading } = (trpc.sales as any).getAllSales.useQuery({ status: "all" })
  const { data: listingsData = [] } = (trpc.listing as any).getMyListings.useQuery({})

  // Calculate metrics
  const metrics = generateMetrics(allSalesData)

  // Filter orders by status
  const filteredOrders = orderStatus === "all" ? allSalesData : allSalesData.filter((o: any) => o.orderStatus === orderStatus)

  // Group orders by date for revenue trend
  const getRevenueByDate = () => {
    const grouped: { [key: string]: number } = {}
    filteredOrders.forEach((order: any) => {
      const date = new Date(order.orderDate).toLocaleDateString()
      grouped[date] = (grouped[date] || 0) + (order.amountCents || 0)
    })
    return Object.entries(grouped).map(([date, amount]) => ({ date, amount }))
  }

  const revenueByDate = getRevenueByDate()

  // Get top selling products
  const getTopProducts = () => {
    const productSales: { [key: string]: { title: string; count: number; revenue: number } } = {}
    filteredOrders.forEach((order: any) => {
      if (!productSales[order.productTitle]) {
        productSales[order.productTitle] = { title: order.productTitle, count: 0, revenue: 0 }
      }
      productSales[order.productTitle].count += 1
      productSales[order.productTitle].revenue += order.amountCents || 0
    })
    return Object.values(productSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5)
  }

  const topProducts = getTopProducts()

  return (
    <div className="pt-16 px-6 md:pt-0">
      {/* Header */}
      <div className="mb-6 md:max-lg:pt-10">
        <h1 className="text-2xl font-semibold">Reports & Analytics</h1>
        <p className="text-gray-400 mt-1">View detailed reports and analytics for your store.</p>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6 flex-wrap">
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-40 bg-[#1a1a1a] border-[#333]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#333]">
            <SelectItem value="all">All Time</SelectItem>
            <SelectItem value="30days">Last 30 Days</SelectItem>
            <SelectItem value="7days">Last 7 Days</SelectItem>
            <SelectItem value="today">Today</SelectItem>
          </SelectContent>
        </Select>
        <Select value={orderStatus} onValueChange={setOrderStatus}>
          <SelectTrigger className="w-40 bg-[#1a1a1a] border-[#333]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-[#1a1a1a] border-[#333]">
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="shipped">Shipped</SelectItem>
            <SelectItem value="delivered">Delivered</SelectItem>
            <SelectItem value="canceled">Canceled</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="border-[#333]">
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Total Sales</p>
          <p className="text-3xl font-bold">{metrics.totalSales}</p>
          <p className="text-xs text-green-400 mt-2">+12% from last month</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Total Revenue</p>
          <p className="text-3xl font-bold">{formatCurrency(metrics.totalRevenue, "NGN")}</p>
          <p className="text-xs text-green-400 mt-2">+8% from last month</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Avg Order Value</p>
          <p className="text-3xl font-bold">{formatCurrency(metrics.averageOrderValue, "NGN")}</p>
          <p className="text-xs text-yellow-400 mt-2">-2% from last month</p>
        </div>
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <p className="text-gray-400 text-sm mb-2">Active Products</p>
          <p className="text-3xl font-bold">{listingsData.length}</p>
          <p className="text-xs text-blue-400 mt-2">{listingsData.length} listings</p>
        </div>
      </div>

      {/* Revenue and Products */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Revenue Trend */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Revenue Trend
          </h3>
          {revenueByDate.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No sales data available</p>
          ) : (
            <div className="space-y-3">
              {revenueByDate.slice(-7).map((item: any, idx: number) => {
                const maxAmount = Math.max(...revenueByDate.map((x: any) => x.amount))
                const percentage = (item.amount / maxAmount) * 100
                return (
                  <div key={idx}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-gray-300">{item.date}</span>
                      <span className="font-medium">{formatCurrency(item.amount, "NGN")}</span>
                    </div>
                    <div className="w-full bg-[#242424] rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-purple-600 to-purple-400 h-2 rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Top Products */}
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-blue-400" />
            Top Selling Products
          </h3>
          {topProducts.length === 0 ? (
            <p className="text-gray-400 text-center py-8">No sales data available</p>
          ) : (
            <div className="space-y-4">
              {topProducts.map((product: any, idx: number) => (
                <div key={idx} className="border-b border-[#333] pb-3 last:border-b-0">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium text-gray-200">{idx + 1}. {product.title}</p>
                      <p className="text-sm text-gray-400">{product.count} orders</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(product.revenue, "NGN")}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Sales by Status */}
      <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6 mt-6">
        <h3 className="text-lg font-semibold mb-4">Orders by Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { status: "confirmed", label: "Confirmed", color: "bg-green-900/20 text-green-400" },
            { status: "shipped", label: "Shipped", color: "bg-blue-900/20 text-blue-400" },
            { status: "delivered", label: "Delivered", color: "bg-purple-900/20 text-purple-400" },
            { status: "canceled", label: "Canceled", color: "bg-red-900/20 text-red-400" },
          ].map((item) => {
            const count = allSalesData.filter((o: any) => o.orderStatus === item.status).length
            return (
              <div key={item.status} className={`${item.color} rounded-lg p-4 text-center`}>
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-sm mt-1">{item.label}</p>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}