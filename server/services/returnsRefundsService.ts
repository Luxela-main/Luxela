import { eq, and, gte } from 'drizzle-orm';
import { db } from '@/server/db/client';
import { refunds, orders, payments, financialLedger, notifications, buyers, sellers } from '@/server/db/schema';
import { format } from 'date-fns';
import { createBuyerNotification, createSellerNotification } from './notificationManager';

export interface ReturnRequest {
  orderId: string;
  reason: string;
  description?: string;
  images?: string[];
  receivedCondition?: 'excellent' | 'good' | 'acceptable' | 'poor';
  restockPercentage?: number;
}

export interface RefundProcessing {
  refundId: string;
  type: 'full' | 'partial' | 'store_credit';
  amount?: number;
  notes?: string;
}

export class ReturnsRefundsService {
  
  // Initiate return request
  static async initiateReturn(orderId: string, buyerId: string, request: ReturnRequest) {
    try {
      const order = await db.query.orders.findFirst({
        where: eq(orders.id, orderId),
      });

      if (!order) throw new Error('Order not found');
      if (order.buyerId !== buyerId) throw new Error('Unauthorized');
      if (order.orderStatus === 'returned') throw new Error('Order already returned');

      const amountCents = order.amountCents;
      
      const [refund] = await db
        .insert(refunds)
        .values({
          orderId,
          buyerId,
          sellerId: order.sellerId,
          amountCents,
          currency: order.currency,
          refundType: 'full',
          reason: request.reason,
          description: request.description,
          refundStatus: 'return_requested',
          images: request.images ? JSON.stringify(request.images) : null,
          receivedCondition: request.receivedCondition,
          restockPercentage: request.restockPercentage,
          requestedAt: new Date(),
        })
        .returning();

      // Create return number (RMA)
      const rmaNumber = `RMA-${new Date().getTime()}-${orderId.slice(0, 8).toUpperCase()}`;
      
      await db
        .update(refunds)
        .set({ rmaNumber })
        .where(eq(refunds.id, refund.id));

      // Notify buyer and seller with new system
      try {
        const [buyer] = await db.select().from(buyers).where(eq(buyers.id, buyerId));
        const [seller] = await db.select().from(sellers).where(eq(sellers.id, order.sellerId));

        if (buyer) {
          await createBuyerNotification({
            buyerId: buyer.id,
            type: 'return_initiated',
            title: 'Return Request Initiated',
            message: `Your return request for order #${orderId.slice(0, 8)} has been submitted. RMA: ${rmaNumber}`,
            relatedEntityId: refund.id,
            relatedEntityType: 'return',
            actionUrl: `/buyer/orders/${orderId}`,
            metadata: { rmaNumber, reason: request.reason },
          });
        }

        if (seller) {
          await createSellerNotification({
            sellerId: seller.id,
            type: 'return_request',
            title: 'Return Request Received',
            message: `A return has been requested for order #${orderId.slice(0, 8)}. RMA: ${rmaNumber}`,
            severity: 'warning',
            relatedEntityId: refund.id,
            relatedEntityType: 'return',
            actionUrl: `/seller/orders/${orderId}`,
            metadata: { rmaNumber, reason: request.reason },
          });
        }
      } catch (notificationError) {
        console.error('Error creating return notifications:', notificationError);
      }

      return { ...refund, rmaNumber };
    } catch (error) {
      console.error('Error initiating return:', error);
      throw error;
    }
  }

  // Get return request details
  static async getReturnDetails(refundId: string) {
    try {
      const refund = await db.query.refunds.findFirst({
        where: eq(refunds.id, refundId),
        with: {
          order: {
            with: {
              buyer: true,
              seller: true,
            },
          },
          payment: true,
        },
      });

      if (!refund) throw new Error('Return request not found');

      return {
        ...refund,
        images: refund.images ? JSON.parse(refund.images) : [],
      };
    } catch (error) {
      console.error('Error fetching return details:', error);
      throw error;
    }
  }

