import { NextRequest, NextResponse } from 'next/server';
import { processAutomaticPayouts } from '@/server/services/automaticPayoutService';

export const runtime = 'nodejs';
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  try {
    const cronSecret = req.headers.get('authorization')?.replace('Bearer ', '');
    
    if (cronSecret !== process.env.CRON_SECRET) {
      console.warn('Unauthorized cron request attempt');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('Starting cron job: Process automatic payouts');

    const result = await processAutomaticPayouts();

    const totalNaira = (result.totalAmount / 100).toFixed(2);
    console.log(
      `Cron job completed: Processed ${result.processed} payouts, Total: ₦${totalNaira}`
    );

    return NextResponse.json({
      success: true,
      message: 'Automatic payouts processed',
      processed: result.processed,
      totalAmount: result.totalAmount,
      totalAmountFormatted: `₦${totalNaira}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron job error (process-payouts):', error);

    return NextResponse.json(
      {
        error: 'Cron job failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const POST = GET;