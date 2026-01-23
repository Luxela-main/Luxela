import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { payments, orders, listings, notifications, webhookEvents, paymentHolds, financialLedger } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";
import { processLoyaltyRewards } from "@/server/services/loyaltyService";
import "dotenv/config";

async function verifyWebhookSignature(
  rawBody: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(rawBody, "utf8")
      .digest("hex");

    const signatureBuffer = Buffer.from(signature, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");

    if (signatureBuffer.length !== expectedBuffer.length) {
      console.error("Signature length mismatch:", { received: signatureBuffer.length, 
      expected: expectedBuffer.length }); 
      return false;
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer); 
    
    if (!isValid) { 
      console.error("Signature mismatch:", { received: signature, expected: expectedSignature 
    });
  } 
    
    return isValid; 
  } catch (err) { console.error("Webhook signature verification error:", err); 
    return false;
    }
  }

export const runtime = "nodejs";

export const GET = () =>
  NextResponse.json({ message: "Webhook endpoint alive" });

export const POST = async (req: NextRequest) => {
  try {
    const signature = req.headers.get("x-tsara-signature");
    const secret = process.env.TSARA_WEBHOOK_SECRET;

    if (!secret) {
      console.error("Missing TSARA_WEBHOOK_SECRET");
      return NextResponse.json(
        { error: "Server misconfigured" },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error("Missing x-tsara-signature");
      return NextResponse.json(
        { error: "Missing signature" },
        { status: 401 }
      );
    }

    const rawBody = await req.text();

    console.log("Webhook received:", { signature_length: signature.length, body_length: rawBody.length, body_preview: rawBody.substring(0, 100) });

    const isValid = await verifyWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      console.error("Invalid webhook signature");
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    console.log("Signature verified successfully");

    const { event, data, id: eventId } = JSON.parse(rawBody);
    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    // Idempotency
    const existing = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId))
      .limit(1);

    if (existing.length > 0) {
      console.log("Event already processed (idempotent):", eventId);
      return NextResponse.json({ success: true, idempotent: true });
    }

    // Map external statuses to internal payment statuses
    const statusMap = {
      pending: "pending",
      processing: "processing",
      success: "completed",
      failed: "failed",
      refunded: "refunded"
    } as const;

    const mappedStatus =
      statusMap[String(data.status) as keyof typeof statusMap] ?? "pending";

    await db.transaction(async (tx) => {
      await tx.insert(webhookEvents).values({
        eventId,
        eventType: event,
        status: "pending",
        receivedAt: new Date()
      });

      // Process payment or payment link updates
      if (event === "payment.updated" || event === "payment_link.updated") {
        const updatedPayment = await tx
          .update(payments)
          .set({
            status: mappedStatus,
            updatedAt: new Date(),
            gatewayResponse: rawBody,
            ...(mappedStatus === "refunded"
              ? { isRefunded: true, refundedAt: new Date() }
              : {})
          })
          .where(eq(payments.transactionRef, data.reference))
          .returning();

        if (!updatedPayment.length) {
          throw new Error("Payment not found");
        }

        const payment = updatedPayment[0];

        // Notify seller and update orders if successful
        if (["success", "completed"].includes(data.status)) {
          if (payment.orderId) {
            await tx
              .update(orders)
              .set({
                orderStatus: "processing",
                payoutStatus: "in_escrow"
              })
              .where(eq(orders.id, payment.orderId));
          }

          if (payment.listingId) {
            const listingRow = await tx
              .select({
                sellerId: listings.sellerId,
                productTitle: listings.title
              })
              .from(listings)
              .where(eq(listings.id, payment.listingId))
              .limit(1);

            if (listingRow[0]) {
              const holdId = uuidv4();
              const now = new Date();
              const releaseableAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
              
              // Create payment hold (30-day escrow)
              await tx.insert(paymentHolds).values({
                id: holdId,
                paymentId: payment.id,
                orderId: payment.orderId || uuidv4(),
                sellerId: listingRow[0].sellerId,
                amountCents: payment.amountCents,
                currency: payment.currency,
                holdStatus: "active",
                heldAt: now,
                releaseableAt,
                createdAt: now
              });
              
              // Create financial ledger entry
              const ledgerId = uuidv4();
              await tx.insert(financialLedger).values({
                id: ledgerId,
                sellerId: listingRow[0].sellerId,
                orderId: payment.orderId || null,
                transactionType: "sale",
                amountCents: payment.amountCents,
                currency: payment.currency,
                status: "pending",
                description: `Sale from listing "${listingRow[0].productTitle}" - Payment ${payment.id}`,
                paymentId: payment.id,
                createdAt: now
              });
              
              // Notify seller
              await tx.insert(notifications).values({
                sellerId: listingRow[0].sellerId,
                type: "purchase",
                message: `Payment received for "${listingRow[0].productTitle}" - ₦${(
                  payment.amountCents / 100
                ).toFixed(2)}. Funds held in escrow for 30 days.`,
                isRead: false,
                isStarred: false,
                createdAt: now
              });
              
              // Process buyer loyalty rewards
              if (payment.buyerId) {
                await processLoyaltyRewards(payment.buyerId);
              }
            }
          }
        }

        // Failed notification
        if (data.status === "failed" && payment.listingId) {
          const listingRow = await tx
            .select({
              sellerId: listings.sellerId,
              productTitle: listings.title
            })
            .from(listings)
            .where(eq(listings.id, payment.listingId))
            .limit(1);

          if (listingRow[0]) {
            await tx.insert(notifications).values({
              sellerId: listingRow[0].sellerId,
              type: "purchase",
              message: `Payment failed for "${listingRow[0].productTitle}"`,
              isRead: false,
              isStarred: false,
              createdAt: new Date()
            });
          }
        }
      }

      await tx
        .update(webhookEvents)
        .set({ status: "processed", processedAt: new Date() })
        .where(eq(webhookEvents.eventId, eventId));
    });

    console.log("Webhook processed successfully:", eventId);
    return NextResponse.json({
      success: true,
      message: "Webhook processed"
    });
  } catch (err) {
    console.error("Webhook processing error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
};