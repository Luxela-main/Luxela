export interface Sale {
  orderId: string;
  product: string;
  customer: string;
  orderDate: Date;
  paymentMethod: string;
  amountCents: number;
  currency: string;
  payoutStatus: "in_escrow" | "processing" | "paid";
  deliveryStatus: "not_shipped" | "in_transit" | "delivered";
  orderStatus: "processing" | "shipped" | "delivered" | "canceled" | "returned";
}
