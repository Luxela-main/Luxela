"use client"

import React, { useState, useMemo } from "react"
import { Clock, CheckCircle, XCircle, AlertCircle, Loader, MapPin, CreditCard, ShoppingBag, Calendar } from "lucide-react"
import Image from "next/image"
import SearchBar from "@/components/search-bar"
import EmptyState from "@/components/empty-state"
import { useLocalStorage } from "@/lib/hooks/useLocalStorage"
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
import {
  usePendingOrders,
  useConfirmOrder,
  useCancelOrder,
} from "@/modules/sellers"
import type { Sale } from "@/modules/sellers/model/sales"

// Map Sale to OrderWithDetails
type OrderWithDetails = Sale & {
  customerEmail?: string
}

function getStatusColor(status: string): string {
  switch (status) {
    case "pending":
      return "bg-yellow-900/30 text-yellow-200 border-yellow-700/30"
    case "confirmed":
      return "bg-blue-900/30 text-blue-200 border-blue-700/30"
    case "processing":
      return "bg-purple-900/30 text-purple-200 border-purple-700/30"
    case "shipped":
      return "bg-cyan-900/30 text-cyan-200 border-cyan-700/30"
    case "delivered":
      return "bg-green-900/30 text-green-200 border-green-700/30"
    case "canceled":
      return "bg-red-900/30 text-red-200 border-red-700/30"
    default:
      return "bg-gray-900/30 text-gray-200 border-gray-700/30"
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case "pending":
      return <Clock className="h-3 w-3" />
    case "confirmed":
    case "processing":
    case "shipped":
      return <CheckCircle className="h-3 w-3" />
    case "delivered":
      return <CheckCircle className="h-3 w-3" />
    case "canceled":
      return <XCircle className="h-3 w-3" />
    default:
      return <Clock className="h-3 w-3" />
  }
}

interface PendingOrdersFilters {
  search: string
  cancelReason: string
  sortBy: 'date' | 'amount' | 'customer'
  sortOrder: 'asc' | 'desc'
  dateFrom: string
  dateTo: string
}

