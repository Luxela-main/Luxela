import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db } from '@/server/db/client';

/**
 * Admin endpoint to manually trigger database migrations
 * This is useful for troubleshooting or running migrations on-demand
 * 
 * Requires: ADMIN_SECRET_KEY environment variable for authentication
 * 
 * POST /api/admin/run-migrations?secret=<ADMIN_SECRET_KEY>
 */
export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const secretKey = request.nextUrl.searchParams.get('secret');
    const adminSecret = process.env.ADMIN_SECRET_KEY;

    if (!adminSecret) {
      return NextResponse.json(
        { error: 'Admin secret key not configured' },
        { status: 500 }
      );
    }

    if (!secretKey || secretKey !== adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing secret key' },
        { status: 401 }
      );
    }

    console.log('🔄 Starting database migrations via API...');
    
    const migrationsFolder = path.join(process.cwd(), 'drizzle');
    
    await migrate(db as any, { migrationsFolder });
    
    console.log('✅ Migrations completed successfully via API');
    
    return NextResponse.json(
      { 
        success: true, 
        message: 'Database migrations completed successfully',
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Migration API error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

/**
 * GET endpoint to check current database schema status
 * Useful for diagnostics without running migrations
 */
export async function GET(request: NextRequest) {
  try {
    const secretKey = request.nextUrl.searchParams.get('secret');
    const adminSecret = process.env.ADMIN_SECRET_KEY;

    if (!adminSecret || !secretKey || secretKey !== adminSecret) {
      return NextResponse.json(
        { error: 'Unauthorized: Invalid or missing secret key' },
        { status: 401 }
      );
    }

    // Simple health check query
    const result = await (db as any).execute(
      'SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = \'listings\' AND column_name = \'status\') as status_column_exists'
    );

    const statusColumnExists = result.rows?.[0]?.status_column_exists || false;

    return NextResponse.json(
      {
        success: true,
        schema: {
          listings: {
            status_column_exists: statusColumnExists,
            message: statusColumnExists 
              ? 'Status column exists in listings table' 
              : 'MISSING: Status column not found in listings table'
          }
        },
        timestamp: new Date().toISOString()
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('❌ Schema check error:', error);
    
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}