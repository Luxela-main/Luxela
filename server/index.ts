import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import express, { Request, Response } from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createTRPCContext } from "./trpc/context";
import { createTRPCRouter } from "./trpc/trpc";
import { eq } from "drizzle-orm";
import { z } from "zod";

// DB initializer
import { keepAlive as initDB } from "./check-db";

// Routers
import { sellerRouter } from "./routers/seller";
import { listingRouter } from "./routers/listing";
import { salesRouter } from "./routers/sales";
import { cartRouter } from "./routers/cart";
import { notificationRouter } from "./routers/notification";
import { reviewRouter } from "./routers/review";
import { paymentRouter } from "./routers/payment";
import { buyerRouter } from "./routers/buyer";

// Create tRPC router
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

// JSON body parser for normal endpoints
app.use(express.json());

// CORS setup
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  process.env.FRONTEND_URL,
  process.env.API_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// --- TSARA WEBHOOK ---
app.post(
  "/webhooks/tsara",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    try {
      const signature = req.headers["x-tsara-signature"] as string;
      const payload = req.body.toString();

      if (!signature) return res.status(400).json({ error: "Missing signature" });

      // Dynamic import to avoid circular dependencies
      const { verifyWebhookSignature } = await import("./services/tsara.js");
      const isValid = verifyWebhookSignature(payload, signature);
      if (!isValid) return res.status(401).json({ error: "Invalid signature" });

      // Validate payload
      const webhookSchema = z.object({
        event: z.string(),
        data: z.object({
          reference: z.string(),
          status: z.string(),
          orderId: z.number().optional(),
          listingId: z.number().optional(),
          amountCents: z.number().optional(),
        }),
      });
      const webhookData = webhookSchema.parse(JSON.parse(payload));

      console.log("Received verified Tsara webhook:", webhookData);

      // Dynamic DB imports
      const { db } = await import("./db.js");
      const { payments, orders, listings, notifications } = await import("./db/schema.js");

      // Map Tsara status to internal status
      const statusMap: Record<string, "pending" | "processing" | "completed" | "failed" | "refunded"> = {
        pending: "pending",
        processing: "processing",
        success: "completed",
        failed: "failed",
        refunded: "refunded",
      };

      // Use transaction for atomic updates
      await db.transaction(async (tx) => {
        // Update payment
        const updatedPayments = await tx
          .update(payments)
          .set({
            status: statusMap[webhookData.data.status] || "pending",
            updatedAt: new Date(),
            gatewayResponse: JSON.stringify(webhookData),
            ...(webhookData.data.status === "refunded" && {
              isRefunded: true,
              refundedAt: new Date(),
            }),
          })
          .where(eq(payments.transactionRef, webhookData.data.reference))
          .returning();

        if (updatedPayments.length === 0) {
          console.warn("Payment not found for reference:", webhookData.data.reference);
          return res.status(404).json({ error: "Payment not found" });
        }

        const payment = updatedPayments[0];

        // Update order status if linked
        if (payment.orderId) {
          if (webhookData.data.status === "success" || webhookData.data.status === "completed") {
            await tx
              .update(orders)
              .set({ orderStatus: "processing", payoutStatus: "processing" })
              .where(eq(orders.id, payment.orderId));
          } else if (webhookData.data.status === "failed") {
            await tx
              .update(orders)
              .set({ orderStatus: "canceled" })
              .where(eq(orders.id, payment.orderId));
          }
        }

        // Notify seller if linked to a listing
        if (payment.listingId) {
          const listingData = await tx
            .select({ sellerId: listings.sellerId, productTitle: listings.title })
            .from(listings)
            .where(eq(listings.id, payment.listingId))
            .limit(1);

          if (listingData[0]) {
            const message =
              webhookData.data.status === "success" || webhookData.data.status === "completed"
                ? `Payment received for "${listingData[0].productTitle}" - $${(
                    (payment.amountCents || 0) / 100
                  ).toFixed(2)}`
                : `Payment failed for "${listingData[0].productTitle}"`;

            await tx.insert(notifications).values({
              sellerId: listingData[0].sellerId,
              type: "purchase",
              message,
              isRead: false,
              isStarred: false,
            });
          }
        }
      });

      res.json({ success: true, message: "Webhook processed successfully" });
    } catch (error: any) {
      console.error("Webhook processing error:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);

// --- tRPC Middleware ---
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: createTRPCContext,
  })
);

// Health check & root
app.get("/", (_req, res) => res.send("Luxela API (Supabase Edition) running"));
app.get("/health", (_req, res) => res.json({ status: "ok" }));

// --- Start server only in non-serverless environments ---
const PORT = process.env.PORT || 5000;
if (!process.env.VERCEL) {
  app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
    try {
      await initDB();
      console.log("Database initialized successfully");
    } catch (err) {
      console.error("Failed to initialize DB:", err);
    }
  });
}

// Export for Vercel / Serverless
export default (req: Request, res: Response) => {
  app(req, res);
};