import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/env';
import { checkDBHealth } from '@/server/db/client';
import { tsaraApi } from '@/server/services/tsara';

/**
 * Health check endpoint to verify all system components
 * Usage: GET /api/debug/health
 * 
 * Checks:
 * - Database connection
 * - Tsara API authentication
 * - Environment variables
 */
export async function GET(req: NextRequest) {
  // Only allow in development or with debug token
  const authHeader = req.headers.get('authorization');
  const isAuthorized = authHeader === `Bearer ${process.env.DEBUG_TOKEN}` || 
                       process.env.NODE_ENV === 'development';
  
  if (!isAuthorized && process.env.NODE_ENV === 'production') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {} as Record<string, any>,
  };

  // 1. Check Database
  try {
    const dbHealthy = await checkDBHealth();
    results.checks.database = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      connected: dbHealthy,
    };
  } catch (error: any) {
    results.checks.database = {
      status: 'error',
      error: error.message,
    };
  }

  // 2. Check Tsara Configuration
  const hasSecretKey = !!env.TSARA_SECRET_KEY && env.TSARA_SECRET_KEY.length > 0;
  const hasPublicKey = !!env.NEXT_PUBLIC_TSARA_PUBLIC_KEY && env.NEXT_PUBLIC_TSARA_PUBLIC_KEY.length > 0;
  
  results.checks.tsara_config = {
    status: hasSecretKey && hasPublicKey ? 'configured' : 'missing',
    hasSecretKey,
    hasPublicKey,
    baseUrl: env.TSARA_BASE_URL || 'https://api.tsara.ng/v1',
  };

  // 3. Check Tsara API Authentication
  if (hasSecretKey) {
    try {
      const response = await tsaraApi.get('/payment-links', {
        timeout: 10000,
        validateStatus: () => true, // Accept any status to check auth
      });
      
      if (response.status === 401) {
        results.checks.tsara_api = {
          status: 'unauthorized',
          statusCode: 401,
          message: 'Authentication failed - check TSARA_SECRET_KEY',
        };
      } else if (response.status >= 200 && response.status < 500) {
        results.checks.tsara_api = {
          status: 'authenticated',
          statusCode: response.status,
          message: 'API authentication successful',
        };
      } else {
        results.checks.tsara_api = {
          status: 'error',
          statusCode: response.status,
          message: 'API returned error',
        };
      }
    } catch (error: any) {
      results.checks.tsara_api = {
        status: 'error',
        error: error.message,
        code: error.code,
      };
    }
  } else {
    results.checks.tsara_api = {
      status: 'skipped',
      message: 'TSARA_SECRET_KEY not configured',
    };
  }

  // 4. Check Environment Variables
  const criticalEnvVars = [
    'DATABASE_URL',
    'TSARA_SECRET_KEY',
    'NEXT_PUBLIC_TSARA_PUBLIC_KEY',
  ];
  
  results.checks.environment = {
    status: 'checked',
    variables: criticalEnvVars.map(varName => ({
      name: varName,
      set: !!process.env[varName] && process.env[varName]!.length > 0,
    })),
  };

  // Overall status
  const allHealthy = 
    results.checks.database?.connected &&
    results.checks.tsara_api?.status === 'authenticated';

  return NextResponse.json({
    ...results,
    overall: allHealthy ? 'healthy' : 'degraded',
  }, { status: allHealthy ? 200 : 503 });
}