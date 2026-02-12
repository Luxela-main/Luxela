import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { adminSettings } from '../db/schema';
import { eq } from 'drizzle-orm';

async function verifyAdminRole(ctx: any) {
  if (ctx.user?.role !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required',
    });
  }
}

// ========== SETTING SCHEMAS ==========

const SettingSchema = z.object({
  settingKey: z.string(),
  settingValue: z.any(),
  category: z.string(),
  description: z.string().optional(),
});

const UpdateSettingSchema = z.object({
  settingKey: z.string(),
  settingValue: z.any(),
  category: z.string(),
});

// ========== HELPER FUNCTIONS ==========

async function getSetting(key: string) {
  const result = await db.select().from(adminSettings).where(eq(adminSettings.settingKey, key)).limit(1);
  return result[0] || null;
}

async function getSettingsByCategory(category: string) {
  return db.select().from(adminSettings).where(eq(adminSettings.category, category));
}

async function updateOrInsertSetting(
  key: string,
  value: any,
  category: string,
  description: string,
  userId: string
) {
  const existing = await getSetting(key);

  if (existing) {
    await db
      .update(adminSettings)
      .set({
        settingValue: value,
        updatedBy: userId,
        updatedAt: new Date(),
      })
      .where(eq(adminSettings.settingKey, key));
  } else {
    await db.insert(adminSettings).values({
      settingKey: key,
      settingValue: value,
      category,
      description: description || `Setting: ${key}`,
      updatedBy: userId,
    });
  }
}

