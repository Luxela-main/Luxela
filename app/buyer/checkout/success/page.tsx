'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function CheckoutSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing your payment...');

  const confirmCheckout = trpc.checkout.confirmCheckout.useMutation({
    onSuccess: (data) => {
      setStatus('success');
      setMessage(`Order ${data.orderId.slice(0, 8)} confirmed! Your order will be processed shortly.`);
      setTimeout(() => {
        router.push(`/buyer/orders/${data.orderId}`);
      }, 3000);
    },
    onError: (error) => {
      setStatus('error');
      setMessage(error.message || 'Failed to confirm your payment. Please contact support.');
    },
  });

  useEffect(() => {
    const confirmPayment = async () => {
      const paymentId = searchParams.get('payment_id');
      const transactionRef = searchParams.get('reference');

      if (!paymentId || !transactionRef) {
        setStatus('error');
        setMessage('Missing payment information. Please contact support.');
        return;
      }

      try {
        await confirmCheckout.mutateAsync({
          paymentId,
          transactionRef,
        });
      } catch (err) {
        console.error('Confirmation error:', err);
        
      }
    };

    confirmPayment();
  }, [searchParams, confirmCheckout]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        {status === 'loading' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Processing Payment</h1>
            <p className="text-gray-600 mb-4">{message}</p>
            <div className="flex justify-center">
              <div className="text-sm text-gray-500">Please don't close this page...</div>
            </div>
          </div>
        )}

        {status === 'success' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-green-800">
                ✓ Your payment has been secured in escrow<br />
                ✓ Seller has been notified<br />
                ✓ You'll receive updates via email
              </p>
            </div>
            <p className="text-xs text-gray-500">Redirecting to your order...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <AlertCircle className="w-16 h-16 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Payment Issue</h1>
            <p className="text-gray-600 mb-6">{message}</p>
            <div className="flex gap-3">
              <button
                onClick={() => router.push('/buyer/checkout')}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition cursor-pointer"
              >
                Try Again
              </button>
              <button
                onClick={() => router.push('/buyer/orders')}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition cursor-pointer"
              >
                View Orders
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}