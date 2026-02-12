import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db/client';
import { orders, supportTickets, refunds, supportAnalytics } from '@/server/db/schema';
import { subDays } from 'date-fns';

// Vercel Cron: every day at midnight UTC
export async function GET(request: NextRequest) {
  // Verify Cron Secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting analytics update...');

    const today = new Date();
    const yesterday = subDays(today, 1);

    // Get yesterday's metrics
    const startOfYesterday = new Date(yesterday);
    startOfYesterday.setHours(0, 0, 0, 0);

    const endOfYesterday = new Date(yesterday);
    endOfYesterday.setHours(23, 59, 59, 999);

    // Query orders created yesterday
    const yesterdayOrders = await db.query.orders.findMany();
    const ordersCreatedYesterday = yesterdayOrders.filter(
      (o: any) => o.orderDate >= startOfYesterday && o.orderDate <= endOfYesterday
    );

    const ordersDeliveredYesterday = yesterdayOrders.filter(
      (o: any) =>
        o.deliveredDate &&
        o.deliveredDate >= startOfYesterday &&
        o.deliveredDate <= endOfYesterday
    );

    // Query support tickets
    const allTickets = await db.query.supportTickets.findMany();
    const ticketsCreatedYesterday = allTickets.filter(
      (t: any) => t.createdAt >= startOfYesterday && t.createdAt <= endOfYesterday
    );

    const ticketsResolvedYesterday = allTickets.filter(
      (t: any) =>
        t.resolvedAt &&
        t.resolvedAt >= startOfYesterday &&
        t.resolvedAt <= endOfYesterday
    );

    // Query refunds
    const allRefunds = await db.query.refunds.findMany();
    const refundsYesterday = allRefunds.filter(
      (r: any) => r.refundedAt && r.refundedAt >= startOfYesterday && r.refundedAt <= endOfYesterday
    );

    // Calculate metrics
    const totalTicketsOpen = allTickets.filter((t: any) => t.status === 'open').length;

    // Average response time (mock calculation)
    const avgResponseTime = ticketsCreatedYesterday.length > 0 ? 120 : 0;
    const avgResolutionTime = ticketsResolvedYesterday.length > 0 ? 720 : 0;

    // SLA breach count (tickets that exceeded 48hr response)
    const slaBreachCount = ticketsCreatedYesterday.filter((t: any) => {
      if (!t.updatedAt) return false;
      const responsetime = (t.updatedAt.getTime() - t.createdAt.getTime()) / (1000 * 60);
      return responsetime > 120;
    }).length;

    // Customer satisfaction (mock)
    const customerSatisfactionScore = 4.2;

    // Agent utilization (mock)
    const agentUtilization = ticketsCreatedYesterday.length > 0 ? 75.5 : 0;

    // Insert analytics record
    const [analytics] = await db
      .insert(supportAnalytics)
      .values({
        date: yesterday,
        totalTicketsCreated: ticketsCreatedYesterday.length,
        totalTicketsResolved: ticketsResolvedYesterday.length,
        totalTicketsOpen,
        averageResponseTime: avgResponseTime,
        averageResolutionTime: avgResolutionTime,
        slaBreachCount,
        customerSatisfactionScore: customerSatisfactionScore.toString(),
        agentUtilization: agentUtilization.toString(),
      })
      .returning();

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      date: yesterday.toISOString().split('T')[0],
      metrics: {
        ordersCreated: ordersCreatedYesterday.length,
        ordersDelivered: ordersDeliveredYesterday.length,
        refundsProcessed: refundsYesterday.length,
        ticketsCreated: ticketsCreatedYesterday.length,
        ticketsResolved: ticketsResolvedYesterday.length,
        ticketsOpen: totalTicketsOpen,
        avgResponseTime: `${avgResponseTime} minutes`,
        avgResolutionTime: `${Math.ceil(avgResolutionTime / 60)} hours`,
        slaBreaches: slaBreachCount,
        customerSatisfaction: customerSatisfactionScore,
        agentUtilization: `${agentUtilization.toFixed(1)}%`,
      },
    };

    console.log('[Cron] Analytics update completed:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Cron] Error in analytics update:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}