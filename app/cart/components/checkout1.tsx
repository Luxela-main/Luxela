"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button"
  ;
import { Minus, Plus, Trash2, Pencil } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";

const initialCartItems = [
  { id: 1, name: "Luxela product 1", price: 30000, quantity: 1 },
  { id: 2, name: "Luxela product 2", price: 30000, quantity: 1 },
  { id: 3, name: "Luxela product 3", price: 30000, quantity: 1 },
  { id: 4, name: "Luxela product 4", price: 30000, quantity: 1 },
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
            <p className="text-sm text-gray-400">NGN {item.price.toLocaleString()}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" onClick={() => decrement(item.id)}>
            <Minus size={16} />
          </Button>
          <span className="w-8 text-center">{item.quantity}</span>
          <Button size="icon" variant="outline" onClick={() => increment(item.id)}>
            <Plus size={16} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Pencil size={16} className="mr-1" /> Edit order
          </Button>
          <Button variant="destructive" size="sm" onClick={() => removeItem(item.id)}>
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
  type FormType = {
    fullName: string;
    email: string;
    phone: string;
    state: string;
    city: string;
    address: string;
    postalCode: string;
    discountCode: string;
    saveDetails: boolean;
    [key: string]: string | boolean;
  };

  type ErrorsType = Partial<Record<keyof FormType, string>>;

  const [form, setForm] = useState<FormType>({
    fullName: "",
    email: "",
    phone: "",
    state: "",
    city: "",
    address: "",
    postalCode: "",
    discountCode: "",
    saveDetails: false,
  });
  const [errors, setErrors] = useState<ErrorsType>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const validateForm = () => {
    const newErrors: ErrorsType = {};
    if (!form.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!form.email.trim()) newErrors.email = "Email is required";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) newErrors.email = "Invalid email";
    if (!form.state.trim()) newErrors.state = "State is required";
    if (!form.city.trim()) newErrors.city = "City is required";
    if (!form.address.trim()) newErrors.address = "Address is required";
    if (!form.postalCode.trim()) newErrors.postalCode = "Postal code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

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

  const subtotal = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = 0;
  const total = subtotal - discount + 0.01;

  const StepIndicator = () => (
    <div className="flex justify-center gap-8 my-8 text-sm">
      <button
        className={`font-bold ${currentStep === 1 ? "text-purple-500" : "text-gray-400"}`}
        onClick={() => setCurrentStep(1)}
      >
        1. Cart review
      </button>
      <button
        className={`font-bold ${currentStep === 2 ? "text-purple-500" : "text-gray-400"}`}
        onClick={() => setCurrentStep(2)}
      >
        2. Billing address
      </button>
      <button
        className={`font-bold ${currentStep === 3 ? "text-purple-500" : "text-gray-400"}`}
        onClick={() => setCurrentStep(3)}
      >
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

              <h2 className="text-xl font-semibold mb-2">Oops! Your cart is empty.</h2>
              <p className="text-sm text-gray-400 mb-6">
                Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
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
          )))}

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
        <div className="flex justify-between text-sm text-gray-400">
          <span>Shipping fees</span>
          <span>NGN 0.01</span>
        </div>
        <div className="flex justify-between text-lg">
          <span className="font-semibold">Total amount</span>
          <span className="font-bold text-white">NGN {total.toLocaleString()}</span>
        </div>
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white"
          onClick={() => setCurrentStep(2)}
        >
          Proceed to checkout
        </Button>
      </div>
    </div>
  );

  const BillingAddressStep = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="bg-[#1a1a1a] p-6 rounded-lg space-y-4 h-fit">
        <h3 className="text-lg font-semibold text-white mb-4">Your order</h3>
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center justify-between border-b border-gray-700 pb-2">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-700 rounded" />
              <div>
                <p className="text-white text-sm">{item.name}</p>
                <p className="text-xs text-gray-400">Quantity: {item.quantity}</p>
              </div>
            </div>
            <Trash2 className="text-red-500 cursor-pointer" size={16} />
          </div>
        ))}
        <input
          type="text"
          name="discountCode"
          value={form.discountCode}
          onChange={handleChange}
          placeholder="Enter discount code"
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-sm text-white"
        />
        <Button className="mt-2 w-full bg-purple-600 hover:bg-purple-700 text-white">Apply code</Button>
        <div className="space-y-1 text-sm text-white">
          <div className="flex justify-between text-gray-400">
            <span>Subtotal</span>
            <span>NGN {subtotal.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Discount</span>
            <span>NGN {discount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Shipping fees</span>
            <span>NGN 0.01</span>
          </div>
          <div className="flex justify-between font-bold pt-2 text-white">
            <span>Total amount</span>
            <span>NGN {total.toLocaleString()}</span>
          </div>
        </div>
        <Button
          className="w-full bg-purple-600 hover:bg-purple-700 text-white mt-4"
          onClick={() => validateForm() && setCurrentStep(3)}
        >
          Continue to payment
        </Button>
      </div>
      <div className="lg:col-span-2 bg-[#1a1a1a] p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-6">Shipping details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          {['fullName', 'email', 'phone', 'state', 'city', 'address', 'postalCode'].map((field) => (
            <div key={field} className="col-span-1 md:col-span-1">
              <input
                type="text"
                name={field}
                value={typeof form[field] === "string" ? form[field] : ""}
                onChange={handleChange}
                placeholder={field.replace(/([A-Z])/g, ' $1')}
                className="px-4 py-2 w-full bg-gray-800 border border-gray-700 rounded text-sm text-white"
              />
              {errors[field] && <p className="text-red-500 text-xs mt-1">{errors[field]}</p>}
            </div>
          ))}
        </div>
        <label className="flex items-center text-sm text-white mt-4">
          <input
            type="checkbox"
            name="saveDetails"
            checked={form.saveDetails}
            onChange={handleChange}
            className="mr-2"
          />
          Save my information for future checkouts in <span className="text-purple-500 ml-1">Luxela</span>
        </label>
      </div>
    </div>
  );

  const PaymentStep = () => (
    <div className="text-center text-gray-400">Payment form goes here. <Button onClick={() => setCurrentStep(1)}>Back to cart</Button></div>
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
