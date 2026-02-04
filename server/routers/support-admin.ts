import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { 
  supportTickets, 
  supportTicketReplies, 
  supportTeamMembers, 
  slaMetrics,
  slaTracking,
  escalationRules,
  supportAuditLogs,
  supportAnalytics
} from '../db/schema';
import { and, eq, gte, lte, desc, asc, or, sql } from 'drizzle-orm';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { v4 as uuidv4 } from 'uuid';

/**
 * Enterprise Support Admin Router
 * Handles:
 * - Admin dashboard access
 * - Ticket assignment and routing
 * - SLA policy management and tracking
 * - Escalation rules and automation
 * - Team member management
 * - Analytics and metrics
 * - Audit logging
 */

async function ensureAdmin(userId: string, userRole?: string): Promise<boolean> {
  if (!userRole || userRole !== 'admin') {
    throw new TRPCError({
      code: 'FORBIDDEN',
      message: 'Admin access required. Only administrators can access this resource.',
    });
  }
  return true;
}

export const supportAdminRouter = createTRPCRouter({
  // ============ TICKET LISTING ============
  
  getAllTickets: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/support/all-tickets',
        tags: ['Support Admin'],
        summary: 'Get all support tickets (admin only)',
      },
    })
    .output(z.array(z.object({
      id: z.string(),
      buyerId: z.string().nullable(),
      sellerId: z.string().nullable(),
      orderId: z.string().nullable(),
      subject: z.string(),
      description: z.string(),
      category: z.string(),
      status: z.string(),
      priority: z.string(),
      assignedTo: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      resolvedAt: z.date().nullable(),
    })))
    .query(async ({ ctx }) => {
      try {
        const userId = ctx.user?.id;
        if (!userId) {
          throw new TRPCError({ code: 'UNAUTHORIZED', message: 'User not authenticated' });
        }
        
        await ensureAdmin(userId, ctx.user?.role);

        const allTickets = await db.select().from(supportTickets).orderBy(desc(supportTickets.createdAt));
        
        return allTickets.map(t => ({
          id: t.id,
          buyerId: t.buyerId ?? null,
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
      } catch (error) {
        if (error instanceof TRPCError) throw error;
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch tickets',
        });
      }
    }),

  // ============ ADMIN DASHBOARD ============
  
  getDashboardMetrics: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/support/dashboard',
        tags: ['Support Admin'],
        summary: 'Get comprehensive support dashboard metrics',
      },
    })
    .output(z.object({
      totalTickets: z.number(),
      openTickets: z.number(),
      inProgressTickets: z.number(),
      resolvedTickets: z.number(),
      slaBreachCount: z.number(),
      averageResolutionTime: z.number(),
      averageResponseTime: z.number(),
      teamUtilization: z.number().min(0).max(100),
      topCategories: z.array(z.object({
        category: z.string(),
        count: z.number(),
      })),
      urgentTickets: z.array(z.object({
        id: z.string(),
        subject: z.string(),
        priority: z.string(),
        createdAt: z.date(),
      })),
    }))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      // Get all tickets
      const allTickets = await db.select().from(supportTickets);
      
      // Get SLA tracking data
      const slaTrackingData = await db.select().from(slaTracking);
      const breachedCount = slaTrackingData.filter(
        m => m.responseBreached || m.resolutionBreached
      ).length;

      // Get team metrics
      const teamMembers = await db.select().from(supportTeamMembers);
      const activeMembers = teamMembers.filter(m => m.status === 'active').length;
      const totalCapacity = teamMembers.reduce((sum, m) => sum + m.maxCapacity, 0);
      const usedCapacity = teamMembers.reduce((sum, m) => sum + m.currentLoadCount, 0);
      const teamUtilization = totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;

      // Calculate average times
      const resolutionTimes = slaTrackingData
        .filter(m => m.actualResolutionTime)
        .map(m => m.actualResolutionTime || 0);
      const averageResolutionTime = resolutionTimes.length > 0 
        ? Math.round(resolutionTimes.reduce((a, b) => a + b, 0) / resolutionTimes.length)
        : 0;

      const responseTimes = slaTrackingData
        .filter(m => m.actualResponseTime)
        .map(m => m.actualResponseTime || 0);
      const averageResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      // Get urgent tickets
      const urgentTickets = allTickets
        .filter(t => t.priority === 'urgent' && (t.status === 'open' || t.status === 'in_progress'))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map(t => ({
          id: t.id,
          subject: t.subject,
          priority: t.priority,
          createdAt: new Date(t.createdAt),
        }));

      // Get top categories
      const categoryCounts: Record<string, number> = {};
      allTickets.forEach(t => {
        categoryCounts[t.category] = (categoryCounts[t.category] || 0) + 1;
      });
      const topCategories = Object.entries(categoryCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category, count]) => ({ category, count }));

      return {
        totalTickets: allTickets.length,
        openTickets: allTickets.filter(t => t.status === 'open').length,
        inProgressTickets: allTickets.filter(t => t.status === 'in_progress').length,
        resolvedTickets: allTickets.filter(t => t.status === 'resolved').length,
        slaBreachCount: breachedCount,
        averageResolutionTime,
        averageResponseTime,
        teamUtilization: Math.round(teamUtilization),
        topCategories,
        urgentTickets,
      };
    }),

  // ============ TICKET ASSIGNMENT ============

  assignTicket: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/support/tickets/{ticketId}/assign',
        tags: ['Support Admin'],
        summary: 'Assign a ticket to a team member',
      },
    })
    .input(z.object({
      ticketId: z.string().uuid(),
      assignToId: z.string().uuid(),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      // Verify ticket exists
      const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
      }

      // Check if team member exists and has capacity
      const teamMember = await db.select().from(supportTeamMembers).where(eq(supportTeamMembers.id, input.assignToId));
      if (!teamMember[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Team member not found' });
      }

      if (teamMember[0].currentLoadCount >= teamMember[0].maxCapacity) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Team member has reached max capacity' });
      }

      // Update team member capacity
      await db.update(supportTeamMembers)
        .set({ currentLoadCount: teamMember[0].currentLoadCount + 1 })
        .where(eq(supportTeamMembers.id, teamMember[0].id));

      // Assign ticket to team member
      await db.update(supportTickets)
        .set({ assignedTo: input.assignToId, updatedAt: new Date() })
        .where(eq(supportTickets.id, input.ticketId));

      // Log audit
      await db.insert(supportAuditLogs).values({
        ticketId: input.ticketId,
        actionType: 'assigned',
        performedBy: userId,
        performedByRole: 'admin',
        newValue: input.assignToId,
      });

      return { success: true };
    }),

  unassignTicket: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/support/tickets/{ticketId}/unassign',
        tags: ['Support Admin'],
        summary: 'Unassign a ticket from a team member',
      },
    })
    .input(z.object({ ticketId: z.string().uuid() }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      // Get ticket to find assigned member
      const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket[0]) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Ticket not found' });
      }
      
      if (ticket[0].assignedTo) {
        // Decrease team member capacity
        const teamMember = await db.select().from(supportTeamMembers)
          .where(eq(supportTeamMembers.id, ticket[0].assignedTo));
        
        if (teamMember[0]) {
          await db.update(supportTeamMembers)
            .set({ currentLoadCount: Math.max(0, teamMember[0].currentLoadCount - 1) })
            .where(eq(supportTeamMembers.id, teamMember[0].id));
        }

        // Update ticket to remove assignment
        await db.update(supportTickets)
          .set({ assignedTo: null, updatedAt: new Date() })
          .where(eq(supportTickets.id, input.ticketId));
      }

      // Log audit
      await db.insert(supportAuditLogs).values({
        ticketId: input.ticketId,
        actionType: 'unassigned',
        performedBy: userId,
        performedByRole: 'admin',
      });

      return { success: true };
    }),

  // ============ SLA MANAGEMENT ============

  setSLAPolicy: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/support/sla-policies',
        tags: ['Support Admin'],
        summary: 'Create or update SLA policy',
      },
    })
    .input(z.object({
      policyName: z.string(),
      priority: z.enum(['low', 'medium', 'high', 'critical']),
      responseTimeMinutes: z.number().positive(),
      resolutionTimeMinutes: z.number().positive(),
      workingHoursOnly: z.boolean().default(false),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      const existing = await db.select().from(slaMetrics)
        .where(and(
          eq(slaMetrics.policyName, input.policyName),
          eq(slaMetrics.priority, input.priority)
        ));

      if (existing[0]) {
        await db.update(slaMetrics)
          .set({
            responseTimeMinutes: input.responseTimeMinutes,
            resolutionTimeMinutes: input.resolutionTimeMinutes,
            workingHoursOnly: input.workingHoursOnly,
            updatedAt: new Date(),
          })
          .where(eq(slaMetrics.id, existing[0].id));
      } else {
        await db.insert(slaMetrics).values({
          policyName: input.policyName,
          priority: input.priority,
          responseTimeMinutes: input.responseTimeMinutes,
          resolutionTimeMinutes: input.resolutionTimeMinutes,
          workingHoursOnly: input.workingHoursOnly,
        });
      }

      return { success: true };
    }),

  getSLAPolicies: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/support/sla-policies',
        tags: ['Support Admin'],
        summary: 'Get all SLA policies',
      },
    })
    .output(z.array(z.object({
      id: z.string(),
      policyName: z.string(),
      priority: z.string(),
      responseTimeMinutes: z.number(),
      resolutionTimeMinutes: z.number(),
    })))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      const policies = await db.select().from(slaMetrics);
      return policies.map(p => ({
        id: p.id,
        policyName: p.policyName,
        priority: p.priority,
        responseTimeMinutes: p.responseTimeMinutes,
        resolutionTimeMinutes: p.resolutionTimeMinutes,
      }));
    }),

  // ============ ESCALATION RULES ============

  setEscalationRule: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/support/escalation-rules',
        tags: ['Support Admin'],
        summary: 'Create escalation rule',
      },
    })
    .input(z.object({
      name: z.string(),
      trigger: z.string(),
      triggerValue: z.string().optional(),
      action: z.string(),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      await db.insert(escalationRules).values({
        name: input.name,
        trigger: input.trigger,
        triggerValue: input.triggerValue,
        action: input.action,
      });

      return { success: true };
    }),

  getEscalationRules: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/support/escalation-rules',
        tags: ['Support Admin'],
        summary: 'Get all escalation rules',
      },
    })
    .output(z.array(z.object({
      id: z.string(),
      name: z.string(),
      trigger: z.string(),
      action: z.string(),
    })))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      const rules = await db.select().from(escalationRules);
      return rules.map(r => ({
        id: r.id,
        name: r.name,
        trigger: r.trigger,
        action: r.action,
      }));
    }),

  // ============ TEAM MANAGEMENT ============

  addTeamMember: protectedProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/admin/support/team-members',
        tags: ['Support Admin'],
        summary: 'Add support team member',
      },
    })
    .input(z.object({
      userId: z.string().uuid(),
      name: z.string(),
      email: z.string().email(),
      role: z.string(),
      department: z.string().optional(),
      maxCapacity: z.number().positive().default(10),
    }))
    .output(z.object({ success: z.literal(true) }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      const existing = await db.select().from(supportTeamMembers)
        .where(eq(supportTeamMembers.userId, input.userId));

      if (existing[0]) {
        throw new TRPCError({ code: 'CONFLICT', message: 'Team member already exists' });
      }

      await db.insert(supportTeamMembers).values({
        userId: input.userId,
        name: input.name,
        email: input.email,
        role: input.role,
        department: input.department,
        maxCapacity: input.maxCapacity,
        currentLoadCount: 0,
        status: 'active',
      });

      return { success: true };
    }),

  getTeamMembers: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/support/team-members',
        tags: ['Support Admin'],
        summary: 'Get all support team members',
      },
    })
    .output(z.array(z.object({
      id: z.string(),
      userId: z.string(),
      name: z.string(),
      email: z.string(),
      role: z.string(),
      status: z.string(),
      currentLoadCount: z.number(),
      maxCapacity: z.number(),
      responseTimeAverage: z.number().nullable(),
    })))
    .query(async ({ ctx }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      const members = await db.select().from(supportTeamMembers);
      return members.map(m => ({
        id: m.id,
        userId: m.userId,
        name: m.name,
        email: m.email,
        role: m.role,
        status: m.status,
        currentLoadCount: m.currentLoadCount,
        maxCapacity: m.maxCapacity,
        responseTimeAverage: m.responseTimeAverage,
      }));
    }),

  // ============ AUDIT LOGS ============

  getAuditLogs: protectedProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/admin/support/tickets/{ticketId}/audit',
        tags: ['Support Admin'],
        summary: 'Get ticket audit logs',
      },
    })
    .input(z.object({ 
      ticketId: z.string().uuid().optional(),
      limit: z.number().default(50),
      offset: z.number().default(0),
    }))
    .output(z.array(z.object({
      id: z.string(),
      actionType: z.string(),
      oldValue: z.string().nullable(),
      newValue: z.string().nullable(),
      createdAt: z.date(),
    })))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      let query = db.select().from(supportAuditLogs);
      if (input.ticketId) {
        query = query.where(eq(supportAuditLogs.ticketId, input.ticketId)) as any;
      }

      const logs = await query.orderBy(desc(supportAuditLogs.createdAt));

      return logs.map(l => ({
        id: l.id,
        actionType: l.actionType,
        oldValue: l.oldValue,
        newValue: l.newValue,
        createdAt: new Date(l.createdAt),
      }));
    }),

  // ============ TICKET UPDATES ============

  updateTicketStatus: protectedProcedure
    .meta({
      openapi: {
        method: 'PATCH',
        path: '/admin/support/tickets/{ticketId}/status',
        tags: ['Support Admin'],
        summary: 'Update ticket status (admin only)',
      },
    })
    .input(
      z.object({
        ticketId: z.string(),
        status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
      })
    )
    .output(z.object({
      id: z.string(),
      buyerId: z.string().nullable(),
      sellerId: z.string().nullable(),
      orderId: z.string().nullable(),
      subject: z.string(),
      description: z.string(),
      category: z.string(),
      status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
      priority: z.enum(['low', 'medium', 'high', 'urgent']),
      assignedTo: z.string().nullable(),
      createdAt: z.date(),
      updatedAt: z.date(),
      resolvedAt: z.date().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.user?.id;
      if (!userId) throw new TRPCError({ code: 'UNAUTHORIZED', message: 'Not logged in' });
      
      await ensureAdmin(userId, ctx.user?.role);

      const ticket = await db.select().from(supportTickets).where(eq(supportTickets.id, input.ticketId));
      if (!ticket[0]) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Ticket not found',
        });
      }

      const now = new Date();
      const updateData: any = {
        status: input.status,
        updatedAt: now,
      };

      // Set resolvedAt when status changes to resolved
      if (input.status === 'resolved' && ticket[0].status !== 'resolved') {
        updateData.resolvedAt = now;
      }

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
        status: t.status as 'open' | 'in_progress' | 'resolved' | 'closed',
        priority: t.priority as 'low' | 'medium' | 'high' | 'urgent',
        assignedTo: t.assignedTo ?? null,
        createdAt: new Date(t.createdAt),
        updatedAt: new Date(t.updatedAt),
        resolvedAt: t.resolvedAt ? new Date(t.resolvedAt) : null,
      };
    }),
});