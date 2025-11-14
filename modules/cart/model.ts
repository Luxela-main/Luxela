export type CartItemType = {
  id: string;
  cartId: string;
  listingId: string;
  quantity: number;
  unitPriceCents: number;
  currency: string;
  name?: string;
  price?: number;
  image: any;
};

export type CartType = {
  id: string;
  discountId: string | null;
};

export type DiscountType = {
  id: string;
  code: string;
  percentOff: number;
  amountOffCents: number;
  active: boolean;
  expiresAt: string;
};

export type CartResponse = {
  cart: CartType;
  items: CartItemType[];
  discount: DiscountType | null;
};

export type AddToCartRequest = {
  listingId: string;
  quantity: number;
};

export type UpdateCartItemRequest = {
  listingId: string;
  quantity: number;
};

export type ApplyDiscountRequest = {
  code: string;
};

export type CartItemProps = {
  item: CartItemType;
  increment: (listingId: string) => void;
  decrement: (listingId: string) => void;
  removeItem: (listingId: string) => void;
};

export type CheckoutRequest = {
  shipping: {
    fullName: string;
    email: string;
    phoneNumber: string;
    state: string;
    city: string;
    address: string;
    postalCode: string;
  };
  paymentMethod: "card";
};

export type CheckoutResponse = {
  orders: Array<{
    id: string;
    sellerId: string;
    listingId: string;
    productTitle: string;
    productCategory: string;
    customerName: string;
    customerEmail: string;
    paymentMethod: string;
    amountCents: number;
    currency: string;
  }>;
  subtotal: number;
  discountCents: number;
  total: number;
};
