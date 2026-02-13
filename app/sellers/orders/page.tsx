"use client"

import { useState, useMemo } from "react"
import { ShoppingBag, TrendingUp, Clock, Truck, CheckCircle, AlertCircle, Loader, RotateCw } from "lucide-react"
import Link from "next/link"
import { formatCurrency } from "@/lib/utils"
import { useSellerOrders } from "@/modules/sellers/queries/useSellerOrders"
import { useSellerOrderPolling } from "@/modules/sellers/hooks/useSellerOrderPolling"
import { toastSvc } from "@/services/toast"
import EmptyState from "@/components/empty-state"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import SearchBar from "@/components/search-bar"
import { Sale } from "@/modules/seller/queries/useSales"

const ORDER_STATUSES = {
  pending: { label: "Pending", color: "bg-gray-900/30 text-gray-200 border-gray-700/30", icon: Clock },
  confirmed: { label: "Confirmed", color: "bg-blue-900/30 text-blue-200 border-blue-700/30", icon: CheckCircle },
  processing: { label: "Processing", color: "bg-yellow-900/30 text-yellow-200 border-yellow-700/30", icon: TrendingUp },
  shipped: { label: "Shipped", color: "bg-purple-900/30 text-purple-200 border-purple-700/30", icon: Truck },
  delivered: { label: "Delivered", color: "bg-green-900/30 text-green-200 border-green-700/30", icon: CheckCircle },
  canceled: { label: "Canceled", color: "bg-red-900/30 text-red-200 border-red-700/30", icon: AlertCircle },
}

interface OrderStats {
  total: number
  pending: number
  confirmed: number
  processing: number
  shipped: number
  delivered: number
  totalRevenue: number
}

