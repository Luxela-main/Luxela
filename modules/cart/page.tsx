"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BillingAddressStep } from "./components/billing-address";
import CartPaymentPage from "./components/cartPayment";
import CartEmptyState from "./components/cartEmpty";
import CartSummaryForm from "./components/cart-summary-form";
import { CartItem } from "./components/cart-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCartState } from "./context";

export default function CartPage() {
  const [activeTab, setActiveTab] = useState("cartReview");
  const {
    items,
    isLoading,
    subtotal,
    total,
    discountAmount,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscount,
  } = useCartState();

  const handleIncrement = (listingId: string) => {
    const item = items.find((item) => item.listingId === listingId);
    if (item) {
      updateQuantity(listingId, item.quantity + 1);
    }
  };

  const handleDecrement = (listingId: string) => {
    const item = items.find((item) => item.listingId === listingId);
    if (item && item.quantity > 1) {
      updateQuantity(listingId, item.quantity - 1);
    } else if (item) {
      removeItem(listingId);
    }
  };

  const handleRemoveItem = (listingId: string) => {
    removeItem(listingId);
  };

  const handleClearCart = () => {
    clearCart();
  };

  const handleApplyDiscount = (code: string) => {
    applyDiscount(code);
  };

  const CartReviewStep = ({ onNext }: { onNext: () => void }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-200">Cart Items</h2>
          {items.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearCart}>
              Clear Cart
            </Button>
          )}
        </div>
        {isLoading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>
            <p className="text-gray-400 mt-2">Loading cart...</p>
          </div>
        ) : items.length === 0 ? (
          <CartEmptyState />
        ) : (
          items.map((item) => (
            <CartItem
              key={item.id}
              item={{
                id: item.id,
                name: item.name || `Product ${item.listingId.slice(0, 8)}`,
                price: item.unitPriceCents / 100,
                quantity: item.quantity,
                image: item.image,
              }}
              increment={() => handleIncrement(item.listingId)}
              decrement={() => handleDecrement(item.listingId)}
              removeItem={() => handleRemoveItem(item.listingId)}
            />
          ))
        )}
      </div>
      <CartSummaryForm
        subtotal={subtotal / 100}
        discount={discountAmount / 100}
        total={total / 100}
        onNextStep={onNext}
        onApplyDiscount={handleApplyDiscount}
        disabled={items.length === 0}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="flex flex-col items-center justify-center min-h-screen py-10 px-4">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Complete your purchase in 3 simple steps
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-6xl mx-auto">
          <TabsList className="flex justify-center items-center gap-8 bg-transparent mb-8">
            {[
              { label: "Cart Review", value: "cartReview", number: 1 },
              { label: "Shipping", value: "billingAddress", number: 2 },
              { label: "Payment", value: "payment", number: 3 },
            ].map((step, index) => (
              <div
                key={step.value}
                className="flex flex-col items-center cursor-pointer">
                <TabsTrigger
                  value={step.value}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-medium transition-all border text-sm
                    ${
                      activeTab === step.value
                        ? "bg-gray-800 border-gray-600 text-white"
                        : "bg-gray-900 border-gray-800 text-gray-500 hover:text-gray-300"
                    }`}>
                  {step.number}
                </TabsTrigger>
                <span
                  className={`mt-2 text-xs font-medium ${
                    activeTab === step.value ? "text-white" : "text-gray-500"
                  }`}>
                  {step.label}
                </span>
                {index < 2 && (
                  <div className="hidden md:block w-20 h-px bg-gray-700 mt-4"></div>
                )}
              </div>
            ))}
          </TabsList>

          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 md:p-8 shadow-lg">
            <TabsContent value="cartReview">
              <CartReviewStep onNext={() => setActiveTab("billingAddress")} />
            </TabsContent>

            <TabsContent value="billingAddress">
              <BillingAddressStep onNext={() => setActiveTab("payment")} />
            </TabsContent>

            <TabsContent value="payment">
              <CartPaymentPage />
            </TabsContent>
          </div>

          <div className="flex justify-between items-center mt-6 text-xs text-gray-500">
            {activeTab !== "cartReview" && (
              <button
                onClick={() => {
                  if (activeTab === "billingAddress")
                    setActiveTab("cartReview");
                  if (activeTab === "payment") setActiveTab("billingAddress");
                }}
                className="flex items-center gap-1 hover:text-white transition-colors">
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                Back
              </button>
            )}
            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              Secure checkout
            </div>
          </div>
        </Tabs>
      </div>
    </div>
  );
}
