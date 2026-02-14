"use client"

import React, { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { ArrowLeft, Loader, AlertCircle, CheckCircle, Truck, Calendar, MapPin, CreditCard, ShoppingBag, RotateCw } from "lucide-react"
import Link from "next/link"
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
import helper from '@/helper'
import { toastSvc } from "@/services/toast"
import { useSaleById } from "@/modules/sellers/queries/useSales"
import { useSellerOrderDetailPolling } from "@/modules/sellers/hooks/useSellerOrderPolling"
import { trpc } from "@/lib/trpc"

function getStatusColor(status: string): string {
  switch (status?.toLowerCase()) {
    case "pending":
      return "bg-gray-900/30 text-gray-200 border-gray-700/30"
    case "confirmed":
      return "bg-blue-900/30 text-blue-200 border-blue-700/30"
    case "processing":
      return "bg-yellow-900/30 text-yellow-200 border-yellow-700/30"
    case "shipped":
      return "bg-purple-900/30 text-purple-200 border-purple-700/30"
    case "delivered":
      return "bg-green-900/30 text-green-200 border-green-700/30"
    case "canceled":
      return "bg-red-900/30 text-red-200 border-red-700/30"
    default:
      return "bg-gray-900/30 text-gray-200 border-gray-700/30"
  }
}

interface ShipmentData {
  trackingNumber: string
  carrier: string
  estimatedDelivery: string
  notes?: string
}

export default function SellerOrderDetailPage() {
  const params = useParams()
  const orderId = params.orderId as string
  
  const [showShipmentDialog, setShowShipmentDialog] = useState(false)
  const [shipmentData, setShipmentData] = useState<ShipmentData>({
    trackingNumber: "",
    carrier: "standard",
    estimatedDelivery: "",
    notes: "",
  })

  const [lastStatus, setLastStatus] = useState<string | null>(null)
  const [isPolling, setIsPolling] = useState(true)

  const { data: order, isLoading, error } = useSaleById(orderId)
  const confirmOrderMutation = trpc.sales.confirmOrder.useMutation()
  const updateSaleMutation = trpc.sales.updateSale.useMutation()

  useSellerOrderDetailPolling(orderId, { enabled: isPolling && !!orderId, interval: 30000 })

  useEffect(() => {
    if (order?.orderStatus && !lastStatus) setLastStatus(order.orderStatus)
  }, [order?.orderStatus, lastStatus])

  const handleConfirmOrder = async () => {
    if (!order) return
    try {
      await confirmOrderMutation.mutateAsync({ orderId: order.orderId })
      toastSvc.success("Order confirmed! Buyer has been notified.")
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to confirm order")
    }
  }

  const handleMarkAsProcessing = async () => {
    if (!order) return
    try {
      await updateSaleMutation.mutateAsync({
        orderId: order.orderId,
        orderStatus: "processing",
      })
      toastSvc.success("Order marked as processing")
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to update order")
    }
  }

  const handleMarkAsShipped = async () => {
    if (!order || !shipmentData.trackingNumber) {
      toastSvc.error("Please enter a tracking number")
      return
    }
    if (!shipmentData.estimatedDelivery) {
      toastSvc.error("Please enter an estimated delivery date")
      return
    }
    
    try {
      await updateSaleMutation.mutateAsync({
        orderId: order.orderId,
        deliveryStatus: "in_transit",
      })
      toastSvc.success("Order marked as shipped! Buyer has been notified.")
      setShowShipmentDialog(false)
      setShipmentData({ trackingNumber: "", carrier: "standard", estimatedDelivery: "", notes: "" })
    } catch (error: any) {
      toastSvc.error(error.message || "Failed to mark order as shipped")
    }
  }

  if (error) {
    return (
      <div className="px-4 md:px-6 mt-4 md:mt-0">
        <Link href="/sellers/orders">
          <Button variant="ghost" className="mb-6 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="bg-red-900/20 border border-red-700 rounded-lg p-6 flex items-center gap-3 text-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0" />
          <div>
            <h3 className="font-semibold">Failed to load order</h3>
            <p className="text-sm text-red-200/80 mt-1">Please try refreshing the page or contact support.</p>
          </div>
        </div>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="px-4 md:px-6 mt-4 md:mt-0 flex items-center justify-center py-16">
        <div className="text-center">
          <Loader className="h-10 w-10 animate-spin mx-auto mb-3 text-gray-400" />
          <p className="text-gray-400 text-sm">Loading order details...</p>
        </div>
      </div>
    )
  }

  if (!order) {
    return (
      <div className="px-4 md:px-6 mt-4 md:mt-0">
        <Link href="/sellers/orders">
          <Button variant="ghost" className="mb-6 cursor-pointer">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="text-center py-16">
          <AlertCircle className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-white mb-2">Order Not Found</h2>
          <p className="text-gray-400">The order you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  const orderDate = new Date(order.orderDate).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <div className="px-4 md:px-6 mt-4 md:mt-0">
      {}
      <Link href="/sellers/orders">
        <Button variant="ghost" className="mb-6 cursor-pointer">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Orders
        </Button>
      </Link>

      {}
      <div className="mb-8">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Order Details</h1>
            <p className="text-sm font-mono text-gray-400">ID: {order?.orderId?.slice(0, 12)}...</p>
          </div>
          {order && (
            <Badge className={`${getStatusColor(order.orderStatus)} border text-lg px-4 py-2`}>
              {order.orderStatus?.charAt(0).toUpperCase() + order.orderStatus?.slice(1)}
            </Badge>
          )}
        </div>
        {isPolling && (
          <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            <span>Live updates enabled (30s refresh)</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Order Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Product</p>
                <p className="text-lg font-semibold text-gray-200">{order?.product || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Category</p>
                <p className="text-sm text-gray-300 capitalize">{order?.productCategory ? order.productCategory.replace(/_/g, ' ') : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Quantity Selected by Buyer</p>
                <p className="text-lg font-bold text-blue-400 bg-blue-900/20 w-fit px-3 py-2 rounded">{order?.quantity || 0} {order?.quantity === 1 ? 'item' : 'items'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Amount</p>
                <p className="text-lg font-bold text-white">{order ? helper.toCurrency((order.amountCents || 0) / 100, { currency: '₦', abbreviate: true }) : "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Order Date</p>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <p className="text-sm text-gray-300">{order ? new Date(order.orderDate).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  }) : "N/A"}</p>
                </div>
              </div>
              {order?.productImage && (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Product Image</p>
                  <img src={order.productImage} alt={order.product} className="h-24 w-24 object-cover rounded border border-[#333]" />
                </div>
              )}
            </div>
          </div>

          {/* Product Variant Details Section */}
          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              Product Variant Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {order?.selectedSize ? (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Size Selected</p>
                  <p className="text-lg font-semibold text-gray-200 bg-gray-900/50 w-fit px-4 py-2 rounded border border-gray-700">{order.selectedSize}</p>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Size Selected</p>
                  <div className="bg-gray-900/30 border border-dashed border-gray-700 rounded p-4 text-center">
                    <p className="text-sm text-gray-400">Size information not available</p>
                    <p className="text-xs text-gray-500 mt-1">Variant data coming soon</p>
                  </div>
                </div>
              )}
              {order?.selectedColor ? (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Color Selected</p>
                  <div className="flex items-center gap-3">
                    {order.selectedColorHex && (
                      <div className="w-8 h-8 rounded border border-gray-600" style={{ backgroundColor: order.selectedColorHex }}></div>
                    )}
                    <span className="text-lg font-semibold text-gray-200">{order.selectedColor}</span>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-500 uppercase font-medium mb-2">Color Selected</p>
                  <div className="bg-gray-900/30 border border-dashed border-gray-700 rounded p-4 text-center">
                    <p className="text-sm text-gray-400">Color information not available</p>
                    <p className="text-xs text-gray-500 mt-1">Variant data coming soon</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Buyer Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Name</p>
                <p className="text-sm text-gray-300">{order?.customer || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Email</p>
                <p className="text-sm text-gray-300">{order?.customerEmail || "Not provided"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Buyer ID</p>
                <p className="text-sm text-gray-300 font-mono">{order?.customer?.slice(0, 12)}...</p>
              </div>
            </div>
          </div>

          {order?.shippingAddress && (
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Shipping Address
              </h2>
              <p className="text-sm text-gray-300">{order.shippingAddress}</p>
            </div>
          )}

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Payment Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Payment Method</p>
                <p className="text-sm text-gray-300 capitalize">{order?.paymentMethod || "N/A"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Payout Status</p>
                {order && (
                  <Badge className={`${
                    order.payoutStatus === 'paid'
                      ? 'bg-green-900/30 text-green-200 border-green-700/30'
                      : order.payoutStatus === 'in_escrow'
                      ? 'bg-yellow-900/30 text-yellow-200 border-yellow-700/30'
                      : 'bg-blue-900/30 text-blue-200 border-blue-700/30'
                  } border text-xs py-1 px-2`}>
                    {order.payoutStatus?.replace(/_/g, ' ') || "N/A"}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
            <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Delivery Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-xs text-gray-500 uppercase font-medium mb-2">Delivery Status</p>
                {order && (
                  <Badge className={`${
                    order.deliveryStatus === 'delivered'
                      ? 'bg-green-900/30 text-green-200 border-green-700/30'
                      : order.deliveryStatus === 'in_transit'
                      ? 'bg-purple-900/30 text-purple-200 border-purple-700/30'
                      : 'bg-gray-900/30 text-gray-200 border-gray-700/30'
                  } border text-xs py-1 px-2`}>
                    {order.deliveryStatus?.replace(/_/g, ' ') || "N/A"}
                  </Badge>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="sticky top-20 bg-[#1a1a1a] border border-[#333] rounded-lg p-6 space-y-4">
            <h2 className="text-lg font-semibold text-white mb-6">Actions</h2>

            {order?.orderStatus === "pending" && (
              <Button
                size="lg"
                className="w-full bg-green-600 hover:bg-green-700 text-white cursor-pointer disabled:cursor-not-allowed"
                onClick={handleConfirmOrder}
                disabled={confirmOrderMutation.isPending}
              >
                {confirmOrderMutation.isPending && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                Confirm Order
              </Button>
            )}

            {order?.orderStatus === "confirmed" && (
              <Button
                size="lg"
                className="w-full bg-yellow-600 hover:bg-yellow-700 text-white cursor-pointer disabled:cursor-not-allowed"
                onClick={handleMarkAsProcessing}
                disabled={updateSaleMutation.isPending}
              >
                {updateSaleMutation.isPending && <Loader className="h-4 w-4 mr-2 animate-spin" />}
                Mark as Processing
              </Button>
            )}

            {order?.orderStatus === "processing" && (
              <Button
                size="lg"
                className="w-full bg-purple-600 hover:bg-purple-700 text-white cursor-pointer"
                onClick={() => setShowShipmentDialog(true)}
              >
                <Truck className="h-4 w-4 mr-2" />
                Mark as Shipped
              </Button>
            )}

            {order?.orderStatus === "shipped" && (
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 text-center">
                <p className="text-sm text-green-200">In Transit</p>
                <p className="text-xs text-green-200/70 mt-1">Waiting for buyer confirmation</p>
              </div>
            )}

            {order?.orderStatus === "delivered" && (
              <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4 text-center">
                <CheckCircle className="h-6 w-6 text-green-500 mx-auto mb-2" />
                <p className="text-sm text-green-200 font-semibold">Order Delivered</p>
                <p className="text-xs text-green-200/70 mt-1">Buyer confirmed receipt</p>
              </div>
            )}

            <div className="mt-8 pt-6 border-t border-[#333]">
              <h3 className="text-sm font-semibold text-gray-300 mb-4">Order Timeline</h3>
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-gray-500 mt-1.5"></div>
                    <div className="w-0.5 h-12 bg-gray-700 my-1"></div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 uppercase">Order Placed</p>
                    <p className="text-sm text-gray-300 mt-1">{order ? new Date(order.orderDate).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }) : "N/A"}</p>
                  </div>
                </div>

                {order && ["confirmed", "processing", "shipped", "delivered"].includes(order.orderStatus) && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mt-1.5"></div>
                      <div className="w-0.5 h-12 bg-gray-700 my-1"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Confirmed</p>
                      <p className="text-sm text-gray-300 mt-1">by seller</p>
                    </div>
                  </div>
                )}

                {order && ["processing", "shipped", "delivered"].includes(order.orderStatus) && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-yellow-500 mt-1.5"></div>
                      <div className="w-0.5 h-12 bg-gray-700 my-1"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Processing</p>
                      <p className="text-sm text-gray-300 mt-1">being prepared</p>
                    </div>
                  </div>
                )}

                {order && ["shipped", "delivered"].includes(order.orderStatus) && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-purple-500 mt-1.5"></div>
                      <div className="w-0.5 h-12 bg-gray-700 my-1"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Shipped</p>
                      <p className="text-sm text-gray-300 mt-1">on the way</p>
                    </div>
                  </div>
                )}

                {order?.orderStatus === "delivered" && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-green-500 mt-1.5"></div>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 uppercase">Delivered</p>
                      <p className="text-sm text-gray-300 mt-1">received by buyer</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Dialog open={showShipmentDialog} onOpenChange={setShowShipmentDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#333] max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl">Mark Order as Shipped</DialogTitle>
            <DialogDescription className="text-gray-400">
              {order ? `Order ID: ${order.orderId.slice(0, 12)}...` : "Loading..."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-[#242424] border border-[#333] rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase mb-2">Product</p>
              <p className="text-sm font-semibold text-gray-200">{order?.product || "N/A"}</p>
              <p className="text-xs text-gray-400 mt-2">{order?.customer || "N/A"}</p>
            </div>

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
              onClick={() => setShowShipmentDialog(false)}
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