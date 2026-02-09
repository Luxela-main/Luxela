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
  hasUnapprovedItems?: boolean;
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

  const { listings, approvedListings, validateProductForCart, isListingApproved, getApprovedListingById } = useListings();

  const items = useMemo(() => {
    const rawItems = data?.items || [];

    const enrichedItems = rawItems
      .filter((item) => {
        // CRITICAL: Only show approved products in cart
        const isApproved = isListingApproved(item.listingId);
        if (!isApproved) {
          console.warn(
            `[CartContext] Filtering out non-approved product from cart: ${item.listingId}`
          );
        }
        return isApproved;
      })
      .map((item) => {
        // Find the product details from approved listings only
        const product = approvedListings.find((l) => l.id === item.listingId);

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
    // CRITICAL: Validate product approval before adding to cart
    let validation = validateProductForCart(listingId);
    
    // If product is not in approved listings cache, try to fetch it directly
    if (!validation.valid) {
      try {
        const listing = await getApprovedListingById(listingId, true);
        if (!listing) {
          throw new Error(
            'Product is not available or has been removed from the catalog'
          );
        }
        // Check stock
        if ((listing.quantity_available || 0) <= 0) {
          throw new Error('This product is currently out of stock');
        }
        // Product is valid, proceed
      } catch (error: any) {
        throw error instanceof Error ? error : new Error(
          validation.reason || 'This product cannot be added to your cart'
        );
      }
    }

    if (quantity <= 0) {
      throw new Error('Invalid quantity. Please select at least 1 item.');
    }

    await addToCartMutation.mutateAsync({ listingId, quantity });
  };

  const updateQuantity = async (listingId: string, quantity: number) => {
    // Validate approval status when updating
    if (!isListingApproved(listingId)) {
      console.warn(
        `[CartContext] Cannot update non-approved product: ${listingId}`
      );
      await removeItem(listingId);
      return;
    }

    if (quantity === 0) {
      await removeItem(listingId);
    } else if (quantity > 0) {
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
    // CRITICAL: Validate all cart items are approved before checkout
    const unapprovedItems = items.filter((item) => !isListingApproved(item.listingId));
    if (unapprovedItems.length > 0) {
      throw new Error(
        `Cannot proceed with checkout. ${unapprovedItems.length} product(s) are no longer available.`
      );
    }

    // Verify at least one item is in cart
    if (items.length === 0) {
      throw new Error('Your cart is empty. Please add products before checkout.');
    }

    await checkoutMutation.mutateAsync(data);
  };

  const normalizedError: Error | null = error instanceof Error ? error : null;

  const hasUnapprovedItems = items.some(
    (item) => !isListingApproved(item.listingId)
  );

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
    hasUnapprovedItems,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};