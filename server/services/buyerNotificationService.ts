import { db } from '../db';
import { buyerNotifications } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import type { NotificationCategory } from '../db/types';

/**
 * Buyer Notification Service
 * Handles all notifications sent to buyers throughout their lifecycle
 * Production-ready with Drizzle ORM integration
 */

export interface BuyerNotificationInput {
  buyerId: string;
  type: NotificationCategory; // notification_category enum value
  title: string;
  message: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
  actionUrl?: string;
  metadata?: Record<string, any>;
}

// In-memory cache for deduplication (in production, use Redis)
const notificationDeduplicationCache = new Map<string, {timestamp: number, count: number}>();
const DEDUPLICATION_WINDOW_MS = 60000; // 60 seconds
const MAX_DUPLICATES_PER_WINDOW = 1; // Allow only 1 notification per window

/**
 * Check if this notification should be deduplicated
 * Returns true if the notification should be skipped (it's a duplicate)
 */
function shouldDeduplicateNotification(dedupeKey: string): boolean {
  const now = Date.now();
  const cached = notificationDeduplicationCache.get(dedupeKey);
  
  // If no cache entry, allow this notification
  if (!cached) {
    notificationDeduplicationCache.set(dedupeKey, { timestamp: now, count: 1 });
    return false;
  }
  
  // If cache entry expired, allow this notification
  if (now - cached.timestamp > DEDUPLICATION_WINDOW_MS) {
    notificationDeduplicationCache.set(dedupeKey, { timestamp: now, count: 1 });
    return false;
  }
  
  // If within window and we've already created this notification, skip it
  if (cached.count >= MAX_DUPLICATES_PER_WINDOW) {
    console.warn(
      `[BuyerNotification] Duplicate notification detected and skipped: ${dedupeKey}`
    );
    return true;
  }
  
  // Within window but haven't hit limit yet, increment count and allow
  cached.count++;
  return false;
}

/**
 * Generic notification creator - all other functions use this
 */
async function createBuyerNotification(
  input: BuyerNotificationInput,
  dedupeKey?: string
): Promise<string> {
  const notificationId = uuidv4();

  try {
    // Check for duplicates if dedupeKey is provided
    if (dedupeKey && shouldDeduplicateNotification(dedupeKey)) {
      console.log(
        `[BuyerNotification] Skipped duplicate notification for buyer ${input.buyerId}`
      );
      return notificationId; // Return a fake ID to satisfy the return type
    }

    const result = await db
      .insert(buyerNotifications)
      .values({
        id: notificationId,
        buyerId: input.buyerId,
        type: input.type,
        title: input.title,
        message: input.message,
        isRead: false,
        isStarred: false,
        relatedEntityId: input.relatedEntityId ?? null,
        relatedEntityType: input.relatedEntityType ?? null,
        actionUrl: input.actionUrl ?? null,
        metadata: input.metadata ?? null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!result[0]) {
      throw new Error('Failed to create notification');
    }

    console.log(
      `[BuyerNotification] Created ${input.type} notification for buyer ${input.buyerId}`
    );
    return notificationId;
  } catch (error) {
    console.error('[BuyerNotification] Error creating notification:', error);
    throw error;
  }
}

// ============================================================================
// SHOPPING ACTIONS
// ============================================================================

/**
 * Notify buyer when item is added to cart
 */
export async function notifyItemAddedToCart(
  buyerId: string,
  listingId: string,
  productTitle: string,
  quantity: number
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'order_pending',
    title: 'Item Added to Cart',
    message: `${quantity}x "${productTitle}" added to your cart`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/cart`,
    metadata: {
      productTitle,
      quantity,
      listingId,
      action: 'added_to_cart',
    },
  });
}

/**
 * Notify buyer when item is removed from cart
 */
export async function notifyItemRemovedFromCart(
  buyerId: string,
  listingId: string,
  productTitle: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'order_pending',
    title: 'Item Removed from Cart',
    message: `"${productTitle}" removed from your cart`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/cart`,
    metadata: {
      productTitle,
      listingId,
      action: 'removed_from_cart',
    },
  });
}

/**
 * Notify buyer when cart is cleared
 */