export default function SellerOrdersHub() {
  const [search, setSearch] = useState("")
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null)

  const { data: orders = [], isLoading, error } = useSellerOrders({ limit: 100, offset: 0 })
  const [isPollingActive, setIsPollingActive] = useState(true)
  useSellerOrderPolling({ enabled: isPollingActive, interval: 30000 })

  const stats = useMemo<OrderStats>(() => {
    if (!orders.length)
      return { total: 0, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, totalRevenue: 0 }

    return {
      total: orders.length,
      pending: orders.filter((o) => o.orderStatus === "pending").length,
      confirmed: orders.filter((o) => o.orderStatus === "confirmed").length,
      processing: orders.filter((o) => o.orderStatus === "processing").length,
      shipped: orders.filter((o) => o.orderStatus === "shipped").length,
      delivered: orders.filter((o) => o.orderStatus === "delivered").length,
      totalRevenue: orders.reduce((sum, o) => sum + o.amountCents, 0),
    }
  }, [orders])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        search === "" ||
        order.orderId?.toLowerCase().includes(search.toLowerCase()) ||
        order.product?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer?.toLowerCase().includes(search.toLowerCase())

      const matchesStatus = selectedStatus === null || order.orderStatus === selectedStatus

      return matchesSearch && matchesStatus
    })
  }, [orders, search, selectedStatus])

  if (error) {
    return (
      <div className="px-4 md:px-6 mt-4 md:mt-0">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 flex items-center gap-3 text-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load orders</h3>
            <p className="text-sm text-red-200/80 mt-1">Please try refreshing the page or contact support.</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 md:px-6 mt-4 md:mt-0">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Order Management</h1>
        <p className="text-gray-400">Track and manage all your orders in one place</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8">
        <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase mb-3 font-medium">Total Orders</p>
          <p className="text-2xl font-bold text-white">{stats.total}</p>
          <p className="text-xs text-gray-400 mt-2">All time</p>
        </div>

        <div className="bg-[#1a1a1a] border border-gray-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase font-medium">Pending</p>
            <Clock className="h-4 w-4 text-gray-500" />
          </div>
          <p className="text-2xl font-bold text-gray-200">{stats.pending}</p>
          <Link href="/sellers/orders/pending">
            <Button size="sm" variant="ghost" className="mt-2 text-xs text-blue-400 p-0 h-auto cursor-pointer">
              View →
            </Button>
          </Link>
        </div>

        <div className="bg-[#1a1a1a] border border-blue-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase font-medium">Confirmed</p>
            <CheckCircle className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-2xl font-bold text-blue-200">{stats.confirmed}</p>
          <Link href="/sellers/orders/confirmed">
            <Button size="sm" variant="ghost" className="mt-2 text-xs text-blue-400 p-0 h-auto cursor-pointer">
              View →
            </Button>
          </Link>
        </div>

        <div className="bg-[#1a1a1a] border border-yellow-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase font-medium">Processing</p>
            <TrendingUp className="h-4 w-4 text-yellow-500" />
          </div>
          <p className="text-2xl font-bold text-yellow-200">{stats.processing}</p>
          <Link href="/sellers/orders/processing">
            <Button size="sm" variant="ghost" className="mt-2 text-xs text-blue-400 p-0 h-auto cursor-pointer">
              View →
            </Button>
          </Link>
        </div>

        <div className="bg-[#1a1a1a] border border-purple-700/30 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-500 uppercase font-medium">Shipped</p>
            <Truck className="h-4 w-4 text-purple-500" />
          </div>
          <p className="text-2xl font-bold text-purple-200">{stats.shipped}</p>
          <Link href="/sellers/orders/shipped">
            <Button size="sm" variant="ghost" className="mt-2 text-xs text-blue-400 p-0 h-auto cursor-pointer">
              View →
            </Button>
          </Link>
        </div>

        <div className="bg-[#1a1a1a] border border-green-700/30 rounded-lg p-4">
          <p className="text-xs text-gray-500 uppercase mb-3 font-medium">Total Revenue</p>
          <p className="text-2xl font-bold text-green-200">{formatCurrency(stats.totalRevenue, { currency: "NGN", truncate: true })}</p>
          <p className="text-xs text-gray-400 mt-2">From delivered</p>
        </div>
      </div>

      <div className="mb-6 flex flex-col md:flex-row gap-4">
        <div className="w-full md:w-80">
          <SearchBar search={search} setSearch={setSearch} />
        </div>

        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={selectedStatus === null ? "default" : "outline"}
            className="cursor-pointer"
            onClick={() => setSelectedStatus(null)}
          >
            All Orders
          </Button>
          {(Object.keys(ORDER_STATUSES) as Array<keyof typeof ORDER_STATUSES>).map((status) => (
            <Button
              key={status}
              size="sm"
              variant={selectedStatus === status ? "default" : "outline"}
              className="cursor-pointer"
              onClick={() => setSelectedStatus(status)}
            >
              {ORDER_STATUSES[status].label}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader className="h-10 w-10 animate-spin mx-auto mb-3 text-gray-400" />
            <p className="text-gray-400 text-sm">Loading orders...</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<ShoppingBag className="h-16 w-16 text-gray-600" />}
          title={search ? "No orders match your search" : "No orders found"}
          description={search ? "Try adjusting your search criteria" : "Orders will appear here as they arrive"}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order: Sale) => (
            <Link key={order.id} href={`/sellers/orders/${order.orderId}`}>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 hover:border-[#444] transition cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Order ID</p>
                    <p className="text-sm font-mono text-gray-300 break-all">{order.orderId.slice(0, 16)}...</p>
                  </div>
                  <Badge
                    className={`${ORDER_STATUSES[order.orderStatus as keyof typeof ORDER_STATUSES]?.color || "bg-gray-900/30 text-gray-200 border-gray-700/30"} border`}
                  >
                    {ORDER_STATUSES[order.orderStatus as keyof typeof ORDER_STATUSES]?.label || order.orderStatus}
                  </Badge>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Product</p>
                    <p className="text-sm font-semibold text-gray-200 line-clamp-1 mt-1">{order.product}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Customer</p>
                      <p className="text-sm text-gray-300 mt-1">{order.customer}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 uppercase">Amount</p>
                      <p className="text-sm font-bold text-white mt-1">{formatCurrency(order.amountCents, { currency: order.currency, truncate: true })}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase">Order Date</p>
                    <p className="text-sm text-gray-300 mt-1">
                      {new Date(order.orderDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <Button size="sm" className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer">
                  View Details →
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
