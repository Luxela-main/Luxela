import { NextRequest, NextResponse } from 'next/server';
import { autoEscalateOldDisputes } from '@/server/services/disputeResolutionService';

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

    console.log('Starting cron job: Escalate old disputes');

    const result = await autoEscalateOldDisputes();

    console.log(
      `Cron job completed: Escalated ${result.escalated} disputes, Failed: ${result.failed}`
    );

    return NextResponse.json({
      success: true,
      message: 'Old disputes escalated',
      escalated: result.escalated,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron job error (escalate-disputes):', error);

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