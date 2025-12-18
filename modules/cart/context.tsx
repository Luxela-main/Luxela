"use client";

import { createContext, useContext, ReactNode } from "react";
import {
  useGetCart,
  useAddToCart,
  useUpdateCartItem,
  useRemoveCartItem,
  useClearCart,
  useApplyDiscount,
  useCheckout,
} from "./query";
import { DiscountType, CheckoutRequest, CartItemType } from "./model";

type CartContextType = {
  cart: any;
  items: CartItemType[];
  discount: DiscountType | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  addToCart: (listingId: string, quantity: number) => void;
  updateQuantity: (listingId: string, quantity: number) => void;
  removeItem: (listingId: string) => void;
  clearCart: () => void;
  applyDiscount: (code: string) => void;
  checkout: (data: CheckoutRequest) => void;
  itemCount: number;
  subtotal: number;
  total: number;
  discountAmount: number;
};

export const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export const useCartState = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCartState must be used within a CartProvider");
  }
  return context;
};

interface CartProviderProps {
  children: ReactNode;
}

export const CartProvider = ({ children }: CartProviderProps) => {
  const { data, isLoading, isError, error } = useGetCart();
  const addToCartMutation = useAddToCart();
  const updateCartItemMutation = useUpdateCartItem();
  const removeCartItemMutation = useRemoveCartItem();
  const clearCartMutation = useClearCart();
  const applyDiscountMutation = useApplyDiscount();
  const checkoutMutation = useCheckout();

  const cart = data?.cart;
  const items = data?.items || [];
  const discount = data?.discount || null;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );

  const discountAmount = discount
    ? discount.percentOff > 0
      ? (subtotal * discount.percentOff) / 100
      : discount.amountOffCents
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  const addToCart = (listingId: string, quantity: number) => {
    addToCartMutation.mutate({ listingId, quantity });
  };

  const updateQuantity = (listingId: string, quantity: number) => {
    if (quantity === 0) {
      removeItem(listingId);
    } else {
      updateCartItemMutation.mutate({ listingId, quantity });
    }
  };

  const removeItem = (listingId: string) => {
    removeCartItemMutation.mutate(listingId);
  };

  const clearCart = () => {
    clearCartMutation.mutate();
  };

  const applyDiscount = (code: string) => {
    applyDiscountMutation.mutate({ code });
  };

  const checkout = (data: CheckoutRequest) => {
    checkoutMutation.mutate(data);
  };

  const normalizedError: Error | null =
  error instanceof Error ? error : null;

  const value: CartContextType = {
    cart,
    items,
    discount,
    isLoading,
    isError,
    error: normalizedError,
    addToCart,
    updateQuantity,
    removeItem,
    clearCart,
    applyDiscount,
    checkout,
    itemCount,
    subtotal,
    total,
    discountAmount,
  };
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};
