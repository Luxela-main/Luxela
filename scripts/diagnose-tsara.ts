#!/usr/bin/env ts-node
/**
 * Tsara API Configuration Diagnostic Script
 * 
 * This script checks:
 * 1. Environment variables are set
 * 2. API connectivity
 * 3. Authentication credentials validity
 * 4. API endpoint accessibility
 * 
 * Usage: npx ts-node scripts/diagnose-tsara.ts
 */

import { env } from '../env';
import axios from 'axios';

const BASE_URL = env.TSARA_API_URL || 'https://api.tsara.ng/v1';
const SECRET_KEY = env.TSARA_SECRET_KEY;
const PUBLIC_KEY = env.NEXT_PUBLIC_TSARA_PUBLIC_KEY;

interface DiagnosticResult {
  timestamp: string;
  checks: {
    secretKeySet: boolean;
    publicKeySet: boolean;
    apiUrlSet: boolean;
    apiReachable: boolean;
    authenticationValid: boolean;
  };
  details: {
    baseUrl: string;
    secretKeyLength: number;
    publicKeyLength: number;
    apiResponse?: any;
    errors: string[];
  };
}

async function runDiagnostics(): Promise<DiagnosticResult> {
  const result: DiagnosticResult = {
    timestamp: new Date().toISOString(),
    checks: {
      secretKeySet: false,
      publicKeySet: false,
      apiUrlSet: false,
      apiReachable: false,
      authenticationValid: false,
    },
    details: {
      baseUrl: BASE_URL,
      secretKeyLength: SECRET_KEY?.length || 0,
      publicKeyLength: PUBLIC_KEY?.length || 0,
      errors: [],
    },
  };

  console.log('🔍 Running Tsara API Diagnostics...\n');

  // Check 1: Environment variables
  console.log('✓ Check 1: Environment Variables');
  result.checks.secretKeySet = !!(SECRET_KEY && SECRET_KEY.trim().length > 10);
  result.checks.publicKeySet = !!(PUBLIC_KEY && PUBLIC_KEY.trim().length > 10);
  result.checks.apiUrlSet = !!BASE_URL;

  if (!result.checks.secretKeySet) {
    result.details.errors.push('❌ TSARA_SECRET_KEY is not set or too short');
  } else {
    console.log(`  ✓ TSARA_SECRET_KEY is set (${SECRET_KEY!.length} chars)`);
  }

  if (!result.checks.publicKeySet) {
    result.details.errors.push('⚠️ NEXT_PUBLIC_TSARA_PUBLIC_KEY is not set (needed for client-side)');
  } else {
    console.log(`  ✓ NEXT_PUBLIC_TSARA_PUBLIC_KEY is set (${PUBLIC_KEY!.length} chars)`);
  }

  console.log(`  ✓ API URL: ${BASE_URL}`);

  // Check 2: API Reachability
  console.log('\n✓ Check 2: API Reachability');
  try {
    const healthCheck = await axios.get(`${BASE_URL}/health`, {
      timeout: 10000,
      validateStatus: () => true,
    });
    
    if (healthCheck.status < 500) {
      result.checks.apiReachable = true;
      console.log(`  ✓ API is reachable (HTTP ${healthCheck.status})`);
    } else {
      result.details.errors.push(`❌ API returned server error: HTTP ${healthCheck.status}`);
      console.log(`  ✗ API health check failed: HTTP ${healthCheck.status}`);
    }
  } catch (error: any) {
    result.details.errors.push(`❌ Cannot reach API: ${error.message}`);
    console.log(`  ✗ API is not reachable: ${error.message}`);
    
    if (error.code === 'ENOTFOUND') {
      console.log('    Hint: The API hostname could not be resolved. Check your internet connection.');
    } else if (error.code === 'ECONNREFUSED') {
      console.log('    Hint: Connection refused. The API server might be down.');
    } else if (error.code === 'ETIMEDOUT') {
      console.log('    Hint: Connection timed out. Network issues or API is slow.');
    }
  }

  // Check 3: Authentication
  console.log('\n✓ Check 3: Authentication');
  if (!result.checks.secretKeySet) {
    result.details.errors.push('❌ Cannot test authentication - TSARA_SECRET_KEY is missing');
    console.log('  ✗ Skipping auth test - no secret key configured');
  } else {
    try {
      // Try to list payment links (requires authentication)
      const authTest = await axios.get(`${BASE_URL}/payment-links`, {
        headers: {
          'Authorization': `Bearer ${SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 10000,
        validateStatus: () => true,
      });

      result.details.apiResponse = {
        status: authTest.status,
        statusText: authTest.statusText,
        data: authTest.data,
      };

      if (authTest.status === 200) {
        result.checks.authenticationValid = true;
        console.log('  ✓ Authentication successful (HTTP 200)');
        console.log(`    Found ${authTest.data?.data?.length || 0} payment links`);
      } else if (authTest.status === 401) {
        result.details.errors.push('❌ Authentication failed (401 Unauthorized)');
        console.log('  ✗ Authentication failed (HTTP 401)');
        console.log('    Hint: Your TSARA_SECRET_KEY is invalid or expired.');
        console.log('    Action: Generate a new secret key from your Tsara dashboard.');
      } else if (authTest.status === 403) {
        result.details.errors.push('❌ Access forbidden (403 Forbidden)');
        console.log('  ✗ Access forbidden (HTTP 403)');
        console.log('    Hint: Your API key does not have permission for this operation.');
      } else if (authTest.status === 404) {
        result.details.errors.push('❌ API endpoint not found (404)');
        console.log('  ✗ Endpoint not found (HTTP 404)');
        console.log('    Hint: The API URL might be incorrect.');
      } else {
        result.details.errors.push(`❌ Unexpected response: HTTP ${authTest.status}`);
        console.log(`  ✗ Unexpected response: HTTP ${authTest.status}`);
        console.log('    Response:', JSON.stringify(authTest.data, null, 2).substring(0, 500));
      }
    } catch (error: any) {
      result.details.errors.push(`❌ Auth test error: ${error.message}`);
      console.log(`  ✗ Auth test failed: ${error.message}`);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('DIAGNOSTIC SUMMARY');
  console.log('='.repeat(50));
  
  const passedChecks = Object.values(result.checks).filter(Boolean).length;
  const totalChecks = Object.values(result.checks).length;
  
  console.log(`\nChecks passed: ${passedChecks}/${totalChecks}`);
  
  if (result.details.errors.length === 0) {
    console.log('\n✅ All checks passed! Your Tsara configuration looks good.');
  } else {
    console.log('\n❌ Issues found:');
    result.details.errors.forEach(err => console.log(`   ${err}`));
  }

  // Actionable recommendations
  console.log('\n📋 Recommendations:');
  
  if (!result.checks.secretKeySet) {
    console.log('   1. Add TSARA_SECRET_KEY to your environment variables');
    console.log('      - Log into your Tsara dashboard');
    console.log('      - Go to Settings > API Keys');
    console.log('      - Copy the Secret Key (starts with "tsara_sk_...")');
    console.log('      - Add to your .env.local or deployment platform');
  }
  
  if (!result.checks.publicKeySet) {
    console.log('   2. Add NEXT_PUBLIC_TSARA_PUBLIC_KEY for client-side operations');
    console.log('      - From Tsara dashboard, copy the Public Key');
    console.log('      - Add to .env.local (not needed for server-only ops)');
  }
  
  if (!result.checks.authenticationValid && result.checks.secretKeySet) {
    console.log('   3. Your secret key appears invalid or expired');
    console.log('      - Generate a new secret key in Tsara dashboard');
    console.log('      - Update TSARA_SECRET_KEY with the new key');
    console.log('      - Restart your application');
  }

  if (!result.checks.apiReachable) {
    console.log('   4. Cannot reach Tsara API');
    console.log('      - Check your internet connection');
    console.log('      - Verify TSARA_API_URL is correct (default: https://api.tsara.ng/v1)');
    console.log('      - Check if Tsara API is down: https://status.tsara.ng');
  }

  return result;
}

// Run diagnostics
runDiagnostics()
  .then((result) => {
    console.log('\n' + '='.repeat(50));
    console.log('Full diagnostic result written to console');
    process.exit(result.checks.authenticationValid ? 0 : 1);
  })
  .catch((error) => {
    console.error('\n❌ Diagnostic script failed:', error);
    process.exit(1);
  });