export async function notifyCartCleared(buyerId: string): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'order_pending',
    title: 'Cart Cleared',
    message: 'All items have been removed from your cart',
    actionUrl: `/buyer/cart`,
    metadata: {
      action: 'cart_cleared',
    },
  });
}

// ============================================================================
// FAVORITES & WISHLIST
// ============================================================================

/**
 * Notify buyer when product is added to favorites
 */
export async function notifyProductFavorited(
  buyerId: string,
  listingId: string,
  productTitle: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'product_back_in_stock',
    title: 'Added to Favorites',
    message: `"${productTitle}" added to your favorites`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/favorites`,
    metadata: {
      productTitle,
      listingId,
      action: 'added_to_favorites',
    },
  });
}

/**
 * Notify buyer when product is removed from favorites
 */
export async function notifyProductUnfavorited(
  buyerId: string,
  listingId: string,
  productTitle: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'product_back_in_stock',
    title: 'Removed from Favorites',
    message: `"${productTitle}" removed from your favorites`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/favorites`,
    metadata: {
      productTitle,
      listingId,
      action: 'removed_from_favorites',
    },
  });
}

// ============================================================================
// BRAND INTERACTIONS
// ============================================================================

/**
 * Notify buyer when they follow a brand
 */
export async function notifyBrandFollowed(
  buyerId: string,
  brandId: string,
  brandName: string
): Promise<string> {
  const dedupeKey = `brand_followed_${buyerId}_${brandId}`;
  return createBuyerNotification(
    {
      buyerId,
      type: 'system_alert',
      title: 'Brand Followed',
      message: `You're now following ${brandName}. Get updates on new products and exclusive offers!`,
      relatedEntityId: brandId,
      relatedEntityType: 'brand',
      actionUrl: `/buyer/brands/${brandId}`,
      metadata: {
        brandName,
        brandId,
        action: 'brand_followed',
      },
    },
    dedupeKey
  );
}

/**
 * Notify buyer when they unfollow a brand
 */
export async function notifyBrandUnfollowed(
  buyerId: string,
  brandId: string,
  brandName: string
): Promise<string> {
  const dedupeKey = `brand_unfollowed_${buyerId}_${brandId}`;
  return createBuyerNotification(
    {
      buyerId,
      type: 'system_alert',
      title: 'Brand Unfollowed',
      message: `You're no longer following ${brandName}`,
      relatedEntityId: brandId,
      relatedEntityType: 'brand',
      actionUrl: `/buyer/brands`,
      metadata: {
        brandName,
        brandId,
        action: 'brand_unfollowed',
      },
    },
    dedupeKey
  );
}

// ============================================================================
// ACCOUNT & PROFILE
// ============================================================================

/**
 * Notify buyer on account creation
 */
export async function notifyAccountCreated(
  buyerId: string,
  email: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Welcome to Luxela!',
    message: `Your account has been successfully created with email ${email}. Start shopping today!`,
    actionUrl: `/buyer/home`,
    metadata: {
      email,
      action: 'account_created',
    },
  });
}

/**
 * Notify buyer on profile update
 */
export async function notifyProfileUpdated(
  buyerId: string,
  updatedFields: string[]
): Promise<string> {
  const fieldsList = updatedFields.join(', ');
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Profile Updated',
    message: `Your profile has been updated: ${fieldsList}`,
    actionUrl: `/buyer/account/profile`,
    metadata: {
      updatedFields,
      action: 'profile_updated',
    },
  });
}

/**
 * Notify buyer on password change
 */
export async function notifyPasswordChanged(buyerId: string): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Password Changed',
    message:
      'Your password has been successfully changed. If you did not make this change, please contact support immediately.',
    actionUrl: `/buyer/account/security`,
    metadata: {
      action: 'password_changed',
      severity: 'important',
    },
  });
}

/**
 * Notify buyer on address addition
 */
export async function notifyAddressAdded(
  buyerId: string,
  addressType: string,
  addressLabel?: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Address Added',
    message: `New ${addressType} address "${addressLabel || 'untitled'}" has been added to your account`,
    actionUrl: `/buyer/account/addresses`,
    metadata: {
      addressType,
      addressLabel,
      action: 'address_added',
    },
  });
}

/**
 * Notify buyer on address update
 */
