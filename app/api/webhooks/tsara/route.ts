import { NextRequest, NextResponse } from "next/server";
import { db } from "@/server/db";
import { payments, webhookEvents } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { handlePaymentSuccess, handlePaymentFailure } from "@/server/services/paymentFlowService";
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
      console.error("[Tsara Webhook] Signature length mismatch:", { 
        received: signatureBuffer.length, 
        expected: expectedBuffer.length 
      }); 
      return false;
    }

    const isValid = crypto.timingSafeEqual(signatureBuffer, expectedBuffer); 
    
    if (!isValid) { 
      console.error("[Tsara Webhook] Signature mismatch - possible tampering or misconfiguration");
    }
    
    return isValid; 
  } catch (err) { 
    console.error("[Tsara Webhook] Signature verification error:", err); 
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

    console.log("[Tsara Webhook] Received webhook request:", {
      hasSignature: !!signature,
      hasSecret: !!secret,
      secretLength: secret?.length || 0,
    });

    if (!secret || secret.trim().length === 0) {
      console.error(
        "[Tsara Webhook] CRITICAL: Missing or empty TSARA_WEBHOOK_SECRET environment variable. " +
        "Webhook verification cannot be performed. " +
        "Configure TSARA_WEBHOOK_SECRET in your .env.local file. " +
        "Get the webhook secret from Tsara dashboard under Settings > Webhooks."
      );
      return NextResponse.json(
        { error: "Server misconfigured: TSARA_WEBHOOK_SECRET not set" },
        { status: 500 }
      );
    }

    if (!signature) {
      console.error(
        "[Tsara Webhook] Missing x-tsara-signature header. " +
        "Ensure Tsara is configured to send webhook signatures. " +
        "Verify webhook settings in Tsara dashboard."
      );
      return NextResponse.json(
        { error: "Missing signature header" },
        { status: 401 }
      );
    }

    const rawBody = await req.text();

    console.log("[Tsara Webhook] Webhook metadata:", { 
      signature_length: signature.length, 
      body_length: rawBody.length, 
      body_preview: rawBody.substring(0, 100) 
    });

    const isValid = await verifyWebhookSignature(rawBody, signature, secret);
    if (!isValid) {
      console.error(
        "[Tsara Webhook] Invalid webhook signature - request rejected. " +
        "This could mean: 1) Wrong TSARA_WEBHOOK_SECRET, 2) Request was tampered with, " +
        "3) Webhook not signed properly by Tsara"
      );
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 }
      );
    }
    console.log("[Tsara Webhook] Signature verified successfully");

    const { event, data, id: eventId } = JSON.parse(rawBody);
    if (!eventId) {
      return NextResponse.json({ error: "Missing event ID" }, { status: 400 });
    }

    // Idempotency check
    const existing = await db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.eventId, eventId))
      .limit(1);

    if (existing.length > 0) {
      console.log("[Tsara Webhook] Event already processed (idempotent):", eventId);
      return NextResponse.json({ success: true, idempotent: true });
    }

    // Status mapping
    const statusMap = {
      pending: "pending" as const,
      processing: "processing" as const,
      success: "completed" as const,
      failed: "failed" as const,
      refunded: "refunded" as const,
    };

    const mappedStatus = statusMap[String(data.status) as keyof typeof statusMap] ?? "pending";

    // Find payment record
    const paymentRecords = await db
      .select()
      .from(payments)
      .where(eq(payments.transactionRef, data.reference))
      .limit(1);

    if (!paymentRecords.length) {
      console.warn(`[Tsara Webhook] Payment not found for reference ${data.reference}`);
      // Still record the webhook event for audit
      await db.insert(webhookEvents).values({
        eventId,
        eventType: event,
        status: "failed",
        receivedAt: new Date(),
        processedAt: new Date(),
      });
      return NextResponse.json(
        { success: false, message: "Payment not found" },
        { status: 404 }
      );
    }

    const payment = paymentRecords[0];

    // Process within transaction
    await db.transaction(async (tx: any) => {
      // Record webhook event
      await tx.insert(webhookEvents).values({
        eventId,
        eventType: event,
        status: "pending",
        receivedAt: new Date(),
      });

      // Update payment status
      await tx
        .update(payments)
        .set({
          status: mappedStatus,
          updatedAt: new Date(),
          gatewayResponse: rawBody,
          ...(mappedStatus === "refunded"
            ? { isRefunded: true, refundedAt: new Date() }
            : {}),
        })
        .where(eq(payments.id, payment.id));

      console.log(
        `[Tsara Webhook] Payment ${payment.id} status updated to ${mappedStatus} (event: ${event})`
      );

      // Handle payment success
      if (["success", "completed"].includes(data.status)) {
        try {
          await handlePaymentSuccess({
            id: payment.transactionRef,
            reference: payment.transactionRef,
            amount: payment.amountCents / 100,
            currency: payment.currency || "NGN",
            status: "success",
            orderId: payment.orderId || undefined,
            listingId: payment.listingId || undefined,
            buyerId: payment.buyerId || undefined,
          });
          console.log(`[Tsara Webhook] Payment success flow processed for ${payment.id}`);
        } catch (err: any) {
          console.error(`[Tsara Webhook] Payment success flow failed for ${payment.id}:`, err);
          throw err; // Transaction will rollback
        }
      }

      // Handle payment failure
      if (data.status === "failed") {
        try {
          await handlePaymentFailure({
            id: payment.transactionRef,
            reference: payment.transactionRef,
            status: "failed",
            orderId: payment.orderId || undefined,
            listingId: payment.listingId || undefined,
          });
          console.log(`[Tsara Webhook] Payment failure flow processed for ${payment.id}`);
        } catch (err: any) {
          console.error(`[Tsara Webhook] Payment failure flow failed for ${payment.id}:`, err);
          throw err; // Transaction will rollback
        }
      }

      // Handle refund
      if (mappedStatus === "refunded") {
        try {
          await handlePaymentFailure({
            id: payment.transactionRef,
            reference: payment.transactionRef,
            status: "refunded",
            orderId: payment.orderId || undefined,
            listingId: payment.listingId || undefined,
          });
          console.log(`[Tsara Webhook] Refund flow processed for ${payment.id}`);
        } catch (err: any) {
          console.error(`[Tsara Webhook] Refund flow failed for ${payment.id}:`, err);
          throw err; // Transaction will rollback
        }
      }

      // Mark webhook as processed
      await tx
        .update(webhookEvents)
        .set({ status: "processed", processedAt: new Date() })
        .where(eq(webhookEvents.eventId, eventId));
    });

    console.log("[Tsara Webhook] Webhook processed successfully:", eventId);
    return NextResponse.json({
      success: true,
      message: "Webhook processed",
      paymentId: payment.id,
      status: mappedStatus,
    });
  } catch (err: any) {
    console.error("[Tsara Webhook] Processing error:", err);
    return NextResponse.json(
      { error: "Internal server error", details: err?.message },
      { status: 500 }
    );
  }
};