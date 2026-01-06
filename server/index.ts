import dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import express, { Express } from "express";
import cors from "cors";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { createTRPCContext } from "./trpc/context";
import { createTRPCRouter } from "./trpc/trpc";
import { eq } from "drizzle-orm";

// Import additional tables for webhook processing
import { orders, notifications } from "./db/schema";

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
import { startKeepAlive as initDB } from "./check-db";

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

const app: Express = express();

app.use(express.json());

// Webhook endpoint for Tsara payments (needs raw body for signature verification)
app.post("/webhooks/tsara", express.raw({ type: 'application/json' }), async (req, res) => {
  try {
    const signature = req.headers['x-tsara-signature'] as string;
    const payload = req.body.toString();

    if (!signature) {
      return res.status(400).json({ error: 'Missing signature' });
    }

    // Import verifyWebhookSignature
    const { verifyWebhookSignature } = await import('./services/tsara');

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(payload, signature);
    if (!isValidSignature) {
      return res.status(401).json({ error: 'Invalid signature' });
    }

    const webhookData = JSON.parse(payload);

    console.log("Received verified Tsara webhook:", webhookData);

    // Process webhook data
    const { event, data } = webhookData;

    if (event === 'payment.updated' || event === 'payment_link.updated') {
      // Import db and schema here to avoid circular dependencies
      const { db } = await import('./db');
      const { payments } = await import('./db/schema');

      // Map Tsara status to our database status
      const statusMap: Record<string, "pending" | "processing" | "completed" | "failed" | "refunded"> = {
        "pending": "pending",
        "processing": "processing",
        "success": "completed",
        "failed": "failed",
        "refunded": "refunded"
      };

      // Update payment status in database
      const updatedPayment = await db
        .update(payments)
        .set({
          status: statusMap[data.status] || "pending",
          updatedAt: new Date(),
          gatewayResponse: JSON.stringify(webhookData),
          ...(data.status === "refunded" && {
            isRefunded: true,
            refundedAt: new Date(),
          }),
        })
        .where(eq(payments.transactionRef, data.reference))
        .returning();

      if (updatedPayment.length === 0) {
        console.warn("Payment not found for reference:", data.reference);
        return res.status(404).json({ error: 'Payment not found' });
      }

      const payment = updatedPayment[0];

      // Business logic for payment status changes
      if (data.status === 'success' || data.status === 'completed') {
        // Update order status if payment is linked to an order
        if (payment.orderId) {
          await db
            .update(orders)
            .set({
              orderStatus: 'processing',
            })
            .where(eq(orders.id, payment.orderId));
        }

        // Create notification for seller
        if (payment.listingId) {
          // Get seller info from listing
          const { listings, sellers } = await import('./db/schema');
          const listingData = await db
            .select({
              sellerId: listings.sellerId,
              productTitle: listings.title,
            })
            .from(listings)
            .where(eq(listings.id, payment.listingId))
            .limit(1);

          if (listingData[0]) {
            await db.insert(notifications).values({
              sellerId: listingData[0].sellerId,
              type: 'purchase',
              message: `Payment received for "${listingData[0].productTitle}" - $${(payment.amountCents / 100).toFixed(2)}`,
              isRead: false,
              isStarred: false,
            });
          }
        }

        // Process payouts - update order payout status
        if (payment.orderId) {
          await db
            .update(orders)
            .set({
              payoutStatus: 'processing',
            })
            .where(eq(orders.id, payment.orderId));
        }
      } else if (data.status === 'failed') {
        // Handle failed payments
        if (payment.orderId) {
          await db
            .update(orders)
            .set({
              orderStatus: 'canceled',
            })
            .where(eq(orders.id, payment.orderId));
        }

        // Notify seller of failed payment
        if (payment.listingId) {
          const { listings, sellers } = await import('./db/schema');
          const listingData = await db
            .select({
              sellerId: listings.sellerId,
              productTitle: listings.title,
            })
            .from(listings)
            .where(eq(listings.id, payment.listingId))
            .limit(1);

          if (listingData[0]) {
            await db.insert(notifications).values({
              sellerId: listingData[0].sellerId,
              type: 'purchase',
              message: `Payment failed for "${listingData[0].productTitle}"`,
              isRead: false,
              isStarred: false,
            });
          }
        }
      }
      // I will do this later!
      // TODO: Send email notifications to buyer and seller
      // This would require email templates and buyer email lookup
    }

    res.json({ success: true, message: 'Webhook processed successfully' });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5000",
  process.env.FRONTEND_URL,
  process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn(`Blocked CORS request from origin: ${origin}`);
        callback(new Error("CORS policy violation"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// TRPC Middleware
app.use("/api/trpc", createExpressMiddleware({
  router: appRouter,
  createContext: createTRPCContext,
}));

// Basic Routes
app.get("/", (_req, res) => {
  res.send("Luxela API (Supabase Edition) running");
});

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Local Dev Server
const PORT = process.env.PORT || 5000;

if (process.env.VERCEL !== "1") {
  app.listen(PORT, async () => {
    console.log(`Server running at http://localhost:${PORT}`);
    await initDB();
  });
}

// Export app for serverless deployment
export default app;