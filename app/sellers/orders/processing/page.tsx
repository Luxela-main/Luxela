"use client"

import React, { useState, useMemo } from "react"
import { TrendingUp, AlertCircle, Loader, Truck } from "lucide-react"
import Link from "next/link"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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

interface ShipmentData {
  trackingNumber: string
  carrier: string
  estimatedDelivery: string
}

export default function ProcessingOrdersPage() {
  const [filters, setFilters] = useState<Filters>({
    search: "",
    sortBy: "date",
    sortOrder: "desc",
  })
  const [showShipmentDialog, setShowShipmentDialog] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null)
  const [shipmentData, setShipmentData] = useState<ShipmentData>({
    trackingNumber: "",
    carrier: "standard",
    estimatedDelivery: "",
  })

  const { data: allOrders = [], isLoading, error } = useSellerOrders({ limit: 50, offset: 0 })
  const updateSaleMutation = trpc.sales.updateSale.useMutation()

  
  const processingOrders = useMemo(
    () => allOrders.filter((order: Sale) => order.orderStatus === "processing"),
    [allOrders]
  )

  const handleMarkAsShipped = async () => {
    if (!selectedOrder) return
    if (!shipmentData.trackingNumber.trim()) {
      toastSvc.error("Please enter a tracking number")
      return
    }
    if (!shipmentData.estimatedDelivery) {
      toastSvc.error("Please enter an estimated delivery date")
      return
    }

    try {
      await updateSaleMutation.mutateAsync({
        orderId: selectedOrder.orderId,
        orderStatus: "shipped",
      })
      toastSvc.success("Order marked as shipped")
      setShowShipmentDialog(false)
      setSelectedOrder(null)
      setShipmentData({ trackingNumber: "", carrier: "standard", estimatedDelivery: "" })
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to mark order as shipped")
    }
  }

  const filteredOrders = useMemo(() => {
    let result = processingOrders.filter((order: Sale) => {
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
  }, [processingOrders, filters])

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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Processing Orders</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isLoading ? "Loading..." : `${filteredOrders.length} order${filteredOrders.length !== 1 ? "s" : ""} being processed`}
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
          icon={<TrendingUp className="h-16 w-16 text-gray-600" />}
          title={filters.search ? "No orders match your search" : "No processing orders"}
          description={filters.search ? "Try adjusting your search criteria" : "Processing orders will appear here"}
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredOrders.map((order: Sale) => (
            <Link key={order.id} href={`/sellers/orders/${order.orderId}`}>
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-5 hover:border-yellow-500/50 transition cursor-pointer">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase mb-1">Order ID</p>
                    <p className="text-sm font-mono text-gray-300">{order.orderId.slice(0, 16)}...</p>
                  </div>
                  <Badge className="bg-yellow-900/30 text-yellow-200 border-yellow-700/30 border">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    Processing
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

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => {
                      setSelectedOrder(order)
                      setShowShipmentDialog(true)
                    }}
                  >
                    <Truck className="h-4 w-4 mr-1" />
                    Ship
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

      <Dialog open={showShipmentDialog} onOpenChange={setShowShipmentDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Mark Order as Shipped</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedOrder ? `Order ID: ${selectedOrder.orderId.slice(0, 12)}...` : "Loading..."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
                <p className="text-xs text-gray-500 uppercase mb-2">Product</p>
                <p className="text-sm font-semibold text-gray-200">{selectedOrder.product || "N/A"}</p>
                <p className="text-xs text-gray-400 mt-2">{selectedOrder.customer || "N/A"}</p>
              </div>
            )}

            <div>
              <label className="text-sm font-medium text-gray-200 block mb-2">Tracking Number *</label>
              <input
                type="text"
                value={shipmentData.trackingNumber}
                onChange={(e) => setShipmentData({ ...shipmentData, trackingNumber: e.target.value })}
                placeholder="Enter tracking number"
                className="w-full bg-[#242424] border border-[#333] rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-600"
              />
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200 block mb-2">Carrier</label>
              <select
                value={shipmentData.carrier}
                onChange={(e) => setShipmentData({ ...shipmentData, carrier: e.target.value })}
                className="w-full bg-[#242424] border border-[#333] rounded px-3 py-2 text-sm text-gray-300"
              >
                <option value="standard">Standard Shipping</option>
                <option value="express">Express Shipping</option>
                <option value="fedex">FedEx</option>
                <option value="ups">UPS</option>
                <option value="dhl">DHL</option>
              </select>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-200 block mb-2">Estimated Delivery Date *</label>
              <input
                type="date"
                value={shipmentData.estimatedDelivery}
                onChange={(e) => setShipmentData({ ...shipmentData, estimatedDelivery: e.target.value })}
                className="w-full bg-[#242424] border border-[#333] rounded px-3 py-2 text-sm text-gray-300"
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowShipmentDialog(false)
                setSelectedOrder(null)
                setShipmentData({ trackingNumber: "", carrier: "standard", estimatedDelivery: "" })
              }}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              className="bg-purple-600 hover:bg-purple-700 text-white cursor-pointer disabled:cursor-not-allowed"
              onClick={handleMarkAsShipped}
              disabled={
                updateSaleMutation.isPending ||
                !shipmentData.trackingNumber ||
                !shipmentData.estimatedDelivery
              }
            >
              {updateSaleMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Confirm Shipment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}