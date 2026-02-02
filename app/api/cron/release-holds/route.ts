import { NextRequest, NextResponse } from 'next/server';
import { autoReleaseExpiredHolds } from '@/server/services/disputeResolutionService';

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

    console.log('Starting cron job: Release expired payment holds');

    const result = await autoReleaseExpiredHolds(30);

    console.log(
      `Cron job completed: Released ${result.released} holds, Failed: ${result.failed}`
    );

    return NextResponse.json({
      success: true,
      message: 'Expired payment holds released',
      released: result.released,
      failed: result.failed,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Cron job error (release-holds):', error);

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