'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useLocalStorage, useLocalStorageClear } from '@/lib/hooks/useLocalStorage';
import { Loader2 } from 'lucide-react';

interface CheckoutFormData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: 'card' | 'bank_transfer' | 'crypto';
}

export default function CheckoutPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string>('');
  const clearCheckoutData = useLocalStorageClear('checkout-form');

  // Use localStorage for form data
  const [checkoutForm, setCheckoutForm] = useLocalStorage<CheckoutFormData>('checkout-form', {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    postalCode: '',
    country: '',
    paymentMethod: 'card',
  });

  // Get user's cart
  const { data: cart, isLoading: cartLoading, error: cartError } = trpc.cart.getCart.useQuery();

  // Checkout mutations
  const prepareCheckout = trpc.checkout.prepareCheckout.useQuery(
    { cartId: cart?.cart?.id || '' },
    { enabled: !!cart?.cart?.id }
  );

  const initializePayment = trpc.checkout.initializePayment.useMutation({
    onSuccess: (data) => {
      // Clear checkout data on successful payment
      clearCheckoutData();
      // Redirect to Tsara payment page
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error) => {
      setError(error.message || 'Payment initialization failed');
      setIsProcessing(false);
    },
  });

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!cart?.cart?.id) {
      setError('Cart not found');
      return;
    }

    setIsProcessing(true);
    setError('');

    try {
      // Validate form
      if (!checkoutForm.firstName || !checkoutForm.lastName || !checkoutForm.email || !checkoutForm.address) {
        setError('Please fill in all required fields');
        return;
      }

      // Get buyer details from form
      const buyerInfo = {
        customerName: `${checkoutForm.firstName} ${checkoutForm.lastName}`,
        customerEmail: checkoutForm.email,
        customerPhone: checkoutForm.phone,
        shippingAddress: checkoutForm.address,
        shippingCity: checkoutForm.city,
        shippingState: checkoutForm.state,
        shippingPostalCode: checkoutForm.postalCode,
        shippingCountry: checkoutForm.country,
      };

      // Initialize payment
      initializePayment.mutate({
        ...buyerInfo,
        paymentMethod: checkoutForm.paymentMethod,
      });
    } catch (err: any) {
      setError(err.message || 'Checkout failed');
      setIsProcessing(false);
    }
  };

  if (cartLoading || prepareCheckout.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  if (cartError || !cart?.items || cart.items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Your cart is empty</h1>
          <button
            onClick={() => router.push('/buyer/collections')}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Continue Shopping
          </button>
        </div>
      </div>
    );
  }

  const checkoutData = prepareCheckout.data;
  const summary = checkoutData?.summary;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow">
          {/* Header */}
          <div className="border-b border-gray-200 px-6 py-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-gray-600 mt-2">Review your order and complete payment</p>
          </div>

          {/* Shipping Address */}
          <div className="px-6 py-8">
            <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  First Name *
                </label>
                <input
                  type="text"
                  name="firstName"
                  value={checkoutForm.firstName}
                  onChange={(e) => setCheckoutForm({...checkoutForm, firstName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="John"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="lastName"
                  value={checkoutForm.lastName}
                  onChange={(e) => setCheckoutForm({...checkoutForm, lastName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Doe"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  value={checkoutForm.email}
                  onChange={(e) => setCheckoutForm({...checkoutForm, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={checkoutForm.phone}
                  onChange={(e) => setCheckoutForm({...checkoutForm, phone: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="+234 123 456 7890"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  name="address"
                  value={checkoutForm.address}
                  onChange={(e) => setCheckoutForm({...checkoutForm, address: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="123 Main St"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  City *
                </label>
                <input
                  type="text"
                  name="city"
                  value={checkoutForm.city}
                  onChange={(e) => setCheckoutForm({...checkoutForm, city: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lagos"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  State/Province *
                </label>
                <input
                  type="text"
                  name="state"
                  value={checkoutForm.state}
                  onChange={(e) => setCheckoutForm({...checkoutForm, state: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Lagos"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Postal Code *
                </label>
                <input
                  type="text"
                  name="postalCode"
                  value={checkoutForm.postalCode}
                  onChange={(e) => setCheckoutForm({...checkoutForm, postalCode: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="100001"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Country *
                </label>
                <input
                  type="text"
                  name="country"
                  value={checkoutForm.country}
                  onChange={(e) => setCheckoutForm({...checkoutForm, country: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Nigeria"
                  required
                />
              </div>
            </div>
          </div>

          <form onSubmit={handleCheckout} className="divide-y divide-gray-200">
            {/* Order Summary */}
            <div className="px-6 py-8">
              <h2 className="text-xl font-semibold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6">
                {checkoutData?.items?.map((item) => (
                  <div key={item.listingId} className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="font-medium">{item.productTitle}</h3>
                      <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.productTitle}
                          className="w-16 h-16 mt-2 rounded object-cover"
                        />
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-medium">
                        ₦{(item.totalPriceCents / 100).toLocaleString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        ₦{(item.unitPriceCents / 100).toLocaleString()} each
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pricing Breakdown */}
              <div className="border-t pt-6 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span>₦{(summary?.subtotalCents || 0 / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Tax (7.5%)</span>
                  <span>₦{(summary?.taxCents || 0 / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>₦{(summary?.shippingCents || 0 / 100).toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-4">
                  <span>Total</span>
                  <span className="text-blue-600">
                    ₦{(summary?.totalCents || 0 / 100).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="px-6 py-8">
              <h2 className="text-xl font-semibold mb-6">Payment Method</h2>
              
              <div className="space-y-3">
                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="card"
                    checked={checkoutForm.paymentMethod === 'card'}
                    onChange={(e) => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value as any})}
                    className="w-4 h-4"
                  />
                  <span className="ml-3">
                    <span className="font-medium">Credit/Debit Card</span>
                    <p className="text-sm text-gray-600">Visa, Mastercard, American Express</p>
                  </span>
                </label>

                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="bank_transfer"
                    checked={checkoutForm.paymentMethod === 'bank_transfer'}
                    onChange={(e) => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value as any})}
                    className="w-4 h-4"
                  />
                  <span className="ml-3">
                    <span className="font-medium">Bank Transfer</span>
                    <p className="text-sm text-gray-600">Direct bank transfer (NGN)</p>
                  </span>
                </label>

                <label className="flex items-center p-4 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="crypto"
                    checked={checkoutForm.paymentMethod === 'crypto'}
                    onChange={(e) => setCheckoutForm({...checkoutForm, paymentMethod: e.target.value as any})}
                    className="w-4 h-4"
                  />
                  <span className="ml-3">
                    <span className="font-medium">Cryptocurrency</span>
                    <p className="text-sm text-gray-600">USDC on Solana blockchain</p>
                  </span>
                </label>
              </div>
            </div>

            {/* Escrow Notice */}
            <div className="px-6 py-8 bg-blue-50 border-l-4 border-blue-600">
              <h3 className="font-semibold text-blue-900 mb-2">🛡️ Buyer Protection</h3>
              <p className="text-sm text-blue-800">
                Your payment is held securely in escrow until you confirm receipt of your order.
                Once you confirm delivery, funds will be released to the seller.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="px-6 py-4 bg-red-50 border-l-4 border-red-600">
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="px-6 py-8 bg-gray-50 flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/cart')}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50"
              >
                Back to Cart
              </button>
              <button
                type="submit"
                disabled={isProcessing || initializePayment.isPending}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isProcessing || initializePayment.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>Proceed to Payment</>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Additional Info */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl mb-2">🚚</div>
            <h3 className="font-semibold mb-2">Fast Shipping</h3>
            <p className="text-sm text-gray-600">
              Most orders ship within 24-48 hours
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl mb-2">🔒</div>
            <h3 className="font-semibold mb-2">Secure Payment</h3>
            <p className="text-sm text-gray-600">
              Your payment is encrypted and secured by Tsara
            </p>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <div className="text-2xl mb-2">💬</div>
            <h3 className="font-semibold mb-2">24/7 Support</h3>
            <p className="text-sm text-gray-600">
              Need help? Contact our support team anytime
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}