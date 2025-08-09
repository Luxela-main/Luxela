"use client";

import { useState } from "react";
import { Minus, Plus, Trash2, Pencil } from "lucide-react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/button";

const initialCartItems = [
  { id: 1, name: "Luxela product 1", price: 30000, quantity: 1 },
  { id: 2, name: "Luxela product 2", price: 30000, quantity: 1 },
  { id: 3, name: "Luxela product 3", price: 30000, quantity: 1 },
  { id: 4, name: "Luxela product 4", price: 30000, quantity: 1 },
];

export default function CartPage() {
  const [cartItems, setCartItems] = useState(initialCartItems);

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

  return (
    <div className="min-h-screen bg-black text-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Cart Items</h2>
        <Button variant="destructive" onClick={clearCart}>
          Clear Cart
        </Button>
      </div>

      <div className="grid gap-4">
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
            <Card key={item.id} className="bg-[#1a1a1a] text-white">
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
          ))
        )}
      </div>
    </div>
  );
}
