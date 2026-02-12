/**
 * FAQ Management Router
 * Handles dynamic FAQ CRUD operations and admin management
 */

import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { db } from '../db';
import { faqs } from '../db/schema';
import { eq, and, desc, asc, type SQL } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';

const FAQ_INPUT = z.object({
  question: z.string().min(10).max(500),
  answer: z.string().min(20).max(5000),
  category: z.string().min(3).max(100),
  userRole: z.enum(['buyer', 'seller', 'admin']),
  order: z.number().int().min(0).optional(),
  tags: z.string().optional(),
});

const FAQ_OUTPUT = z.object({
  id: z.string().uuid(),
  question: z.string(),
  answer: z.string(),
  category: z.string(),
  userRole: z.enum(['buyer', 'seller', 'admin']),
  order: z.number(),
  active: z.boolean(),
  views: z.number(),
  helpful: z.number(),
  notHelpful: z.number(),
  tags: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const faqsRouter = createTRPCRouter({
  /**
   * Get all active FAQs for a specific user role
   * Includes view tracking and helpful/not helpful counts
   */
  getFAQsByRole: publicProcedure
    .input(z.object({
      userRole: z.enum(['buyer', 'seller', 'admin']),
      category: z.string().optional(),
      search: z.string().optional(),
    }))
    .output(z.array(FAQ_OUTPUT))
    .query(async ({ input }) => {
      const conditions = [
        eq(faqs.active, true),
        eq(faqs.userRole, input.userRole),
      ];

      if (input.category) {
        conditions.push(eq(faqs.category, input.category));
      }

      const results = await db
        .select()
        .from(faqs)
        .where(and(...conditions))
        .orderBy(asc(faqs.order), desc(faqs.updatedAt));

      const mapFaq = (faq: typeof results[0]) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        userRole: faq.userRole as 'buyer' | 'seller' | 'admin',
        order: faq.order,
        active: faq.active,
        views: faq.views,
        helpful: faq.helpful,
        notHelpful: faq.notHelpful,
        tags: faq.tags,
        createdAt: new Date(faq.createdAt),
        updatedAt: new Date(faq.updatedAt),
      });

      if (input.search) {
        return results
          .filter((faq: any) =>
            faq.question.toLowerCase().includes(input.search!.toLowerCase()) ||
            faq.answer.toLowerCase().includes(input.search!.toLowerCase())
          )
          .map(mapFaq);
      }

      return results.map(mapFaq);
    }),

  /**
   * Get FAQ categories for a user role
   * Used for filtering/navigation
   */
  getCategories: publicProcedure
    .input(z.object({
      userRole: z.enum(['buyer', 'seller', 'admin']),
    }))
    .output(z.array(z.object({
      category: z.string(),
      count: z.number(),
    })))
    .query(async ({ input }) => {
      const results = await db
        .select({ category: faqs.category })
        .from(faqs)
        .where(and(
          eq(faqs.active, true),
          eq(faqs.userRole, input.userRole)
        ));

      const grouped = results.reduce((acc: any, item: any) => {
        const existing = acc.find((g: any) => g.category === item.category);
        if (existing) {
          existing.count++;
        } else {
          acc.push({ category: item.category, count: 1 });
        }
        return acc;
      }, [] as Array<{ category: string; count: number }>);

      return grouped.sort((a: any, b: any) => b.count - a.count);
    }),

  /**
   * Track FAQ view (increment view count)
   */
  trackView: publicProcedure
    .input(z.object({
      faqId: z.string().uuid(),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input }) => {
      const faq = await db
        .select()
        .from(faqs)
        .where(eq(faqs.id, input.faqId));

      if (!faq[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'FAQ not found' });
      }

      await db
        .update(faqs)
        .set({ views: faq[0].views + 1 })
        .where(eq(faqs.id, input.faqId));

      return { success: true };
    }),

  /**
   * Mark FAQ as helpful/not helpful
   */
  recordFeedback: publicProcedure
    .input(z.object({
      faqId: z.string().uuid(),
      helpful: z.boolean(),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ input }) => {
      const faq = await db
        .select()
        .from(faqs)
        .where(eq(faqs.id, input.faqId));

      if (!faq[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'FAQ not found' });
      }

      const update = input.helpful
        ? { helpful: faq[0].helpful + 1 }
        : { notHelpful: faq[0].notHelpful + 1 };

      await db
        .update(faqs)
        .set(update)
        .where(eq(faqs.id, input.faqId));

      return { success: true };
    }),

  // ============ ADMIN ONLY ============

  /**
   * Get all FAQs (admin)
   */
  getAllFAQs: protectedProcedure
    .input(z.object({
      userRole: z.enum(['buyer', 'seller', 'admin']).optional(),
      includeInactive: z.boolean().default(false),
    }))
    .output(z.array(FAQ_OUTPUT))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      // Check admin role
      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can access this',
        });
      }

      const conditions: SQL<unknown>[] = [];
      if (input.userRole) {
        conditions.push(eq(faqs.userRole, input.userRole));
      }
      if (!input.includeInactive) {
        conditions.push(eq(faqs.active, true));
      }

      const results = await db
        .select()
        .from(faqs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(asc(faqs.order), asc(faqs.userRole));

      return results.map((faq: any) => ({
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        userRole: faq.userRole as 'buyer' | 'seller' | 'admin',
        order: faq.order,
        active: faq.active,
        views: faq.views,
        helpful: faq.helpful,
        notHelpful: faq.notHelpful,
        tags: faq.tags,
        createdAt: new Date(faq.createdAt),
        updatedAt: new Date(faq.updatedAt),
      }));
    }),

  /**
   * Create FAQ (admin)
   */
  createFAQ: protectedProcedure
    .input(FAQ_INPUT)
    .output(FAQ_OUTPUT)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can create FAQs',
        });
      }

      const id = uuidv4();
      const now = new Date();

      const result = await db
        .insert(faqs)
        .values({
          id,
          question: input.question,
          answer: input.answer,
          category: input.category,
          userRole: input.userRole,
          order: input.order || 0,
          tags: input.tags || null,
          createdBy: userId,
          updatedBy: userId,
          createdAt: now,
          updatedAt: now,
        })
        .returning();

      const faq = result[0];
      return {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        userRole: faq.userRole as 'buyer' | 'seller' | 'admin',
        order: faq.order,
        active: faq.active,
        views: faq.views,
        helpful: faq.helpful,
        notHelpful: faq.notHelpful,
        tags: faq.tags,
        createdAt: new Date(faq.createdAt),
        updatedAt: new Date(faq.updatedAt),
      };
    }),

  /**
   * Update FAQ (admin)
   */
  updateFAQ: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      ...FAQ_INPUT.shape,
    }))
    .output(FAQ_OUTPUT)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update FAQs',
        });
      }

      const result = await db
        .update(faqs)
        .set({
          question: input.question,
          answer: input.answer,
          category: input.category,
          userRole: input.userRole,
          order: input.order || 0,
          tags: input.tags || null,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(faqs.id, input.id))
        .returning();

      if (!result[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'FAQ not found' });
      }

      const faq = result[0];
      return {
        id: faq.id,
        question: faq.question,
        answer: faq.answer,
        category: faq.category,
        userRole: faq.userRole as 'buyer' | 'seller' | 'admin',
        order: faq.order,
        active: faq.active,
        views: faq.views,
        helpful: faq.helpful,
        notHelpful: faq.notHelpful,
        tags: faq.tags,
        createdAt: new Date(faq.createdAt),
        updatedAt: new Date(faq.updatedAt),
      };
    }),

  /**
   * Delete FAQ (admin)
   */
  deleteFAQ: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can delete FAQs',
        });
      }

      await db.delete(faqs).where(eq(faqs.id, input.id));

      return { success: true };
    }),

  /**
   * Bulk update FAQ order
   */
  reorderFAQs: protectedProcedure
    .input(z.array(z.object({
      id: z.string().uuid(),
      order: z.number().int().min(0),
    })))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can reorder FAQs',
        });
      }

      await Promise.all(
        input.map((item: any) =>
          db
            .update(faqs)
            .set({ order: item.order, updatedBy: userId, updatedAt: new Date() })
            .where(eq(faqs.id, item.id))
        )
      );

      return { success: true };
    }),

  /**
   * Toggle FAQ active status
   */
  toggleFAQStatus: protectedProcedure
    .input(z.object({
      id: z.string().uuid(),
      active: z.boolean(),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED' });

      if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only admins can update FAQ status',
        });
      }

      await db
        .update(faqs)
        .set({
          active: input.active,
          updatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(faqs.id, input.id));

      return { success: true };
    }),
});