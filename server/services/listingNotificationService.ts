import { db } from '../db';
import { notifications, sellers } from '../db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import nodemailer from 'nodemailer';
import { createSellerNotification } from './notificationManager';

interface ListingApprovalNotification {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  comments?: string;
}

interface ListingRejectionNotification {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  rejectionReason: string;
  comments?: string;
}

interface ListingRevisionRequestNotification {
  listingId: string;
  listingTitle: string;
  sellerId: string;
  sellerEmail: string;
  sellerName: string;
  revisionRequests: Record<string, any>;
  comments?: string;
}

let emailTransporter: nodemailer.Transporter | null = null;

function getEmailTransporter() {
  if (!emailTransporter) {
    emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }
  return emailTransporter;
}

async function sendListingApprovalEmail(payload: ListingApprovalNotification & { notificationId: string }): Promise<void> {
  try {
    const transporter = getEmailTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: payload.sellerEmail,
      subject: `✅ Your Listing "${payload.listingTitle}" Has Been Approved!`,
      html: `
        <h2>Great News!</h2>
        <p>Hello ${payload.sellerName},</p>
        <p>Your listing <strong>"${payload.listingTitle}"</strong> has been approved and is now live on Luxela marketplace!</p>
        <p>Your customers can now see and purchase from this listing.</p>
        <p><a href="${process.env.SELLER_DASHBOARD_URL}/listings/${payload.listingId}">View your listing</a></p>
        <p>Best regards,<br>Luxela Team</p>
      `,
    });
    console.log('[Email] Listing approval email sent to:', payload.sellerEmail);
  } catch (error) {
    console.error('[Email] Failed to send approval email:', error);
  }
}

async function sendListingRejectionEmail(payload: ListingRejectionNotification & { notificationId: string }): Promise<void> {
  try {
    const transporter = getEmailTransporter();
    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: payload.sellerEmail,
      subject: `⚠️ Your Listing "${payload.listingTitle}" Needs Revision`,
      html: `
        <h2>Listing Review Update</h2>
        <p>Hello ${payload.sellerName},</p>
        <p>Your listing <strong>"${payload.listingTitle}"</strong> has been reviewed.</p>
        <p><strong>Reason:</strong> ${payload.rejectionReason}</p>
        ${payload.comments ? `<p><strong>Additional Comments:</strong> ${payload.comments}</p>` : ''}
        <p>Please review and update your listing according to the feedback.</p>
        <p><a href="${process.env.SELLER_DASHBOARD_URL}/listings/${payload.listingId}/edit">Edit your listing</a></p>
        <p>Best regards,<br>Luxela Team</p>
      `,
    });
    console.log('[Email] Listing rejection email sent to:', payload.sellerEmail);
  } catch (error) {
    console.error('[Email] Failed to send rejection email:', error);
  }
}

async function sendListingRevisionRequestEmail(payload: ListingRevisionRequestNotification & { notificationId: string }): Promise<void> {
  try {
    const transporter = getEmailTransporter();
    const revisionItems = Object.entries(payload.revisionRequests)
      .map(([field, reason]) => `<li><strong>${field}:</strong> ${reason}</li>`)
      .join('');

    await transporter.sendMail({
      from: process.env.SMTP_FROM_EMAIL,
      to: payload.sellerEmail,
      subject: `📝 Revisions Requested for "${payload.listingTitle}"`,
      html: `
        <h2>Listing Revision Request</h2>
        <p>Hello ${payload.sellerName},</p>
        <p>Your listing <strong>"${payload.listingTitle}"</strong> requires some revisions before approval.</p>
        <h3>Please address the following:</h3>
        <ul>${revisionItems}</ul>
        ${payload.comments ? `<p><strong>Additional Comments:</strong> ${payload.comments}</p>` : ''}
        <p><a href="${process.env.SELLER_DASHBOARD_URL}/listings/${payload.listingId}/edit">Make revisions</a></p>
        <p>Best regards,<br>Luxela Team</p>
      `,
    });
    console.log('[Email] Listing revision request email sent to:', payload.sellerEmail);
  } catch (error) {
    console.error('[Email] Failed to send revision request email:', error);
  }
}

export async function notifyListingApproved(
  payload: ListingApprovalNotification
): Promise<string> {
  try {
    // Get seller info
    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, payload.sellerId));

    let notificationId = 'unknown';

    // Create notification in new system
    if (seller) {
      try {
        await createSellerNotification({
          sellerId: seller.id,
          type: 'listing_approved',
          title: 'Listing Approved',
          message: `Your listing "${payload.listingTitle}" has been approved and is now live on the marketplace!`,
          severity: 'info',
          relatedEntityId: payload.listingId,
          relatedEntityType: 'listing',
          actionUrl: `/seller/listings/${payload.listingId}`,
          metadata: { comments: payload.comments },
        });
      } catch (notifError) {
        console.error('[ListingNotification] Failed to create seller notification:', notifError);
      }
    }

    await sendListingApprovalEmail({
      ...payload,
      notificationId,
    });

    console.log('[ListingNotification] Approval notification sent:', {
      notificationId,
      listingId: payload.listingId,
      email: payload.sellerEmail,
    });

    return notificationId;
  } catch (error) {
    console.error('[ListingNotification] Failed to notify listing approval:', {
      error: error instanceof Error ? error.message : String(error),
      listingId: payload.listingId,
      sellerId: payload.sellerId,
    });
    throw error;
  }
}

