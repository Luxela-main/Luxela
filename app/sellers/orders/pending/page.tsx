"use client"

import React, { useState, useMemo } from "react"
import { Clock, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { formatCurrency } from "@/lib/utils"
import { toastSvc } from "@/services/toast"
import { usePendingOrders, useConfirmOrder, useCancelOrder } from "@/modules/sellers"
import type { Sale } from "@/modules/sellers/model/sales"

function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-[#6B7280]/20 text-[#6B7280] border-[#6B7280]/30"
    case "confirmed":
      return "bg-blue-900/30 text-blue-200 border-blue-700/30"
    default:
      return "bg-gray-900/30 text-gray-200 border-gray-700/30"
  }
}

interface PendingOrdersFilters {
  search: string
  cancelReason: string
  sortBy: "date" | "amount" | "customer"
  sortOrder: "asc" | "desc"
  dateFrom: string
  dateTo: string
}

export default function PendingOrdersPage() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Sale | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [selectedBulkOrders, setSelectedBulkOrders] = useState<Set<string>>(new Set())
  const [filters, setFilters] = useState<PendingOrdersFilters>({
    search: "",
    cancelReason: "",
    sortBy: "date",
    sortOrder: "desc",
    dateFrom: "",
    dateTo: "",
  })

  const { data: orders = [], isLoading, error } = usePendingOrders({ status: "pending", limit: 50, offset: 0 })
  const confirmMutation = useConfirmOrder()
  const cancelMutation = useCancelOrder()

  const handleConfirmOrder = (orderId: string) => {
    confirmMutation.mutate({ orderId })
  }

  const handleCancelOrder = () => {
    if (!selectedOrderId || !filters.cancelReason.trim()) {
      toastSvc.error("Please provide a cancellation reason")
      return
    }
    cancelMutation.mutate({ orderId: selectedOrderId, reason: filters.cancelReason })
    setFilters({ ...filters, cancelReason: "" })
    setShowCancelDialog(false)
  }

  const handleBulkSelectAll = () => {
    if (selectedBulkOrders.size === filteredOrders.length) {
      setSelectedBulkOrders(new Set())
    } else {
      setSelectedBulkOrders(new Set(filteredOrders.map((order: Sale) => order.id)))
    }
  }

  const handleBulkSelectOrder = (orderId: string) => {
    const newSelection = new Set(selectedBulkOrders)
    if (newSelection.has(orderId)) {
      newSelection.delete(orderId)
    } else {
      newSelection.add(orderId)
    }
    setSelectedBulkOrders(newSelection)
  }

  const handleBulkConfirm = () => {
    if (selectedBulkOrders.size === 0) {
      toastSvc.error("Please select at least one order")
      return
    }
    selectedBulkOrders.forEach((orderId) => {
      const order = filteredOrders.find((o: Sale) => o.id === orderId)
      if (order) {
        confirmMutation.mutate({ orderId: order.orderId })
      }
    })
    setSelectedBulkOrders(new Set())
  }

  const handleBulkCancel = () => {
    if (selectedBulkOrders.size === 0) {
      toastSvc.error("Please select at least one order")
      return
    }
    if (!filters.cancelReason.trim()) {
      toastSvc.error("Please provide a cancellation reason")
      return
    }
    selectedBulkOrders.forEach((orderId) => {
      const order = filteredOrders.find((o: Sale) => o.id === orderId)
      if (order) {
        cancelMutation.mutate({ orderId: order.orderId, reason: filters.cancelReason })
      }
    })
    setSelectedBulkOrders(new Set())
    setFilters({ ...filters, cancelReason: "" })
  }

  const filteredOrders = useMemo(() => {
    let result = orders.filter((order: Sale) => {
      const matchesSearch =
        filters.search === "" ||
        order.orderId?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.product?.toLowerCase().includes(filters.search.toLowerCase()) ||
        order.customer?.toLowerCase().includes(filters.search.toLowerCase())

      let matchesDateRange = true
      if (filters.dateFrom || filters.dateTo) {
        const orderDate = new Date(order.orderDate).getTime()
        if (filters.dateFrom) {
          const fromTime = new Date(filters.dateFrom).getTime()
          matchesDateRange = matchesDateRange && orderDate >= fromTime
        }
        if (filters.dateTo) {
          const toTime = new Date(filters.dateTo).getTime()
          matchesDateRange = matchesDateRange && orderDate <= toTime
        }
      }

      return matchesSearch && matchesDateRange
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
  }, [orders, filters])

  if (error) {
    return (
      <div className="px-4 md:px-6 mt-4 md:mt-0">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 flex items-center gap-3 text-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load pending orders</h3>
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
          <h1 className="text-2xl md:text-3xl font-bold text-white">Pending Orders</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isLoading ? "Loading..." : `${filteredOrders.length} order${filteredOrders.length !== 1 ? "s" : ""} awaiting confirmation`}
            {selectedBulkOrders.size > 0 && ` • ${selectedBulkOrders.size} selected`}
          </p>
        </div>
        <div className="w-full md:w-80">
          <SearchBar search={filters.search} setSearch={(newSearch) => setFilters({ ...filters, search: newSearch })} />
        </div>
      </div>

      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <Select value={filters.sortBy} onValueChange={(val: any) => setFilters({ ...filters, sortBy: val })}>
              <SelectTrigger className="bg-[#242424] border-[#333] w-40 cursor-pointer">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-[#1a1a1a] border-[#333]">
                <SelectItem value="date">Order Date</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
                <SelectItem value="customer">Customer Name</SelectItem>
              </SelectContent>
            </Select>
            <Button
              size="sm"
              variant="ghost"
              className="px-2 text-gray-400 hover:text-gray-200"
              onClick={() => setFilters({ ...filters, sortOrder: filters.sortOrder === "asc" ? "desc" : "asc" })}
            >
              {filters.sortOrder === "asc" ? "↑" : "↓"}
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Date Range:</span>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
              className="bg-[#242424] border border-[#333] rounded px-3 py-2 text-sm text-gray-300"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
              className="bg-[#242424] border border-[#333] rounded px-3 py-2 text-sm text-gray-300"
            />
          </div>

          {(filters.dateFrom || filters.dateTo) && (
            <Button
              size="sm"
              variant="outline"
              className="text-gray-400 hover:text-gray-200"
              onClick={() => setFilters({ ...filters, dateFrom: "", dateTo: "" })}
            >
              Clear Dates
            </Button>
          )}
        </div>
      </div>

      {selectedBulkOrders.size > 0 && (
        <div className="mb-6 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <p className="text-sm font-medium text-blue-200">
            {selectedBulkOrders.size} order{selectedBulkOrders.size !== 1 ? "s" : ""} selected
          </p>
          <div className="flex flex-col md:flex-row gap-2">
            <Button
              size="sm"
              className="bg-green-600 hover:bg-green-700 text-white cursor-pointer disabled:cursor-not-allowed"
              onClick={handleBulkConfirm}
              disabled={confirmMutation.isPending}
            >
              {confirmMutation.isPending && <Loader className="h-3 w-3 mr-1 animate-spin" />}
              Confirm All ({selectedBulkOrders.size})
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="border-red-600 text-red-400 hover:bg-red-900/20 cursor-pointer disabled:cursor-not-allowed"
              onClick={() => {
                if (!filters.cancelReason.trim()) {
                  toastSvc.error("Please select a cancellation reason first")
                  return
                }
                handleBulkCancel()
              }}
              disabled={cancelMutation.isPending}
            >
              {cancelMutation.isPending && <Loader className="h-3 w-3 mr-1 animate-spin" />}
              Cancel All ({selectedBulkOrders.size})
            </Button>
            <Button size="sm" variant="ghost" className="text-gray-400 hover:text-gray-200" onClick={() => setSelectedBulkOrders(new Set())}>
              Deselect
            </Button>
          </div>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="text-center">
            <Loader className="h-10 w-10 animate-spin mx-auto mb-3 text-gray-400" />
            <p className="text-gray-400 text-sm">Loading pending orders...</p>
          </div>
        </div>
      ) : filteredOrders.length === 0 ? (
        <EmptyState
          icon={<Clock className="h-16 w-16 text-gray-600" />}
          title={filters.search ? "No orders match your search" : "No pending orders"}
          description={filters.search ? "Try adjusting your search criteria" : "All confirmed or no new orders yet"}
        />
      ) : (
        <div className="space-y-3">
          {filteredOrders.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedBulkOrders.size === filteredOrders.length && filteredOrders.length > 0}
                onChange={handleBulkSelectAll}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-sm text-gray-400">Select All</span>
            </div>
          )}

          {filteredOrders.map((order: Sale) => (
            <div
              key={order.id}
              className={`bg-[#1a1a1a] border rounded-lg p-4 transition ${
                selectedBulkOrders.has(order.id) ? "border-blue-600 bg-blue-900/10" : "border-[#333] hover:border-[#444]"
              }`}
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Checkbox */}
                <div className="md:col-span-1 flex items-center">
                  <input
                    type="checkbox"
                    checked={selectedBulkOrders.has(order.id)}
                    onChange={() => handleBulkSelectOrder(order.id)}
                    className="w-4 h-4 cursor-pointer"
                  />
                </div>

                {/* Order Details */}
                <div className="md:col-span-4 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Order ID</p>
                    <p className="text-sm font-mono text-gray-300 break-all">{order.orderId.slice(0, 12)}...</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Product</p>
                    <p className="text-sm font-semibold text-gray-200 line-clamp-1">{order.product}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Customer</p>
                    <p className="text-sm text-gray-300">{order.customer}</p>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="md:col-span-2 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Amount</p>
                    <p className="text-lg font-bold text-white">{formatCurrency(order.amountCents, order.currency)}</p>
                  </div>
                  <Badge className={`${getStatusColor(order.orderStatus)} border inline-flex items-center gap-1`}>
                    <Clock className="h-3 w-3" />
                    <span className="capitalize">{order.orderStatus}</span>
                  </Badge>
                </div>

                {/* Actions */}
                <div className="md:col-span-3 flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white w-full cursor-pointer disabled:cursor-not-allowed"
                    onClick={() => handleConfirmOrder(order.orderId)}
                    disabled={confirmMutation.isPending}
                  >
                    {confirmMutation.isPending && <Loader className="h-3 w-3 mr-1 animate-spin" />}
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/20 w-full cursor-pointer"
                    onClick={() => {
                      setSelectedOrderId(order.orderId)
                      setSelectedOrder(order)
                      setShowCancelDialog(true)
                    }}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Cancel Order</DialogTitle>
            <DialogDescription className="text-gray-400">
              {selectedOrder && `Order ID: ${selectedOrder.orderId.slice(0, 12)}...`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedOrder && (
              <div className="bg-[#242424] border border-[#333] rounded-lg p-3">
                <p className="text-xs text-gray-500 uppercase">Product</p>
                <p className="text-sm font-semibold text-gray-200 mt-1">{selectedOrder.product}</p>
                <p className="text-xs text-gray-400 mt-2">{selectedOrder.customer}</p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-200 block mb-2">Cancellation Reason *</label>
              <Select value={filters.cancelReason} onValueChange={(val: string) => setFilters({ ...filters, cancelReason: val })}>
                <SelectTrigger className="bg-[#242424] border-[#333] cursor-pointer">
                  <SelectValue placeholder="Select a reason" />
                </SelectTrigger>
                <SelectContent className="bg-[#1a1a1a] border-[#333]">
                  <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                  <SelectItem value="customer_request">Customer Request</SelectItem>
                  <SelectItem value="payment_issue">Payment Issue</SelectItem>
                  <SelectItem value="shipping_delay">Shipping Delay</SelectItem>
                  <SelectItem value="other">Other Reason</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setShowCancelDialog(false)
                setFilters({ ...filters, cancelReason: "" })
              }}
              disabled={cancelMutation.isPending}
              className="cursor-pointer disabled:cursor-not-allowed"
            >
              Close
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:cursor-not-allowed"
              onClick={handleCancelOrder}
              disabled={cancelMutation.isPending || !filters.cancelReason}
            >
              {cancelMutation.isPending ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Canceling...
                </>
              ) : (
                "Confirm Cancel"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}