#!/usr/bin/env tsx
/**
 * Diagnostic script for tRPC 500 errors
 * Run with: npx tsx scripts/diagnose-500-errors.ts
 */

import 'dotenv/config';
import { checkDBHealth } from '../server/db/client';
import { getApiKeyStatus } from '../server/services/tsara';

async function diagnose() {
  console.log('🔍 Starting diagnostics...\n');
  
  // Check 1: Database Connection
  console.log('1️⃣  Checking Database Connection...');
  try {
    const dbHealthy = await checkDBHealth();
    if (dbHealthy) {
      console.log('   ✅ Database connection is healthy\n');
    } else {
      console.log('   ❌ Database health check failed\n');
    }
  } catch (error: any) {
    console.error('   ❌ Database connection error:', error.message);
    console.log('   💡 Check your DATABASE_URL environment variable\n');
  }
  
  // Check 2: Tsara API Key
  console.log('2️⃣  Checking Tsara API Configuration...');
  const tsaraStatus = getApiKeyStatus();
  console.log('   Configured:', tsaraStatus.configured ? '✅ Yes' : '❌ No');
  console.log('   Valid:', tsaraStatus.valid ? '✅ Yes' : '❌ No');
  console.log('   Message:', tsaraStatus.message);
  
  if (!tsaraStatus.configured) {
    console.log('\n   💡 Missing TSARA_SECRET_KEY. Set one of these environment variables:');
    console.log('      - TSARA_SECRET_KEY');
    console.log('      - TSARA_KEY');
    console.log('      - TSARA_API_KEY');
    console.log('      - TSARA_SECRET');
  }
  console.log();
  
  // Check 3: Environment Variables
  console.log('3️⃣  Checking Key Environment Variables...');
  const envVars = [
    'DATABASE_URL',
    'TSARA_SECRET_KEY',
    'TSARA_KEY',
    'TSARA_API_KEY',
    'TSARA_SECRET',
    'NEXT_PUBLIC_TSARA_PUBLIC_KEY',
    'REDIS_URL',
    'UPSTASH_REDIS_REST_URL',
  ];
  
  for (const envVar of envVars) {
    const value = process.env[envVar];
    const status = value ? `✅ SET (${value.length} chars)` : '❌ NOT SET';
    console.log(`   ${envVar}: ${status}`);
  }
  
  console.log('\n📋 Summary:');
  console.log('   - If DATABASE_URL is missing: Set your PostgreSQL connection string');
  console.log('   - If TSARA_SECRET_KEY is missing: Get your API key from https://tsara.ng');
  console.log('   - If both are set but errors persist: Check server logs for detailed error messages');
}

diagnose().catch(console.error);