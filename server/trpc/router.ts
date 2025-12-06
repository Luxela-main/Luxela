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
});

export type AppRouter = typeof appRouter;