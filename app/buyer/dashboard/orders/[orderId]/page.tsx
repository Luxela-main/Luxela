'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useRealtimeOrders } from '@/hooks/useRealtimeOrders';
import { useOrderActions } from '@/app/buyer/dashboard/orders/useOrderActions';
import { useInvoiceActions } from '@/hooks/buyer/useInvoiceActions';
import { Breadcrumb } from '@/components/buyer/dashboard/breadcrumb';
import { InvoiceDisplay } from '@/components/buyer/dashboard/InvoiceDisplay';
import { ReviewModal } from '@/components/buyer/dashboard/modals/ReviewModal';
import { ReturnModal } from '@/components/buyer/dashboard/modals/ReturnModal';
import { CancelOrderModal } from '@/components/buyer/dashboard/modals/CancelOrderModal';
import { ContactSellerModal } from '@/components/buyer/dashboard/modals/ContactSellerModal';
import { ContactSupportModal } from '@/components/buyer/dashboard/modals/ContactSupportModal';
import type { Order, OrderStatus, PaymentMethod, PayoutStatus, DeliveryStatus, ProductCategory } from '@/types/buyer';
import {
  ArrowLeft,
  CheckCircle,
  Clock,
  Truck,
  AlertCircle,
  Loader,
  MessageCircle,
  Download,
  RefreshCw,
  XCircle,
  Star,
  ShoppingBag,
  MapPin,
  Calendar,
  Package,
  Eye,
  EyeOff,
  Printer,
  Share2,
} from 'lucide-react';
import { useToast } from '@/components/hooks/useToast';
import Link from 'next/link';

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.orderId as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'tracking' | 'invoice' | 'actions'>('overview');
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  
  // Modal states
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isReturnModalOpen, setIsReturnModalOpen] = useState(false);
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false);
  const [isContactSellerModalOpen, setIsContactSellerModalOpen] = useState(false);
  const [isContactSupportModalOpen, setIsContactSupportModalOpen] = useState(false);

  const invoiceRef = useRef<HTMLDivElement>(null);
  const toastHandler = useToast();
  
  // Custom hooks
  const orderActions = useOrderActions();
  const invoiceActions = useInvoiceActions({
    onSuccess: () => {
      toastHandler.success('Invoice downloaded successfully');
    },
    onError: (error) => {
      toastHandler.error(error.message);
    },
  });

  const { data: ordersData, isLoading: isDataLoading, error: queryError, refetch } = trpc.buyer.getPurchaseHistory.useQuery(
    { page: 1, limit: 50 },
    { retry: 2, retryDelay: 1000 }
  );

  const { startPolling } = useRealtimeOrders({
    enabled: true,
    refetchInterval: 30000,
    staleTime: 10000,
    refetchOnWindowFocus: true,
    refetchOnInteraction: true,
    adaptiveRefresh: true,
    maxRetries: 5,
  });

  useEffect(() => {
    startPolling();
  }, [startPolling]);

  // Handle invoice download
  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      await invoiceActions.downloadInvoice('invoice-content', order);
    } catch (error) {
      console.error('Failed to download invoice:', error);
    }
  };

  // Handle print invoice
  const handlePrintInvoice = () => {
    invoiceActions.printInvoice('invoice-content');
  };

  // Handle refresh order
  const handleRefreshOrder = async () => {
    setIsRefreshing(true);
    try {
      await refetch();
      toastHandler.success('Order details refreshed');
    } catch (error) {
      toastHandler.error('Failed to refresh order details');
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handle share invoice
  const handleShareInvoice = async () => {
    if (!order) return;
    try {
      await invoiceActions.shareInvoice('invoice-content', order);
    } catch (error) {
      console.error('Failed to share invoice:', error);
    }
  };

  useEffect(() => {
    if (ordersData?.data) {
      const foundOrder = ordersData.data.find((item: any) => item.orderId === orderId);
      if (foundOrder) {
        const validStatuses: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'canceled', 'returned'];
        const orderStatus = (validStatuses.includes(foundOrder.orderStatus as any) ? foundOrder.orderStatus : 'pending') as OrderStatus;
        
        const validCategories: ProductCategory[] = ['mens', 'womens', 'kids', 'accessories', 'footwear', 'outerwear', 'sportswear', 'formal', 'casual', 'streetwear'];
        const productCategory = (validCategories.includes(foundOrder.productCategory as any) ? foundOrder.productCategory : 'casual') as ProductCategory;
        
        const validPaymentMethods: PaymentMethod[] = ['credit_card', 'debit_card', 'paypal', 'apple_pay', 'google_pay', 'bank_transfer'];
        const paymentMethod = (validPaymentMethods.includes(foundOrder.paymentMethod as any) ? foundOrder.paymentMethod : 'credit_card') as PaymentMethod;
        
        const validPayoutStatuses: PayoutStatus[] = ['in_escrow', 'released', 'refunded', 'disputed'];
        const payoutStatus = (validPayoutStatuses.includes(foundOrder.payoutStatus as any) ? foundOrder.payoutStatus : 'in_escrow') as PayoutStatus;
        
        const validDeliveryStatuses: DeliveryStatus[] = ['not_shipped', 'in_transit', 'delivered', 'failed', 'returned'];
        const deliveryStatus = (validDeliveryStatuses.includes(foundOrder.deliveryStatus as any) ? foundOrder.deliveryStatus : 'not_shipped') as DeliveryStatus;
        
        const createdAtDate = foundOrder.createdAt ? new Date(foundOrder.createdAt) : new Date();
        const deliveredDateValue = foundOrder.deliveredDate ? new Date(foundOrder.deliveredDate) : undefined;
        const estimatedArrivalValue = foundOrder.estimatedArrival ? new Date(foundOrder.estimatedArrival) : undefined;
        
        const mappedOrder: Order = {
          ...foundOrder,
          orderId: foundOrder.orderId,
          buyerId: foundOrder.buyerId || '',
          sellerId: foundOrder.sellerId || '',
          listingId: foundOrder.listingId || '',
          productTitle: foundOrder.productTitle || 'N/A',
          productCategory: productCategory,
          customerName: foundOrder.customerName || '',
          customerEmail: foundOrder.customerEmail || '',
          quantity: foundOrder.quantity || 1,
          orderStatus: orderStatus,
          trackingNumber: foundOrder.trackingNumber || undefined,
          createdAt: createdAtDate,
          deliveredDate: deliveredDateValue,
          estimatedArrival: estimatedArrivalValue,
          paymentMethod: paymentMethod,
          amountCents: foundOrder.amountCents || foundOrder.priceCents || 0,
          currency: foundOrder.currency || 'NGN',
          payoutStatus: payoutStatus,
          deliveryStatus: deliveryStatus,
          orderDate: foundOrder.orderDate ? new Date(foundOrder.orderDate) : createdAtDate,
          updatedAt: foundOrder.updatedAt ? new Date(foundOrder.updatedAt) : new Date(),
          // Include seller information from API response
          sellerStoreName: foundOrder.sellerStoreName || 'LUXELA Store',
          sellerName: foundOrder.sellerName || 'Store Manager',
          sellerEmail: foundOrder.sellerEmail || 'support@theluxela.com',
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, { bg: string; text: string; border: string }> = {
      pending: { bg: 'from-yellow-500 to-amber-500', text: 'text-yellow-300', border: 'border-yellow-400/30' },
      confirmed: { bg: 'from-blue-500 to-cyan-500', text: 'text-blue-300', border: 'border-blue-400/30' },
      processing: { bg: 'from-blue-500 to-indigo-500', text: 'text-blue-300', border: 'border-blue-400/30' },
      shipped: { bg: 'from-purple-500 to-pink-500', text: 'text-purple-300', border: 'border-purple-400/30' },
      delivered: { bg: 'from-emerald-500 to-green-500', text: 'text-emerald-300', border: 'border-emerald-400/30' },
      canceled: { bg: 'from-red-500 to-orange-500', text: 'text-red-300', border: 'border-red-400/30' },
      returned: { bg: 'from-red-500 to-orange-500', text: 'text-red-300', border: 'border-red-400/30' },
    };
    return colors[status] || colors.pending;
  };

  const formatPrice = (cents: number): string => {
    return (cents / 100).toLocaleString('en-NG', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    });
  };

  const getPrice = () => {
    const cents = (order as any)?.totalPriceCents || (order as any)?.amountCents || 0;
    return formatPrice(cents);
  };

  const canReview = order?.orderStatus === 'delivered' && !(order as any).reviewedAt;
  const canReturn = order && ['delivered'].includes(order.orderStatus) && (order as any).returnEligible !== false;
  const canCancel = order && ['pending', 'confirmed', 'processing'].includes(order.orderStatus);
  const canRequestReturn = order?.orderStatus === 'delivered';

  const getFormattedDate = (date: Date | string | null | undefined) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  };

  const getTrackingProgress = () => {
    const steps: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
    const currentIndex = steps.indexOf(order?.orderStatus || 'pending');
    return ((currentIndex + 1) / steps.length) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] via-[#0a0a0a] to-[#000000]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col items-center justify-center py-20">
            <Loader className="w-10 h-10 text-[#8451E1] animate-spin mb-4" />
            <p className="text-gray-400 text-lg">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] via-[#0a0a0a] to-[#000000]">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8451E1] hover:text-[#c084fc] mb-6 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Orders</span>
          </button>

          <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-6 flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-red-300 font-semibold mb-1">Failed to load order</h3>
              <p className="text-red-400/70 text-sm">{error || 'Order not found'}</p>
            </div>
            <button
              onClick={() => {
                refetch();
                toastHandler.success('Retrying...');
              }}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition whitespace-nowrap text-sm font-medium"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusColor(order.orderStatus);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0e0e0e] via-[#0a0a0a] to-[#000000]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-[#8451E1] hover:text-[#c084fc] transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Orders</span>
          </button>
          <button
            onClick={handleRefreshOrder}
            disabled={isRefreshing}
            className="flex items-center gap-2 px-4 py-2 bg-[#8451E1]/20 hover:bg-[#8451E1]/30 border border-[#8451E1]/60 text-[#8451E1] font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh order details"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Order Header Card */}
        <div className="bg-gradient-to-br from-[#1a1a2e]/60 to-[#0f0f1a]/60 border border-[#8451E1]/30 rounded-xl p-6 sm:p-8 mb-8 backdrop-blur-xl">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 mb-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-white mb-2">{order.productTitle}</h1>
              <p className="text-gray-400 mb-4">Order ID: <span className="font-mono text-[#8451E1]">{order.orderId}</span></p>

              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r ${statusConfig.bg} bg-opacity-20 border ${statusConfig.border}`}>
                {order.orderStatus === ('delivered' as OrderStatus) && <CheckCircle className="w-5 h-5" />}
                {order.orderStatus === ('shipped' as OrderStatus) && <Truck className="w-5 h-5" />}
                {(['pending', 'confirmed', 'processing'] as OrderStatus[]).includes(order.orderStatus) && <Clock className="w-5 h-5" />}
                {(['canceled', 'returned'] as OrderStatus[]).includes(order.orderStatus) && <XCircle className="w-5 h-5" />}
                <span className="text-sm font-semibold uppercase tracking-wider">
                  {order.orderStatus.charAt(0).toUpperCase() + order.orderStatus.slice(1)}
                </span>
              </div>
            </div>

            <div className="text-right">
              <p className="text-gray-500 text-sm mb-1">Order Total</p>
              <p className="text-4xl font-bold bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent">
                ₦{getPrice()}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          {!(['canceled', 'returned'] as OrderStatus[]).includes(order.orderStatus) && (
            <div className="space-y-2">
              <div className="w-full h-2 bg-[#0a0a0a] rounded-full overflow-hidden border border-[#8451E1]/20">
                <div
                  className="h-full bg-gradient-to-r from-[#8451E1] to-[#c084fc] transition-all duration-500"
                  style={{ width: `${getTrackingProgress()}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 text-right">Tracking progress</p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-8 border-b border-[#8451E1]/20 overflow-x-auto">
          {(['overview', 'tracking', 'invoice', 'actions'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium transition relative whitespace-nowrap ${
                activeTab === tab
                  ? 'text-[#8451E1]'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-[#8451E1] to-[#c084fc]" />
              )}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Product Info */}
            <div className="bg-[#1a1a2e]/30 border border-[#8451E1]/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Product Information</h3>
              <div className="flex gap-6">
                {order.productImage && (
                  <div className="flex-shrink-0">
                    <img
                      src={order.productImage}
                      alt={order.productTitle}
                      className="w-24 h-32 object-cover rounded-lg border border-[#8451E1]/20"
                    />
                  </div>
                )}
                <div className="flex-1 space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-gray-500 text-sm">Product Name</p>
                      <p className="text-white font-medium">{order.productTitle}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Category</p>
                      <p className="text-white font-medium">{order.productCategory || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Quantity</p>
                      <p className="text-white font-medium">{order.quantity || 1}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-sm">Unit Price</p>
                      <p className="text-white font-medium">₦{getPrice()}</p>
                    </div>
                    {order.sizes && order.sizes.length > 0 && (
                      <div>
                        <p className="text-gray-500 text-sm">Sizes</p>
                        <p className="text-white font-medium">{order.sizes.join(', ')}</p>
                      </div>
                    )}
                    {order.colors && order.colors.length > 0 && (
                      <div>
                        <p className="text-gray-500 text-sm">Colors</p>
                        <p className="text-white font-medium">{order.colors.join(', ')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Timeline */}
            <div className="bg-[#1a1a2e]/30 border border-[#8451E1]/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-6">Order Timeline</h3>
              <div className="space-y-4">
                {order.createdAt && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-[#8451E1] mb-2" />
                      <div className="w-0.5 h-12 bg-[#8451E1]/30" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Order Placed</p>
                      <p className="text-gray-400 text-sm">{getFormattedDate(order.createdAt)}</p>
                    </div>
                  </div>
                )}

                {order.orderStatus !== ('pending' as OrderStatus) && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-4 h-4 rounded-full ${order.orderStatus !== ('pending' as OrderStatus) ? 'bg-[#8451E1]' : 'bg-[#8451E1]/30'} mb-2`} />
                      {order.orderStatus !== ('delivered' as OrderStatus) && order.orderStatus !== ('canceled' as OrderStatus) && (
                        <div className="w-0.5 h-12 bg-[#8451E1]/30" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">Confirmed</p>
                      <p className="text-gray-400 text-sm">Order confirmed and processing</p>
                    </div>
                  </div>
                )}

                {(['shipped', 'delivered'] as OrderStatus[]).includes(order.orderStatus) && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-[#8451E1] mb-2" />
                      {order.orderStatus === ('delivered' as OrderStatus) && (
                        <div className="w-0.5 h-12 bg-[#8451E1]/30" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">Shipped</p>
                      <p className="text-gray-400 text-sm">
                        {(order as any).trackingNumber ? `Tracking: ${(order as any).trackingNumber}` : 'In transit'}
                      </p>
                    </div>
                  </div>
                )}

                {order.orderStatus === ('delivered' as OrderStatus) && (
                  <div className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-4 h-4 rounded-full bg-emerald-500" />
                    </div>
                    <div>
                      <p className="text-white font-medium">Delivered</p>
                      <p className="text-gray-400 text-sm">{getFormattedDate(order.deliveredDate)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary */}
            <div className="bg-[#1a1a2e]/30 border border-[#8451E1]/20 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Order Summary</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-white">₦{getPrice()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-white">Free</span>
                </div>
                <div className="h-px bg-[#8451E1]/20" />
                <div className="flex justify-between text-lg">
                  <span className="text-white font-semibold">Total</span>
                  <span className="bg-gradient-to-r from-[#8451E1] to-[#c084fc] bg-clip-text text-transparent font-bold">
                    ₦{getPrice()}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tracking Tab */}
        {activeTab === 'tracking' && (
          <div className="bg-[#1a1a2e]/30 border border-[#8451E1]/20 rounded-xl p-6">
            {(order as any).trackingNumber ? (
              <div className="space-y-4">
                <div>
                  <p className="text-gray-500 text-sm mb-1">Tracking Number</p>
                  <p className="text-xl font-mono text-[#8451E1] font-semibold">{(order as any).trackingNumber}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-sm mb-1">Carrier</p>
                  <p className="text-white font-medium">{(order as any).carrier || 'Standard Shipping'}</p>
                </div>
                {(order as any).trackingUrl && (
                  <a
                    href={(order as any).trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white font-semibold rounded-lg transition mt-4"
                  >
                    <Truck className="w-5 h-5" />
                    <span>Track Package</span>
                  </a>
                )}
              </div>
            ) : (
              <div className="text-center py-12">
                <Package className="w-12 h-12 text-[#8451E1]/30 mx-auto mb-3" />
                <p className="text-gray-400">Tracking information will be available once your order ships</p>
              </div>
            )}
          </div>
        )}

        {/* Invoice Tab */}
        {activeTab === 'invoice' && (
          <div className="space-y-6">
            {/* Invoice Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={handleDownloadInvoice}
                disabled={invoiceActions.isDownloading}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-[#8451E1] to-[#7240D0] hover:shadow-lg hover:shadow-[#8451E1]/30 text-white font-semibold rounded-lg transition disabled:opacity-50"
              >
                {invoiceActions.isDownloading ? (
                  <>
                    <Loader className="w-5 h-5 animate-spin" />
                    <span>{Math.round(invoiceActions.progress)}%</span>
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    <span>Download PDF</span>
                  </>
                )}
              </button>
              <button
                onClick={handlePrintInvoice}
                className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#8451E1]/20 hover:bg-[#8451E1]/30 border border-[#8451E1]/60 text-[#8451E1] font-semibold rounded-lg transition"
              >
                <Printer className="w-5 h-5" />
                <span>Print</span>
              </button>
              {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
                <button
                  onClick={handleShareInvoice}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-[#8451E1]/20 hover:bg-[#8451E1]/30 border border-[#8451E1]/60 text-[#8451E1] font-semibold rounded-lg transition"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </button>
              )}
            </div>

            {/* Preview Toggle */}
            <button
              onClick={() => setShowInvoicePreview(!showInvoicePreview)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#0a0a0a]/50 hover:bg-[#0a0a0a]/70 border border-[#8451E1]/20 text-[#8451E1] font-semibold rounded-lg transition"
            >
              {showInvoicePreview ? (
                <>
                  <EyeOff className="w-5 h-5" />
                  <span>Hide Preview</span>
                </>
              ) : (
                <>
                  <Eye className="w-5 h-5" />
                  <span>Show Preview</span>
                </>
              )}
            </button>

            {/* Invoice Preview */}
            {showInvoicePreview && (
              <div className="overflow-auto border border-[#8451E1]/20 rounded-lg bg-white max-h-96">
                <InvoiceDisplay order={order} hideActionButtons />
              </div>
            )}
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            {/* Review Button */}
            {canReview && (
              <button
                onClick={() => setIsReviewModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:shadow-lg hover:shadow-amber-500/30 text-white font-semibold rounded-lg transition"
              >
                <Star className="w-5 h-5" />
                <span>Leave a Review</span>
              </button>
            )}

            {/* Return Button */}
            {canRequestReturn && (
              <button
                onClick={() => setIsReturnModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:shadow-lg hover:shadow-orange-500/30 text-white font-semibold rounded-lg transition"
              >
                <RefreshCw className="w-5 h-5" />
                <span>Request Return</span>
              </button>
            )}

            {/* Cancel Order Button */}
            {canCancel && (
              <button
                onClick={() => setIsCancelModalOpen(true)}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 hover:shadow-lg hover:shadow-red-500/30 text-white font-semibold rounded-lg transition"
              >
                <XCircle className="w-5 h-5" />
                <span>Cancel Order</span>
              </button>
            )}

            {/* Contact Seller */}
            <button
              onClick={() => setIsContactSellerModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#8451E1]/20 hover:bg-[#8451E1]/30 border border-[#8451E1]/60 text-[#8451E1] font-semibold rounded-lg transition"
            >
              <MessageCircle className="w-5 h-5" />
              <span>Contact Seller</span>
            </button>

            {/* Contact Support */}
            <button
              onClick={() => setIsContactSupportModalOpen(true)}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-[#8451E1]/20 hover:bg-[#8451E1]/30 border border-[#8451E1]/60 text-[#8451E1] font-semibold rounded-lg transition"
            >
              <AlertCircle className="w-5 h-5" />
              <span>Contact Support</span>
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      {order && (
        <>
          {/* Review Modal */}
          <ReviewModal
            isOpen={isReviewModalOpen}
            orderId={order.orderId}
            productTitle={order.productTitle}
            onClose={() => setIsReviewModalOpen(false)}
            onSubmit={async (rating, review) => {
              try {
                // Call submit review mutation here
                toastHandler.success('Review submitted successfully!');
                refetch();
                setIsReviewModalOpen(false);
              } catch (error: any) {
                toastHandler.error(error?.message || 'Failed to submit review');
              }
            }}
          />

          {/* Return Modal */}
          <ReturnModal
            isOpen={isReturnModalOpen}
            orderId={order.orderId}
            productTitle={order.productTitle}
            onClose={() => setIsReturnModalOpen(false)}
            onSubmit={async (reason, description) => {
              await orderActions.requestReturn(order.orderId, reason, description);
            }}
            isLoading={orderActions.isSubmittingReturn}
          />

          {/* Cancel Order Modal */}
          <CancelOrderModal
            isOpen={isCancelModalOpen}
            orderId={order.orderId}
            productTitle={order.productTitle}
            orderTotal={`₦${getPrice()}`}
            onClose={() => setIsCancelModalOpen(false)}
            onSubmit={async (reason) => {
              await orderActions.cancelOrder(order.orderId, reason);
            }}
            isLoading={orderActions.isCancellingOrder}
          />

          {/* Contact Seller Modal */}
          <ContactSellerModal
            isOpen={isContactSellerModalOpen}
            orderId={order.orderId}
            productTitle={order.productTitle}
            sellerName={(order as any).sellerName}
            onClose={() => setIsContactSellerModalOpen(false)}
            onSubmit={async (message) => {
              await orderActions.contactSeller(order.orderId, order.sellerId, message);
            }}
            isLoading={orderActions.isSubmittingSupport}
          />

          {/* Contact Support Modal */}
          <ContactSupportModal
            isOpen={isContactSupportModalOpen}
            orderId={order.orderId}
            productTitle={order.productTitle}
            onClose={() => setIsContactSupportModalOpen(false)}
            onSubmit={async (message) => {
              await orderActions.contactSupport(order.orderId, message);
            }}
            isLoading={orderActions.isSubmittingSupport}
          />
        </>
      )}
    </div>
  );
}