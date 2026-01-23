import { initTRPC } from "@trpc/server";
import { z } from "zod";
import { createTRPCContext } from "./context";
import { listingRouter } from "../routers/listing";
import { sellerRouter } from "../routers/seller";
import { buyerRouter } from "../routers/buyer";
import { salesRouter } from "../routers/sales";
import { cartRouter } from "../routers/cart";
import { paymentRouter } from "../routers/payment";
import { reviewRouter } from "../routers/review";
import { notificationRouter } from "../routers/notification";
import { supportRouter } from "../routers/support";
import { productRouter } from "../routers/product";

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


const t = initTRPC.context<ReturnType<typeof createTRPCContext>>().create();

export const publicProcedure = t.procedure;

export const appRouter = t.router({
  hello: publicProcedure
    .input(z.object({ name: z.string().optional() }).optional())
    .query(({ input }) => {
      return { message: `Hello ${input?.name ?? "world"}!` };
    }),
  listing: listingRouter,
  seller: sellerRouter,
  buyer: buyerRouter,
  sales: salesRouter,
  cart: cartRouter,
  payment: paymentRouter,
  review: reviewRouter,
  notification: notificationRouter,
  support: supportRouter,
  product: productRouter,
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
});

export type AppRouter = typeof appRouter;