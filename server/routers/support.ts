import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { supportTickets, supportTicketReplies, sellers, notifications, users, buyers } from '../db/schema';
import { and, eq, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';
import { sendSupportTicketEmail } from '../services/emailService';

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
  id: z.string(),
  buyerId: z.string(),
  sellerId: z.string().nullable(),
  orderId: z.string().nullable(),
  subject: z.string(),
  description: z.string(),
  category: z.string(),
  status: TicketStatusEnum,
  priority: TicketPriorityEnum,
  assignedTo: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date(),
  resolvedAt: z.date().nullable(),
});

const TicketReplyOutput = z.object({
  id: z.string(),
  ticketId: z.string(),
  senderId: z.string(),
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
        summary: 'Create a new support ticket (buyers only)',
      },
    })
    .input(
      z.object({
        subject: z.string().min(5),
        description: z.string().min(10),
        category: TicketCategoryEnum,
        priority: TicketPriorityEnum.optional(),
        orderId: z.string().optional(),
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

      try {
        // Ensure buyer record exists
        const existingBuyer = await db
          .select()
          .from(buyers)
          .where(eq(buyers.userId, userId));

        let buyerId = existingBuyer[0]?.id;

        if (!buyerId) {
          // Auto-create buyer record if missing
          const newBuyerId = uuidv4();
          await db.insert(buyers).values({
            id: newBuyerId,
            userId: userId,
          });
          buyerId = newBuyerId;
        }

        const ticketId = uuidv4();
        const now = new Date();

        const result = await db
          .insert(supportTickets)
          .values({
            id: ticketId,
            buyerId: buyerId,
            sellerId: null,
            subject: input.subject,
            description: input.description,
            category: input.category,
            status: 'open',
            priority: input.priority || 'medium',
            createdAt: now,
            updatedAt: now,
            ...(input.orderId ? { orderId: input.orderId } : {}),
          })
          .returning();

        const ticket = result[0];

        if (!ticket) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create ticket - no result returned',
          });
        }

        return {
          id: ticket.id,
          buyerId: ticket.buyerId,
          sellerId: ticket.sellerId ?? null,
          orderId: ticket.orderId ?? null,
          subject: ticket.subject,
          description: ticket.description,
          category: ticket.category,
          status: ticket.status,
          priority: ticket.priority,
          assignedTo: ticket.assignedTo ?? null,
          createdAt: new Date(ticket.createdAt),
          updatedAt: new Date(ticket.updatedAt),
          resolvedAt: ticket.resolvedAt ? new Date(ticket.resolvedAt) : null,
        };
      } catch (error) {
        console.error('[Support] createTicket error:', error);
        if (error instanceof TRPCError) {
          throw error;
        }
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error instanceof Error ? error.message : 'Failed to create support ticket',
        });
      }
    }),

  getTickets: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/support/tickets',
        tags: ['Support'],
        summary: 'Get support tickets (buyers see own, sellers see assigned)',
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

      const sellerResult = await db.select().from(sellers).where(eq(sellers.userId, userId));
      const seller = sellerResult[0];

      let whereClause: any;
      if (seller) {
        whereClause = eq(supportTickets.assignedTo, seller.id);
      } else {
        // Get buyer ID associated with this user
        const buyerResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
        const buyer = buyerResult[0];
        if (!buyer) {
          // User is not a buyer, return empty
          return [];
        }
        whereClause = eq(supportTickets.buyerId, buyer.id);
      }

      if (input.status) {
        whereClause = and(whereClause, eq(supportTickets.status, input.status));
      }

      const tickets = await db
        .select()
        .from(supportTickets)
        .where(whereClause)
        .orderBy(desc(supportTickets.createdAt));

      return tickets.map((t) => ({
        id: t.id,
        buyerId: t.buyerId,
        sellerId: t.sellerId ?? null,
        orderId: t.orderId ?? null,
        subject: t.subject,
        description: t.description,
        category: t.category,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assignedTo ?? null,
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
    .input(z.object({ ticketId: z.string() }))
    .output(SupportTicketOutput)
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const sellerResult = await db.select().from(sellers).where(eq(sellers.userId, userId));
      const seller = sellerResult[0];

      const conditions = seller
        ? and(eq(supportTickets.id, input.ticketId), eq(supportTickets.assignedTo, seller.id))
        : and(eq(supportTickets.id, input.ticketId), eq(supportTickets.buyerId, userId));

      const ticket = await db.select().from(supportTickets).where(conditions);

      if (!ticket[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found or access denied',
        });
      }

      const t = ticket[0];
      return {
        id: t.id,
        buyerId: t.buyerId,
        sellerId: t.sellerId ?? null,
        orderId: t.orderId ?? null,
        subject: t.subject,
        description: t.description,
        category: t.category,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assignedTo ?? null,
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
        summary: 'Update ticket (admin via support-admin router)',
      },
    })
    .input(
      z.object({
        ticketId: z.string(),
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

      const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket[0])
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });

      const isBuyer = ticket[0].buyerId === userId;
      if (!isBuyer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the ticket creator can modify it',
        });
      }

      const updateData: any = {};
      if (input.subject !== undefined) updateData.subject = input.subject;
      if (input.description !== undefined) updateData.description = input.description;
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
        sellerId: t.sellerId ?? null,
        orderId: t.orderId ?? null,
        subject: t.subject,
        description: t.description,
        category: t.category,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assignedTo ?? null,
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
        summary: 'Delete a support ticket (creator only)',
      },
    })
    .input(z.object({ ticketId: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket[0])
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });

      if (ticket[0].buyerId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the ticket creator can delete it',
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
        summary: 'Close a support ticket (creator or assigned seller)',
      },
    })
    .input(z.object({ ticketId: z.string() }))
    .output(SupportTicketOutput)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket[0])
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });

      const isBuyer = ticket[0].buyerId === userId;
      const sellerResult = await db.select().from(sellers).where(eq(sellers.userId, userId));
      const seller = sellerResult[0];
      const isAssignedSeller = seller && ticket[0].assignedTo === seller.id;

      if (!isBuyer && !isAssignedSeller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to close this ticket',
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
        sellerId: t.sellerId ?? null,
        orderId: t.orderId ?? null,
        subject: t.subject,
        description: t.description,
        category: t.category,
        status: t.status,
        priority: t.priority,
        assignedTo: t.assignedTo ?? null,
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
        ticketId: z.string(),
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

      const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket[0])
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });

      const isBuyer = ticket[0].buyerId === userId;
      const sellerResult = await db.select().from(sellers).where(eq(sellers.userId, userId));
      const seller = sellerResult[0];
      const isAssignedSeller = seller && ticket[0].assignedTo === seller.id;

      if (!isBuyer && !isAssignedSeller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to reply to this ticket',
        });
      }

      let senderRole: 'buyer' | 'seller' | 'admin' = isBuyer ? 'buyer' : 'seller';

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

      await db.update(supportTickets).set({ updatedAt: now }).where(eq(supportTickets.id, input.ticketId));

      if (isBuyer && ticket[0].assignedTo) {
        const assignedSeller = await db.select().from(sellers).where(eq(sellers.id, ticket[0].assignedTo));
        if (assignedSeller[0]) {
          const sellerUser = await db.select().from(users).where(eq(users.id, assignedSeller[0].userId));
          if (sellerUser[0]) {
            await sendSupportTicketEmail({
              type: 'ticket_reply',
              recipientEmail: sellerUser[0].email,
              ticketId: input.ticketId,
              ticketSubject: ticket[0].subject,
              replyMessage: input.message,
              senderName: 'Customer',
            }).catch(err => console.error('Email notification failed:', err));
          }
        }
      } else if (isAssignedSeller) {
        const buyerUser = await db.select().from(users).where(eq(users.id, ticket[0].buyerId));
        if (buyerUser[0]) {
          await sendSupportTicketEmail({
            type: 'ticket_reply',
            recipientEmail: buyerUser[0].email,
            ticketId: input.ticketId,
            ticketSubject: ticket[0].subject,
            replyMessage: input.message,
            senderName: 'Support Agent',
          }).catch(err => console.error('Email notification failed:', err));
        }
      }

      return {
        id: reply.id,
        ticketId: reply.ticketId,
        senderId: reply.senderId,
        senderRole: reply.senderRole,
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
    .input(z.object({ ticketId: z.string() }))
    .output(z.array(TicketReplyOutput))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket[0])
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });

      const isBuyer = ticket[0].buyerId === userId;
      const sellerResult = await db.select().from(sellers).where(eq(sellers.userId, userId));
      const seller = sellerResult[0];
      const isAssignedSeller = seller && ticket[0].assignedTo === seller.id;

      if (!isBuyer && !isAssignedSeller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to view this ticket',
        });
      }

      const replies = await db
        .select()
        .from(supportTicketReplies)
        .where(eq(supportTicketReplies.ticketId, input.ticketId))
        .orderBy(desc(supportTicketReplies.createdAt));

      return replies.map((r) => ({
        id: r.id,
        ticketId: r.ticketId,
        senderId: r.senderId,
        senderRole: r.senderRole,
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
    .input(z.object({ replyId: z.string() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId)
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'User not logged in',
        });

      const reply = await db.select().from(supportTicketReplies).where(eq(supportTicketReplies.id, input.replyId));
      if (!reply[0])
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Reply not found',
        });

      if (reply[0].senderId !== userId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to delete this reply',
        });
      }

      await db.update(supportTicketReplies).set({ message: '[Deleted by user]' }).where(eq(supportTicketReplies.id, input.replyId));

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

      const sellerResult = await db.select().from(sellers).where(eq(sellers.userId, userId));
      const seller = sellerResult[0];

      if (!seller) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not a seller account',
        });
      }

      const allTickets = await db
        .select()
        .from(supportTickets)
        .where(eq(supportTickets.assignedTo, seller.id));

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