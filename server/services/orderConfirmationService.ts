/**
 * Order Confirmation Service
 * Handles seller order confirmation and buyer delivery confirmation with proper state management
 */
import { db } from '../db';
import { orders, paymentHolds } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';
import { notifyOrderConfirmed, notifyDeliveryConfirmed } from './notificationService';

type OrderRow = typeof orders.$inferSelect;

/**
 * Seller confirms receipt of order payment
 * Verifies payment hold is active before allowing confirmation
 */
export async function sellerConfirmOrder(sellerId: string, orderId: string): Promise<OrderRow> {
  try {
    // Get order and verify seller ownership
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.sellerId, sellerId)
        )
      );

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found or does not belong to this seller',
      });
    }

    // Check order state - must be in 'processing'
    if (order.orderStatus === 'confirmed') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Order is already confirmed',
      });
    }

    if (['cancelled', 'refunded'].includes(order.orderStatus)) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: `Cannot confirm a ${order.orderStatus} order`,
      });
    }

    // CRITICAL: Verify payment hold exists and is active
    const [hold] = await db
      .select()
      .from(paymentHolds)
      .where(
        and(
          eq(paymentHolds.orderId, orderId),
          eq(paymentHolds.holdStatus, 'active')
        )
      );

    if (!hold) {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Payment hold not found or not active. Payment verification failed. Please contact support.',
      });
    }

    // Confirm order in transaction
    const [updated] = await db.transaction(async (tx: any) => {
      return await tx
        .update(orders)
        .set({
          orderStatus: 'confirmed',
          deliveryStatus: 'processing',
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();
    });

    // Notify buyer that seller confirmed the order
    if (updated.buyerId) {
      await notifyOrderConfirmed(sellerId, updated.buyerId, updated.id);
    }

    console.log(`[ORDER_CONFIRM] Seller ${sellerId} confirmed order ${orderId}`);

    return updated;
  } catch (err: any) {
    console.error('[ORDER_CONFIRM] Error:', err);
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: err?.message || 'Failed to confirm order',
    });
  }
}

/**
 * Seller confirms that package has been delivered/handed over to courier
 * This is different from buyer delivery confirmation - seller is just marking shipped
 */
export async function sellerConfirmDelivery(sellerId: string, orderId: string) {
  try {
    // Get order and verify seller ownership
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.sellerId, sellerId)
        )
      );

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    // Can only mark delivered if order is confirmed
    if (order.orderStatus !== 'confirmed') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Order must be confirmed before marking as delivered',
      });
    }

    if (order.deliveryStatus === 'delivered') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Order already marked as delivered',
      });
    }

    // Mark as shipped/delivered
    const [updated] = await db
      .update(orders)
      .set({
        deliveryStatus: 'delivered',
        updatedAt: new Date(),
      })
      .where(eq(orders.id, orderId))
      .returning();

    // Notify buyer that seller shipped/delivered
    if (updated.buyerId) {
      await notifyDeliveryConfirmed(sellerId, updated.buyerId, updated.id);
    }

    console.log(`[SELLER_DELIVERY] Seller ${sellerId} confirmed delivery for order ${orderId}`);

    return {
      success: true,
      message: 'Delivery confirmed. Buyer notified.',
      order: {
        orderId: updated.id,
        deliveryStatus: updated.deliveryStatus,
      },
    };
  } catch (err: any) {
    console.error('[SELLER_DELIVERY] Error:', err);
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: err?.message || 'Failed to confirm delivery',
    });
  }
}

/**
 * Buyer confirms receipt of delivered order
 * This releases the escrow hold and triggers payout processing
 */
export async function buyerConfirmDelivery(buyerId: string, orderId: string) {
  try {
    // Get order and verify buyer owns it
    const [order] = await db
      .select()
      .from(orders)
      .where(
        and(
          eq(orders.id, orderId),
          eq(orders.buyerId, buyerId)
        )
      );

    if (!order) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Order not found',
      });
    }

    // Can only confirm delivery if seller shipped it
    if (order.deliveryStatus !== 'delivered') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Cannot confirm delivery until seller confirms shipment',
      });
    }

    // Prevent double-confirmation
    if (order.payoutStatus === 'processing' || order.payoutStatus === 'paid') {
      throw new TRPCError({
        code: 'BAD_REQUEST',
        message: 'Delivery already confirmed',
      });
    }

    // Execute in transaction: update order + release hold
    const [updated] = await db.transaction(async (tx: any) => {
      // Update order status
      const [updatedOrder] = await tx
        .update(orders)
        .set({
          deliveryStatus: 'delivered',
          payoutStatus: 'processing',
          deliveredDate: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(orders.id, orderId))
        .returning();

      // Release payment hold
      const [hold] = await tx
        .select()
        .from(paymentHolds)
        .where(eq(paymentHolds.orderId, orderId));

      if (hold && hold.holdStatus === 'active') {
        await tx
          .update(paymentHolds)
          .set({
            holdStatus: 'released',
            releasedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(paymentHolds.id, hold.id));
      }

      return [updatedOrder];
    });

    // Notify seller that buyer confirmed delivery
    if (order.sellerId) {
      await notifyDeliveryConfirmed(order.buyerId, order.sellerId, order.id);
    }

    console.log(`[BUYER_DELIVERY_CONFIRM] Buyer ${buyerId} confirmed delivery for order ${orderId}`);

    return updated;
  } catch (err: any) {
    console.error('[BUYER_DELIVERY_CONFIRM] Error:', err);
    if (err instanceof TRPCError) throw err;
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: err?.message || 'Failed to confirm delivery',
    });
  }
}