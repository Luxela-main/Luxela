import { NextRequest, NextResponse } from 'next/server';
import { processAutomaticPayouts } from '@/server/services/automaticPayoutService';
import { processScheduledPayouts } from '@/server/services/payoutExecutionService';

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

    console.log('Starting cron job: Process automatic and scheduled payouts');

    const [automaticResult, scheduledResult] = await Promise.all([
      processAutomaticPayouts(),
      processScheduledPayouts(),
    ]);

    const totalProcessed = automaticResult.processed + scheduledResult.processed;
    const totalFailed = (automaticResult.failed || 0) + (scheduledResult.failed || 0);
    const totalAmount = automaticResult.totalAmount + scheduledResult.totalAmount;
    const totalNaira = (totalAmount / 100).toFixed(2);

    const allErrors = [
      ...(automaticResult.errors || []),
      ...(scheduledResult.errors || []),
    ];

    console.log(
      `Cron job completed: Automatic=${automaticResult.processed}, Scheduled=${scheduledResult.processed}, Total processed: ${totalProcessed}, Failed: ${totalFailed}, Amount: ₦${totalNaira}`
    );

    return NextResponse.json({
      success: true,
      message: 'Automatic and scheduled payouts processed',
      automatic: {
        processed: automaticResult.processed,
        totalAmount: automaticResult.totalAmount,
      },
      scheduled: {
        processed: scheduledResult.processed,
        failed: scheduledResult.failed,
        totalAmount: scheduledResult.totalAmount,
      },
      summary: {
        totalProcessed,
        totalFailed,
        totalAmount,
        totalAmountFormatted: `₦${totalNaira}`,
      },
      errors: allErrors.length > 0 ? allErrors : undefined,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron job error (process-payouts):', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Cron job failed',
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export const POST = GET;