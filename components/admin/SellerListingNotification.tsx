/**
 * Example Seller Notification Templates
 * These can be sent to sellers when their listings are reviewed
 * 
 * This file shows what notifications should be sent to sellers
 * at different stages of the review process.
 */

// ============================================
// NOTIFICATION 1: LISTING APPROVED
// ============================================

export const ListingApprovedNotification = {
  type: 'listing_approved',
  subject: '🎉 Your Listing Has Been Approved!',
  template: (listingTitle: string, comments?: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Listing Approved!</h2>
      
      <p>Great news! Your listing "<strong>${listingTitle}</strong>" has been approved by our admin team.</p>
      
      <p>Your listing is now <strong>live and visible to all buyers</strong>. Customers can now:</p>
      <ul>
        <li>See your product in search results</li>
        <li>Add it to their cart</li>
        <li>Purchase your item</li>
      </ul>
      
      ${comments ? `<div style="background: #f0f9ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #1e40af;"><strong>Admin Comments:</strong></p>
        <p style="margin: 5px 0; color: #1e40af;">${comments}</p>
      </div>` : ''}
      
      <p>
        <a href="https://yourplatform.com/admin/listings/${listingTitle.toLowerCase().replace(/\s+/g, '-')}" 
           style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Listing
        </a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <p style="color: #6b7280; font-size: 12px;">
        Thank you for selling on our platform! If you have any questions, contact support.
      </p>
    </div>
  `,
};

// ============================================
// NOTIFICATION 2: LISTING REJECTED
// ============================================

export const ListingRejectedNotification = {
  type: 'listing_rejected',
  subject: '⚠️ Your Listing Needs Changes',
  template: (listingTitle: string, rejectionReason: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #ef4444;">Listing Rejected</h2>
      
      <p>We've reviewed your listing "<strong>${listingTitle}</strong>" and unfortunately it doesn't meet our quality standards at this time.</p>
      
      <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #991b1b;"><strong>Reason for Rejection:</strong></p>
        <p style="margin: 5px 0; color: #991b1b;">${rejectionReason}</p>
      </div>
      
      <h3 style="color: #374151;">What You Can Do:</h3>
      <ol>
        <li>Review the rejection reason above carefully</li>
        <li>Make the necessary improvements to your listing</li>
        <li>Resubmit your listing for review</li>
      </ol>
      
      <p>We recommend:</p>
      <ul>
        <li>High-quality product images (clear, well-lit)</li>
        <li>Detailed, accurate descriptions</li>
        <li>Correct pricing and inventory information</li>
        <li>All required fields completed</li>
      </ul>
      
      <p>
        <a href="https://yourplatform.com/seller/listings/edit/${listingTitle.toLowerCase().replace(/\s+/g, '-')}" 
           style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Edit & Resubmit Listing
        </a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <p style="color: #6b7280; font-size: 12px;">
        Need help? Check our <a href="https://yourplatform.com/help" style="color: #3b82f6;">FAQs</a> or contact support.
      </p>
    </div>
  `,
};

// ============================================
// NOTIFICATION 3: REVISION REQUESTED
// ============================================

export const RevisionRequestedNotification = {
  type: 'revision_requested',
  subject: '📝 Your Listing Needs Minor Changes',
  template: (listingTitle: string, feedback: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #f59e0b;">Revision Request</h2>
      
      <p>Thank you for submitting "<strong>${listingTitle}</strong>". We'd like you to make a few improvements before we can approve it.</p>
      
      <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #92400e;"><strong>Requested Changes:</strong></p>
        <p style="margin: 5px 0; color: #92400e;">${feedback}</p>
      </div>
      
      <h3 style="color: #374151;">Next Steps:</h3>
      <ol>
        <li>Click the button below to edit your listing</li>
        <li>Make the requested changes</li>
        <li>Save and resubmit for review</li>
      </ol>
      
      <p style="color: #6b7280; font-size: 14px;">
        💡 <strong>Tip:</strong> The clearer and more detailed your listing, the faster it will be approved!
      </p>
      
      <p>
        <a href="https://yourplatform.com/seller/listings/edit/${listingTitle.toLowerCase().replace(/\s+/g, '-')}" 
           style="background: #f59e0b; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          Edit Listing Now
        </a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <p style="color: #6b7280; font-size: 12px;">
        Once you make these changes and resubmit, our team will review again within 24 hours.
      </p>
    </div>
  `,
};

// ============================================
// NOTIFICATION 4: LISTING RE-APPROVED AFTER REVISIONS
// ============================================

export const ListingReapprovedNotification = {
  type: 'listing_reapproved',
  subject: '✅ Your Revised Listing is Now Live!',
  template: (listingTitle: string) => `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #10b981;">Listing Approved After Revision!</h2>
      
      <p>Excellent! Your updated listing "<strong>${listingTitle}</strong>" has been approved and is now live.</p>
      
      <p>Thank you for making the requested improvements. Your listing now meets our quality standards and is ready for customers.</p>
      
      <div style="background: #f0fdf4; border-left: 4px solid #10b981; padding: 15px; margin: 20px 0;">
        <p style="margin: 0; color: #166534;"><strong>Status:</strong> 🟢 Live & Visible to Buyers</p>
      </div>
      
      <h3 style="color: #374151;">You Can Now:</h3>
      <ul>
        <li>Monitor sales and customer reviews</li>
        <li>Update inventory levels</li>
        <li>Create more listings</li>
        <li>Build your store reputation</li>
      </ul>
      
      <p>
        <a href="https://yourplatform.com/seller/dashboard" 
           style="background: #10b981; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">
          View Dashboard
        </a>
      </p>
      
      <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
      
      <p style="color: #6b7280; font-size: 12px;">
        Happy selling! Watch your dashboard to track orders and customer feedback.
      </p>
    </div>
  `,
};

// ============================================
// USAGE EXAMPLE IN ROUTER
// ============================================

/**
 * Example: How to use these templates in the admin listing review router
 * 
 * After approval:
 * ```
 * await sendNotification({
 *   sellerId: listing.sellerId,
 *   type: 'listing_approved',
 *   subject: ListingApprovedNotification.subject,
 *   content: ListingApprovedNotification.template(
 *     listing.title,
 *     input.comments
 *   ),
 * });
 * ```
 * 
 * After rejection:
 * ```
 * await sendNotification({
 *   sellerId: listing.sellerId,
 *   type: 'listing_rejected',
 *   subject: ListingRejectedNotification.subject,
 *   content: ListingRejectedNotification.template(
 *     listing.title,
 *     input.rejectionReason
 *   ),
 * });
 * ```
 * 
 * After revision request:
 * ```
 * await sendNotification({
 *   sellerId: listing.sellerId,
 *   type: 'revision_requested',
 *   subject: RevisionRequestedNotification.subject,
 *   content: RevisionRequestedNotification.template(
 *     listing.title,
 *     input.comments
 *   ),
 * });
 * ```
 */

// ============================================
// NOTIFICATION DATA STRUCTURE
// ============================================

export interface ListingReviewNotification {
  type: 'listing_approved' | 'listing_rejected' | 'revision_requested' | 'listing_reapproved';
  sellerId: string;
  listingId: string;
  listingTitle: string;
  subject: string;
  content: string;
  actionUrl?: string;
  sentAt?: Date;
}

// ============================================
// IN-APP NOTIFICATION BADGE TEXT
// ============================================

/**
 * These are the short messages that appear in the seller's notification badge
 * in the dashboard
 */

export const NotificationBadgeText = {
  approved: (title: string) => `✓ Your listing "${title}" is now live!`,
  rejected: (title: string) => `⚠ Your listing "${title}" was rejected`,
  revision: (title: string) => `📝 Your listing "${title}" needs changes`,
  reapproved: (title: string) => `✓ Your updated listing "${title}" is approved!`,
};

// ============================================
// EMAIL SUBJECT LINES
// ============================================

export const EmailSubjects = {
  approved: '🎉 Your Listing Has Been Approved!',
  rejected: '⚠️ Your Listing Needs Changes',
  revision: '📝 Your Listing Needs Minor Changes',
  reapproved: '✅ Your Revised Listing is Now Live!',
};