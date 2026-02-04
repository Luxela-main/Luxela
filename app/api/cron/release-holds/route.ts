import { NextRequest, NextResponse } from 'next/server';
import { autoReleaseExpiredHolds } from '@/server/services/escrowService';

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

    console.log('Starting cron job: Release escrow holds');

    const releasedCount = await autoReleaseExpiredHolds();

    console.log(
      `Cron job completed: Released ${releasedCount} holds`
    );

    return NextResponse.json({
      success: true,
      message: 'Escrow holds released',
      released: releasedCount,
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