export async function notifyAddressUpdated(
  buyerId: string,
  addressType: string,
  addressLabel?: string,
  addressDetails?: {
    houseAddress?: string;
    city?: string;
    postalCode?: string;
    isDefault?: boolean;
  }
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Address Updated',
    message: `Your ${addressType} address "${addressLabel || 'untitled'}" has been updated`,
    actionUrl: `/buyer/account/addresses`,
    metadata: {
      addressType,
      addressLabel,
      houseAddress: addressDetails?.houseAddress,
      city: addressDetails?.city,
      postalCode: addressDetails?.postalCode,
      isDefault: addressDetails?.isDefault,
      action: 'address_updated',
    },
  });
}

/**
 * Notify buyer on address deletion
 */
export async function notifyAddressDeleted(
  buyerId: string,
  addressType: string,
  addressLabel?: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Address Deleted',
    message: `Your ${addressType} address "${addressLabel || 'untitled'}" has been deleted`,
    actionUrl: `/buyer/account/addresses`,
    metadata: {
      addressType,
      addressLabel,
      action: 'address_deleted',
    },
  });
}

/**
 * Notify buyer on settings change
 */
export async function notifySettingsChanged(
  buyerId: string,
  settingName: string,
  newValue: any
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Settings Updated',
    message: `Your ${settingName} setting has been updated`,
    actionUrl: `/buyer/account/settings`,
    metadata: {
      settingName,
      newValue,
      action: 'settings_changed',
    },
  });
}

// ============================================================================
// PRODUCT INTERACTIONS & REVIEWS
// ============================================================================

/**
 * Notify buyer when their review is posted successfully
 */
export async function notifyReviewPosted(
  buyerId: string,
  productTitle: string,
  rating: number,
  listingId: string
): Promise<string> {
  const starEmoji = '⭐'.repeat(rating);
  return createBuyerNotification({
    buyerId,
    type: 'new_review',
    title: 'Review Posted',
    message: `Your ${starEmoji} review on "${productTitle}" has been posted and is now visible to other shoppers`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/product/${listingId}#reviews`,
    metadata: {
      productTitle,
      rating,
      listingId,
      action: 'review_posted',
    },
  });
}

/**
 * Notify buyer when seller responds to their review
 */
export async function notifySellerRepliedToReview(
  buyerId: string,
  productTitle: string,
  sellerName: string,
  listingId: string,
  replyText: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'new_reply',
    title: 'Seller Replied to Your Review',
    message: `${sellerName} replied to your review on "${productTitle}": "${replyText.substring(0, 100)}..."`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/product/${listingId}#reviews`,
    metadata: {
      productTitle,
      sellerName,
      listingId,
      replyText,
      action: 'seller_review_reply',
    },
  });
}

/**
 * Notify buyer on product viewed/saved
 * (Optional - can be used for tracking)
 */
export async function notifyProductSaved(
  buyerId: string,
  productTitle: string,
  listingId: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'product_back_in_stock',
    title: 'Product Saved',
    message: `"${productTitle}" has been saved to your browsing history`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/product/${listingId}`,
    metadata: {
      productTitle,
      listingId,
      action: 'product_saved',
    },
  });
}

// ============================================================================
// COMMUNICATIONS & SUPPORT
// ============================================================================

/**
 * Notify buyer when they receive a new message from seller
 */
export async function notifyNewMessageFromSeller(
  buyerId: string,
  sellerName: string,
  messagePreview: string,
  conversationId: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'new_reply',
    title: 'New Message from Seller',
    message: `${sellerName} sent you a message: "${messagePreview.substring(0, 80)}..."`,
    relatedEntityId: conversationId,
    relatedEntityType: 'conversation',
    actionUrl: `/buyer/messages/${conversationId}`,
    metadata: {
      sellerName,
      messagePreview,
      conversationId,
      action: 'new_seller_message',
    },
  });
}

/**
 * Notify buyer when support ticket is replied to
 */
export async function notifyTicketReplied(
  buyerId: string,
  ticketId: string,
  ticketTitle: string,
  replyText: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'new_reply',
    title: 'Support Ticket Reply',
    message: `Your support ticket "${ticketTitle}" has been replied to`,
    relatedEntityId: ticketId,
    relatedEntityType: 'support_ticket',
    actionUrl: `/buyer/support/${ticketId}`,
    metadata: {
      ticketTitle,
      ticketId,
      replyText,
      action: 'support_ticket_reply',
    },
  });
}

/**
 * Notify buyer when support ticket status changes
 */
export async function notifyTicketStatusChanged(
  buyerId: string,
  ticketId: string,
  ticketTitle: string,
  newStatus: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Support Ticket Updated',
    message: `Your support ticket "${ticketTitle}" status changed to: ${newStatus}`,
    relatedEntityId: ticketId,
    relatedEntityType: 'support_ticket',
    actionUrl: `/buyer/support/${ticketId}`,
    metadata: {
      ticketTitle,
      ticketId,
      newStatus,
      action: 'ticket_status_changed',
    },
  });
}

// ============================================================================
// SPECIAL EVENTS & REWARDS
// ============================================================================

/**
 * Notify buyer when loyalty points are earned
 */
export async function notifyLoyaltyPointsEarned(
  buyerId: string,
  points: number,
  reason: string,
  totalPoints: number
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Loyalty Points Earned!',
    message: `You've earned ${points} points (${reason}). Total balance: ${totalPoints} points`,
    actionUrl: `/buyer/loyalty`,
    metadata: {
      points,
      reason,
      totalPoints,
      action: 'loyalty_points_earned',
    },
  });
}

