"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { initialCartItems } from "../data";
import OrderSummary from "./order-summary";
import PaymentMethods from "./payment-methods";

export default function CartPaymentPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [billingInfo, setBillingInfo] = useState({
    name: "John Doe Daniels",
    email: "johndoedaniels@gmail.com",
    phone: "090809799790",
    state: "Kwara State",
    city: "Ilorin",
    house: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    postal: "Nigeria",
  });

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = 0;
  const shipping = 1;
  const total = subtotal - discount + shipping;

  return (
    <div className="min-h-screen bg-black text-white p-6 space-y-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-start">
              Shipping address
            </h3>
            <Button className="bg-purple-600 hover:bg-purple-700 text-white">
              Change
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
            <p>
              <strong>Full name:</strong> {billingInfo.name}
            </p>
            <p>
              <strong>Email address:</strong> {billingInfo.email}
            </p>
            <p>
              <strong>Phone number:</strong> {billingInfo.phone}
            </p>
            <p>
              <strong>State of residence:</strong> {billingInfo.state}
            </p>
            <p>
              <strong>City:</strong> {billingInfo.city}
            </p>
            <p>
              <strong>Postal address:</strong> {billingInfo.postal}
            </p>
            <div className="sm:col-span-2">
              <p>
                <strong>House address:</strong>
              </p>
              <p className="text-gray-300">{billingInfo.house}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <OrderSummary />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-lg">
          <PaymentMethods />
        </div>

        <div className="lg:col-span-1 bg-[#1a1a1a] p-6 rounded-lg space-y-4 h-fit">
          <div className="flex justify-between">
            <span className="text-gray-400">Subtotal</span>
            <span className="font-bold">NGN {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Discount</span>
            <span className="font-bold">NGN {discount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Shipping fees</span>
            <span className="font-bold">NGN {shipping.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-lg">
            <span className="font-semibold">Total amount</span>
            <span className="font-bold text-white">
              NGN {total.toLocaleString()}
            </span>
          </div>
          <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
            Make Payment
          </Button>
        </div>
      </div>
    </div>
  );
}
