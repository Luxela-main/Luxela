/**
 * Tsara Payment Diagnostic Utility
 * 
 * This utility helps diagnose common configuration issues with the Tsara payment integration.
 * Run this to verify your setup before attempting payments.
 */

import { env } from "@/env";
import { tsaraApi, diagnoseTsaraConnection } from "./tsara";

export interface DiagnosticResult {
  status: 'pass' | 'fail' | 'warn';
  message: string;
  details?: string;
}

export interface TsaraDiagnostics {
  timestamp: string;
  environment: string;
  checks: DiagnosticResult[];
  overallStatus: 'healthy' | 'degraded' | 'failing';
  recommendations: string[];
}

/**
 * Run comprehensive diagnostics on Tsara configuration
 */
export async function runTsaraDiagnostics(): Promise<TsaraDiagnostics> {
  const checks: DiagnosticResult[] = [];
  const recommendations: string[] = [];

  // Check 1: Environment variables
  const secretKey =
    env.TSARA_SECRET_KEY ||
    process.env.TSARA_SECRET_KEY ||
    process.env.TSARA_KEY ||
    process.env.TSARA_API_KEY ||
    process.env.TSARA_SECRET ||
    '';
  const publicKey = env.NEXT_PUBLIC_TSARA_PUBLIC_KEY;

  if (!secretKey || secretKey.trim() === '') {
    checks.push({
      status: 'fail',
      message: 'TSARA_SECRET_KEY is not configured',
      details: 'Add TSARA_SECRET_KEY, TSARA_KEY, or TSARA_API_KEY to your environment variables',
    });
    recommendations.push('Set the Tsara server secret in your environment variables');
  } else if (secretKey.length < 20) {
    checks.push({
      status: 'warn',
      message: 'TSARA_SECRET_KEY appears to be too short',
      details: 'API keys are typically longer than 20 characters',
    });
    recommendations.push('Verify your Tsara secret key is complete and correct');
  } else {
    checks.push({
      status: 'pass',
      message: 'TSARA_SECRET_KEY is configured',
      details: `Key length: ${secretKey.length} characters`,
    });
  }

  if (!publicKey || publicKey.trim() === '') {
    checks.push({
      status: 'warn',
      message: 'NEXT_PUBLIC_TSARA_PUBLIC_KEY is not configured',
      details: 'Public key is required for client-side operations',
    });
    recommendations.push('Set NEXT_PUBLIC_TSARA_PUBLIC_KEY for client-side features');
  } else {
    checks.push({
      status: 'pass',
      message: 'NEXT_PUBLIC_TSARA_PUBLIC_KEY is configured',
    });
  }

  // Check 2: API Connectivity
  try {
    const connectionTest = await diagnoseTsaraConnection();
    
    if (connectionTest.isConfigured && connectionTest.canReachApi) {
      checks.push({
        status: 'pass',
        message: 'Successfully connected to Tsara API',
        details: `Base URL: ${connectionTest.baseUrl}`,
      });
    } else if (!connectionTest.isConfigured) {
      checks.push({
        status: 'fail',
        message: 'Cannot connect to Tsara API - configuration missing',
        details: connectionTest.errorDetails,
      });
      recommendations.push('Verify all required environment variables are set');
    } else {
      checks.push({
        status: 'fail',
        message: 'Cannot reach Tsara API',
        details: connectionTest.errorDetails || 'Unknown connection error',
      });
      recommendations.push('Check your internet connection and firewall settings');
      recommendations.push('Verify the Tsara API URL is correct');
    }
  } catch (error: any) {
    checks.push({
      status: 'fail',
      message: 'API connectivity test failed',
      details: error.message,
    });
    recommendations.push('Check server logs for detailed error information');
  }

  // Check 3: Environment
  checks.push({
    status: 'pass',
    message: `Environment: ${process.env.NODE_ENV || 'development'}`,
    details: `Using ${process.env.NODE_ENV === 'production' ? 'production' : 'sandbox'} API`,
  });

  // Determine overall status
  const failCount = checks.filter(c => c.status === 'fail').length;
  const warnCount = checks.filter(c => c.status === 'warn').length;
  
  let overallStatus: 'healthy' | 'degraded' | 'failing';
  if (failCount > 0) {
    overallStatus = 'failing';
  } else if (warnCount > 0) {
    overallStatus = 'degraded';
  } else {
    overallStatus = 'healthy';
  }

  return {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    checks,
    overallStatus,
    recommendations,
  };
}

/**
 * Quick check to verify Tsara is minimally configured
 */
export function isTsaraConfigured(): boolean {
  const secretKey = env.TSARA_SECRET_KEY;
  return !!(secretKey && secretKey.trim().length > 0);
}

/**
 * Log diagnostic results to console
 */
export function logDiagnostics(diagnostics: TsaraDiagnostics): void {
  console.log('\n========================================');
  console.log('  Tsara Payment Diagnostics');
  console.log('========================================\n');
  
  console.log(`Status: ${diagnostics.overallStatus.toUpperCase()}`);
  console.log(`Environment: ${diagnostics.environment}`);
  console.log(`Timestamp: ${diagnostics.timestamp}\n`);

  console.log('Checks:');
  diagnostics.checks.forEach((check, i) => {
    const icon = check.status === 'pass' ? '✅' : check.status === 'warn' ? '⚠️' : '❌';
    console.log(`  ${icon} ${check.message}`);
    if (check.details) {
      console.log(`     ${check.details}`);
    }
  });

  if (diagnostics.recommendations.length > 0) {
    console.log('\nRecommendations:');
    diagnostics.recommendations.forEach((rec, i) => {
      console.log(`  ${i + 1}. ${rec}`);
    });
  }

  console.log('\n========================================\n');
}

// Auto-run diagnostics if this file is executed directly
if (require.main === module) {
  runTsaraDiagnostics().then(logDiagnostics).catch(console.error);
}