import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc/trpc';
import { db } from '../db';
import { supportTickets, supportTicketReplies } from '../db/schema';
import { eq } from 'drizzle-orm';

const metricsSchema = z.object({
  totalOpen: z.number(),
  totalInProgress: z.number(),
  totalResolved: z.number(),
  avgResponseTimeMinutes: z.number(),
  avgResolutionTimeMinutes: z.number(),
  timestamp: z.date(),
});

const dashboardSummarySchema = z.object({
  totalTickets: z.number(),
  openTickets: z.number(),
  inProgressTickets: z.number(),
  resolvedTickets: z.number(),
  avgResponseTime: z.number(),
  avgResolutionTime: z.number(),
  recentTickets: z.array(z.any()),
  topCategories: z.array(z.any()),
});

type Metrics = z.infer<typeof metricsSchema>;
type DashboardSummary = z.infer<typeof dashboardSummarySchema>;

async function getMetrics(sellerId: string): Promise<Metrics> {
  const tickets = await db.query.supportTickets.findMany({
    where: eq(supportTickets.sellerId, sellerId),
  });

  if (!tickets?.length) {
    return {
      totalOpen: 0,
      totalInProgress: 0,
      totalResolved: 0,
      avgResponseTimeMinutes: 0,
      avgResolutionTimeMinutes: 0,
      timestamp: new Date(),
    };
  }

  let responseTime = 0;
  let responseCount = 0;
  let resolutionTime = 0;
  let resolutionCount = 0;

  for (const ticket of tickets) {
    if (ticket.createdAt) {
      const reply = await db.query.supportTicketReplies.findFirst({
        where: eq(supportTicketReplies.ticketId, ticket.id),
      });

      if (reply && reply.createdAt) {
        const time = new Date(reply.createdAt as any).getTime() - new Date(ticket.createdAt as any).getTime();
        responseTime += time / (1000 * 60);
        responseCount++;
      }
    }

    if (ticket.resolvedAt) {
      const time = new Date(ticket.resolvedAt as any).getTime() - new Date(ticket.createdAt as any).getTime();
      resolutionTime += time / (1000 * 60);
      resolutionCount++;
    }
  }

  return {
    totalOpen: tickets.filter(t => t.status === 'open').length,
    totalInProgress: tickets.filter(t => t.status === 'in_progress').length,
    totalResolved: tickets.filter(t => t.status === 'resolved').length,
    avgResponseTimeMinutes: responseCount > 0 ? responseTime / responseCount : 0,
    avgResolutionTimeMinutes: resolutionCount > 0 ? resolutionTime / resolutionCount : 0,
    timestamp: new Date(),
  };
}

export const supportSubscriptionsRouter = createTRPCRouter({
  subscribeToMetrics: protectedProcedure
    .input(z.object({ sellerId: z.string().optional() }))
    .output(metricsSchema)
    .query(async ({ ctx, input }): Promise<Metrics> => {
      const sellerId = input?.sellerId || ctx.user?.id;
      if (!sellerId) throw new Error('Seller ID required');
      return getMetrics(sellerId);
    }),

  getDashboardSummary: protectedProcedure
    .input(z.object({}))
    .output(dashboardSummarySchema)
    .query(async ({ ctx }): Promise<DashboardSummary> => {
      const allTickets = await db.query.supportTickets.findMany();
      if (!allTickets?.length) {
        return {
          totalTickets: 0,
          openTickets: 0,
          inProgressTickets: 0,
          resolvedTickets: 0,
          avgResponseTime: 0,
          avgResolutionTime: 0,
          recentTickets: [],
          topCategories: [],
        };
      }

      return {
        totalTickets: allTickets.length,
        openTickets: allTickets.filter(t => t.status === 'open').length,
        inProgressTickets: allTickets.filter(t => t.status === 'in_progress').length,
        resolvedTickets: allTickets.filter(t => t.status === 'resolved').length,
        avgResponseTime: 0,
        avgResolutionTime: 0,
        recentTickets: allTickets.slice(-10),
        topCategories: [],
      };
    }),
});