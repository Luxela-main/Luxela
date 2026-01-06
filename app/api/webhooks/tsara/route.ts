import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { payments, orders, listings, notifications } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/server/services/tsara";

export const POST = async (req: NextRequest) => {
  try {
    const signature = req.headers.get("x-tsara-signature");
    if (!signature) return NextResponse.json({ error: "Missing signature" }, { status: 400 });

    const payload = await req.text();

    if (!verifyWebhookSignature(payload, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const webhookData = JSON.parse(payload);
    const { event, data } = webhookData;

    if (event === "payment.updated" || event === "payment_link.updated") {
      const statusMap: Record<string, "pending" | "processing" | "completed" | "failed" | "refunded"> = {
        pending: "pending",
        processing: "processing",
        success: "completed",
        failed: "failed",
        refunded: "refunded",
      };

      const updatedPayment = await db
        .update(payments)
        .set({
          status: statusMap[data.status] || "pending",
          updatedAt: new Date(),
          gatewayResponse: JSON.stringify(webhookData),
          ...(data.status === "refunded" && { isRefunded: true, refundedAt: new Date() }),
        })
        .where(eq(payments.transactionRef, data.reference))
        .returning();

      if (!updatedPayment.length) {
        return NextResponse.json({ error: "Payment not found" }, { status: 404 });
      }

      const payment = updatedPayment[0];

      // Payment business logic
      if (["success", "completed"].includes(data.status)) {
        if (payment.orderId) {
          await db.update(orders).set({ orderStatus: "processing" }).where(eq(orders.id, payment.orderId));
        }

        if (payment.listingId) {
          const listingData = await db
            .select({ sellerId: listings.sellerId, productTitle: listings.title })
            .from(listings)
            .where(eq(listings.id, payment.listingId))
            .limit(1);

          if (listingData[0]) {
            await db.insert(notifications).values({
              sellerId: listingData[0].sellerId,
              type: "purchase",
              message: `Payment received for "${listingData[0].productTitle}" - $${(payment.amountCents / 100).toFixed(
                2
              )}`,
              isRead: false,
              isStarred: false,
            });
          }
        }

        if (payment.orderId) {
          await db.update(orders).set({ payoutStatus: "processing" }).where(eq(orders.id, payment.orderId));
        }
      }

      if (data.status === "failed" && payment.listingId) {
        const listingData = await db
          .select({ sellerId: listings.sellerId, productTitle: listings.title })
          .from(listings)
          .where(eq(listings.id, payment.listingId))
          .limit(1);

        if (listingData[0]) {
          await db.insert(notifications).values({
            sellerId: listingData[0].sellerId,
            type: "purchase",
            message: `Payment failed for "${listingData[0].productTitle}"`,
            isRead: false,
            isStarred: false,
          });
        }
      }
    }

    return NextResponse.json({ success: true, message: "Webhook processed successfully" });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};