/**
 * Notify buyer when they redeem loyalty points
 */
export async function notifyLoyaltyPointsRedeemed(
  buyerId: string,
  pointsRedeemed: number,
  reward: string,
  remainingPoints: number
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Points Redeemed',
    message: `You've redeemed ${pointsRedeemed} points for ${reward}. Remaining: ${remainingPoints} points`,
    actionUrl: `/buyer/loyalty`,
    metadata: {
      pointsRedeemed,
      reward,
      remainingPoints,
      action: 'loyalty_points_redeemed',
    },
  });
}

/**
 * Notify buyer when NFT reward is earned
 */
export async function notifyNFTRewardEarned(
  buyerId: string,
  nftName: string,
  nftDescription: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'NFT Reward Unlocked!',
    message: `Congratulations! You've unlocked the "${nftName}" NFT: ${nftDescription}`,
    actionUrl: `/buyer/rewards/nfts`,
    metadata: {
      nftName,
      nftDescription,
      action: 'nft_reward_earned',
    },
  });
}

/**
 * Notify buyer when they unlock an achievement/milestone
 */
export async function notifyMilestoneUnlocked(
  buyerId: string,
  milestoneTitle: string,
  description: string,
  reward?: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'system_alert',
    title: 'Milestone Unlocked!',
    message: `${milestoneTitle}: ${description}${reward ? ` - ${reward}` : ''}`,
    actionUrl: `/buyer/achievements`,
    metadata: {
      milestoneTitle,
      description,
      reward,
      action: 'milestone_unlocked',
    },
  });
}

// ============================================================================
// PROMOTIONAL
// ============================================================================

/**
 * Notify buyer of new discount/coupon availability
 */
export async function notifyNewDiscount(
  buyerId: string,
  discountCode: string,
  discountAmount: string,
  expiresAt: Date
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'price_drop',
    title: 'Exclusive Discount Available',
    message: `Use code "${discountCode}" for ${discountAmount} off. Valid until ${expiresAt.toLocaleDateString()}`,
    actionUrl: `/buyer/cart`,
    metadata: {
      discountCode,
      discountAmount,
      expiresAt,
      action: 'new_discount_available',
    },
  });
}

/**
 * Notify buyer when price drops on favorited item
 */
