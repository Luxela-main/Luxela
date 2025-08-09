"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Minus, Plus, Trash2, Pencil } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";

const initialCartItems = [
  { id: 1, name: "Luxela product 1", price: 30000, quantity: 1 },
  { id: 2, name: "Luxela product 2", price: 30000, quantity: 1 },
  { id: 3, name: "Luxela product 3", price: 30000, quantity: 1 },
];

type CartItemType = {
  id: number;
  name: string;
  price: number;
  quantity: number;
};

type CartItemProps = {
  item: CartItemType;
  increment: (id: number) => void;
  decrement: (id: number) => void;
  removeItem: (id: number) => void;
};

function CartItem({ item, increment, decrement, removeItem }: CartItemProps) {
  return (
    <Card className="bg-[#1a1a1a] text-white">
      <CardContent className="flex justify-between items-center p-4">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-gray-700 rounded" />
          <div>
            <h4 className="text-lg font-semibold">{item.name}</h4>
            <p className="text-sm text-gray-400">
              NGN {item.price.toLocaleString()}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="outline"
            onClick={() => decrement(item.id)}>
            <Minus size={16} />
          </Button>
          <span className="w-8 text-center">{item.quantity}</span>
          <Button
            size="icon"
            variant="outline"
            onClick={() => increment(item.id)}>
            <Plus size={16} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Pencil size={16} className="mr-1" /> Edit order
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => removeItem(item.id)}>
            <Trash2 size={16} className="mr-1" /> Remove Item
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function CartPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);
  const [currentStep, setCurrentStep] = useState(1);
  const [billingInfo, setBillingInfo] = useState({
    name: "John Doe Daniels",
    email: "johndoedaniels@gmail.com",
    phone: "090809799790",
    state: "Kwara State",
    city: "Ilorin",
    house: "Lorem ipsum dolor sit amet, consectetur adipiscing elit...",
    postal: "Nigeria",
  });

  const increment = (id: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const decrement = (id: number) => {
    setCartItems((items) =>
      items.map((item) =>
        item.id === id && item.quantity > 1
          ? { ...item, quantity: item.quantity - 1 }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setCartItems((items) => items.filter((item) => item.id !== id));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );
  const discount = 0;
  const shipping = 1;
  const total = subtotal - discount + shipping;

  const StepIndicator = () => (
    <div className="flex justify-center gap-8 my-8 text-sm">
      <button
        className={`font-bold ${
          currentStep === 1 ? "text-purple-500" : "text-gray-400"
        }`}
        onClick={() => setCurrentStep(1)}>
        1. Cart review
      </button>
      <button
        className={`font-bold ${
          currentStep === 2 ? "text-purple-500" : "text-gray-400"
        }`}
        onClick={() => setCurrentStep(2)}>
        2. Billing address
      </button>
      <button
        className={`font-bold ${
          currentStep === 3 ? "text-purple-500" : "text-gray-400"
        }`}
        onClick={() => setCurrentStep(3)}>
        3. Payment
      </button>
    </div>
  );

  const CartReviewStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-gray-400">Cart items</h2>
          <Button variant="destructive" size="sm" onClick={clearCart}>
            Clear Cart
          </Button>
        </div>
        {cartItems.length === 0 ? (
          <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center px-4">
            <div className="max-w-md text-center">
              <div className="mb-6">
                <Image
                  src="/empty-cart.png"
                  alt="Empty cart"
                  width={300}
                  height={300}
                  className="mx-auto"
                />
              </div>

              <h2 className="text-xl font-semibold mb-2">
                Oops! Your cart is empty.
              </h2>
              <p className="text-sm text-gray-400 mb-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
                eiusmod tempor incididunt ut labore et dolore magna aliqua.
              </p>

              <Button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-md">
                Add items to cart
              </Button>
            </div>
          </div>
        ) : (
          cartItems.map((item) => (
            <CartItem
              key={item.id}
              item={item}
              increment={increment}
              decrement={decrement}
              removeItem={removeItem}
            />
          ))
        )}
      </div>
      <div className="bg-[#1a1a1a] p-6 rounded-lg space-y-4 h-fit">
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
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setCurrentStep(2)}>
          Continue to payment
        </Button>
      </div>
    </div>
  );

  const BillingAddressStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Billing address</h3>
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
            <p>{billingInfo.house}</p>
          </div>
        </div>
        <div className="text-right mt-4">
          <Button
            onClick={() => setCurrentStep(3)}
            className="bg-purple-600 hover:bg-purple-700 text-white">
            Continue to payment
          </Button>
        </div>
      </div>
    </div>
  );

  const PaymentStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4">Billing address</h3>
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
            <p>{billingInfo.house}</p>
          </div>
        </div>
      </div>
      <div className="bg-[#1a1a1a] p-6 rounded-lg space-y-4 h-fit">
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
  );

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <StepIndicator />
      {currentStep === 1 && <CartReviewStep />}
      {currentStep === 2 && <BillingAddressStep />}
      {currentStep === 3 && <PaymentStep />}
    </div>
  );
}