// Order Details Modal Component
function OrderDetailsModal({ order, open, onOpenChange }: { order: OrderWithDetails | null, open: boolean, onOpenChange: (open: boolean) => void }) {
  if (!order) return null

  const orderDate = new Date(order.orderDate).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })

  const paymentStatusColor: Record<string, string> = {
    'in_escrow': 'bg-yellow-900/30 text-yellow-200 border-yellow-700/30',
    'processing': 'bg-blue-900/30 text-blue-200 border-blue-700/30',
    'paid': 'bg-green-900/30 text-green-200 border-green-700/30',
  }

  const deliveryStatusColor: Record<string, string> = {
    'not_shipped': 'bg-gray-900/30 text-gray-200 border-gray-700/30',
    'in_transit': 'bg-blue-900/30 text-blue-200 border-blue-700/30',
    'delivered': 'bg-green-900/30 text-green-200 border-green-700/30',
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Order Details</DialogTitle>
          <DialogDescription className="text-gray-400">
            {`Order ID: ${order.orderId}`}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-6">
          {/* Order Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-3 font-medium">Order Information</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Order Date</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-gray-500" />
                    <p className="text-sm text-gray-300">{orderDate}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Status</p>
                  <Badge className={`${getStatusColor(order.orderStatus)} border inline-flex items-center gap-1 mt-1`}>
                    {getStatusIcon(order.orderStatus)}
                    <span className="capitalize">{order.orderStatus}</span>
                  </Badge>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Quantity</p>
                  <p className="text-sm text-gray-300 mt-1">{order.quantity} item{order.quantity !== 1 ? 's' : ''}</p>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-3 font-medium">Product</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500">Product Name</p>
                  <p className="text-sm font-semibold text-gray-200 mt-1">{order.product}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500">Amount</p>
                  <p className="text-lg font-bold text-white mt-1">
                    {formatCurrency(order.amountCents, order.currency)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
            <p className="text-xs text-gray-500 uppercase mb-3 font-medium">Customer Information</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-gray-500">Name</p>
                <p className="text-sm text-gray-300 mt-1">{order.customer}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Email</p>
                <p className="text-sm text-gray-300 mt-1">{order.customerEmail || 'Not provided'}</p>
              </div>
            </div>
          </div>

          {/* Shipping Address */}
          {order.shippingAddress && (
            <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-gray-500" />
                <p className="text-xs text-gray-500 uppercase font-medium">Shipping Address</p>
              </div>
              <p className="text-sm text-gray-300">{order.shippingAddress}</p>
            </div>
          )}

          {/* Payment Status */}
          <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <CreditCard className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-500 uppercase font-medium">Payment Status</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500 mb-2">Payment Method</p>
                <p className="text-sm text-gray-300 capitalize">{order.paymentMethod}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-2">Payout Status</p>
                <Badge className={`${paymentStatusColor[order.payoutStatus]} border inline-flex items-center gap-1`}>
                  <span className="capitalize">{order.payoutStatus.replace('_', ' ')}</span>
                </Badge>
              </div>
            </div>
          </div>

          {/* Delivery Status */}
          <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <ShoppingBag className="h-4 w-4 text-gray-500" />
              <p className="text-xs text-gray-500 uppercase font-medium">Delivery Status</p>
            </div>
            <Badge className={`${deliveryStatusColor[order.deliveryStatus]} border inline-flex items-center gap-1`}>
              <span className="capitalize">{order.deliveryStatus.replace('_', ' ')}</span>
            </Badge>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="cursor-pointer"
          >
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default function PendingOrders() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [selectedBulkOrders, setSelectedBulkOrders] = useState<Set<string>>(new Set())
  
  // Use localStorage for search and filter state
  const [filters, setFilters] = useLocalStorage<PendingOrdersFilters>('pending-orders-filters', {
    search: '',
    cancelReason: '',
    sortBy: 'date',
    sortOrder: 'desc',
    dateFrom: '',
    dateTo: '',
  })

  const search = filters.search
  const cancelReason = filters.cancelReason
  const sortBy = filters.sortBy
  const sortOrder = filters.sortOrder
  const dateFrom = filters.dateFrom
  const dateTo = filters.dateTo

  // Fetch pending orders
  const { data: orders = [], isLoading, error } = usePendingOrders(
    { status: "pending", limit: 50, offset: 0 }
  )

  // Debug logging
  React.useEffect(() => {
    if (error) {
      console.error('Pending orders error:', error);
    }
  }, [error])

  // Setup mutations with React Query automatic invalidation
  const confirmMutation = useConfirmOrder()
  const cancelMutation = useCancelOrder()

  const handleConfirmOrder = (orderId: string) => {
    confirmMutation.mutate({ orderId })
  }

  const handleCancelOrder = () => {
    if (!selectedOrderId || !cancelReason.trim()) {
      toastSvc.error("Please provide a cancellation reason")
      return
    }
    cancelMutation.mutate({ orderId: selectedOrderId, reason: cancelReason })
    setFilters({...filters, cancelReason: ''})
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
    if (!cancelReason.trim()) {
      toastSvc.error("Please provide a cancellation reason")
      return
    }
    selectedBulkOrders.forEach((orderId) => {
      const order = filteredOrders.find((o: Sale) => o.id === orderId)
      if (order) {
        cancelMutation.mutate({ orderId: order.orderId, reason: cancelReason })
      }
    })
    setSelectedBulkOrders(new Set())
    setFilters({...filters, cancelReason: ''})
  }

  const toggleSortOrder = () => {
    setFilters({...filters, sortOrder: sortOrder === 'asc' ? 'desc' : 'asc'})
  }

  const filteredOrders = useMemo(() => {
    let result = orders.filter((order: Sale) => {
      // Search filter
      const matchesSearch = search === '' || 
        order.orderId?.toLowerCase().includes(search.toLowerCase()) ||
        order.product?.toLowerCase().includes(search.toLowerCase()) ||
        order.customer?.toLowerCase().includes(search.toLowerCase())
      
      // Date range filter
      let matchesDateRange = true
      if (dateFrom || dateTo) {
        const orderDate = new Date(order.orderDate).getTime()
        if (dateFrom) {
          const fromTime = new Date(dateFrom).getTime()
          matchesDateRange = matchesDateRange && orderDate >= fromTime
        }
        if (dateTo) {
          const toTime = new Date(dateTo).getTime()
          matchesDateRange = matchesDateRange && orderDate <= toTime
        }
      }
      
      return matchesSearch && matchesDateRange
    })

    // Sorting
    result.sort((a: Sale, b: Sale) => {
      let compareValue = 0
      
      if (sortBy === 'date') {
        compareValue = new Date(a.orderDate).getTime() - new Date(b.orderDate).getTime()
      } else if (sortBy === 'amount') {
        compareValue = a.amountCents - b.amountCents
      } else if (sortBy === 'customer') {
        compareValue = a.customer.localeCompare(b.customer)
      }
      
      return sortOrder === 'asc' ? compareValue : -compareValue
    })

    return result
  }, [orders, search, sortBy, sortOrder, dateFrom, dateTo])

  if (error) {
    let errorMessage = 'Unknown error';
    
    // TRPC errors have a different structure
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null) {
      // Try to extract message from TRPC error structure
      const errorObj = error as any;
      errorMessage = errorObj.message || errorObj.data?.message || JSON.stringify(error);
    }
    
    console.error('Rendering error state:', { error, errorMessage });
    return (
      <div className="px-6 mt-4 md:mt-0">
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 flex items-center gap-3 text-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load pending orders</h3>
            <p className="text-sm text-red-200/80 mt-1">{errorMessage || 'Please try refreshing the page or contact support.'}</p>
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
            {isLoading ? "Loading..." : `${filteredOrders.length} order${filteredOrders.length !== 1 ? "s" : ""} pending confirmation`}
            {selectedBulkOrders.size > 0 && ` • ${selectedBulkOrders.size} selected`}
          </p>
        </div>
        <div className="w-full md:w-80">
          <SearchBar search={search} setSearch={(newSearch) => setFilters({...filters, search: newSearch})} />
        </div>
      </div>

      {/* Filters and Sorting Bar */}
      <div className="mb-6 flex flex-col gap-4">
        <div className="flex flex-col md:flex-row gap-3 flex-wrap">
          {/* Sort Dropdown */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Sort by:</span>
            <Select value={sortBy} onValueChange={(val: any) => setFilters({...filters, sortBy: val})}>
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
              onClick={toggleSortOrder}
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          {/* Date Range Filters */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Date Range:</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
              className="bg-[#242424] border border-[#333] rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-500"
              title="From date"
            />
            <span className="text-gray-500">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
              className="bg-[#242424] border border-[#333] rounded px-3 py-2 text-sm text-gray-300 placeholder-gray-500"
              title="To date"
            />
          </div>

          {/* Clear Filters */}
          {(dateFrom || dateTo) && (
            <Button
              size="sm"
              variant="outline"
              className="text-gray-400 hover:text-gray-200"
              onClick={() => setFilters({...filters, dateFrom: '', dateTo: ''})}
            >
              Clear Dates
            </Button>
          )}
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedBulkOrders.size > 0 && (
        <div className="mb-6 bg-blue-900/20 border border-blue-700/30 rounded-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-blue-200">{selectedBulkOrders.size} order{selectedBulkOrders.size !== 1 ? 's' : ''} selected</p>
          </div>
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
                if (!cancelReason.trim()) {
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
            <Button
              size="sm"
              variant="ghost"
              className="text-gray-400 hover:text-gray-200"
              onClick={() => setSelectedBulkOrders(new Set())}
            >
              Deselect
            </Button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-700 rounded-lg p-4 flex items-center gap-3 text-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div className="text-sm">
            <p className="font-semibold">Failed to load orders</p>
            <p className="text-red-200/80">Please try refreshing or contact support.</p>
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
          title={search ? "No orders match your search" : "No pending orders"}
          description={search 
            ? "Try adjusting your search criteria"
            : "New orders will appear here for you to confirm or cancel."
          }
        />
      ) : (
        <div className="space-y-3">
          {/* Header with Select All */}
          {filteredOrders.length > 0 && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-3 flex items-center gap-3">
              <input
                type="checkbox"
                checked={selectedBulkOrders.size === filteredOrders.length && filteredOrders.length > 0}
                onChange={handleBulkSelectAll}
                className="w-4 h-4 cursor-pointer"
                title="Select all orders"
              />
              <span className="text-sm text-gray-400">Select All</span>
            </div>
          )}
          {filteredOrders.map((order: Sale) => (
            <div
              key={order.id}
              className={`bg-[#1a1a1a] border rounded-lg p-4 transition ${
                selectedBulkOrders.has(order.id)
                  ? 'border-blue-600 bg-blue-900/10'
                  : 'border-[#333] hover:border-[#444]'
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

                {/* Product Image */}
                <div className="md:col-span-1">
                  {false ? (
                    <div className="relative h-24 w-24 bg-[#242424] rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src=""
                        alt={order.product}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="h-24 w-24 bg-[#242424] rounded-lg flex items-center justify-center text-gray-600">
                      <Clock className="h-6 w-6" />
                    </div>
                  )}
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
                    <p className="text-xs text-gray-500">{order.customerEmail || 'N/A'}</p>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="md:col-span-2 space-y-2 flex flex-col justify-start">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Amount</p>
                    <p className="text-lg font-bold text-white">
                      {formatCurrency(order.amountCents, order.currency)}
                    </p>
                  </div>
                  <div>
                    <Badge className={`${getStatusColor(order.orderStatus)} border inline-flex items-center gap-1`}>
                      {getStatusIcon(order.orderStatus)}
                      <span className="capitalize">{order.orderStatus}</span>
                    </Badge>
                  </div>
                </div>

                {/* Actions */}
                <div className="md:col-span-2 flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-blue-400 hover:bg-blue-900/20 w-full cursor-pointer"
                    onClick={() => {
                      setSelectedOrder(order as any)
                      setShowDetailsModal(true)
                    }}
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white w-full cursor-pointer disabled:cursor-not-allowed transition"
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
                    className="border-red-600 text-red-400 hover:bg-red-900/20 w-full cursor-pointer disabled:cursor-not-allowed transition"
                    onClick={() => {
                      setSelectedOrderId(order.orderId)
                      setSelectedOrder(order as any)
                      setShowCancelDialog(true)
                    }}
                    disabled={cancelMutation.isPending}
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

      {/* Cancel Order Dialog */}
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
                <p className="text-xs text-gray-400 mt-2">
                  <span className="font-medium">{selectedOrder.customer}</span> • {selectedOrder.customerEmail || 'N/A'}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-200 block mb-2">Cancellation Reason *</label>
              <Select value={filters.cancelReason} onValueChange={(val: string) => setFilters({...filters, cancelReason: val})}>
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
              className="cursor-pointer disabled:cursor-not-allowed transition"
            >
              Close
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white cursor-pointer disabled:cursor-not-allowed transition"
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

      {/* Order Details Modal */}
      <OrderDetailsModal 
        order={selectedOrder} 
        open={showDetailsModal} 
        onOpenChange={setShowDetailsModal}
      />
    </div>
  )
}