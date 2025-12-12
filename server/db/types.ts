import { z } from "zod";
import { 
  userSchema, buyerSchema, buyerAccountDetailsSchema, 
  buyerBillingAddressSchema, buyerShippingSchema, favoritesSchema, 
  cartSchema, cartItemSchema, sellerSchema, sellerBusinessSchema, 
  sellerAdditionalSchema, sellerPaymentSchema, sellerShippingSchema, 
  listingSchema, orderSchema, paymentSchema, reviewSchema, 
  notificationSchema, discountSchema, emailOtpSchema 
} from "./zodSchemas";

export type User = z.infer<typeof userSchema>;
export type Buyer = z.infer<typeof buyerSchema>;
export type BuyerAccountDetails = z.infer<typeof buyerAccountDetailsSchema>;
export type BuyerBillingAddress = z.infer<typeof buyerBillingAddressSchema>;
export type BuyerShipping = z.infer<typeof buyerShippingSchema>;
export type Favorite = z.infer<typeof favoritesSchema>;
export type Cart = z.infer<typeof cartSchema>;
export type CartItem = z.infer<typeof cartItemSchema>;

export type Seller = z.infer<typeof sellerSchema>;
export type SellerBusiness = z.infer<typeof sellerBusinessSchema>;
export type SellerAdditional = z.infer<typeof sellerAdditionalSchema>;
export type SellerPayment = z.infer<typeof sellerPaymentSchema>;
export type SellerShipping = z.infer<typeof sellerShippingSchema>;

export type Listing = z.infer<typeof listingSchema>;
export type Order = z.infer<typeof orderSchema>;
export type Payment = z.infer<typeof paymentSchema>;
export type Review = z.infer<typeof reviewSchema>;
export type Notification = z.infer<typeof notificationSchema>;
export type Discount = z.infer<typeof discountSchema>;
export type EmailOtp = z.infer<typeof emailOtpSchema>;