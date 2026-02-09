'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { trpc } from '@/lib/trpc';
import { useLocalStorage, useLocalStorageClear } from '@/lib/hooks/useLocalStorage';
import { Loader2, AlertCircle, XCircle } from 'lucide-react';

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
  agreeToTerms: boolean;
}

interface FieldErrors {
  [key: string]: string;
}

interface PaymentStatus {
  state: 'idle' | 'processing' | 'success' | 'error';
  message: string;
  retryCount: number;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_REGEX = /^[0-9+\-\s()]{7,}$/;
const POSTAL_CODE_REGEX = /^[a-zA-Z0-9\s\-]{3,}$/;
const MAX_RETRY_ATTEMPTS = 3;

export default function CheckoutPage() {
  const router = useRouter();
  const clearCheckoutData = useLocalStorageClear('checkout-form');
  
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({
    state: 'idle',
    message: '',
    retryCount: 0,
  });
  const [showTermsError, setShowTermsError] = useState(false);

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
    agreeToTerms: false,
  });

  // Get user's cart
  const { data: cart, isLoading: cartLoading, error: cartError } = trpc.cart.getCart.useQuery();

  // Checkout mutations - Extract cartId safely
  const cartId = cart?.cart?.id;
  const prepareCheckout = trpc.checkout.prepareCheckout.useQuery(
    { cartId: cartId || '' },
    { enabled: !!cartId && cartId.length > 0 }
  );

  const initializePayment = trpc.checkout.initializePayment.useMutation({
    onSuccess: (data) => {
      setPaymentStatus({
        state: 'success',
        message: 'Payment initialized successfully',
        retryCount: 0,
      });
      clearCheckoutData();
      if (data.paymentUrl) {
        window.location.href = data.paymentUrl;
      }
    },
    onError: (error) => {
      setPaymentStatus({
        state: 'error',
        message: error.message || 'Payment initialization failed',
        retryCount: paymentStatus.retryCount + 1,
      });
    },
  });

  // Field validation functions
  const validateField = useCallback((name: string, value: string): string => {
    const trimmedValue = value.trim();

    switch (name) {
      case 'firstName':
      case 'lastName':
        if (!trimmedValue) return 'This field is required';
        if (trimmedValue.length < 2) return 'Must be at least 2 characters';
        if (!/^[a-zA-Z\s'-]+$/.test(trimmedValue)) return 'Only letters, spaces, and hyphens allowed';
        return '';
      case 'email':
        if (!trimmedValue) return 'Email is required';
        if (!EMAIL_REGEX.test(trimmedValue)) return 'Please enter a valid email address';
        return '';
      case 'phone':
        if (trimmedValue && !PHONE_REGEX.test(trimmedValue)) return 'Please enter a valid phone number';
        return '';
      case 'address':
        if (!trimmedValue) return 'Address is required';
        if (trimmedValue.length < 5) return 'Please enter a complete address';
        return '';
      case 'city':
      case 'state':
      case 'country':
        if (!trimmedValue) return `${name.charAt(0).toUpperCase() + name.slice(1)} is required`;
        if (trimmedValue.length < 2) return 'Please enter a valid value';
        return '';
      case 'postalCode':
        if (!trimmedValue) return 'Postal code is required';
        if (!POSTAL_CODE_REGEX.test(trimmedValue)) return 'Please enter a valid postal code';
        return '';
      default:
        return '';
    }
  }, []);

  const validateForm = useCallback((): boolean => {
    const errors: FieldErrors = {};
    const requiredFields = ['firstName', 'lastName', 'email', 'address', 'city', 'state', 'postalCode', 'country'];

    requiredFields.forEach((field) => {
      const error = validateField(field, checkoutForm[field as keyof CheckoutFormData] as string);
      if (error) errors[field] = error;
    });

    if (checkoutForm.phone) {
      const phoneError = validateField('phone', checkoutForm.phone);
      if (phoneError) errors.phone = phoneError;
    }

    if (!checkoutForm.agreeToTerms) {
      setShowTermsError(true);
      return false;
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }, [checkoutForm, validateField]);

  const handleFieldChange = useCallback((field: keyof CheckoutFormData, value: any) => {
    setCheckoutForm({ ...checkoutForm, [field]: value });
    // Clear error when user starts typing
    if (fieldErrors[field]) {
      const newErrors = { ...fieldErrors };
      delete newErrors[field];
      setFieldErrors(newErrors);
    }
  }, [checkoutForm, fieldErrors, setCheckoutForm]);

  const handleRetryPayment = useCallback(async () => {
    if (!validateForm()) return;
    if (paymentStatus.retryCount >= MAX_RETRY_ATTEMPTS) {
      setPaymentStatus({
        state: 'error',
        message: 'Maximum retry attempts exceeded. Please contact support.',
        retryCount: paymentStatus.retryCount,
      });
      return;
    }
    await handleCheckout({ preventDefault: () => {} } as React.FormEvent);
  }, [validateForm, paymentStatus.retryCount]);

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      setPaymentStatus({
        state: 'error',
        message: 'Please correct the errors below and try again.',
        retryCount: 0,
      });
      return;
    }

    if (!cart?.cart?.id) {
      setPaymentStatus({
        state: 'error',
        message: 'Cart not found. Please go back and try again.',
        retryCount: 0,
      });
      return;
    }

    if (!prepareCheckout.data?.items || prepareCheckout.data.items.length === 0) {
      setPaymentStatus({
        state: 'error',
        message: 'Your cart is empty.',
        retryCount: 0,
      });
      return;
    }

    setPaymentStatus({
      state: 'processing',
      message: 'Processing your payment...',
      retryCount: paymentStatus.retryCount,
    });

    try {
      const buyerInfo = {
        customerName: `${checkoutForm.firstName.trim()} ${checkoutForm.lastName.trim()}`,
        customerEmail: checkoutForm.email.trim(),
        customerPhone: checkoutForm.phone.trim() || undefined,
        shippingAddress: checkoutForm.address.trim(),
        shippingCity: checkoutForm.city.trim(),
        shippingState: checkoutForm.state.trim(),
        shippingPostalCode: checkoutForm.postalCode.trim(),
        shippingCountry: checkoutForm.country.trim(),
      };

      await initializePayment.mutateAsync({
        customerName: buyerInfo.customerName,
        customerEmail: buyerInfo.customerEmail,
        customerPhone: buyerInfo.customerPhone,
        shippingAddress: buyerInfo.shippingAddress,
        shippingCity: buyerInfo.shippingCity,
        shippingState: buyerInfo.shippingState,
        shippingPostalCode: buyerInfo.shippingPostalCode,
        shippingCountry: buyerInfo.shippingCountry,
        paymentMethod: checkoutForm.paymentMethod,
      });
    } catch (err: any) {
      const errorMessage = err?.message || 'Payment initialization failed. Please try again.';
      setPaymentStatus({
        state: 'error',
        message: errorMessage,
        retryCount: paymentStatus.retryCount + 1,
      });
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
          <div className="border-b-4 border-b-[#E5E7EB] bg-gradient-to-r from-[#E5E7EB]/10 via-transparent px-6 py-8">
            <h1 className="text-3xl font-bold">Checkout</h1>
            <p className="text-gray-600 mt-2">Review your order and complete payment</p>
          </div>

          {/* Shipping Address */}
          <div className="px-6 py-8 border-l-4 border-l-[#6B7280]">
            <h2 className="text-xl font-semibold mb-6">Shipping Address</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="firstName">
                  First Name *
                </label>
                <input
                  id="firstName"
                  type="text"
                  name="firstName"
                  value={checkoutForm.firstName}
                  onChange={(e) => handleFieldChange('firstName', e.target.value)}
                  onBlur={(e) => validateField('firstName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.firstName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="John"
                  aria-invalid={!!fieldErrors.firstName}
                  aria-describedby={fieldErrors.firstName ? 'firstName-error' : undefined}
                />
                {fieldErrors.firstName && (
                  <p id="firstName-error" className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {fieldErrors.firstName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="lastName">
                  Last Name *
                </label>
                <input
                  id="lastName"
                  type="text"
                  name="lastName"
                  value={checkoutForm.lastName}
                  onChange={(e) => handleFieldChange('lastName', e.target.value)}
                  onBlur={(e) => validateField('lastName', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.lastName ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Doe"
                  aria-invalid={!!fieldErrors.lastName}
                  aria-describedby={fieldErrors.lastName ? 'lastName-error' : undefined}
                />
                {fieldErrors.lastName && (
                  <p id="lastName-error" className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {fieldErrors.lastName}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="email">
                  Email *
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={checkoutForm.email}
                  onChange={(e) => handleFieldChange('email', e.target.value)}
                  onBlur={(e) => validateField('email', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.email ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="john@example.com"
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={fieldErrors.email ? 'email-error' : undefined}
                />
                {fieldErrors.email && (
                  <p id="email-error" className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {fieldErrors.email}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="phone">
                  Phone
                </label>
                <input
                  id="phone"
                  type="tel"
                  name="phone"
                  value={checkoutForm.phone}
                  onChange={(e) => handleFieldChange('phone', e.target.value)}
                  onBlur={(e) => validateField('phone', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="+234 123 456 7890"
                  aria-invalid={!!fieldErrors.phone}
                  aria-describedby={fieldErrors.phone ? 'phone-error' : undefined}
                />
                {fieldErrors.phone && (
                  <p id="phone-error" className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {fieldErrors.phone}
                  </p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="address">
                  Address *
                </label>
                <input
                  id="address"
                  type="text"
                  name="address"
                  value={checkoutForm.address}
                  onChange={(e) => handleFieldChange('address', e.target.value)}
                  onBlur={(e) => validateField('address', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="123 Main St"
                  aria-invalid={!!fieldErrors.address}
                  aria-describedby={fieldErrors.address ? 'address-error' : undefined}
                />
                {fieldErrors.address && (
                  <p id="address-error" className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {fieldErrors.address}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="city">
                  City *
                </label>
                <input
                  id="city"
                  type="text"
                  name="city"
                  value={checkoutForm.city}
                  onChange={(e) => handleFieldChange('city', e.target.value)}
                  onBlur={(e) => validateField('city', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.city ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Lagos"
                  aria-invalid={!!fieldErrors.city}
                  aria-describedby={fieldErrors.city ? 'city-error' : undefined}
                />
                {fieldErrors.city && (
                  <p id="city-error" className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {fieldErrors.city}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="state">
                  State/Province *
                </label>
                <input
                  id="state"
                  type="text"
                  name="state"
                  value={checkoutForm.state}
                  onChange={(e) => handleFieldChange('state', e.target.value)}
                  onBlur={(e) => validateField('state', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.state ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Lagos"
                  aria-invalid={!!fieldErrors.state}
                  aria-describedby={fieldErrors.state ? 'state-error' : undefined}
                />
                {fieldErrors.state && (
                  <p id="state-error" className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {fieldErrors.state}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="postalCode">
                  Postal Code *
                </label>
                <input
                  id="postalCode"
                  type="text"
                  name="postalCode"
                  value={checkoutForm.postalCode}
                  onChange={(e) => handleFieldChange('postalCode', e.target.value)}
                  onBlur={(e) => validateField('postalCode', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.postalCode ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="100001"
                  aria-invalid={!!fieldErrors.postalCode}
                  aria-describedby={fieldErrors.postalCode ? 'postalCode-error' : undefined}
                />
                {fieldErrors.postalCode && (
                  <p id="postalCode-error" className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {fieldErrors.postalCode}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1" htmlFor="country">
                  Country *
                </label>
                <input
                  id="country"
                  type="text"
                  name="country"
                  value={checkoutForm.country}
                  onChange={(e) => handleFieldChange('country', e.target.value)}
                  onBlur={(e) => validateField('country', e.target.value)}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    fieldErrors.country ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Nigeria"
                  aria-invalid={!!fieldErrors.country}
                  aria-describedby={fieldErrors.country ? 'country-error' : undefined}
                />
                {fieldErrors.country && (
                  <p id="country-error" className="text-red-600 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {fieldErrors.country}
                  </p>
                )}
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
                  <span>₦{((summary?.subtotalCents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span>₦{((summary?.shippingCents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2 mt-4">
                  <span>Total</span>
                  <span className="text-blue-600">
                    ₦{((summary?.totalCents || 0) / 100).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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
                    onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
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
                    onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
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
                    onChange={(e) => handleFieldChange('paymentMethod', e.target.value)}
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

            {/* Payment Status Messages */}
            {paymentStatus.state === 'error' && (
              <div className="px-6 py-4 bg-red-50 border-l-4 border-red-600">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900">{paymentStatus.message}</p>
                    {paymentStatus.retryCount > 0 && (
                      <p className="text-xs text-red-700 mt-1">
                        Retry attempt {paymentStatus.retryCount} of {MAX_RETRY_ATTEMPTS}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            {paymentStatus.state === 'processing' && (
              <div className="px-6 py-4 bg-blue-50 border-l-4 border-blue-600">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                  <p className="text-sm text-blue-800">{paymentStatus.message}</p>
                </div>
              </div>
            )}

            {/* Terms & Conditions */}
            <div className="px-6 py-6 border-t border-gray-200">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={checkoutForm.agreeToTerms}
                  onChange={(e) => {
                    handleFieldChange('agreeToTerms', e.target.checked);
                    setShowTermsError(false);
                  }}
                  className="w-4 h-4 mt-1 accent-blue-600 cursor-pointer"
                  aria-describedby="terms-error"
                />
                <span className="text-sm text-gray-700">
                  I agree to the{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Terms and Conditions
                  </a>
                  {' '}and{' '}
                  <a href="#" className="text-blue-600 hover:underline">
                    Privacy Policy
                  </a>
                </span>
              </label>
              {showTermsError && (
                <p id="terms-error" className="text-red-600 text-sm mt-2 flex items-center gap-1">
                  <XCircle className="w-4 h-4" /> You must agree to the terms and conditions
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="px-6 py-8 bg-gray-50 flex gap-4">
              <button
                type="button"
                onClick={() => router.push('/cart')}
                disabled={paymentStatus.state === 'processing'}
                className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                aria-label="Go back to shopping cart"
              >
                Back to Cart
              </button>
              {paymentStatus.state === 'error' && paymentStatus.retryCount < MAX_RETRY_ATTEMPTS ? (
                <button
                  type="button"
                  onClick={handleRetryPayment}
                  className="flex-1 px-6 py-3 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  aria-label="Retry payment"
                >
                  Retry Payment
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={paymentStatus.state === 'processing' || initializePayment.isPending}
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-colors"
                  aria-label="Proceed to payment"
                >
                  {paymentStatus.state === 'processing' || initializePayment.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    <>Proceed to Payment</>
                  )}
                </button>
              )}
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