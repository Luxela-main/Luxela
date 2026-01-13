"use client";

import { createContext, useContext, ReactNode, useMemo } from "react";
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
import { useListings } from "@/context/ListingsContext";

type CartContextType = {
  cart: any;
  items: CartItemType[];
  discount: DiscountType | null;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
  addToCart: (listingId: string, quantity: number) => Promise<void>;
  updateQuantity: (listingId: string, quantity: number) => Promise<void>;
  removeItem: (listingId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyDiscount: (code: string) => Promise<void>;
  checkout: (data: CheckoutRequest) => Promise<void>;
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

  const { listings } = useListings();

  const items = useMemo(() => {
    const rawItems = data?.items || [];

    const enrichedItems = rawItems.map((item) => {
      // Find the product details from listings context
      const product = listings.find((l) => l.id === item.listingId);

      return {
        ...item,
        // Mapping backend fields to frontend
        name: product?.title || `Product ${item.listingId.slice(0, 5)}`,
        image: product?.image || undefined,
        price: item.unitPriceCents / 100,
      };
    });
    // Sort by listingId so items don't swap positions on update
    return enrichedItems.sort((a, b) => a.listingId.localeCompare(b.listingId));
  }, [data?.items, listings]);

  const discount = data?.discount || null;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);
  const subtotal = items.reduce(
    (sum, item) => sum + item.unitPriceCents * item.quantity,
    0
  );

  const discountAmount = discount
    ? (discount.percentOff ?? 0) > 0
      ? (subtotal * (discount.percentOff ?? 0)) / 100
      : discount.amountOffCents ?? 0
    : 0;

  const total = Math.max(0, subtotal - discountAmount);

  const addToCart = async (listingId: string, quantity: number) => {
    await addToCartMutation.mutateAsync({ listingId, quantity });
  };

  const updateQuantity = async (listingId: string, quantity: number) => {
    if (quantity === 0) {
      await removeItem(listingId);
    } else {
      await updateCartItemMutation.mutateAsync({ listingId, quantity });
    }
  };

  const removeItem = async (listingId: string) => {
    await removeCartItemMutation.mutateAsync({ listingId });
  };

  const clearCart = async () => {
    await clearCartMutation.mutateAsync();
  };

  const applyDiscount = async (code: string) => {
    await applyDiscountMutation.mutateAsync({ code });
  };

  const checkout = async (data: CheckoutRequest) => {
    await checkoutMutation.mutateAsync(data);
  };

  const normalizedError: Error | null = error instanceof Error ? error : null;

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
