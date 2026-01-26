import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { supportTickets, supportTicketReplies, sellers } from '../db/schema';
import { and, eq, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';

const TicketStatusEnum = z.enum(['open', 'in_progress', 'resolved', 'closed']);
const TicketPriorityEnum = z.enum(['low', 'medium', 'high', 'urgent']);
const TicketCategoryEnum = z.enum([
  'general_inquiry',
  'technical_issue',
  'payment_problem',
  'order_issue',
  'refund_request',
  'account_issue',
  'listing_help',
  'other',
]);

const SupportTicketOutput = z.object({
  id: z.string().uuid(),
  buyerId: z.string().uuid(),
  sellerId: z.string().uuid().nullable(),
  subject: z.string(),
  description: z.string(),
  category: TicketCategoryEnum,
  status: TicketStatusEnum,
  priority: TicketPriorityEnum,
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().nullable(),
});

const TicketReplyOutput = z.object({
  id: z.string().uuid(),
  ticketId: z.string().uuid(),
  senderId: z.string().uuid(),
  senderRole: z.enum(['buyer', 'seller', 'admin']),
  message: z.string(),
  attachmentUrl: z.string().url().nullable(),
  createdAt: z.date(),
});

export const supportRouter = createTRPCRouter({
  createTicket: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/support/tickets',
        tags: ['Support'],
        summary: 'Create a new support ticket',
      },
    })
    .input(
      z.object({
        subject: z.string().min(5),
        description: z.string().min(10),
        category: TicketCategoryEnum,
        priority: TicketPriorityEnum.optional(),
      })
    )
    .output(SupportTicketOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const ticketId = uuidv4();
      const now = new Date();

      const result = await db
        .insert(supportTickets)
        .values({
          id: ticketId,
          buyerId: userId,
          sellerId: null,
          subject: input.subject,
          description: input.description,
          category: input.category,
          status: 'open',
          priority: input.priority || 'medium',
          createdAt: now,
          updatedAt: now,
          resolvedAt: null,
        })
        .returning();

      const ticket = result[0];

      return {
        id: ticket.id,
        buyerId: ticket.buyerId,
        sellerId: ticket.sellerId,
        subject: ticket.subject,
        description: ticket.description,
        category: ticket.category as any,
        status: ticket.status as any,
        priority: ticket.priority as any,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
        resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : null,
      };
    }),

  getTickets: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/support/tickets',
        tags: ['Support'],
        summary: 'Get all support tickets for the current user (buyer or seller)',
      },
    })
    .input(z.object({ status: TicketStatusEnum.optional() }))
    .output(z.array(SupportTicketOutput))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      // Check if user is a seller
      const sellerResult = await db
        .select()
        .from(sellers)
        .where(eq(sellers.userId, userId));
      
      const seller = sellerResult[0];

      // Build conditions based on whether user is a seller or buyer
      const conditions: any[] = seller
        ? [eq(supportTickets.sellerId, seller.id)]
        : [eq(supportTickets.buyerId, userId)];
      
      if (input.status) {
        conditions.push(eq(supportTickets.status, input.status));
      }

      const tickets = await db
        .select()
        .from(supportTickets)
        .where(and(...conditions));

      return tickets.map((t) => ({
        id: t.id,
        buyerId: t.buyerId,
        sellerId: t.sellerId,
        subject: t.subject,
        description: t.description,
        category: t.category as any,
        status: t.status as any,
        priority: t.priority as any,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
      }));
    }),

  getTicket: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/support/tickets/{ticketId}',
        tags: ['Support'],
        summary: 'Get a specific support ticket',
      },
    })
    .input(z.object({ ticketId: z.string().uuid() }))
    .output(SupportTicketOutput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      // Check if user is a seller
      const sellerResult = await db
        .select()
        .from(sellers)
        .where(eq(sellers.userId, userId));
      
      const seller = sellerResult[0];

      // Build query conditions based on whether user is a seller or buyer
      const conditions = seller
        ? and(
            eq(supportTickets.id, input.ticketId),
            eq(supportTickets.sellerId, seller.id)
          )
        : and(
            eq(supportTickets.id, input.ticketId),
            eq(supportTickets.buyerId, userId)
          );

      const ticket = await db
        .select()
        .from(supportTickets)
        .where(conditions);

      if (!ticket[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      const t = ticket[0];
      return {
        id: t.id,
        buyerId: t.buyerId,
        sellerId: t.sellerId,
        subject: t.subject,
        description: t.description,
        category: t.category as any,
        status: t.status as any,
        priority: t.priority as any,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
      };
    }),

  updateTicket: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/support/tickets/{ticketId}',
        tags: ['Support'],
        summary: 'Update a support ticket',
      },
    })
    .input(
      z.object({
        ticketId: z.string().uuid(),
        subject: z.string().min(5).optional(),
        description: z.string().min(10).optional(),
        status: TicketStatusEnum.optional(),
        priority: TicketPriorityEnum.optional(),
        category: TicketCategoryEnum.optional(),
      })
    )
    .output(SupportTicketOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      // Check if user is a seller
      const sellerResult = await db
        .select()
        .from(sellers)
        .where(eq(sellers.userId, userId));
      
      const seller = sellerResult[0];

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not registered as a seller',
        });
      }

      const [existing] = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.id, input.ticketId),
            eq(supportTickets.sellerId, seller.id)
          )
        );

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      const updateData: any = {};
      if (input.subject !== undefined) updateData.subject = input.subject;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.status !== undefined) updateData.status = input.status;
      if (input.priority !== undefined) updateData.priority = input.priority;
      if (input.category !== undefined) updateData.category = input.category;

      if (input.status === 'resolved' && existing.status !== 'resolved') {
        updateData.resolvedAt = new Date();
      }

      updateData.updatedAt = new Date();

      const result = await db
        .update(supportTickets)
        .set(updateData)
        .where(eq(supportTickets.id, input.ticketId))
        .returning();

      const t = result[0];
      return {
        id: t.id,
        buyerId: t.buyerId,
        sellerId: t.sellerId,
        subject: t.subject,
        description: t.description,
        category: t.category as any,
        status: t.status as any,
        priority: t.priority as any,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
      };
    }),

  deleteTicket: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/support/tickets/{ticketId}',
        tags: ['Support'],
        summary: 'Delete a support ticket',
      },
    })
    .input(z.object({ ticketId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const sellerResult = await db
        .select()
        .from(sellers)
        .where(eq(sellers.userId, userId));
      
      const seller = sellerResult[0];

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not registered as a seller',
        });
      }

      const [existing] = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.id, input.ticketId),
            eq(supportTickets.sellerId, seller.id)
          )
        );

      if (!existing) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      await db.delete(supportTickets).where(eq(supportTickets.id, input.ticketId));

      return { success: true };
    }),

  closeTicket: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/support/tickets/{ticketId}/close',
        tags: ['Support'],
        summary: 'Close a support ticket',
      },
    })
    .input(z.object({ ticketId: z.string().uuid() }))
    .output(SupportTicketOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const sellerResult = await db
        .select()
        .from(sellers)
        .where(eq(sellers.userId, userId));
      
      const seller = sellerResult[0];

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not registered as a seller',
        });
      }

      const ticket = await db
        .select()
        .from(supportTickets)
        .where(
          and(
            eq(supportTickets.id, input.ticketId),
            eq(supportTickets.sellerId, seller.id)
          )
        );

      if (!ticket[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      const now = new Date();
      const result = await db
        .update(supportTickets)
        .set({
          status: 'closed',
          updatedAt: now,
          resolvedAt: now,
        })
        .where(eq(supportTickets.id, input.ticketId))
        .returning();

      const t = result[0];
      return {
        id: t.id,
        buyerId: t.buyerId,
        sellerId: t.sellerId,
        subject: t.subject,
        description: t.description,
        category: t.category as any,
        status: t.status as any,
        priority: t.priority as any,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
      };
    }),

  replyToTicket: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/support/tickets/{ticketId}/replies',
        tags: ['Support'],
        summary: 'Add a reply to a support ticket',
      },
    })
    .input(
      z.object({
        ticketId: z.string().uuid(),
        message: z.string().min(1),
        attachmentUrl: z.string().url().optional(),
      })
    )
    .output(TicketReplyOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const ticket = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.id, input.ticketId));

      if (!ticket[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      let senderRole: 'buyer' | 'seller' | 'admin' = 'buyer';
      const seller = await db
        .select()
        .from(sellers)
        .where(eq(sellers.userId, userId));

      if (seller[0]) {
        senderRole = 'seller';
      }

      const replyId = uuidv4();
      const now = new Date();

      const result = await db
        .insert(supportTicketReplies)
        .values({
          id: replyId,
          ticketId: input.ticketId,
          senderId: userId,
          senderRole: senderRole,
          message: input.message,
          attachmentUrl: input.attachmentUrl || null,
          createdAt: now,
        })
        .returning();

      const reply = result[0];

      await db
        .update(supportTickets)
        .set({ updatedAt: now })
        .where(eq(supportTickets.id, input.ticketId));

      return {
        id: reply.id,
        ticketId: reply.ticketId,
        senderId: reply.senderId,
        senderRole: reply.senderRole as any,
        message: reply.message,
        attachmentUrl: reply.attachmentUrl,
        createdAt: new Date(reply.createdAt),
      };
    }),

  getTicketReplies: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/support/tickets/{ticketId}/replies',
        tags: ['Support'],
        summary: 'Get all replies for a support ticket',
      },
    })
    .input(z.object({ ticketId: z.string().uuid() }))
    .output(z.array(TicketReplyOutput))
    .query(async ({ ctx, input }) => {
      const replies = await db
        .select()
        .from(supportTicketReplies)
        .where(eq(supportTicketReplies.ticketId, input.ticketId))
        .orderBy(desc(supportTicketReplies.createdAt));

      return replies.map((r) => ({
        id: r.id,
        ticketId: r.ticketId,
        senderId: r.senderId,
        senderRole: r.senderRole as any,
        message: r.message,
        attachmentUrl: r.attachmentUrl,
        createdAt: new Date(r.createdAt),
      }));
    }),

  deleteReply: protectedProcedure
    .meta({
      openapi: {
        method: 'DELETE',
        path: '/support/tickets/replies/{replyId}',
        tags: ['Support'],
        summary: 'Delete a ticket reply (soft delete)',
      },
    })
    .input(z.object({ replyId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const reply = await db
        .select()
        .from(supportTicketReplies)
        .where(eq(supportTicketReplies.id, input.replyId));

      if (!reply[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reply not found',
        });
      }

      if (reply[0].senderId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this reply',
        });
      }

      await db
        .update(supportTicketReplies)
        .set({
          message: '[Deleted by user]',
        })
        .where(eq(supportTicketReplies.id, input.replyId));

      return { success: true };
    }),

  getTicketsStats: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/support/stats',
        tags: ['Support'],
        summary: 'Get support tickets statistics',
      },
    })
    .output(
      z.object({
        total: z.number(),
        open: z.number(),
        inProgress: z.number(),
        resolved: z.number(),
        closed: z.number(),
        urgent: z.number(),
      })
    )
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const sellerResult = await db
        .select()
        .from(sellers)
        .where(eq(sellers.userId, userId));
      
      const seller = sellerResult[0];

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You are not registered as a seller',
        });
      }

      const allTickets = await db
        .select()
        .from(supportTickets)
        .where(
          or(
            eq(supportTickets.sellerId, seller.id),
            eq(supportTickets.assignedTo, seller.id)
          )
        );

      return {
        total: allTickets.length,
        open: allTickets.filter((t) => t.status === 'open').length,
        inProgress: allTickets.filter((t) => t.status === 'in_progress').length,
        resolved: allTickets.filter((t) => t.status === 'resolved').length,
        closed: allTickets.filter((t) => t.status === 'closed').length,
        urgent: allTickets.filter((t) => t.priority === 'urgent').length,
      };
    }),
});