"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { BillingAddressStep } from "./components/billing-address";
import CartPaymentPage from "./components/cartPayment";
import { initialCartItems } from "./data";
import CartEmptyState from "./components/cartEmpty";
import CartSummaryForm from "./components/cart-summary-form";
import { CartItem } from "./components/cart-item";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function CartPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);

  const handleIncrement = (id: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecrement = (id: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const handleRemoveItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = 0;
  const total = subtotal - discount;

  const CartReviewStep = ({ onNext }: { onNext: () => void }) => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-300">Cart items</h2>
          <Button variant="ghost" size="sm" onClick={handleClearCart}>
            Clear Cart
          </Button>
        </div>
        {cartItems.length === 0 ? (
          <CartEmptyState />
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              increment={handleIncrement}
              decrement={handleDecrement}
              removeItem={handleRemoveItem}
            />
          ))
        )}
      </div>
      <CartSummaryForm
        subtotal={subtotal}
        discount={discount}
        total={total}
        onNextStep={onNext}
        onApplyDiscount={(code) => console.log("Apply discount:", code)}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <Tabs defaultValue="cartReview" className="w-full mx-auto">
        <TabsList className="flex justify-center gap-4 mb-8 bg-gray-900 p-2 rounded-xl">
          <TabsTrigger
            value="cartReview"
            className="data-[state=active]:text-purple-500 font-bold">
            1. Cart Review
          </TabsTrigger>
          <TabsTrigger
            value="billingAddress"
            className="data-[state=active]:text-purple-500 font-bold">
            2. Shipping Address
          </TabsTrigger>
          <TabsTrigger
            value="payment"
            className="data-[state=active]:text-purple-500 font-bold">
            3. Payment
          </TabsTrigger>
        </TabsList>

        <TabsContent value="cartReview">
          <CartReviewStep
            onNext={() => {
              const nextTab = document.querySelector(
                '[data-value="billingAddress"]'
              ) as HTMLElement;
              nextTab?.click();
            }}
          />
        </TabsContent>

        <TabsContent value="billingAddress">
          <BillingAddressStep />
        </TabsContent>

        <TabsContent value="payment">
          <CartPaymentPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}
