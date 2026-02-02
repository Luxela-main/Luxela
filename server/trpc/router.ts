import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { createTRPCContext } from "./context";
import { listingRouter } from "../routers/listing";
import { sellerRouter } from "../routers/seller";
import { sellerOrdersRouter } from "../routers/sellerOrders";
import { buyerRouter } from "../routers/buyer";
import { salesRouter } from "../routers/sales";
import { cartRouter } from "../routers/cart";
import { paymentRouter } from "../routers/payment";
import { reviewRouter } from "../routers/review";
import { notificationRouter } from "../routers/notification";
import { supportRouter } from "../routers/support";
import { supportAdminRouter } from "../routers/support-admin";
import { productRouter } from "../routers/product";
import { collectionRouter } from "../routers/collection";
import { refundRouter } from "../routers/refund";
import { inventoryRouter } from "../routers/inventory";
import { paymentConfirmationRouter } from "../routers/paymentConfirmation";
import { orderStatusRouter } from "../routers/orderStatus";
import { shippingRouter } from "../routers/shipping";
import { emailNotificationRouter } from "../routers/emailNotification";
import { checkoutRouter } from "../routers/checkout";
import { webhookRouter } from "../routers/webhook";
import { variantsRouter } from "../routers/variantsRouter";
import { financeRouter } from "../routers/finance";
import { supportSubscriptionsRouter } from "../routers/supportSubscriptions";
import { payoutSubscriptionsRouter } from "../routers/payoutSubscriptions";
import { faqsRouter } from "../routers/faqs";
import { productsRouter } from "../routers/products";
import { adminListingReviewRouter } from "../routers/admin-listing-review";
import { sellerListingNotificationsRouter } from "../routers/seller-listing-notifications";
import { buyerListingsCatalogRouter } from "../routers/buyer-listings-catalog";

const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

export const publicProcedure = t.procedure;

const helloRouter = t.router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(({ input }) => {
      return { message: `Hello ${input?.name ?? "world"}!` };
    }),
});

export const appRouter = t.router({
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
});

export type AppRouter = typeof appRouter;