  // Approve return request (seller/admin action)
  static async approveReturn(refundId: string, operatorId: string, operatorRole: string) {
    try {
      if (!['seller', 'admin'].includes(operatorRole)) {
        throw new Error('Unauthorized to approve returns');
      }

      const refund = await db.query.refunds.findFirst({
        where: eq(refunds.id, refundId),
      });

      if (!refund) throw new Error('Return request not found');
      if (refund.refundStatus !== 'return_requested') {
        throw new Error('Return cannot be approved in current status');
      }

      // Update refund status
      const [updated] = await db
        .update(refunds)
        .set({
          refundStatus: 'return_approved',
          processedAt: new Date(),
        })
        .where(eq(refunds.id, refundId))
        .returning();

      // Notify seller about approved return
      await db.insert(notifications).values({
        sellerId: refund.sellerId,
        orderId: refund.orderId,
        type: 'reminder',
        message: `Return request approved. RMA: ${refund.rmaNumber}. Buyer should ship item back.`,
      });

      return updated;
    } catch (error) {
      console.error('Error approving return:', error);
      throw error;
    }
  }

  // Reject return request
  static async rejectReturn(refundId: string, operatorId: string, reason: string) {
    try {
      const refund = await db.query.refunds.findFirst({
        where: eq(refunds.id, refundId),
      });

      if (!refund) throw new Error('Return request not found');

      const [updated] = await db
        .update(refunds)
        .set({
          refundStatus: 'return_rejected',
          sellerNote: reason,
          processedAt: new Date(),
        })
        .where(eq(refunds.id, refundId))
        .returning();

      // Notify seller about rejection
      await db.insert(notifications).values({
        sellerId: refund.sellerId,
        orderId: refund.orderId,
        type: 'reminder',
        message: `Return request rejected. Reason: ${reason}`,
      });

      return updated;
    } catch (error) {
      console.error('Error rejecting return:', error);
      throw error;
    }
  }

  // Process refund after item received
  static async processRefund(refundId: string, config: RefundProcessing) {
    try {
      const refund = await db.query.refunds.findFirst({
        where: eq(refunds.id, refundId),
        with: { order: true, payment: true },
      });

      if (!refund) throw new Error('Refund not found');
      if (refund.refundStatus !== 'return_approved') {
        throw new Error('Cannot process refund in current status');
      }

      const refundAmount = config.amount || refund.amountCents;
      const refundType = config.type || refund.refundType;

      // Update refund record
      const [updatedRefund] = await db
        .update(refunds)
        .set({
          refundStatus: 'refunded',
          refundedAt: new Date(),
          notes: config.notes,
          restockPercentage: config.type === 'full' ? 100 : (config.type === 'partial' ? 50 : 0),
        })
        .where(eq(refunds.id, refundId))
        .returning();

      // Update order status
      if (refundType === 'full') {
        await db
          .update(orders)
          .set({ orderStatus: 'returned' })
          .where(eq(orders.id, refund.orderId));
      }

      // Create financial ledger entry
      await db.insert(financialLedger).values({
        sellerId: refund.sellerId,
        orderId: refund.orderId,
        paymentId: refund.paymentId,
        transactionType: refundType === 'store_credit' ? 'return_request' : 'refund_completed',
        amountCents: -refundAmount,
        currency: refund.currency,
        status: 'completed',
        description: `${refundType} refund for order ${refund.orderId.slice(0, 8)}`,
      });

      // Notify seller about refund processing
      await db.insert(notifications).values({
        sellerId: refund.sellerId,
        orderId: refund.orderId,
        type: 'refund_issued',
        message: `${refundType} refund of ${(refundAmount / 100).toFixed(2)} ${refund.currency} processed for order ${refund.orderId.slice(0, 8)}.`,
      });

      return updatedRefund;
    } catch (error) {
      console.error('Error processing refund:', error);
      throw error;
    }
  }

