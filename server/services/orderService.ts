import { db } from '../db';
import { orders, orderStateTransitions, buyers, sellers } from '../db/schema';
import { eq } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { TRPCError } from '@trpc/server';
import {
  createBuyerNotification,
  createSellerNotification,
  createAdminNotification,
} from './notificationManager';

export type OrderStatus =
  | 'processing'
  | 'shipped'
  | 'delivered'
  | 'canceled'
  | 'returned';

const validTransitions: Record<OrderStatus, OrderStatus[]> = {
  processing: ['shipped', 'canceled'],
  shipped: ['delivered', 'canceled'],
  delivered: ['returned'],
  canceled: [],
  returned: [],
};

export async function validateAndUpdateOrderStatus(
  orderId: string,
  newStatus: OrderStatus,
  reason: string = ''
): Promise<void> {
  const [order] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (!order) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: 'Order not found',
    });
  }

  const currentStatus = order.orderStatus as OrderStatus;
  const allowedTransitions = validTransitions[currentStatus] || [];

  if (!allowedTransitions.includes(newStatus)) {
    throw new TRPCError({
      code: 'BAD_REQUEST',
      message: `Invalid status transition from ${currentStatus} to ${newStatus}. Allowed: ${allowedTransitions.join(', ')}`,
    });
  }

  await db.transaction(async (tx: any) => {
    await tx
      .update(orders)
      .set({
        orderStatus: newStatus,
      })
      .where(eq(orders.id, orderId));

    await tx.insert(orderStateTransitions).values({
      id: uuidv4(),
      orderId,
      fromStatus: currentStatus,
      toStatus: newStatus,
      reason,
      triggeredBy: 'system-process',
      triggeredByRole: 'admin',
    });
  });

  // Fetch order details to get buyer and seller info
  const [updatedOrder] = await db
    .select()
    .from(orders)
    .where(eq(orders.id, orderId));

  if (updatedOrder) {
    try {
      // Get buyer
      const [buyer] = await db
        .select()
        .from(buyers)
        .where(eq(buyers.id, updatedOrder.buyerId));

      // Get seller
      const [seller] = await db
        .select()
        .from(sellers)
        .where(eq(sellers.id, updatedOrder.sellerId));

      // Trigger notifications based on status change
      const notificationText = getStatusDisplay(newStatus);
      const message = `Your order #${orderId.substring(0, 8)} has been ${notificationText.toLowerCase()}`;

      // Notify buyer
      if (buyer) {
        await createBuyerNotification({
          buyerId: buyer.id,
          type: `order_${newStatus}`,
          title: `Order ${notificationText}`,
          message,
          relatedEntityId: orderId,
          relatedEntityType: 'order',
          actionUrl: `/buyer/orders/${orderId}`,
          metadata: { previousStatus: currentStatus, newStatus },
        });
      }

      // Notify seller
      if (seller) {
        await createSellerNotification({
          sellerId: seller.id,
          type: `order_${newStatus}`,
          title: `Order ${notificationText}`,
          message: `Buyer order #${orderId.substring(0, 8)} status: ${notificationText}`,
          severity: newStatus === 'canceled' ? 'warning' : 'info',
          relatedEntityId: orderId,
          relatedEntityType: 'order',
          actionUrl: `/seller/orders/${orderId}`,
          metadata: { previousStatus: currentStatus, newStatus },
        });
      }
    } catch (notificationError) {
      console.error('Failed to create order status notifications:', notificationError);
      // Don't throw - notification failure shouldn't block order status update
    }
  }
}

export async function getOrderStateHistory(orderId: string) {
  const transitions = await db
    .select()
    .from(orderStateTransitions)
    .where(eq(orderStateTransitions.orderId, orderId))
    .orderBy(orderStateTransitions.createdAt);

  return transitions;
}

export async function isOrderStatusValid(
  currentStatus: OrderStatus,
  targetStatus: OrderStatus
): Promise<boolean> {
  const allowedTransitions = validTransitions[currentStatus] || [];
  return allowedTransitions.includes(targetStatus);
}

export function getStatusDisplay(status: OrderStatus): string {
  const displayMap: Record<OrderStatus, string> = {
    processing: 'Processing',
    shipped: 'Shipped',
    delivered: 'Delivered',
    canceled: 'Canceled',
    returned: 'Returned',
  };

  return displayMap[status] || status;
}