export async function notifyPriceDropOnFavorite(
  buyerId: string,
  productTitle: string,
  oldPrice: number,
  newPrice: number,
  listingId: string,
  currency: string
): Promise<string> {
  const savings = oldPrice - newPrice;
  const savingsPercent = Math.round((savings / oldPrice) * 100);

  return createBuyerNotification({
    buyerId,
    type: 'price_drop',
    title: 'Price Drop Alert!',
    message: `"${productTitle}" dropped from ${currency} ${(oldPrice / 100).toFixed(2)} to ${currency} ${(newPrice / 100).toFixed(2)} (${savingsPercent}% off)`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/product/${listingId}`,
    metadata: {
      productTitle,
      oldPrice,
      newPrice,
      savings,
      savingsPercent,
      currency,
      listingId,
      action: 'price_drop_favorite',
    },
  });
}

/**
 * Notify buyer when favorited product is back in stock
 */
export async function notifyFavoriteBackInStock(
  buyerId: string,
  productTitle: string,
  listingId: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'product_back_in_stock',
    title: 'Back in Stock!',
    message: `"${productTitle}" is back in stock! Shop now before it sells out again`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/product/${listingId}`,
    metadata: {
      productTitle,
      listingId,
      action: 'favorite_back_in_stock',
    },
  });
}

/**
 * Notify buyer about flash sale
 */
export async function notifyFlashSale(
  buyerId: string,
  saleTitle: string,
  description: string,
  discountPercent: number,
  endsAt: Date
): Promise<string> {
  const timeUntilEnd = Math.max(0, endsAt.getTime() - Date.now());
  const hoursLeft = Math.floor(timeUntilEnd / (1000 * 60 * 60));

  return createBuyerNotification({
    buyerId,
    type: 'price_drop',
    title: '⚡ Flash Sale!',
    message: `${saleTitle}: ${discountPercent}% off! Hurry, only ${hoursLeft} hours left`,
    actionUrl: `/buyer/sale`,
    metadata: {
      saleTitle,
      description,
      discountPercent,
      endsAt,
      hoursLeft,
      action: 'flash_sale_alert',
    },
  });
}

/**
 * Notify buyer about seasonal sale
 */
export async function notifySeasonalSale(
  buyerId: string,
  saleTitle: string,
  description: string,
  startDate: Date,
  endDate: Date
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'price_drop',
    title: 'Seasonal Sale',
    message: `${saleTitle}: ${description}. From ${startDate.toLocaleDateString()} to ${endDate.toLocaleDateString()}`,
    actionUrl: `/buyer/sale`,
    metadata: {
      saleTitle,
      description,
      startDate,
      endDate,
      action: 'seasonal_sale_alert',
    },
  });
}

/**
 * Notify buyer about brand-specific promotion
 */
export async function notifyBrandPromotion(
  buyerId: string,
  brandName: string,
  promotionDetails: string,
  brandId: string
): Promise<string> {
  return createBuyerNotification({
    buyerId,
    type: 'price_drop',
    title: `${brandName} Promotion`,
    message: `${brandName} is having a promotion: ${promotionDetails}`,
    relatedEntityId: brandId,
    relatedEntityType: 'brand',
    actionUrl: `/buyer/brands/${brandId}`,
    metadata: {
      brandName,
      promotionDetails,
      brandId,
      action: 'brand_promotion_alert',
    },
  });
}

// ============================================================================
// BUYER NOTIFICATION MANAGEMENT
// ============================================================================

/**
 * Get all notifications for a buyer
 */
export async function getBuyerNotifications(
  buyerId: string,
  limit: number = 50,
  offset: number = 0
) {
  try {
    const notifications = await db
      .select()
      .from(buyerNotifications)
      .where(eq(buyerNotifications.buyerId, buyerId))
      .orderBy(desc(buyerNotifications.createdAt))
      .limit(limit)
      .offset(offset);

    return notifications;
  } catch (error) {
    console.error('[BuyerNotification] Error fetching notifications:', error);
    throw error;
  }
}

/**
 * Get unread notification count for a buyer
 */
export async function getUnreadNotificationCount(buyerId: string) {
  try {
    const result = await db
      .select()
      .from(buyerNotifications)
      .where(
        and(
          eq(buyerNotifications.buyerId, buyerId),
          eq(buyerNotifications.isRead, false)
        )
      );

    return result.length;
  } catch (error) {
    console.error(
      '[BuyerNotification] Error getting unread count:',
      error
    );
    throw error;
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    return await db
      .update(buyerNotifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(buyerNotifications.id, notificationId))
      .returning();
  } catch (error) {
    console.error(
      '[BuyerNotification] Error marking as read:',
      error
    );
    throw error;
  }
}

/**
 * Mark all notifications as read for a buyer
 */
