export interface Sale {
  id: string;
  orderId: string;
  product: string;
  customer: string;
  customerEmail?: string;
  orderDate: Date;
  paymentMethod: string;
  amountCents: number;
  currency: string;
  quantity: number;
  shippingAddress?: string;
  payoutStatus: "in_escrow" | "processing" | "paid";
  deliveryStatus: "not_shipped" | "in_transit" | "delivered";
  orderStatus: "pending" | "confirmed" | "processing" | "shipped" | "delivered" | "canceled" | "returned";
}