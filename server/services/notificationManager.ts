import { db } from '../db';
import { buyerNotifications, sellerNotifications, adminNotifications } from '../db/schema';
import { sql } from 'drizzle-orm';

/**
 * Notification Manager Service
 * Centralized service for creating notifications across the system
 * Handles buyers, sellers, and admin notifications
 */

export interface CreateBuyerNotificationInput {
  buyerId: string;
  type: string;
  title: string;
  message: string;
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
}

export interface CreateSellerNotificationInput {
  sellerId: string;
  type: string;
  title: string;
  message: string;
  severity?: 'info' | 'warning' | 'critical';
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
}

export interface CreateAdminNotificationInput {
  adminId: string;
  type: string;
  title: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  relatedEntityId?: string | null;
  relatedEntityType?: string | null;
  actionUrl?: string | null;
  metadata?: Record<string, any>;
}

/**
 * Create a notification for a buyer
 */
export async function createBuyerNotification(input: CreateBuyerNotificationInput) {
  try {
    // Validate required fields before database operation
    if (!input.buyerId) {
      throw new Error('buyerId is required for buyer notification');
    }
    if (!input.type) {
      throw new Error('type is required for buyer notification');
    }
    if (!input.title) {
      throw new Error('title is required for buyer notification');
    }
    if (!input.message) {
      throw new Error('message is required for buyer notification');
    }

    const result = await db.insert(buyerNotifications).values({
      buyerId: input.buyerId,
      type: input.type as any,
      title: input.title,
      message: input.message,
      relatedEntityId: input.relatedEntityId || null,
      relatedEntityType: input.relatedEntityType || null,
      actionUrl: input.actionUrl || null,
      metadata: input.metadata || null,
      isRead: false,
      isStarred: false,
    });
    return result;
  } catch (error: any) {
    console.error('[DB_ERROR] Failed to create buyer notification:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      column: error.column,
      table: error.table,
      constraint: error.constraint,
      input: {
        buyerId: input.buyerId,
        type: input.type,
        title: input.title,
        message: input.message,
        hasRelatedEntityId: !!input.relatedEntityId,
        hasMetadata: !!input.metadata,
      },
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Create a notification for a seller
 */
export async function createSellerNotification(input: CreateSellerNotificationInput) {
  try {
    // Validate required fields
    if (!input.sellerId) {
      throw new Error('sellerId is required for seller notification');
    }
    if (!input.type) {
      throw new Error('type is required for seller notification');
    }
    if (!input.title) {
      throw new Error('title is required for seller notification');
    }
    if (!input.message) {
      throw new Error('message is required for seller notification');
    }

    const result = await db.insert(sellerNotifications).values({
      sellerId: input.sellerId,
      type: input.type as any,
      title: input.title,
      message: input.message,
      severity: (input.severity || 'info') as any,
      relatedEntityId: input.relatedEntityId || null,
      relatedEntityType: input.relatedEntityType || null,
      actionUrl: input.actionUrl || null,
      metadata: input.metadata || null,
      isRead: false,
      isStarred: false,
    });
    return result;
  } catch (error: any) {
    console.error('[DB_ERROR] Failed to create seller notification:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      input: {
        sellerId: input.sellerId,
        type: input.type,
        severity: input.severity,
      },
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Create a notification for an admin
 */
export async function createAdminNotification(input: CreateAdminNotificationInput) {
  try {
    // Validate required fields
    if (!input.adminId) {
      throw new Error('adminId is required for admin notification');
    }
    if (!input.type) {
      throw new Error('type is required for admin notification');
    }
    if (!input.title) {
      throw new Error('title is required for admin notification');
    }
    if (!input.message) {
      throw new Error('message is required for admin notification');
    }

    const result = await db.insert(adminNotifications).values({
      adminId: input.adminId,
      type: input.type as any,
      title: input.title,
      message: input.message,
      severity: input.severity as any,
      relatedEntityId: input.relatedEntityId || null,
      relatedEntityType: input.relatedEntityType || null,
      actionUrl: input.actionUrl || null,
      metadata: input.metadata || null,
      isRead: false,
      isStarred: false,
    });
    return result;
  } catch (error: any) {
    console.error('[DB_ERROR] Failed to create admin notification:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      input: {
        adminId: input.adminId,
        type: input.type,
        severity: input.severity,
      },
      timestamp: new Date().toISOString(),
    });
    throw error;
  }
}

/**
 * Create bulk buyer notifications
 */
export async function createBuyerNotifications(inputs: CreateBuyerNotificationInput[]) {
  try {
    const values = inputs.map((input) => ({
      buyerId: input.buyerId,
      type: input.type as any,
      title: input.title,
      message: input.message,
      relatedEntityId: input.relatedEntityId || null,
      relatedEntityType: input.relatedEntityType || null,
      actionUrl: input.actionUrl || null,
      metadata: input.metadata || null,
      isRead: false,
      isStarred: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    const result = await db.insert(buyerNotifications).values(values);
    return result;
  } catch (error) {
    console.error('Failed to create bulk buyer notifications:', error);
    throw error;
  }
}

/**
 * Create bulk seller notifications
 */
export async function createSellerNotifications(inputs: CreateSellerNotificationInput[]) {
  try {
    const values = inputs.map((input) => ({
      sellerId: input.sellerId,
      type: input.type as any,
      title: input.title,
      message: input.message,
      severity: (input.severity || 'info') as any,
      relatedEntityId: input.relatedEntityId || null,
      relatedEntityType: input.relatedEntityType || null,
      actionUrl: input.actionUrl || null,
      metadata: input.metadata || null,
      isRead: false,
      isStarred: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    const result = await db.insert(sellerNotifications).values(values);
    return result;
  } catch (error) {
    console.error('Failed to create bulk seller notifications:', error);
    throw error;
  }
}

/**
 * Create bulk admin notifications
 */
export async function createAdminNotifications(inputs: CreateAdminNotificationInput[]) {
  try {
    const values = inputs.map((input) => ({
      adminId: input.adminId,
      type: input.type as any,
      title: input.title,
      message: input.message,
      severity: input.severity as any,
      relatedEntityId: input.relatedEntityId || null,
      relatedEntityType: input.relatedEntityType || null,
      actionUrl: input.actionUrl || null,
      metadata: input.metadata || null,
      isRead: false,
      isStarred: false,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
    
    const result = await db.insert(adminNotifications).values(values);
    return result;
  } catch (error) {
    console.error('Failed to create bulk admin notifications:', error);
    throw error;
  }
}

/**
 * Mark buyer notification as read
 */
export async function markBuyerNotificationAsRead(notificationId: string) {
  try {
    await db
      .update(buyerNotifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(sql`id = ${notificationId}`);
  } catch (error) {
    console.error('Failed to mark buyer notification as read:', error);
    throw error;
  }
}

/**
 * Mark seller notification as read
 */
export async function markSellerNotificationAsRead(notificationId: string) {
  try {
    await db
      .update(sellerNotifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(sql`id = ${notificationId}`);
  } catch (error) {
    console.error('Failed to mark seller notification as read:', error);
    throw error;
  }
}

/**
 * Mark admin notification as read
 */
export async function markAdminNotificationAsRead(notificationId: string) {
  try {
    await db
      .update(adminNotifications)
      .set({ isRead: true, updatedAt: new Date() })
      .where(sql`id = ${notificationId}`);
  } catch (error) {
    console.error('Failed to mark admin notification as read:', error);
    throw error;
  }
}

/**
 * Delete buyer notification
 */
export async function deleteBuyerNotification(notificationId: string) {
  try {
    await db
      .delete(buyerNotifications)
      .where(sql`id = ${notificationId}`);
  } catch (error) {
    console.error('Failed to delete buyer notification:', error);
    throw error;
  }
}

/**
 * Delete seller notification
 */
export async function deleteSellerNotification(notificationId: string) {
  try {
    await db
      .delete(sellerNotifications)
      .where(sql`id = ${notificationId}`);
  } catch (error) {
    console.error('Failed to delete seller notification:', error);
    throw error;
  }
}

/**
 * Delete admin notification
 */
export async function deleteAdminNotification(notificationId: string) {
  try {
    await db
      .delete(adminNotifications)
      .where(sql`id = ${notificationId}`);
  } catch (error) {
    console.error('Failed to delete admin notification:', error);
    throw error;
  }
}

/**
 * Clear all read notifications for a buyer
 */
export async function clearBuyerReadNotifications(buyerId: string) {
  try {
    await db
      .delete(buyerNotifications)
      .where(sql`buyer_id = ${buyerId} AND is_read = true`);
  } catch (error) {
    console.error('Failed to clear buyer read notifications:', error);
    throw error;
  }
}

/**
 * Clear all read notifications for a seller
 */
export async function clearSellerReadNotifications(sellerId: string) {
  try {
    await db
      .delete(sellerNotifications)
      .where(sql`seller_id = ${sellerId} AND is_read = true`);
  } catch (error) {
    console.error('Failed to clear seller read notifications:', error);
    throw error;
  }
}

/**
 * Clear all read notifications for an admin
 */
export async function clearAdminReadNotifications(adminId: string) {
  try {
    await db
      .delete(adminNotifications)
      .where(sql`admin_id = ${adminId} AND is_read = true`);
  } catch (error) {
    console.error('Failed to clear admin read notifications:', error);
    throw error;
  }
}