  // Get refund status
  static async getRefundStatus(refundId: string) {
    try {
      const refund = await db.query.refunds.findFirst({
        where: eq(refunds.id, refundId),
      });

      if (!refund) throw new Error('Refund not found');

      const statusMap = {
        pending: 'Return request submitted, awaiting seller review',
        return_requested: 'Return approved, waiting for item to be shipped back',
        return_approved: 'Item received and inspection in progress',
        return_rejected: 'Return request was rejected',
        refunded: `Refund processed on ${format(refund.refundedAt || new Date(), 'MMM d, yyyy')}`,
        canceled: 'Return request canceled',
      };

      return {
        id: refund.id,
        rmaNumber: refund.rmaNumber,
        status: refund.refundStatus,
        statusDescription: statusMap[refund.refundStatus as keyof typeof statusMap],
        amount: refund.amountCents,
        currency: refund.currency,
        reason: refund.reason,
        requestedAt: refund.requestedAt,
        refundedAt: refund.refundedAt,
      };
    } catch (error) {
      console.error('Error getting refund status:', error);
      throw error;
    }
  }

  // List returns for buyer
  static async getBuyerReturns(buyerId: string, limit = 10, offset = 0) {
    try {
      const buyerRefunds = await db.query.refunds.findMany({
        where: eq(refunds.buyerId, buyerId),
        limit,
        offset,
        orderBy: (r: any) => [r.createdAt],
        with: {
          order: {
            columns: {
              productTitle: true,
              productImage: true,
            },
          },
        },
      });

      return buyerRefunds;
    } catch (error) {
      console.error('Error fetching buyer returns:', error);
      throw error;
    }
  }

  // List returns for seller
  static async getSellerReturns(sellerId: string, limit = 10, offset = 0) {
    try {
      const sellerRefunds = await db.query.refunds.findMany({
        where: eq(refunds.sellerId, sellerId),
        limit,
        offset,
        orderBy: (r: any) => [r.createdAt],
        with: {
          order: {
            columns: {
              productTitle: true,
              customerName: true,
            },
          },
        },
      });

      return sellerRefunds;
    } catch (error) {
      console.error('Error fetching seller returns:', error);
      throw error;
    }
  }

  // Get return analytics
  static async getReturnAnalytics(sellerId?: string, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      let refundList: any[];
      if (sellerId) {
        refundList = await db.query.refunds.findMany({
          where: and(
            eq(refunds.sellerId, sellerId),
            gte(refunds.createdAt, startDate)
          ),
        });
      } else {
        refundList = await db.query.refunds.findMany({
          where: gte(refunds.createdAt, startDate),
        });
      }

      const allRefunds = refundList;

      const stats = {
        totalReturns: allRefunds.length,
        totalRefunded: allRefunds
          .filter((r: any) => r.refundStatus === 'refunded')
          .reduce((sum: any, r: any) => sum + r.amountCents, 0),
        returnRate: allRefunds.length > 0 ? ((allRefunds.length / 100) * 100).toFixed(2) : '0',
        byStatus: {
          pending: allRefunds.filter((r: any) => r.refundStatus === 'pending').length,
          approved: allRefunds.filter((r: any) => r.refundStatus === 'return_approved').length,
          rejected: allRefunds.filter((r: any) => r.refundStatus === 'return_rejected').length,
          refunded: allRefunds.filter((r: any) => r.refundStatus === 'refunded').length,
        },
        topReasons: this.getTopReasons(allRefunds),
      };

      return stats;
    } catch (error) {
      console.error('Error calculating return analytics:', error);
      throw error;
    }
  }

  private static getTopReasons(refunds: any[]) {
    const reasonCounts: Record<string, number> = {};
    refunds.forEach((r: any) => {
      reasonCounts[r.reason] = (reasonCounts[r.reason] || 0) + 1;
    });
    return Object.entries(reasonCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([reason, count]) => ({ reason, count }));
  }
}