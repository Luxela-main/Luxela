'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';
import type { Order, TrackingStep, ProductCategory, PaymentMethod, PayoutStatus, DeliveryStatus, OrderStatus } from '@/types/buyer';
import {
  ArrowLeft,
  CheckCircle,
  AlertCircle,
  Loader,
  MessageCircle,
  Download,
  Star,
  RotateCw,
} from 'lucide-react';

export default function DeliveredOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewText, setReviewText] = useState('');

  const { data: ordersData, isLoading: isDataLoading, error: queryError, refetch } = trpc.buyer.getPurchaseHistory.useQuery(
    { status: 'delivered', page: 1, limit: 100 },
    { retry: 2, retryDelay: 1000 }
  );

  useEffect(() => {
    if (ordersData?.data) {
      const foundOrder = ordersData.data.find((item: any) => item.orderId === orderId);

      if (foundOrder) {
        const mappedOrder: Order = {
          orderId: foundOrder.orderId,
          buyerId: foundOrder.buyerId || '',
          sellerId: foundOrder.sellerId || '',
          listingId: foundOrder.listingId || '',
          productTitle: foundOrder.productTitle,
          productImage: foundOrder.productImage,
          productCategory: foundOrder.productCategory as ProductCategory,
          customerName: foundOrder.customerName || '',
          customerEmail: foundOrder.customerEmail || '',
          recipientEmail: foundOrder.recipientEmail || undefined,
          paymentMethod: (foundOrder.paymentMethod || 'credit_card') as PaymentMethod,
          amountCents: foundOrder.priceCents || foundOrder.amountCents || 0,
          currency: foundOrder.currency || 'NGN',
          payoutStatus: (foundOrder.payoutStatus || 'in_escrow') as PayoutStatus,
          orderStatus: foundOrder.orderStatus as OrderStatus,
          deliveryStatus: foundOrder.deliveryStatus as DeliveryStatus,
          shippingAddress: foundOrder.shippingAddress || undefined,
          trackingNumber: foundOrder.trackingNumber || undefined,
          estimatedArrival: foundOrder.estimatedArrival ? new Date(foundOrder.estimatedArrival) : undefined,
          deliveredDate: foundOrder.deliveredDate ? new Date(foundOrder.deliveredDate) : undefined,
          orderDate: new Date(foundOrder.orderDate),
          createdAt: new Date(foundOrder.createdAt || foundOrder.orderDate),
          updatedAt: new Date(foundOrder.updatedAt || foundOrder.orderDate),
        };
        setOrder(mappedOrder);
        setError(null);
      } else {
        setError('Order not found');
      }
    }

    setIsLoading(isDataLoading);
    if (queryError) {
      setError('Failed to load order details');
    }
  }, [ordersData, isDataLoading, queryError, orderId]);

  const getTrackingSteps = (order: Order): TrackingStep[] => {
    return [
      { label: 'Order Placed', completed: true, date: order.createdAt },
      {
        label: 'Processing',
        completed: ['confirmed', 'processing', 'shipped', 'delivered'].includes(order.orderStatus),
        date: undefined,
      },
      {
        label: 'Shipped',
        completed: ['shipped', 'delivered'].includes(order.orderStatus),
        date: undefined,
      },
      {
        label: 'In Transit',
        completed: ['shipped', 'delivered'].includes(order.orderStatus),
        date: undefined,
      },
      {
        label: 'Delivered',
        completed: order.orderStatus === 'delivered',
        date: order.deliveredDate,
      },
    ];
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <div className="flex justify-center items-center py-12">
            <Loader className="text-[#8451e1] animate-spin" size={32} />
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-[#0e0e0e]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 px-4 py-2 rounded bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white transition text-sm mb-6"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <div className="flex-1">
              <p className="text-red-400 font-semibold">{error || 'Order not found'}</p>
            </div>
            <button
              onClick={() => refetch()}
              className="ml-auto px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded text-sm transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0e0e0e]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <Breadcrumb
          items={[
            { label: 'Dashboard', href: '/buyer/dashboard' },
            { label: 'Orders', href: '/buyer/dashboard/orders' },
            { label: 'Delivered', href: '/buyer/dashboard/orders/delivered' },
            { label: `Order ${order.orderId.slice(0, 8)}` },
          ]}
        />

        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded bg-[#1a1a1a] hover:bg-[#252525] text-gray-400 hover:text-white transition text-sm mb-6"
        >
          <ArrowLeft size={18} />
          Back to Delivered Orders
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Status Section */}
            <div className="bg-green-500/10 border border-[#333] rounded-lg p-6">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-2xl font-bold text-white mb-1">
                    Order #{order.orderId.slice(0, 8)}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {order.orderDate.toLocaleDateString('en-US', {
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle className="text-green-500" size={20} />
                  <span className="font-bold text-lg text-green-400">Delivered</span>
                </div>
              </div>

              <p className="text-gray-300">
                Your order was delivered on {order.deliveredDate ? order.deliveredDate.toLocaleDateString() : 'Recently'}. Thank you for your purchase!
              </p>
            </div>

            {/* Product Information */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <h3 className="text-white font-bold text-lg mb-4">Product Information</h3>

              <div className="flex gap-4">
                {order.productImage && (
                  <img
                    src={order.productImage}
                    alt={order.productTitle}
                    className="w-24 h-32 object-cover rounded bg-[#2a2a2a]"
                  />
                )}

                <div className="flex-1">
                  <h4 className="text-white font-semibold mb-2">{order.productTitle}</h4>
                  <p className="text-gray-400 text-sm mb-3">
                    Category: <span className="text-white capitalize">{order.productCategory || 'Fashion'}</span>
                  </p>
                  <p className="text-[#8451e1] font-bold text-lg">
                    ${(order.amountCents / 100).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tracking Timeline */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <h3 className="text-white font-bold text-lg mb-6">Tracking Timeline</h3>
              <div className="space-y-4">
                {getTrackingSteps(order).map((step, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-2 flex-shrink-0 ${
                          step.completed
                            ? 'bg-[#8451e1] border-[#8451e1]'
                            : 'border-[#333] bg-transparent'
                        }`}
                      >
                        {step.completed && <CheckCircle className="text-white" size={18} />}
                      </div>
                      {idx < getTrackingSteps(order).length - 1 && (
                        <div
                          className={`w-0.5 h-12 ${
                            step.completed ? 'bg-[#8451e1]' : 'bg-[#333]'
                          }`}
                        />
                      )}
                    </div>
                    <div className="pt-2 pb-4">
                      <p className="text-white font-semibold text-sm">{step.label}</p>
                      {step.date && (
                        <p className="text-gray-400 text-xs mt-1">
                          {step.date.toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Shipping Details */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <h3 className="text-white font-bold text-lg mb-4">Shipping Address</h3>
              <div className="space-y-2">
                <p className="text-white">{order.customerName}</p>
                <p className="text-gray-300 text-sm">
                  {order.shippingAddress || '123 Fashion Street, Style City, SC 12345'}
                </p>
                <p className="text-gray-400 text-sm mt-3">Email: {order.customerEmail}</p>
              </div>
            </div>

            {/* Review Form */}
            {!showReviewForm ? (
              <button
                onClick={() => setShowReviewForm(true)}
                className="w-full bg-[#8451e1] hover:bg-[#7043d8] text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <Star size={16} />
                Leave a Review
              </button>
            ) : (
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
                <h3 className="text-white font-bold text-lg mb-4">Rate Your Order</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Rating</label>
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setReviewRating(star)}
                          className={`text-2xl transition ${
                            star <= reviewRating ? 'text-yellow-400' : 'text-gray-600'
                          }`}
                        >
                          ★
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-gray-400 text-sm mb-2 block">Your Review</label>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Share your experience with this product..."
                      className="w-full bg-[#0e0e0e] border border-[#2a2a2a] text-white rounded-lg p-3 focus:outline-none focus:border-[#8451e1] text-sm"
                      rows={4}
                    />
                  </div>

                  <div className="flex gap-3">
                    <button className="flex-1 bg-[#8451e1] hover:bg-[#7043d8] text-white px-4 py-2 rounded-lg font-semibold transition">
                      Submit Review
                    </button>
                    <button
                      onClick={() => setShowReviewForm(false)}
                      className="flex-1 bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-2 rounded-lg font-semibold transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <h3 className="text-white font-bold text-lg mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">${(order.amountCents / 100).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-white">Free</span>
                </div>
                <div className="pt-3 border-t border-[#2a2a2a]">
                  <div className="flex justify-between">
                    <span className="text-white font-bold">Total</span>
                    <span className="text-[#8451e1] font-bold text-lg">
                      ${(order.amountCents / 100).toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Info */}
            <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-6">
              <h3 className="text-white font-bold text-lg mb-4">Payment Details</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Method</span>
                  <span className="text-white text-sm capitalize">
                    {order.paymentMethod?.replace(/_/g, ' ') || 'Credit Card'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 text-sm">Status</span>
                  <span className="inline-flex items-center text-green-400 text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-400 mr-2" />
                    Completed
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <button className="w-full bg-[#8451e1] hover:bg-[#7043d8] text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <MessageCircle size={16} />
                Contact Seller
              </button>

              <button className="w-full bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <RotateCw size={16} />
                Return / Refund
              </button>

              <button className="w-full bg-[#2a2a2a] hover:bg-[#333] text-white px-4 py-3 rounded-lg font-semibold transition flex items-center justify-center gap-2">
                <Download size={16} />
                Download Invoice
              </button>
            </div>

            {/* Info Box */}
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <p className="text-green-400 text-sm font-semibold mb-2">Delivered</p>
              <p className="text-gray-300 text-xs">
                Your order has been successfully delivered. Share your experience to help other buyers!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}