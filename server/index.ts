import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createTRPCContext } from "./trpc/context";
import { createTRPCRouter } from "./trpc/trpc";

// Routers
import { sellerRouter } from "./routers/seller";
import { listingRouter } from "./routers/listing";
import { salesRouter } from "./routers/sales";
import { cartRouter } from "./routers/cart";
import { notificationRouter } from "./routers/notification";
import { reviewRouter } from "./routers/review";
import { paymentRouter } from "./routers/payment";
import { buyerRouter } from "./routers/buyer";

// DB initializer
import { keepAlive as initDB } from "./check-db";

export const appRouter = createTRPCRouter({
  seller: sellerRouter,
  listing: listingRouter,
  sales: salesRouter,
  cart: cartRouter,
  notification: notificationRouter,
  review: reviewRouter,
  payment: paymentRouter,
  buyer: buyerRouter,
});

export type AppRouter = typeof appRouter;

const app = express();

app.use(express.json());

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5000", "https://theluxela.com"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

app.get("/", (_req, res) => res.send("Luxela API (Supabase Edition) running"));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

const PORT = process.env.PORT || 5000;
app.listen(PORT, async () => {
  console.log(`Server running at http://localhost:${PORT}`);
  await initDB();
});