export async function markAllNotificationsAsRead(buyerId: string) {
  try {
    return await db
      .update(buyerNotifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(eq(buyerNotifications.buyerId, buyerId))
      .returning();
  } catch (error) {
    console.error('[BuyerNotification] Error marking all as read:', error);
    throw error;
  }
}

/**
 * Star/unstar a notification
 */
export async function toggleNotificationStar(
  notificationId: string,
  starred: boolean
) {
  try {
    return await db
      .update(buyerNotifications)
      .set({ isStarred: starred, updatedAt: new Date() })
      .where(eq(buyerNotifications.id, notificationId))
      .returning();
  } catch (error) {
    console.error('[BuyerNotification] Error toggling star:', error);
    throw error;
  }
}

/**
 * Delete a notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    return await db
      .delete(buyerNotifications)
      .where(eq(buyerNotifications.id, notificationId))
      .returning();
  } catch (error) {
    console.error('[BuyerNotification] Error deleting notification:', error);
    throw error;
  }
}

/**
 * Clear all notifications for a buyer
 */
export async function clearAllNotifications(buyerId: string) {
  try {
    return await db
      .delete(buyerNotifications)
      .where(eq(buyerNotifications.buyerId, buyerId))
      .returning();
  } catch (error) {
    console.error('[BuyerNotification] Error clearing notifications:', error);
    throw error;
  }
}


/**
 * Notify buyer about a price drop on a favorited listing
 */
export async function notifyPriceDrop(
  buyerId: string,
  listingId: string,
  listingTitle: string,
  oldPrice: number,
  newPrice: number,
  currency: string = 'NGN'
) {
  const discount = oldPrice - newPrice;
  const discountPercent = Math.round((discount / oldPrice) * 100);

  return createBuyerNotification({
    buyerId,
    type: 'price_drop',
    title: `${discountPercent}% Price Drop!`,
    message: `${listingTitle} is now ${currency} ${newPrice.toLocaleString()} (was ${currency} ${oldPrice.toLocaleString()}). Hurry, limited time!`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/listings/${listingId}`,
    metadata: {
      listingTitle,
      oldPrice,
      newPrice,
      discount,
      discountPercent,
      currency,
    },
  });
}

/**
 * Notify buyer when a favorited item is back in stock
 */
export async function notifyBackInStock(
  buyerId: string,
  listingId: string,
  listingTitle: string,
  availableQuantity: number,
  price: number,
  currency: string = 'NGN'
) {
  return createBuyerNotification({
    buyerId,
    type: 'product_back_in_stock',
    title: 'Item Back in Stock!',
    message: `${listingTitle} is back in stock with ${availableQuantity} ${availableQuantity === 1 ? 'item' : 'items'} available at ${currency} ${price.toLocaleString()}.`,
    relatedEntityId: listingId,
    relatedEntityType: 'listing',
    actionUrl: `/buyer/listings/${listingId}`,
    metadata: {
      listingTitle,
      availableQuantity,
      price,
      currency,
    },
  });
}

/**
 * Notify buyer when a refund has been initiated
 */
export async function notifyRefundInitiated(
  buyerId: string,
  refundAmount: number,
  orderId: string,
  reason: string
) {
  return createBuyerNotification({
    buyerId,
    type: 'refund_initiated',
    title: 'Refund Initiated',
    message: `Your refund of NGN ${refundAmount.toLocaleString()} for order ${orderId} has been initiated. Reason: ${reason}`,
    relatedEntityId: orderId,
    relatedEntityType: 'order',
    actionUrl: `/buyer/orders/${orderId}`,
    metadata: {
      orderId,
      refundAmount,
      reason,
    },
  });
}

/**
 * Notify buyer when refund has been completed
 */
export async function notifyRefundCompleted(
  buyerId: string,
  refundAmount: number,
  orderId: string
) {
  return createBuyerNotification({
    buyerId,
    type: 'return_completed',
    title: 'Refund Completed',
    message: `Your refund of NGN ${refundAmount.toLocaleString()} for order ${orderId} has been completed and credited to your account.`,
    relatedEntityId: orderId,
    relatedEntityType: 'order',
    actionUrl: `/buyer/orders/${orderId}`,
    metadata: {
      orderId,
      refundAmount,
    },
  });
}