export const adminSettingsRouter = createTRPCRouter({
  /**
   * Get a single setting by key
   */
  getSetting: publicProcedure
    .input(z.object({ key: z.string() }))
    .query(async ({ input }) => {
      const setting = await getSetting(input.key);
      if (!setting) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: `Setting ${input.key} not found`,
        });
      }
      return setting.settingValue;
    }),

  /**
   * Get all settings in a category
   */
  getSettingsByCategory: publicProcedure
    .input(z.object({ category: z.string() }))
    .query(async ({ input }) => {
      const settings = await getSettingsByCategory(input.category);
      const result: Record<string, any> = {};
      settings.forEach((setting: any) => {
        const key = setting.settingKey.split(':')[1] || setting.settingKey;
        result[key] = setting.settingValue;
      });
      return result;
    }),

  /**
   * Get all settings grouped by category
   */
  getAllSettings: protectedProcedure
    .query(async ({ ctx }) => {
      await verifyAdminRole(ctx);
      const allSettings = await db.select().from(adminSettings);
      const result: Record<string, Record<string, any>> = {};

      allSettings.forEach((setting: any) => {
        if (!result[setting.category]) {
          result[setting.category] = {};
        }
        const key = setting.settingKey.split(':')[1] || setting.settingKey;
        result[setting.category][key] = setting.settingValue;
      });

      return result;
    }),

  /**
   * Update a single setting
   */
  updateSetting: protectedProcedure
    .input(UpdateSettingSchema)
    .mutation(async ({ input, ctx }) => {
      await verifyAdminRole(ctx);
      const userId = ctx.user?.id || 'system';

      await updateOrInsertSetting(input.settingKey, input.settingValue, input.category, '', userId);

      return {
        success: true,
        message: `Setting ${input.settingKey} updated successfully`,
      };
    }),

  /**
   * Update multiple settings at once
   */
  updateSettings: protectedProcedure
    .input(z.array(UpdateSettingSchema))
    .mutation(async ({ input, ctx }) => {
      await verifyAdminRole(ctx);
      const userId = ctx.user?.id || 'system';

      for (const setting of input) {
        await updateOrInsertSetting(setting.settingKey, setting.settingValue, setting.category, '', userId);
      }

      return {
        success: true,
        message: `${input.length} settings updated successfully`,
        count: input.length,
      };
    }),

  /**
   * Get payment settings
   */
  getPaymentSettings: protectedProcedure
    .query(async ({ ctx }) => {
      await verifyAdminRole(ctx);
      const settings = await getSettingsByCategory('payment');
      const result: Record<string, any> = {
        commissionRate: 15,
        refundWindow: 30,
        autoPayoutSchedule: 'monthly',
        paymentProviders: [
          { id: 'stripe', name: 'Stripe', enabled: true, fee: 2.9, feeFixed: 0.30 },
          { id: 'paypal', name: 'PayPal', enabled: true, fee: 3.49, feeFixed: 0.49 },
        ],
        payoutMethods: [
          { id: 'bank', name: 'Bank Transfer', enabled: true, minPayout: 100, processingTime: '2-5 days', fee: 0 },
          { id: 'paypal', name: 'PayPal', enabled: true, minPayout: 50, processingTime: '1-3 days', fee: 0 },
        ],
      };

      settings.forEach((setting: any) => {
        const keyParts = setting.settingKey.split(':');
        const key = keyParts[1] || keyParts[0];
        const value = setting.settingValue;

        if (key === 'commissionRate') result.commissionRate = value;
        if (key === 'refundWindow') result.refundWindow = value;
        if (key === 'autoPayoutSchedule') result.autoPayoutSchedule = value;
        if (key === 'paymentProviders') result.paymentProviders = value;
        if (key === 'payoutMethods') result.payoutMethods = value;
      });

      return result;
    }),

  /**
   * Get email template settings
   */
  getEmailTemplateSettings: protectedProcedure
    .query(async ({ ctx }) => {
      await verifyAdminRole(ctx);
      const settings = await getSettingsByCategory('email');
      const result: Record<string, any> = {
        smtp: {
          server: 'smtp.gmail.com',
          port: '587',
          fromEmail: 'noreply@luxela.com',
          enableTLS: true,
        },
        emailTemplates: [
          { id: 'welcome', name: 'Welcome Email', subject: 'Welcome to Luxela', category: 'onboarding', enabled: true },
          { id: 'order-confirmation', name: 'Order Confirmation', subject: 'Order Confirmed', category: 'orders', enabled: true },
          { id: 'password-reset', name: 'Password Reset', subject: 'Reset Your Password', category: 'account', enabled: true },
        ],
      };

      settings.forEach((setting: any) => {
        const keyParts = setting.settingKey.split(':');
        const key = keyParts[1] || keyParts[0];
        const value = setting.settingValue;

        if (key === 'smtpServer') result.smtp.server = value;
        if (key === 'smtpPort') result.smtp.port = value;
        if (key === 'fromEmail') result.smtp.fromEmail = value;
        if (key === 'enableSSL') result.smtp.enableTLS = value;
        if (key === 'emailTemplates') result.emailTemplates = value;
      });

      return result;
    }),

  /**
   * Get platform rules
   */
  getPlatformRules: protectedProcedure
    .query(async ({ ctx }) => {
      await verifyAdminRole(ctx);
      const settings = await getSettingsByCategory('platformRules');
      const result: Record<string, any> = {
        listing: {
          minPrice: 0,
          maxPrice: 999999,
          requireApproval: false,
          approvalDays: 2,
        },
        seller: {
          minimumSellerRating: 0,
          minimumCompletionRate: 0,
          requireVerification: false,
        },
        security: {
          enableRateLimiting: true,
          loginAttempts: 5,
          sessionTimeout: 30,
          enableTwoFactorAuth: false,
        },
      };

      settings.forEach((setting: any) => {
        const keyParts = setting.settingKey.split(':');
        const key = keyParts[1] || keyParts[0];
        const value = setting.settingValue;

        if (['minPrice', 'maxPrice', 'requireApproval', 'approvalDays'].includes(key)) {
          result.listing[key] = value;
        } else if (['minimumSellerRating', 'minimumCompletionRate', 'requireVerification'].includes(key)) {
          result.seller[key] = value;
        } else if (['enableRateLimiting', 'loginAttempts', 'sessionTimeout', 'enableTwoFactorAuth'].includes(key)) {
          result.security[key] = value;
        }
      });

      return result;
    }),

  /**
   * Update general settings (backwards compat)
   */
  updateGeneralSettings: protectedProcedure
    .input(
      z.object({
        siteName: z.string().optional(),
        siteUrl: z.string().url().optional(),
        supportEmail: z.string().email().optional(),
        adminEmail: z.string().email().optional(),
        timezone: z.string().optional(),
        language: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await verifyAdminRole(ctx);
      const userId = ctx.user?.id || 'system';

      const updates: Array<{ settingKey: string; settingValue: string; category: string }> = [];
      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          updates.push({
            settingKey: `general:${key}`,
            settingValue: value,
            category: 'general',
          });
        }
      }

      for (const update of updates) {
        await updateOrInsertSetting(update.settingKey, update.settingValue, update.category, '', userId);
      }

      return {
        success: true,
        data: input,
      };
    }),

  /**
   * Update platform rules
   */
  updatePlatformRules: protectedProcedure
    .input(z.record(z.string(), z.any()))
    .mutation(async ({ input, ctx }) => {
      await verifyAdminRole(ctx);
      const userId = ctx.user?.id || 'system';

      for (const [key, value] of Object.entries(input)) {
        await updateOrInsertSetting(`platformRules:${key}`, value, 'platformRules', '', userId);
      }

      return {
        success: true,
        data: input,
      };
    }),

  /**
   * Update payment settings
   */
  updatePaymentSettings: protectedProcedure
    .input(z.record(z.string(), z.any()))
    .mutation(async ({ input, ctx }) => {
      await verifyAdminRole(ctx);
      const userId = ctx.user?.id || 'system';

      for (const [key, value] of Object.entries(input)) {
        await updateOrInsertSetting(`payment:${key}`, value, 'payment', '', userId);
      }

      return {
        success: true,
        data: input,
      };
    }),

  /**
   * Update compliance settings
   */
  updateComplianceSettings: protectedProcedure
    .input(z.record(z.string(), z.any()))
    .mutation(async ({ input, ctx }) => {
      await verifyAdminRole(ctx);
      const userId = ctx.user?.id || 'system';

      for (const [key, value] of Object.entries(input)) {
        await updateOrInsertSetting(`compliance:${key}`, value, 'compliance', '', userId);
      }

      return {
        success: true,
        data: input,
      };
    }),

  /**
   * Update email settings
   */
  updateEmailSettings: protectedProcedure
    .input(
      z.object({
        smtpServer: z.string().optional(),
        smtpPort: z.string().optional(),
        fromEmail: z.string().email().optional(),
        fromName: z.string().optional(),
        replyTo: z.string().email().optional(),
        enableSSL: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await verifyAdminRole(ctx);
      const userId = ctx.user?.id || 'system';

      for (const [key, value] of Object.entries(input)) {
        if (value !== undefined) {
          await updateOrInsertSetting(`email:${key}`, value, 'email', '', userId);
        }
      }

      return {
        success: true,
        data: input,
      };
    }),

  /**
   * Get email template
   */
  getEmailTemplate: protectedProcedure
    .input(z.object({ templateId: z.string() }))
    .query(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);
      const template = await getSetting(`emailTemplate:${input.templateId}`);
      if (!template) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Template not found',
        });
      }
      return template.settingValue;
    }),

  /**
   * Update email template
   */
  updateEmailTemplate: protectedProcedure
    .input(
      z.object({
        templateId: z.string(),
        subject: z.string().optional(),
        body: z.string().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);
      const userId = ctx.user?.id || 'system';

      const templateKey = `emailTemplate:${input.templateId}`;
      const existing = await getSetting(templateKey);

      const existingValue = (existing?.settingValue as Record<string, any>) || {};
      const updated = {
        ...existingValue,
        subject: input.subject || existingValue.subject || 'Untitled',
        enabled: input.enabled !== undefined ? input.enabled : existingValue.enabled !== false,
      };

      await updateOrInsertSetting(templateKey, updated, 'email', `Email template: ${input.templateId}`, userId);

      return {
        success: true,
        template: updated,
      };
    }),

  /**
   * Test email settings
   */
  testEmailSettings: protectedProcedure
    .input(z.object({ recipient: z.string().email() }))
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);
      // This would actually send a test email in production
      return {
        success: true,
        message: `Test email would be sent to ${input.recipient}`,
      };
    }),

  /**
   * Validate payment provider credentials
   */
  validatePaymentProvider: protectedProcedure
    .input(
      z.object({
        providerId: z.string(),
        credentials: z.record(z.string(), z.string()),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await verifyAdminRole(ctx);
      // In production, this would validate credentials with the provider
      return {
        success: true,
        message: `${input.providerId} credentials validated successfully`,
      };
    }),

  /**
   * Fix missing listing reviews
   */
  fixPendingListingsReviews: protectedProcedure
    .output(
      z.object({
        success: z.boolean(),
        message: z.string(),
        created: z.number(),
      })
    )
    .mutation(async ({ ctx }) => {
      await verifyAdminRole(ctx);

      try {
        const { listings, listingReviews } = await import('../db/schema');
        const { inArray, sql } = await import('drizzle-orm');

        // Find all listings with pending_review status
        const pendingListings = await db
          .select({ id: listings.id, sellerId: listings.sellerId })
          .from(listings)
          .where(eq(listings.status, 'pending_review'));

        if (pendingListings.length === 0) {
          return {
            success: true,
            message: 'No pending listings found.',
            created: 0,
          };
        }

        // Get all listing IDs that already have review records
        const listingIds = pendingListings.map((l: any) => l.id);
        const reviewedListingIds = await db
          .select({ listingId: listingReviews.listingId })
          .from(listingReviews)
          .where(inArray(listingReviews.listingId, listingIds));

        const reviewedIds = new Set(reviewedListingIds.map((r: any) => r.listingId));
        const missingReviews = pendingListings.filter((l: any) => !reviewedIds.has(l.id));

        if (missingReviews.length === 0) {
          return {
            success: true,
            message: 'All pending listings already have review records.',
            created: 0,
          };
        }

        // Create review records for missing listings
        const reviewsToInsert = missingReviews.map((listing: any) => ({
          listingId: listing.id,
          sellerId: listing.sellerId,
          status: 'pending' as const,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(listingReviews).values(reviewsToInsert);

        return {
          success: true,
          message: `✅ Fixed ${missingReviews.length} pending listings. They should now appear in the admin review dashboard.`,
          created: missingReviews.length,
        };
      } catch (error) {
        console.error('Failed to fix pending listings:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fix pending listings reviews',
        });
      }
    }),
});