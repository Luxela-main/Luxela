import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { supportTickets, supportTicketReplies, sellers, notifications, users, buyers, buyerNotifications, sellerNotifications } from '../db/schema';
import { and, eq, or, desc } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';
import { sendSupportTicketEmail } from '../services/emailService';
import {
  notifyTicketReplied,
  notifyTicketStatusChanged,
} from '../services/buyerNotificationService';
import { createSellerNotification } from '../services/notificationManager';

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
  buyerId: z.string().nullable(),
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

        // Create notification for buyer
        try {
          await db.insert(buyerNotifications).values({
            id: uuidv4(),
            buyerId: buyerId,
            type: 'ticket_created' as any,
            title: 'Support Ticket Created',
            message: `Your support ticket "${input.subject}" has been created and is awaiting response.`,
            relatedEntityId: ticket.id,
            relatedEntityType: 'ticket',
            actionUrl: `/buyer/dashboard/support-tickets/${ticket.id}`,
            isRead: false,
            metadata: {
              notificationType: 'ticket_created',
              ticketId: ticket.id,
              ticketSubject: input.subject,
              category: input.category,
            },
            createdAt: now,
            updatedAt: now,
          });
        } catch (notifErr) {
          console.error('Failed to create ticket notification:', notifErr);
        }

        // Create admin notification for new support ticket
        try {
          const adminUsers = await db.select().from(users).where(eq(users.role, 'admin'));
          
          for (const admin of adminUsers) {
            await createSellerNotification({
              sellerId: 'admin-' + admin.id,
              type: 'ticket_created',
              title: 'New Support Ticket',
              message: `New support ticket: "${input.subject}" (${input.priority || 'medium'} priority)`,
              severity: (input.priority || 'medium') === 'urgent' ? 'critical' : (input.priority || 'medium') === 'high' ? 'warning' : 'info',
              relatedEntityId: ticket.id,
              relatedEntityType: 'ticket',
              actionUrl: `/admin/support-tickets/${ticket.id}`,
              metadata: {
                notificationType: 'ticket_created',
                ticketId: ticket.id,
                ticketSubject: input.subject,
                category: input.category,
                priority: input.priority || 'medium',
              },
            });
          }
        } catch (adminNotifErr) {
          console.error('[Support] Failed to create admin ticket notification:', adminNotifErr);
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

  createSellerTicket: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/support/tickets/seller',
        tags: ['Support'],
        summary: 'Create a new support ticket (sellers only)',
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

      try {
        const sellerResult = await db.select().from(sellers).where(eq(sellers.userId, userId));
        const seller = sellerResult[0];
        if (!seller) {
          throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Only sellers can create support tickets',
          });
        }

        const ticketId = uuidv4();
        const now = new Date();

        const result = await db
          .insert(supportTickets)
          .values({
            id: ticketId,
            buyerId: null,
            sellerId: seller.id,
            subject: input.subject,
            description: input.description,
            category: input.category,
            status: 'open',
            priority: input.priority || 'medium',
            createdAt: now,
            updatedAt: now,
          })
          .returning();

        const ticket = result[0];
        if (!ticket) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create ticket',
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
        console.error('[Support] createSellerTicket error:', error);
        if (error instanceof TRPCError) throw error;
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
        summary: 'Get support tickets (buyers see own, sellers see assigned and created)',
      },
    })
    .input(z.object({ status: TicketStatusEnum.nullish() }))
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
        // Sellers see both assigned tickets and tickets they created
        whereClause = or(
          eq(supportTickets.assignedTo, seller.id),
          eq(supportTickets.sellerId, seller.id)
        );
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

      return tickets.map((t: typeof tickets[number]) => ({
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
      let buyerResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
      let buyer = buyerResult[0];

      // If buyer doesn't exist, try to create one
      if (!buyer && !seller) {
        try {
          const newBuyerId = uuidv4();
          await db.insert(buyers).values({
            id: newBuyerId,
            userId: userId,
          });
          buyer = {
            id: newBuyerId,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        } catch (error) {
          // If creation fails (e.g., already exists), try to fetch again
          const retryResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
          buyer = retryResult[0];
        }
      }

      // Check if user is an admin
      const adminResult = await db.select().from(users).where(eq(users.id, userId));
      const isAdmin = adminResult[0]?.role === 'admin';
      
      let conditions;
      if (isAdmin) {
        // Admin can view any ticket
        conditions = eq(supportTickets.id, input.ticketId);
      } else if (seller) {
        conditions = and(
          eq(supportTickets.id, input.ticketId),
          or(
            eq(supportTickets.assignedTo, seller.id),
            eq(supportTickets.sellerId, seller.id)
          )
        );
      } else if (buyer) {
        conditions = and(
          eq(supportTickets.id, input.ticketId),
          eq(supportTickets.buyerId, buyer.id)
        );
      } else {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to view this ticket',
        });
      }
      

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
        summary: 'Update ticket (creator only)',
      },
    })
    .input(
      z.object({
        ticketId: z.string(),
        subject: z.string().min(5).optional(),
        description: z.string().min(10).optional(),
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

      // Get buyer to compare IDs properly
      const buyerResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
      const buyer = buyerResult[0];
      const isBuyer = buyer && ticket[0].buyerId === buyer.id;
      // Only allow editing if ticket is open or in_progress
      if (ticket[0].status !== 'open' && ticket[0].status !== 'in_progress') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This ticket cannot be edited. Only open or in-progress tickets can be edited.',
        });
      }

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

      // Get buyer to compare IDs properly
      const buyerResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
      const buyer = buyerResult[0];
      const isBuyer = buyer && ticket[0].buyerId === buyer.id;

      if (!isBuyer) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Only the ticket creator can delete it',
        });
      }

      // Only allow deleting if ticket is open or in_progress
      if (ticket[0].status !== 'open' && ticket[0].status !== 'in_progress') {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'This ticket cannot be deleted. Only open or in-progress tickets can be deleted.',
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

      // Get buyer to compare IDs properly
      const buyerResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
      const buyer = buyerResult[0];
      const isBuyer = buyer && ticket[0].buyerId === buyer.id;
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

      // Notify assigned seller if ticket is closed
      if (ticket[0].assignedTo) {
        try {
          await createSellerNotification({
            sellerId: ticket[0].assignedTo,
            type: 'ticket_status_changed',
            title: 'Ticket Closed',
            message: `Support ticket "${ticket[0].subject}" has been closed.`,
            severity: 'info',
            relatedEntityId: input.ticketId,
            relatedEntityType: 'ticket',
            actionUrl: `/sellers/support-tickets/${input.ticketId}`,
            metadata: {
              notificationType: 'ticket_status_changed',
              ticketId: input.ticketId,
              oldStatus: ticket[0].status,
              newStatus: 'closed',
              ticketSubject: ticket[0].subject,
            },
          });
        } catch (err) {
          console.error('[Support] Failed to notify seller of ticket closure:', err);
        }
      }

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

      const isAdmin = ctx.user?.role === 'admin' || ctx.user?.admin === true;
      
      // Get buyer if exists
      let buyerResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
      let buyer = buyerResult[0];
      
      // If buyer doesn't exist, try to create one
      if (!buyer) {
        try {
          const newBuyerId = uuidv4();
          await db.insert(buyers).values({
            id: newBuyerId,
            userId: userId,
          });
          buyer = {
            id: newBuyerId,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        } catch (error) {
          // If creation fails (e.g., already exists), try to fetch again
          const retryResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
          buyer = retryResult[0];
        }
      }
      
      const isBuyer = buyer && ticket[0].buyerId === buyer.id;
      const sellerResult = await db.select().from(sellers).where(eq(sellers.userId, userId));
      const seller = sellerResult[0];
      const isAssignedSeller = seller && ticket[0].assignedTo === seller.id;
      const isTicketCreator = seller && ticket[0].sellerId === seller.id;

      if (!isAdmin && !isBuyer && !isAssignedSeller && !isTicketCreator) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not authorized to reply to this ticket',
        });
      }

      let senderRole: 'buyer' | 'seller' | 'admin';
      if (isAdmin) {
        senderRole = 'admin';
      } else if (isBuyer) {
        senderRole = 'buyer';
      } else if (isAssignedSeller || isTicketCreator) {
        senderRole = 'seller';
      } else {
        // This should never happen due to the check above
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Unable to determine sender role',
        });
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

      await db.update(supportTickets).set({ updatedAt: now }).where(eq(supportTickets.id, input.ticketId));

      // Notify buyer if seller/admin replied
      if ((senderRole === 'seller' || senderRole === 'admin') && ticket[0].buyerId) {
        try {
          await notifyTicketReplied(
            ticket[0].buyerId,
            input.ticketId,
            ticket[0].subject,
            input.message
          );
        } catch (notifErr) {
          console.error('[Support] Failed to notify buyer of ticket reply:', notifErr);
        }
      }

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
            
            // Create in-app notification for seller
            try {
              await db.insert(sellerNotifications).values({
                id: uuidv4(),
                sellerId: assignedSeller[0].id,
                type: 'ticket_reply' as any,
                title: 'Support Ticket Reply',
                message: `Customer replied to your ticket: "${ticket[0].subject}"`,
                severity: 'info' as any,
                relatedEntityId: input.ticketId,
                relatedEntityType: 'ticket',
                actionUrl: `/sellers/support-tickets/${input.ticketId}`,
                isRead: false,
                metadata: {
                  notificationType: 'ticket_reply',
                  ticketId: input.ticketId,
                  replyId: replyId,
                  senderRole: 'buyer',
                },
                createdAt: now,
                updatedAt: now,
              });
            } catch (notifErr) {
              console.error('Failed to create seller notification:', notifErr);
            }
          }
        }
      } else if (isAssignedSeller && ticket[0].buyerId) {
        const buyer = await db.select().from(buyers).where(eq(buyers.id, ticket[0].buyerId));
        if (buyer[0]) {
          const buyerUser = await db.select().from(users).where(eq(users.id, buyer[0].userId));
          if (buyerUser[0]) {
            // Send email notification
            await sendSupportTicketEmail({
              type: 'ticket_reply',
              recipientEmail: buyerUser[0].email,
              ticketId: input.ticketId,
              ticketSubject: ticket[0].subject,
              replyMessage: input.message,
              senderName: 'Support Agent',
            }).catch(err => console.error('Email notification failed:', err));
          }
          
          // Create in-app notification for buyer
          try {
            await db.insert(buyerNotifications).values({
              id: uuidv4(),
              buyerId: buyer[0].id,
              type: 'ticket_reply' as any,
              title: 'Support Ticket Reply',
              message: `Brand Contact replied to your ticket: "${ticket[0].subject}"`,
              relatedEntityId: input.ticketId,
              relatedEntityType: 'ticket',
              actionUrl: `/buyer/dashboard/support-tickets/${input.ticketId}`,
              isRead: false,
              metadata: {
                notificationType: 'ticket_reply',
                ticketId: input.ticketId,
                replyId: replyId,
                senderRole: 'seller',
              },
              createdAt: now,
              updatedAt: now,
            });
          } catch (notifErr) {
            console.error('Failed to create buyer notification:', notifErr);
          }
        }
      } else if (isAdmin && ticket[0].buyerId) {
        // Admin reply - send email to the buyer
        const buyer = await db.select().from(buyers).where(eq(buyers.id, ticket[0].buyerId));
        if (buyer[0]) {
          const buyerUser = await db.select().from(users).where(eq(users.id, buyer[0].userId));
          if (buyerUser[0]) {
            // Send email notification
            await sendSupportTicketEmail({
              type: 'ticket_reply',
              recipientEmail: buyerUser[0].email,
              ticketId: input.ticketId,
              ticketSubject: ticket[0].subject,
              replyMessage: input.message,
              senderName: 'Admin Support',
            }).catch(err => console.error('Email notification failed:', err));
          }
          
          // Create in-app notification for buyer
          try {
            await db.insert(buyerNotifications).values({
              id: uuidv4(),
              buyerId: buyer[0].id,
              type: 'ticket_reply' as any,
              title: 'Admin Support Reply',
              message: `Admin replied to your ticket: "${ticket[0].subject}"`,
              relatedEntityId: input.ticketId,
              relatedEntityType: 'ticket',
              actionUrl: `/buyer/dashboard/support-tickets/${input.ticketId}`,
              isRead: false,
              metadata: {
                notificationType: 'ticket_reply',
                ticketId: input.ticketId,
                replyId: replyId,
                senderRole: 'admin',
              },
              createdAt: now,
              updatedAt: now,
            });
          } catch (notifErr) {
            console.error('Failed to create buyer notification:', notifErr);
          }
        }

        // Notify assigned seller if admin replied to a ticket
        if (ticket[0].assignedTo) {
          try {
            await createSellerNotification({
              sellerId: ticket[0].assignedTo,
              type: 'ticket_reply',
              title: 'Admin Reply on Ticket',
              message: `Admin replied to ticket: "${ticket[0].subject}"`,
              severity: 'info',
              relatedEntityId: input.ticketId,
              relatedEntityType: 'ticket',
              actionUrl: `/sellers/support-tickets/${input.ticketId}`,
              metadata: {
                notificationType: 'ticket_reply',
                ticketId: input.ticketId,
                replyId: replyId,
                senderRole: 'admin',
              },
            });
          } catch (err) {
            console.error('[Support] Failed to notify seller of admin reply:', err);
          }
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

      // Check if user is the buyer - buyerId is from buyers table
      let buyerResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
      let buyer = buyerResult[0];
      
      // If buyer doesn't exist, try to create one
      if (!buyer) {
        try {
          const newBuyerId = uuidv4();
          await db.insert(buyers).values({
            id: newBuyerId,
            userId: userId,
          });
          buyer = {
            id: newBuyerId,
            userId: userId,
            createdAt: new Date(),
            updatedAt: new Date(),
          } as any;
        } catch (error) {
          // If creation fails (e.g., already exists), try to fetch again
          const retryResult = await db.select().from(buyers).where(eq(buyers.userId, userId));
          buyer = retryResult[0];
        }
      }
      
      // Check if user created the ticket (as buyer)
      const isBuyer = (buyer && ticket[0].buyerId === buyer.id) || ticket[0].buyerId === userId;
      
      const sellerResult = await db.select().from(sellers).where(eq(sellers.userId, userId));
      const seller = sellerResult[0];
      const isAssignedSeller = seller && ticket[0].assignedTo === seller.id;
      
      // Check if user is an admin
      const adminResult = await db.select().from(users).where(eq(users.id, userId));
      const isAdmin = adminResult[0]?.role === 'admin';

      if (!isBuyer && !isAssignedSeller && !isAdmin) {
        console.error('[Support] getTicketReplies access denied', {
          userId,
          ticketId: input.ticketId,
          ticketBuyerId: ticket[0].buyerId,
          buyerId: buyer?.id,
          isBuyer,
          isAssignedSeller,
          isAdmin,
        });
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

      return replies.map((r: typeof replies[number]) => ({
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
        open: allTickets.filter((t: typeof allTickets[number]) => t.status === 'open').length,
        inProgress: allTickets.filter((t: typeof allTickets[number]) => t.status === 'in_progress').length,
        resolved: allTickets.filter((t: typeof allTickets[number]) => t.status === 'resolved').length,
        closed: allTickets.filter((t: typeof allTickets[number]) => t.status === 'closed').length,
        urgent: allTickets.filter((t: typeof allTickets[number]) => t.priority === 'urgent').length,
      };
    }),
});