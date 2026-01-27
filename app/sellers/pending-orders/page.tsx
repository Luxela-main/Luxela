"use client"

import React, { useState, useMemo } from "react"
import { Clock, CheckCircle, XCircle, AlertCircle, Loader } from "lucide-react"
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
  type PendingOrder,
} from "@/modules/seller/queries"

// Use PendingOrder type from queries module
type OrderWithDetails = PendingOrder & {
  product: string // Alias for productTitle
  customer: string // Alias for buyerName
  customerEmail: string // Alias for buyerEmail
  orderDate: Date // Use createdAt from the actual data
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
  search: string;
  cancelReason: string;
}

export default function PendingOrders() {
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<OrderWithDetails | null>(null)
  const [showCancelDialog, setShowCancelDialog] = useState(false)
  
  // Use localStorage for search and filter state
  const [filters, setFilters] = useLocalStorage<PendingOrdersFilters>('pending-orders-filters', {
    search: '',
    cancelReason: '',
  })

  const search = filters.search
  const cancelReason = filters.cancelReason

  // Fetch pending orders
  const { data: orders = [], isLoading, error } = usePendingOrders(
    { status: "pending", limit: 50, offset: 0 },
    { refetchInterval: 30000 } // Auto-refetch every 30 seconds
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

  const filteredOrders = useMemo(() => {
    return orders.filter(
      (order: PendingOrder) =>
        order.orderId?.toLowerCase().includes(search.toLowerCase()) ||
        order.productTitle?.toLowerCase().includes(search.toLowerCase()) ||
        order.buyerName?.toLowerCase().includes(search.toLowerCase()) ||
        order.buyerEmail?.toLowerCase().includes(search.toLowerCase())
    )
  }, [orders, search])

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
      <div className="pt-16 px-6 md:pt-0">
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
    <div className="pt-16 px-4 md:pt-0 md:px-6">
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">Pending Orders</h1>
          <p className="text-gray-400 mt-2 text-sm">
            {isLoading ? "Loading..." : `${filteredOrders.length} order${filteredOrders.length !== 1 ? "s" : ""} pending confirmation`}
          </p>
        </div>
        <div className="w-full md:w-80">
          <SearchBar search={search} setSearch={(newSearch) => setFilters({...filters, search: newSearch})} />
        </div>
      </div>

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
          {filteredOrders.map((order: PendingOrder) => (
            <div
              key={order.id}
              className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4 hover:border-[#444] transition"
            >
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Product Image */}
                <div className="md:col-span-2">
                  {order.productImage ? (
                    <div className="relative h-24 w-24 bg-[#242424] rounded-lg overflow-hidden flex-shrink-0">
                      <Image
                        src={order.productImage}
                        alt={order.productTitle}
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
                <div className="md:col-span-5 space-y-2">
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Order ID</p>
                    <p className="text-sm font-mono text-gray-300 break-all">{order.orderId.slice(0, 12)}...</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Product</p>
                    <p className="text-sm font-semibold text-gray-200 line-clamp-1">{order.productTitle}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase">Customer</p>
                    <p className="text-sm text-gray-300">{order.buyerName}</p>
                    <p className="text-xs text-gray-500">{order.buyerEmail}</p>
                  </div>
                </div>

                {/* Amount & Status */}
                <div className="md:col-span-2 space-y-2">
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
                <div className="md:col-span-3 flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white w-full"
                    onClick={() => handleConfirmOrder(order.orderId)}
                    disabled={confirmMutation.isPending}
                  >
                    {confirmMutation.isPending && <Loader className="h-3 w-3 mr-1 animate-spin" />}
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Order
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-900/20 w-full"
                    onClick={() => {
                      setSelectedOrderId(order.orderId)
                      setSelectedOrder(order as any)
                      setShowCancelDialog(true)
                    }}
                    disabled={cancelMutation.isPending}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Cancel Order
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
                  <span className="font-medium">{selectedOrder.customer}</span> • {selectedOrder.customerEmail}
                </p>
              </div>
            )}
            <div>
              <label className="text-sm font-medium text-gray-200 block mb-2">Cancellation Reason *</label>
              <Select value={filters.cancelReason} onValueChange={(val: string) => setFilters({...filters, cancelReason: val})}>
                <SelectTrigger className="bg-[#242424] border-[#333]">
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
            >
              Close
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700 text-white"
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