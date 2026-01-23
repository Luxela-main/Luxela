import { db } from '../db';
import { notifications, orders, buyerAccountDetails, sellers } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';

let nodemailer: any = null;
try {
  nodemailer = require('nodemailer');
} catch (e) {
  console.warn('nodemailer not installed');
}

/**
 * Notification Service
 * Handles all buyer and seller notifications throughout the escrow lifecycle
 */

export type NotificationType = 'purchase' | 'review' | 'comment' | 'reminder' | 'order_confirmed' | 'payment_failed' | 'refund_issued' | 'delivery_confirmed';

export interface NotificationPayload {
  type: NotificationType;
  sellerId: string;
  buyerId?: string;
  message: string;
  orderId?: string;
  metadata?: Record<string, any>;
}

// Email transporter (configure with your email service)
const emailTransporter = nodemailer?.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

/**
 * Send notification to database and optionally via email
 */
export async function sendNotification(payload: NotificationPayload): Promise<string> {
  const notificationId = uuidv4();

  try {
    // Store in database
    await db.insert(notifications).values({
      id: notificationId,
      sellerId: payload.sellerId,
      buyerId: payload.buyerId || null,
      type: payload.type as any,
      message: payload.message,
      orderId: payload.orderId || null,
      isRead: false,
      isStarred: false,
      createdAt: new Date(),
    });

    // Send email notification if configured
    if (emailTransporter && payload.buyerId) {
      await sendEmailNotification(payload);
    }

    return notificationId;
  } catch (error) {
    console.error('Notification send error:', error);
    throw error;
  }
}

/**
 * Send email notification
 */
async function sendEmailNotification(payload: NotificationPayload): Promise<void> {
  try {
    if (!payload.buyerId) return;

    // Get buyer email from account details
    const account = await db
      .select()
      .from(buyerAccountDetails)
      .where(eq(buyerAccountDetails.buyerId, payload.buyerId))
      .limit(1);

    if (!account[0]?.email) {
      console.warn(`No email found for buyer ${payload.buyerId}`);
      return;
    }

    const email = account[0].email;
    const subject = getEmailSubject(payload.type);
    const htmlContent = generateEmailHTML(payload);

    await emailTransporter.sendMail({
      from: process.env.SMTP_FROM || 'noreply@luxela.com',
      to: email,
      subject,
      html: htmlContent,
    });
  } catch (error) {
    console.error('Email send error:', error);
    // Don't throw - notification was already stored
  }
}

function getEmailSubject(type: NotificationType): string {
  const subjects: Record<NotificationType, string> = {
    purchase: 'New Purchase Notification',
    review: 'New Review Received',
    comment: 'New Comment',
    reminder: 'Reminder',
    order_confirmed: 'Order Confirmed',
    payment_failed: 'Payment Failed',
    refund_issued: 'Refund Issued',
    delivery_confirmed: 'Delivery Confirmed',
  };
  return subjects[type] || 'Notification';
}

function generateEmailHTML(payload: NotificationPayload): string {
  return `
    <html>
      <body style="font-family: Arial, sans-serif;">
        <h2>${getEmailSubject(payload.type)}</h2>
        <p>${payload.message}</p>
        <p style="color: #888; font-size: 12px;">
          Sent at ${new Date().toLocaleString()}
        </p>
      </body>
    </html>
  `;
}

/**
 * Get all notifications for a seller
 */
export async function getSellerNotifications(sellerId: string) {
  return await db
    .select()
    .from(notifications)
    .where(eq(notifications.sellerId, sellerId));
}

/**
 * Get unread notifications for a seller
 */
export async function getUnreadNotifications(sellerId: string) {
  return await db
    .select()
    .from(notifications)
    .where(
      and(
        eq(notifications.sellerId, sellerId),
        eq(notifications.isRead, false)
      )
    );
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  return await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.id, notificationId));
}

/**
 * Mark all notifications as read for a seller
 */
export async function markAllAsRead(sellerId: string) {
  return await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.sellerId, sellerId));
}

/**
 * Star/unstar notification
 */
export async function toggleStarNotification(notificationId: string, starred: boolean) {
  return await db
    .update(notifications)
    .set({ isStarred: starred })
    .where(eq(notifications.id, notificationId));
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  return await db
    .delete(notifications)
    .where(eq(notifications.id, notificationId));
}

/**
 * Send purchase notification
 */
export async function notifyPurchase(
  sellerId: string,
  buyerId: string,
  orderId: string,
  productName: string
) {
  return sendNotification({
    type: 'purchase',
    sellerId,
    buyerId,
    orderId,
    message: `New purchase: ${productName}`,
  });
}

/**
 * Send payment failed notification
 */
export async function notifyPaymentFailed(
  sellerId: string,
  buyerId: string,
  orderId: string
) {
  return sendNotification({
    type: 'payment_failed',
    sellerId,
    buyerId,
    orderId,
    message: 'Payment failed for your order',
  });
}

/**
 * Send order confirmed notification
 */
export async function notifyOrderConfirmed(
  sellerId: string,
  buyerId: string,
  orderId: string
) {
  return sendNotification({
    type: 'order_confirmed',
    sellerId,
    buyerId,
    orderId,
    message: 'Your order has been confirmed',
  });
}

/**
 * Send delivery confirmed notification
 */
export async function notifyDeliveryConfirmed(
  sellerId: string,
  buyerId: string,
  orderId: string
) {
  return sendNotification({
    type: 'delivery_confirmed',
    sellerId,
    buyerId,
    orderId,
    message: 'Your order has been delivered',
  });
}

/**
 * Send refund issued notification
 */
export async function notifyRefundIssued(
  sellerId: string,
  buyerId: string,
  orderId: string,
  amount: number,
  currency: string
) {
  return sendNotification({
    type: 'refund_issued',
    sellerId,
    buyerId,
    orderId,
    message: `Refund of ${currency} ${(amount / 100).toFixed(2)} has been issued`,
  });
}

/**
 * Send review notification
 */
export async function notifyReview(
  sellerId: string,
  buyerId: string,
  productName: string,
  rating: number
) {
  return sendNotification({
    type: 'review',
    sellerId,
    buyerId,
    message: `New ${rating}-star review on ${productName}`,
  });
}

/**
 * Send comment notification
 */
export async function notifyComment(
  sellerId: string,
  buyerId: string,
  message: string
) {
  return sendNotification({
    type: 'comment',
    sellerId,
    buyerId,
    message,
  });
}

/**
 * Send reminder notification
 */
export async function notifyReminder(
  sellerId: string,
  message: string
) {
  return sendNotification({
    type: 'reminder',
    sellerId,
    message,
  });
}