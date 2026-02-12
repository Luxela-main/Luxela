"use client"

import React, { useState, useMemo } from "react"
import { Truck, AlertCircle, Loader } from "lucide-react"
import Link from "next/link"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { useSellerOrders } from "@/modules/sellers/queries/useSellerOrders"
import type { Sale } from "@/modules/sellers/model/sales"

interface Filters {
  search: string
  sortBy: "date" | "amount" | "customer"
  sortOrder: "asc" | "desc"
}

export default function ShippedOrdersPage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  })

  const { data: allOrders = [], isLoading, error } = useSellerOrders({ limit: 50, offset: 0 })

  
  const shippedOrders = useMemo(
    () => allOrders.filter((order: Sale) => order.orderStatus === "shipped"),
    [allOrders]
  )

  const filteredOrders = useMemo(() => {
    let result = shippedOrders.filter((order: Sale) => {
      return (
        filters.search === "" ||
        order.orderId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.product?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customer?.toLowerCase().includes(filters.search.toLowerCase())
      )
    })

    result.sort((a: Sale, b: Sale) => {
      let compareValue = 0
      if (filters.sortBy === "date") {
        compareValue = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
      } else if (filters.sortBy === "amount") {
        compareValue = a.amountCents - b.amountCents
      } else if (filters.sortBy === "customer") {
        compareValue = a.customer.localeCompare(b.customer)
      }
      return filters.sortOrder === "asc" ? compareValue : -compareValue
    })

    return result
  }, [shippedOrders, filters])

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
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Shipped Orders</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isLoading ? "Loading..." : `${filteredOrders.length} order${filteredOrders.length !== 1 ? "s" : ""} in transit`}
          </p>
        </div>
        <div className="w-full md:w-80">
          <SearchBar search={filters.search} setSearch={(newSearch) => setFilters({ ...filters, search: newSearch })} />
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
          icon={<Truck className="h-16 w-16 text-gray-600" />}
          title={filters.search ? "No orders match your search" : "No shipped orders"}
          description={filters.search ? "Try adjusting your search criteria" : "Shipped orders will appear here"}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order: Sale) => (
            <Link key={order.id} href={`/sellers/orders/${order.orderId}`}>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 hover:border-purple-500/50 transition cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Order ID</p>
                    <p className="text-sm font-mono text-gray-300">{order.orderId.slice(0, 16)}...</p>
                  </div>
                  <Badge className="bg-purple-900/30 text-purple-200 border-purple-700/30 border">
                    <Truck className="h-3 w-3 mr-1" />
                    Shipped
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
                      <p className="text-sm font-bold text-white mt-1">{formatCurrency(order.amountCents, order.currency)}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase">Shipped Date</p>
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
                  View Tracking →
                </Button>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}