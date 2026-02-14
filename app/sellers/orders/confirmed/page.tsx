"use client"

import React, { useState, useMemo } from "react"
import { CheckCircle, AlertCircle, Loader, TrendingUp } from "lucide-react"
import Link from "next/link"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import helper from "@/helper"
import { toastSvc } from "@/services/toast"
import { useSellerOrders } from "@/modules/sellers/queries/useSellerOrders"
import { trpc } from "@/lib/trpc"
import type { Sale } from "@/modules/sellers/model/sales"

interface Filters {
  search: string
  sortBy: "date" | "amount" | "customer"
  sortOrder: "asc" | "desc"
}

export default function ConfirmedOrdersPage() {
  const [search, setSearch] = useState("")
  const [filters, setFilters] = useState<Filters>({
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  })
  const [processingOrderId, setProcessingOrderId] = useState<string | null>(null)

  const { data: allOrders = [], isLoading, error } = useSellerOrders({ limit: 50, offset: 0 })
  const updateSaleMutation = trpc.sales.updateSale.useMutation()

  
  const confirmedOrders = useMemo(
    () => allOrders.filter((order: Sale) => order.orderStatus === "confirmed"),
    [allOrders]
  )

  const handleMarkAsProcessing = async (orderId: string) => {
    setProcessingOrderId(orderId)
    try {
      await updateSaleMutation.mutateAsync({
        orderId,
        orderStatus: "processing",
      })
      toastSvc.success("Order marked as processing")
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to update order")
    } finally {
      setProcessingOrderId(null)
    }
  }

  const filteredOrders = useMemo(() => {
    let result = confirmedOrders.filter((order: Sale) => {
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
  }, [confirmedOrders, filters])

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Confirmed Orders</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isLoading ? "Loading..." : `${filteredOrders.length} order${filteredOrders.length !== 1 ? "s" : ""} confirmed`}
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
          icon={<CheckCircle className="h-16 w-16 text-gray-600" />}
          title={filters.search ? "No orders match your search" : "No confirmed orders"}
          description={filters.search ? "Try adjusting your search criteria" : "Confirmed orders will appear here"}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order: Sale) => (
            <Link key={order.id} href={`/sellers/orders/${order.orderId}`}>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 hover:border-blue-500/50 transition cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Order ID</p>
                    <p className="text-sm font-mono text-gray-300">{order.orderId.slice(0, 16)}...</p>
                  </div>
                  <Badge className="bg-blue-900/30 text-blue-200 border-blue-700/30 border">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Confirmed
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
                      <p className="text-sm font-bold text-white mt-1">{helper.toCurrency((order.amountCents || 0) / 100, { currency: '₦', abbreviate: true })}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 uppercase">Confirmed Date</p>
                    <p className="text-sm text-gray-300 mt-1">
                      {new Date(order.orderDate).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => handleMarkAsProcessing(order.orderId)}
                    disabled={updateSaleMutation.isPending && processingOrderId === order.orderId}
                  >
                    {updateSaleMutation.isPending && processingOrderId === order.orderId && <Loader className="h-3 w-3 mr-1 animate-spin" />}
                    <TrendingUp className="h-4 w-4 mr-1" />
                    Process
                  </Button>
                  <Link href={`/sellers/orders/${order.orderId}`} className="flex-1">
                    <Button size="sm" variant="outline" className="w-full cursor-pointer">
                      View
                    </Button>
                  </Link>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}