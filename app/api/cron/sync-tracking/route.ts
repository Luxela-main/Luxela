import { NextRequest, NextResponse } from 'next/server';
import { OrderTrackingService } from '@/server/services/orderTrackingService';
import { db } from '@/server/db/client';
import { orders } from '@/server/db/schema';
import { and, eq, isNotNull } from 'drizzle-orm';

// Vercel Cron: every 4 hours
export async function GET(request: NextRequest) {
  // Verify Cron Secret
  if (request.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log('[Cron] Starting tracking sync...');

    // Get all in-transit orders with tracking numbers
    const inTransitOrders = await db.query.orders.findMany({
      where: and(
        eq(orders.deliveryStatus, 'in_transit'),
        isNotNull(orders.trackingNumber)
      ),
      limit: 100,
    });

    console.log(`[Cron] Found ${inTransitOrders.length} in-transit orders to sync`);

    let syncedCount = 0;
    let failedCount = 0;

    for (const order of inTransitOrders) {
      try {
        if (!order.trackingNumber) continue;

        // Extract courier from tracking number pattern or default
        const courier = determineCourier(order.trackingNumber);

        // Sync tracking with courier API
        await OrderTrackingService.syncTracking(order.trackingNumber, courier);
        syncedCount++;
      } catch (error) {
        console.error(
          `[Cron] Error syncing tracking for order ${order.id}:`,
          error
        );
        failedCount++;
      }
    }

    const result = {
      success: true,
      timestamp: new Date().toISOString(),
      synced: syncedCount,
      failed: failedCount,
      total: inTransitOrders.length,
    };

    console.log('[Cron] Tracking sync completed:', result);
    return NextResponse.json(result);
  } catch (error) {
    console.error('[Cron] Error in tracking sync:', error);
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

// Helper: Determine courier from tracking number
function determineCourier(trackingNumber: string): string {
  const num = trackingNumber.toUpperCase();

  // DHL: Starts with 00, 01, 02... or is numeric 10-20 digits
  if (/^\d{10,20}$/.test(num) || /^00|^01|^02/.test(num)) return 'dhl';

  // FedEx: Starts with 79, 80, 83 or 12-digit numeric
  if (/^(79|80|83)/.test(num) || /^\d{12}$/.test(num)) return 'fedex';

  // UPS: Starts with 1Z, 10-digit or 11-digit
  if (/^1Z/.test(num) || /^\d{10,11}$/.test(num)) return 'ups';

  // Default
  return 'dhl';
}