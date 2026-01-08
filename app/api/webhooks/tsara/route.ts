import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { payments, orders, listings, notifications, webhookEvents } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import "dotenv/config";

async function verifyWebhookSignature(rawBody: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["verify"]
    );
    const signatureBytes = Uint8Array.from(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)));
    return await crypto.subtle.verify("HMAC", key, signatureBytes, encoder.encode(rawBody));
  } catch (err) {
    console.error("Webhook signature verification error:", err);
    return false;
  }
}

export const runtime = "nodejs";

export const GET = () => NextResponse.json({ message: "Webhook endpoint alive" });

export const POST = async (req: NextRequest) => {
  try {
    const signature = req.headers.get("x-tsara-signature");
    const secret = process.env.TSARA_WEBHOOK_SECRET;

    if (!signature || !secret) return NextResponse.json({ error: "Missing signature or secret" }, { status: 400 });

    const rawBody = await req.text();
    const isValid = await verifyWebhookSignature(rawBody, signature, secret);
    if (!isValid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

    const { event, data, id: eventId } = JSON.parse(rawBody);
    if (!eventId) return NextResponse.json({ error: "Missing event ID" }, { status: 400 });

    const existing = await db.select().from(webhookEvents).where(eq(webhookEvents.eventId, eventId)).limit(1);
    if (existing.length > 0) return NextResponse.json({ success: true, idempotent: true });

    await db.transaction(async (tx) => {
      await tx.insert(webhookEvents).values({
        eventId,
        eventType: event,
        status: "pending",
        receivedAt: new Date()
      });

      if (event === "payment.updated" || event === "payment_link.updated") {
        const statusMap: Record<string, "pending" | "processing" | "completed" | "failed" | "refunded"> = {
          pending: "pending", processing: "processing", success: "completed", failed: "failed", refunded: "refunded"
        };

        const updatedPayment = await tx.update(payments)
          .set({
            status: statusMap[data.status] || "pending",
            updatedAt: new Date(),
            gatewayResponse: rawBody,
            ...(data.status === "refunded" ? { isRefunded: true, refundedAt: new Date() } : {})
          })
          .where(eq(payments.transactionRef, data.reference))
          .returning();

        if (!updatedPayment.length) throw new Error("Payment not found");
        const payment = updatedPayment[0];

        if (["success", "completed"].includes(data.status)) {
          if (payment.orderId) await tx.update(orders).set({ orderStatus: "processing", payoutStatus: "processing" }).where(eq(orders.id, payment.orderId));
          if (payment.listingId) {
            const listingRow = await tx.select({ sellerId: listings.sellerId, productTitle: listings.title }).from(listings).where(eq(listings.id, payment.listingId)).limit(1);
            if (listingRow[0]) await tx.insert(notifications).values({ sellerId: listingRow[0].sellerId, type: "purchase", message: `Payment received for "${listingRow[0].productTitle}" - $${(payment.amountCents / 100).toFixed(2)}`, isRead: false, isStarred: false, createdAt: new Date() });
          }
        }

        if (data.status === "failed" && payment.listingId) {
          const listingRow = await tx.select({ sellerId: listings.sellerId, productTitle: listings.title }).from(listings).where(eq(listings.id, payment.listingId)).limit(1);
          if (listingRow[0]) await tx.insert(notifications).values({ sellerId: listingRow[0].sellerId, type: "purchase", message: `Payment failed for "${listingRow[0].productTitle}"`, isRead: false, isStarred: false, createdAt: new Date() });
        }
      }

      await tx.update(webhookEvents).set({ status: "processed", processedAt: new Date() }).where(eq(webhookEvents.eventId, eventId));
    });

    return NextResponse.json({ success: true, message: "Webhook processed" });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
};
