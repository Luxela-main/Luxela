"use client";

import { Check, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { toastSvc } from "@/services/toast";

type PaymentStatus = 'verifying' | 'success' | 'failed' | 'no_payment';

export default function OrderSuccessPage() {
  const router = useRouter();
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('verifying');
  const [paymentData, setPaymentData] = useState<any>(null);

  const confirmCheckout = trpc.checkout.confirmCheckout.useMutation({
    onSuccess: (data) => {
      console.log('[OrderSuccess] Payment confirmed successfully:', data);
      setPaymentStatus('success');
      setPaymentData(data);
      toastSvc.success('Payment confirmed successfully!');

      // Clear session storage
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('pendingPaymentRef');
        sessionStorage.removeItem('pendingTransactionRef');
        sessionStorage.removeItem('checkoutOrderId');
      }
    },
    onError: (error: any) => {
      console.error('[OrderSuccess] Payment confirmation failed:', error);
      setPaymentStatus('failed');
      toastSvc.error(error?.message || 'Payment verification failed. Please contact support.');
    },
  });

  useEffect(() => {
    const savedAddress = localStorage.getItem("billingAddress");
    if (savedAddress) {
      setOrderDetails(JSON.parse(savedAddress));
    }

    // Check for pending payment confirmation
    const checkPendingPayment = () => {
      if (typeof window === 'undefined') return;

      const pendingPaymentRef = sessionStorage.getItem('pendingPaymentRef');
      const pendingTransactionRef = sessionStorage.getItem('pendingTransactionRef');
      const checkoutOrderId = sessionStorage.getItem('checkoutOrderId');

      if (pendingPaymentRef && pendingTransactionRef) {
        console.log('[OrderSuccess] Found pending payment, confirming...', { pendingPaymentRef, pendingTransactionRef });
        confirmCheckout.mutate({
          paymentId: pendingPaymentRef,
          transactionRef: pendingTransactionRef,
        });
      } else {
        console.log('[OrderSuccess] No pending payment found');
        setPaymentStatus('no_payment');
      }
    };

    checkPendingPayment();
  }, []);

  const currentDate = new Date().toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const deliveryStartDate = new Date();
  deliveryStartDate.setDate(deliveryStartDate.getDate() + 7);
  const deliveryEndDate = new Date();
  deliveryEndDate.setDate(deliveryEndDate.getDate() + 10);

  const formatDeliveryDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });
  };

  const renderStatusIcon = () => {
    switch (paymentStatus) {
      case 'verifying':
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-blue-500 blur-xl opacity-20"></div>
            <div className="relative w-16 h-16 border-2 border-blue-500 rounded-2xl rotate-45 flex items-center justify-center bg-[#141414]">
              <Loader2 className="w-6 h-6 text-blue-500 -rotate-45 animate-spin" />
            </div>
          </div>
        );
      case 'success':
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-green-500 blur-xl opacity-20"></div>
            <div className="relative w-16 h-16 border-2 border-green-500 rounded-2xl rotate-45 flex items-center justify-center bg-[#141414]">
              <Check className="w-6 h-6 text-green-500 -rotate-45" strokeWidth={3} />
            </div>
          </div>
        );
      case 'failed':
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-red-500 blur-xl opacity-20"></div>
            <div className="relative w-16 h-16 border-2 border-red-500 rounded-2xl rotate-45 flex items-center justify-center bg-[#141414]">
              <AlertCircle className="w-6 h-6 text-red-500 -rotate-45" strokeWidth={3} />
            </div>
          </div>
        );
      default:
        return (
          <div className="relative">
            <div className="absolute inset-0 bg-purple-500 blur-xl opacity-20"></div>
            <div className="relative w-16 h-16 border-2 border-purple-500 rounded-2xl rotate-45 flex items-center justify-center bg-[#141414]">
              <Check className="w-4 h-4 text-purple-500 -rotate-45" strokeWidth={3} />
            </div>
          </div>
        );
    }
  };

  const renderStatusMessage = () => {
    switch (paymentStatus) {
      case 'verifying':
        return {
          title: "Verifying your payment...",
          subtitle: "Please wait while we confirm your payment with our payment processor.",
        };
      case 'success':
        return {
          title: "Thank you for your order!",
          subtitle: "The order confirmation has been sent to your email.",
        };
      case 'failed':
        return {
          title: "Payment verification failed",
          subtitle: "We couldn't verify your payment. Please contact support or try again.",
        };
      default:
        return {
          title: "Order placed successfully!",
          subtitle: "Your order has been received and is being processed.",
        };
    }
  };

  const statusMessage = renderStatusMessage();

  return (
    <div className="min-h-screen bg-[#0E0E0E] text-[#F2F2F2] p-4 md:p-8">
      <div className="max-w-2xl mx-auto bg-[#141414] border border-[#212121] rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-8 md:p-12">

          {/* Status Icon */}
          <div className="flex justify-center mb-6">
            {renderStatusIcon()}
          </div>

          <div className="text-center mb-10">
            <h1 className="text-xl font-semibold mb-3">{statusMessage.title}</h1>
            <p className="text-[#ACACAC] text-sm">
              {statusMessage.subtitle}
            </p>
          </div>

          {/* Show order details only on success */}
          {paymentStatus === 'success' && (
            <div className="space-y-0 border-t border-[#212121]">
              <div className="py-5 border-b border-[#212121]">
                <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Transaction date</p>
                <p className="text-base font-medium">{currentDate}</p>
              </div>

              <div className="py-5 border-b border-[#212121]">
                <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Payment method</p>
                <p className="text-base font-medium">Tsara Payment</p>
              </div>

              <div className="py-5 border-b border-[#212121]">
                <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Shipping Address</p>
                <p className="text-sm text-[#F2F2F2] leading-relaxed max-w-md">
                  {orderDetails ? (
                    `${orderDetails.address}, ${orderDetails.city}, ${orderDetails.state} ${orderDetails.postalCode}`
                  ) : (
                    "Address information not available"
                  )}
                </p>
              </div>

              <div className="py-5">
                <p className="text-[#ACACAC] text-xs uppercase tracking-wider mb-2">Delivery date</p>
                <p className="text-sm">
                  Delivery between <span className="font-bold">{formatDeliveryDate(deliveryStartDate)}</span> and{" "}
                  <span className="font-medium">{formatDeliveryDate(deliveryEndDate)}</span> (7-10 days from now)
                </p>
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-10">
            {paymentStatus === 'failed' ? (
              <>
                <Button
                  onClick={() => router.push("/cart")}
                  className="w-full bg-gradient-to-r from-[#8451E1] to-[#8451E1] hover:opacity-90 text-white font-medium h-10 rounded-xl shadow-lg shadow-purple-500/20"
                >
                  Try Again
                </Button>
                <Button
                  onClick={() => router.push("/buyer/dashboard/orders")}
                  className="w-full bg-[#212121] hover:bg-[#2a2a2a] text-white border border-[#333] font-medium h-10 rounded-xl"
                >
                  View Orders
                </Button>
              </>
            ) : (
              <>
                <Button
                  onClick={() => router.push("/buyer")}
                  className="w-full bg-gradient-to-r from-[#8451E1] to-[#8451E1] hover:opacity-90 text-white font-medium h-10 rounded-xl shadow-lg shadow-purple-500/20"
                >
                  Continue Shopping
                </Button>
                <Button
                  onClick={() => router.push("/buyer/dashboard/orders")}
                  className="w-full bg-[#212121] hover:bg-[#2a2a2a] text-white border border-[#333] font-medium h-10 rounded-xl"
                >
                  Track Order
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}