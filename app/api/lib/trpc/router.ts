import { createTRPCRouter, publicProcedure } from "./trpc";
import { z } from "zod";

// Import all routers from /server/routers
import { listingRouter } from "@/server/routers/listing";
import { sellerRouter } from "@/server/routers/seller";
import { sellerOrdersRouter } from "@/server/routers/sellerOrders";
import { buyerRouter } from "@/server/routers/buyer";
import { salesRouter } from "@/server/routers/sales";
import { cartRouter } from "@/server/routers/cart";
import { paymentRouter } from "@/server/routers/payment";
import { reviewRouter } from "@/server/routers/review";
import { notificationRouter } from "@/server/routers/notification";
import { supportRouter } from "@/server/routers/support";
import { supportAdminRouter } from "@/server/routers/support-admin";
import { productRouter } from "@/server/routers/product";
import { collectionRouter } from "@/server/routers/collection";
import { refundRouter } from "@/server/routers/refund";
import { inventoryRouter } from "@/server/routers/inventory";
import { paymentConfirmationRouter } from "@/server/routers/paymentConfirmation";
import { orderStatusRouter } from "@/server/routers/orderStatus";
import { shippingRouter } from "@/server/routers/shipping";
import { emailNotificationRouter } from "@/server/routers/emailNotification";
import { checkoutRouter } from "@/server/routers/checkout";
import { webhookRouter } from "@/server/routers/webhook";
import { variantsRouter } from "@/server/routers/variantsRouter";
import { financeRouter } from "@/server/routers/finance";
import { supportSubscriptionsRouter } from "@/server/routers/supportSubscriptions";
import { payoutSubscriptionsRouter } from "@/server/routers/payoutSubscriptions";
import { faqsRouter } from "@/server/routers/faqs";
import { productsRouter } from "@/server/routers/products";
import { adminListingReviewRouter } from "@/server/routers/admin-listing-review";
import { sellerListingNotificationsRouter } from "@/server/routers/seller-listing-notifications";
import { buyerListingsCatalogRouter } from "@/server/routers/buyer-listings-catalog";
import { payoutVerificationRouter } from "@/server/routers/payoutVerification";

const helloRouter = createTRPCRouter({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(({ input }) => {
      return { message: `Hello ${input?.name ?? "world"}!` };
    }),
});

export const appRouter = createTRPCRouter({
  hello: helloRouter.hello,
  listing: listingRouter,
  seller: sellerRouter,
  sellers: sellerOrdersRouter,
  buyer: buyerRouter,
  sales: salesRouter,
  cart: cartRouter,
  payment: paymentRouter,
  review: reviewRouter,
  notification: notificationRouter,
  support: supportRouter,
  supportAdmin: supportAdminRouter,
  product: productRouter,
  collection: collectionRouter,
  refund: refundRouter,
  inventory: inventoryRouter,
  paymentConfirmation: paymentConfirmationRouter,
  orderStatus: orderStatusRouter,
  shipping: shippingRouter,
  emailNotification: emailNotificationRouter,
  checkout: checkoutRouter,
  webhooks: webhookRouter,
  variants: variantsRouter,
  finance: financeRouter,
  supportSubscriptions: supportSubscriptionsRouter,
  payoutSubscriptions: payoutSubscriptionsRouter,
  faqs: faqsRouter,
  products: productsRouter,
  adminListingReview: adminListingReviewRouter,
  sellerListingNotifications: sellerListingNotificationsRouter,
  buyerListingsCatalog: buyerListingsCatalogRouter,
  payoutVerification: payoutVerificationRouter,
});

export type AppRouter = typeof appRouter;