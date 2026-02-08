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
    hasUnapprovedItems,
  } = useCartState();

  const handleApplyDiscount = (code: string) => {
    applyDiscount(code);
  };

  const CartReviewStep = ({ onNext }: { onNext: () => void }) => (
    <div className=" flex flex-col lg:flex-row  lg:justify-between gap-8 lg:items-start">
      <div className="flex-1 rounded-xl border border-[#212121] ">
        {/* Unapproved Items Warning */}
        {hasUnapprovedItems && (
          <div className="p-4 mb-4 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-400 font-medium">
              ⚠️ Some products in your cart are no longer available. Please remove them before checkout.
            </p>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 p-4">
          <h2 className="text-base text-gray-200">Cart items</h2>
          {items.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearCart}
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
            >
              Clear Cart
            </Button>
          )}
        </div>
        <hr className="border-b border-[#212121]" />
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
                ...item,
                price: item.price ?? item.unitPriceCents / 100,
                name: item.name ?? `Product ${item.listingId.slice(0, 5)}`,
              }}
              increment={(id, qty) => updateQuantity(id, qty + 1)}
              decrement={(id, qty) => updateQuantity(id, qty - 1)}
              removeItem={(id) => removeItem(id)}
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
    <div className="min-h-screen bg-[#0E0E0E] text-white">
      <div className="flex flex-col items-center justify-center min-h-screen py-8 sm:py-10 px-3 sm:px-4">
        <div className="text-center mb-10 space-y-2">
          <h1 className="text-3xl font-bold text-white">Checkout</h1>
          <p className="text-gray-400 text-sm md:text-base">
            Complete your purchase in 3 simple steps
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="w-full max-w-6xl mx-auto"
        >
          {/* Progress Header */}
          <div className="w-full max-w-4xl mx-auto mb-12 relative px-2">
            <TabsList className="bg-transparent h-auto w-full relative flex justify-between items-center border-none p-0">
              {/* 1. The Background Connecting Line (Gray) */}
              <div className="absolute top-4 left-0 w-full h-[2px] bg-gray-800 z-0" />

              {/* 2. The Active Progress Line (Purple) */}
              <div
                className="absolute top-4 left-0 h-[2px] bg-purple-500 transition-all duration-500 ease-in-out z-0"
                style={{
                  width:
                    activeTab === "cartReview"
                      ? "0%"
                      : activeTab === "billingAddress"
                      ? "50%"
                      : "100%",
                }}
              />

              {[
                { label: "Cart", value: "cartReview", number: 1 },
                {
                  label: "Shipping address",
                  value: "billingAddress",
                  number: 2,
                },
                { label: "Payment", value: "payment", number: 3 },
              ].map((step) => {
                const isActive = activeTab === step.value;
                const isCompleted =
                  (activeTab === "billingAddress" && step.number === 1) ||
                  (activeTab === "payment" &&
                    (step.number === 1 || step.number === 2));

                return (
                  <TabsTrigger
                    key={step.value}
                    value={step.value}
                    className="relative z-10 flex flex-col items-center gap-2 bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none group p-0"
                  >
                    <div
                      className={`
                w-8 h-8 rounded-full border-2 flex items-center justify-center text-sm transition-all duration-300 bg-[#0E0E0E]
                ${
                  isActive
                    ? "border-purple-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.4)]"
                    : isCompleted
                    ? "border-purple-500 bg-purple-500 text-white"
                    : "border-gray-700 text-gray-500"
                }
              `}
                    >
                      {isCompleted ? (
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>

                    {/* The Label */}
                    <span
                      className={`text-xs md:text-sm font-medium transition-colors ${
                        isActive ? "text-white" : "text-gray-500"
                      }`}
                    >
                      {step.label}
                    </span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
          </div>

          <div className="bg-[#141414] shadow-2xl">
            <TabsContent value="cartReview" className="mt-0 outline-none">
              <CartReviewStep onNext={() => setActiveTab("billingAddress")} />
            </TabsContent>

            <TabsContent value="billingAddress" className="mt-0 outline-none">
              <BillingAddressStep onNext={() => setActiveTab("payment")} />
            </TabsContent>

            <TabsContent value="payment" className="mt-0 outline-none">
              <CartPaymentPage />
            </TabsContent>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center mt-6 text-xs text-gray-500 px-2">
            <div>
              {activeTab !== "cartReview" && (
                <button
                  onClick={() => {
                    if (activeTab === "billingAddress")
                      setActiveTab("cartReview");
                    if (activeTab === "payment") setActiveTab("billingAddress");
                  }}
                  className="flex items-center gap-1 hover:text-white transition-colors"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
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
            </div>

            <div className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
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