export async function notifyListingRejected(
  payload: ListingRejectionNotification
): Promise<string> {
  try {
    // Get seller info
    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, payload.sellerId));

    let notificationId = 'unknown';

    // Create notification in new system
    if (seller) {
      try {
        await createSellerNotification({
          sellerId: seller.id,
          type: 'listing_rejected',
          title: 'Listing Rejected',
          message: `Your listing "${payload.listingTitle}" has been rejected. Reason: ${payload.rejectionReason}`,
          severity: 'warning',
          relatedEntityId: payload.listingId,
          relatedEntityType: 'listing',
          actionUrl: `/seller/listings/${payload.listingId}`,
          metadata: { rejectionReason: payload.rejectionReason, comments: payload.comments },
        });
      } catch (notifError) {
        console.error('[ListingNotification] Failed to create seller notification:', notifError);
      }
    }

    await sendListingRejectionEmail({
      ...payload,
      notificationId,
    });

    console.log(`[ListingNotification] Rejection notification created for seller ${payload.sellerId}`, {
      notificationId,
      listingId: payload.listingId,
      email: payload.sellerEmail,
    });

    return notificationId;
  } catch (error) {
    console.error('[ListingNotification] Failed to notify listing rejection:', {
      error: error instanceof Error ? error.message : String(error),
      listingId: payload.listingId,
      sellerId: payload.sellerId,
    });
    throw error;
  }
}

export async function notifyListingRevisionRequest(
  payload: ListingRevisionRequestNotification
): Promise<string> {
  try {
    // Get seller info
    const [seller] = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, payload.sellerId));

    let notificationId = 'unknown';
    const revisionSummary = Object.keys(payload.revisionRequests)
      .slice(0, 3)
      .join(', ');

    // Create notification in new system
    if (seller) {
      try {
        await createSellerNotification({
          sellerId: seller.id,
          type: 'listing_revision_requested',
          title: 'Listing Revision Requested',
          message: `Your listing "${payload.listingTitle}" requires revisions: ${revisionSummary}...`,
          severity: 'warning',
          relatedEntityId: payload.listingId,
          relatedEntityType: 'listing',
          actionUrl: `/seller/listings/${payload.listingId}`,
          metadata: { revisionRequests: payload.revisionRequests, comments: payload.comments },
        });
      } catch (notifError) {
        console.error('[ListingNotification] Failed to create seller notification:', notifError);
      }
    }

    await sendListingRevisionRequestEmail({
      ...payload,
      notificationId,
    });

    console.log(`[ListingNotification] Revision request notification created for seller ${payload.sellerId}`, {
      notificationId,
      listingId: payload.listingId,
      email: payload.sellerEmail,
    });

    return notificationId;
  } catch (error) {
    console.error('[ListingNotification] Failed to notify listing revision request:', {
      error: error instanceof Error ? error.message : String(error),
      listingId: payload.listingId,
      sellerId: payload.sellerId,
    });
    throw error;
  }
}

export async function getSellerNotifications(
  sellerId: string,
  limit: number = 20,
  offset: number = 0
): Promise<any[]> {
  try {
    const sellerNotifs = await db
      .select()
      .from(notifications)
      .where(eq(notifications.sellerId, sellerId))
      .orderBy(notifications.createdAt)
      .limit(limit)
      .offset(offset);

    return sellerNotifs;
  } catch (error) {
    console.error('[ListingNotification] Failed to fetch seller notifications:', {
      error: error instanceof Error ? error.message : String(error),
      sellerId,
    });
    throw error;
  }
}

export async function markNotificationsAsRead(
  notificationIds: string[]
): Promise<void> {
  try {
    if (notificationIds.length === 0) return;

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        inArray(notifications.id, notificationIds)
      );

    console.log('[ListingNotification] Marked notifications as read:', {
      count: notificationIds.length,
    });
  } catch (error) {
    console.error('[ListingNotification] Failed to mark notifications as read:', {
      error: error instanceof Error ? error.message : String(error),
      count: notificationIds.length,
    });
    throw error;
  }
}

export async function deleteNotification(notificationId: string): Promise<void> {
  try {
    await db
      .delete(notifications)
      .where(eq(notifications.id, notificationId));

    console.log('[ListingNotification] Notification deleted:', { notificationId });
  } catch (error) {
    console.error('[ListingNotification] Failed to delete notification:', {
      error: error instanceof Error ? error.message : String(error),
      notificationId,
    });
    throw error;
  }
}