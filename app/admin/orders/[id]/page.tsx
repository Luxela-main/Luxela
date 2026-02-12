'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { formatNaira } from '@/lib/currency';
import {
  Loader2,
  ArrowLeft,
  Package,
  User,
  MapPin,
  DollarSign,
  Truck,
  AlertTriangle,
  CheckCircle,
  MessageSquare,
  RefreshCw,
  Clock,
} from 'lucide-react';
import Link from 'next/link';

const ORDER_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-500/10 text-yellow-500',
  confirmed: 'bg-blue-500/10 text-blue-500',
  processing: 'bg-purple-500/10 text-purple-500',
  shipped: 'bg-cyan-500/10 text-cyan-500',
  delivered: 'bg-green-500/10 text-green-500',
  canceled: 'bg-red-500/10 text-red-500',
  returned: 'bg-orange-500/10 text-orange-500',
};

interface OrderDetail {
  id: string;
  buyer_id: string | null;
  seller_id: string | null;
  listing_id: string | null;
  product_title: string | null;
  product_image: string | null;
  customer_name: string | null;
  customer_email: string | null;
  order_status: string;
  delivery_status: string | null;
  amount_cents: number;
  currency: string | null;
  shipping_address: string | null;
  tracking_number: string | null;
  order_date: string | null;
  delivered_date: string | null;
  payment_method?: string | null;
  payout_status?: string | null;
  product_category?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
  shipped_at?: string | null;
  history?: Array<{ status: string; created_at: string }> | null;
}

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params.id as string;
  const [showDisputeDialog, setShowDisputeDialog] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [disputeReason, setDisputeReason] = useState('');
  const [cancelReason, setCancelReason] = useState('');

  
  const { data: orderData, isLoading } = trpc.orderStatus.getOrderById.useQuery(
    { orderId }
  ) as { data: OrderDetail | undefined; isLoading: boolean };

  const handleResolveDispute = () => {
    
    setShowDisputeDialog(false);
    setDisputeReason('');
  };

  const handleCancelOrder = () => {
    
    setShowCancelDialog(false);
    setCancelReason('');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 text-[#8451e1] animate-spin" />
      </div>
    );
  }

  if (!orderData) {
    return (
      <div className="space-y-6">
        <Link href="/admin/orders">
          <Button variant="ghost" className="text-[#8451e1]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Orders
          </Button>
        </Link>
        <div className="text-center py-10 text-gray-400">Order not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/admin/orders">
            <Button variant="ghost" className="text-[#8451e1]">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-white">
              Order {orderData.id?.substring(0, 8)}
            </h1>
            <p className="text-gray-400 text-sm">
              {new Date(orderData.created_at || '').toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>

      {}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Order Status
                </p>
                <Badge
                  className={`${ORDER_STATUS_COLORS[
                    orderData.order_status || 'pending'
                  ]}`}
                >
                  {(orderData.order_status || 'pending')
                    .charAt(0)
                    .toUpperCase() +
                    (orderData.order_status || 'pending').slice(1)}
                </Badge>
              </div>
              <Package className="w-5 h-5 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Amount
                </p>
                <p className="text-2xl font-bold text-white">
                  {formatNaira((orderData?.amount_cents || 0), false)}
                </p>
              </div>
              <DollarSign className="w-5 h-5 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Delivery Status
                </p>
                <Badge variant="outline" className="border-gray-600 text-gray-300">
                  In Transit
                </Badge>
              </div>
              <Truck className="w-5 h-5 text-cyan-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {}
        <div className="lg:col-span-2 space-y-6">
          {}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Package className="w-5 h-5" />
                Product Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 aspect-square bg-[#1a1a1a] rounded-lg flex items-center justify-center">
                  <div className="text-gray-400 text-center">
                    <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>Product Image</p>
                  </div>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Product Name
                </p>
                <p className="text-white">Premium Leather Handbag</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    Category
                  </p>
                  <p className="text-white">Accessories</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-400 mb-1">
                    Quantity
                  </p>
                  <p className="text-white">1</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="w-5 h-5" />
                Customer Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Customer Name
                </p>
                <p className="text-white">John Doe</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Email
                </p>
                <p className="text-white">john@example.com</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Shipping Address
                </p>
                <p className="text-white text-sm">
                  123 Main Street, New York, NY 10001
                </p>
              </div>
            </CardContent>
          </Card>

          {}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Truck className="w-5 h-5" />
                Shipping Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Tracking Number
                </p>
                <p className="text-white font-mono">TRK-1234-5678-9012</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Carrier
                </p>
                <p className="text-white">FedEx</p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400 mb-1">
                  Estimated Arrival
                </p>
                <p className="text-white">Dec 22, 2024</p>
              </div>
              <Button className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30">
                Track Shipment
              </Button>
            </CardContent>
          </Card>

          {}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Order Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderData.history?.map((event: any, index: number) => (
                  <div key={index} className="flex gap-4">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-[#8451e1] mt-1.5"></div>
                      {index < (orderData.history?.length || 0) - 1 && (
                        <div className="absolute top-3 left-1.5 w-0.5 h-8 bg-[#1a1a1a]"></div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-white capitalize">
                        {event.status?.replace('_', ' ')}
                      </p>
                      <p className="text-sm text-gray-400">
                        {new Date(event.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                )) || (
                  <div className="text-gray-400 text-sm">No history available</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {}
        <div className="space-y-6">
          {}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white">Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/30">
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Delivery
              </Button>
              <Button className="w-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 border border-blue-500/30">
                <MessageSquare className="w-4 h-4 mr-2" />
                Send Message
              </Button>
              <Button
                onClick={() => setShowDisputeDialog(true)}
                className="w-full bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500/20 border border-yellow-500/30"
              >
                <AlertTriangle className="w-4 h-4 mr-2" />
                Handle Dispute
              </Button>
              <Button
                onClick={() => setShowCancelDialog(true)}
                className="w-full bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/30"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Cancel Order
              </Button>
            </CardContent>
          </Card>

          {}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Subtotal</span>
                <span className="text-white">{formatNaira(1200, true)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shipping</span>
                <span className="text-white">{formatNaira(20, true)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tax</span>
                <span className="text-white">{formatNaira(14.56, true)}</span>
              </div>
              <div className="border-t border-[#1a1a1a] pt-3 flex justify-between">
                <span className="font-medium text-white">Total</span>
                <span className="text-2xl font-bold text-[#8451e1]">
                  $1,234.56
                </span>
              </div>
            </CardContent>
          </Card>

          {}
          <Card className="bg-[#0e0e0e] border-[#1a1a1a]">
            <CardHeader>
              <CardTitle className="text-white text-sm">Customer Info</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1">Total Orders</p>
                <p className="text-lg font-bold text-white">24</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1">Lifetime Value</p>
                <p className="text-lg font-bold text-white">{formatNaira(8432.10, true)}</p>
              </div>
              <Link href="/admin/members">
                <Button variant="outline" className="w-full border-[#1a1a1a] text-[#8451e1] hover:bg-[#1a1a1a]">
                  View Profile
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </div>

      {}
      <Dialog open={showDisputeDialog} onOpenChange={setShowDisputeDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">Handle Dispute</DialogTitle>
            <DialogDescription className="text-gray-400">
              Document and resolve this customer dispute
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Dispute Reason
              </label>
              <Textarea
                placeholder="Enter dispute reason and resolution..."
                className="bg-[#0e0e0e] border-[#2a2a2a] text-white placeholder-gray-600"
                value={disputeReason}
                onChange={(e) => setDisputeReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="border-[#1a1a1a]"
                onClick={() => setShowDisputeDialog(false)}
              >
                Cancel
              </Button>
              <Button
                className="bg-[#8451e1] hover:bg-[#7241d1] text-white"
                onClick={handleResolveDispute}
              >
                Resolve Dispute
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-[#1a1a1a] border-[#2a2a2a]">
          <DialogHeader>
            <DialogTitle className="text-white">Cancel Order</DialogTitle>
            <DialogDescription className="text-gray-400">
              Are you sure you want to cancel this order? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-gray-400 mb-2 block">
                Cancellation Reason
              </label>
              <Textarea
                placeholder="Enter cancellation reason..."
                className="bg-[#0e0e0e] border-[#2a2a2a] text-white placeholder-gray-600"
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button
                variant="outline"
                className="border-[#1a1a1a]"
                onClick={() => setShowCancelDialog(false)}
              >
                Keep Order
              </Button>
              <Button
                className="bg-red-500 hover:bg-red-600 text-white"
                onClick={handleCancelOrder}
              >
                Cancel Order
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}