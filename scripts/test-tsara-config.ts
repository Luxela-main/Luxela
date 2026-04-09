#!/usr/bin/env tsx
/**
 * Tsara Payment Configuration Test Script
 * 
 * Run this script to verify your Tsara API configuration:
 *   npx tsx scripts/test-tsara-config.ts
 * 
 * Or with npm:
 *   npm run test:tsara
 */

import { diagnoseTsaraConnection, validateApiKey, TSARA_SECRET_KEY } from '../server/services/tsara';
import { env } from '../env';

console.log('╔══════════════════════════════════════════════════════════════╗');
console.log('║       Tsara Payment Configuration Diagnostic Tool            ║');
console.log('╚══════════════════════════════════════════════════════════════╝');
console.log();

// Check environment variables
console.log('📋 Environment Variable Check:');
console.log('─────────────────────────────────────────────────────────────');
const envVars = {
  'TSARA_SECRET_KEY': process.env.TSARA_SECRET_KEY,
  'TSARA_KEY': process.env.TSARA_KEY,
  'TSARA_API_KEY': process.env.TSARA_API_KEY,
  'TSARA_SECRET': process.env.TSARA_SECRET,
  'env.TSARA_SECRET_KEY': env.TSARA_SECRET_KEY,
  'Selected Key': TSARA_SECRET_KEY,
};

for (const [name, value] of Object.entries(envVars)) {
  const status = value ? `✅ SET (${value.length} chars)` : '❌ NOT SET';
  console.log(`  ${name.padEnd(25)} ${status}`);
}
console.log();

// Validate key format
console.log('🔐 API Key Validation:');
console.log('─────────────────────────────────────────────────────────────');
const validation = validateApiKey(TSARA_SECRET_KEY);
if (validation.valid) {
  console.log('  ✅ Key format is valid');
  console.log(`  📊 ${validation.details}`);
} else {
  console.log('  ❌ Key validation failed');
  console.log(`  🚫 ${validation.error}`);
  console.log(`  📋 ${validation.details}`);
}
console.log();

// Test API connection
console.log('🌐 API Connection Test:');
console.log('─────────────────────────────────────────────────────────────');
diagnoseTsaraConnection()
  .then((result) => {
    console.log(`  ⏱️  Timestamp: ${result.timestamp}`);
    console.log(`  🌍 Environment: ${result.environment}`);
    console.log(`  🔗 Base URL: ${result.baseUrl}`);
    console.log(`  ✅ Secret Key: ${result.hasSecretKey ? 'Configured' : 'Missing'}`);
    console.log(`  ✅ Public Key: ${result.hasPublicKey ? 'Configured' : 'Missing'}`);
    console.log(`  📊 API Status: ${result.apiTestStatus || 'N/A'}`);
    console.log(`  🔌 Can Reach API: ${result.canReachApi ? '✅ Yes' : '❌ No'}`);
    
    if (result.errorDetails) {
      console.log(`  ⚠️  Error Details: ${result.errorDetails}`);
    }
    console.log();

    // Final recommendation
    console.log('📊 Summary:');
    console.log('─────────────────────────────────────────────────────────────');
    if (result.isConfigured && result.canReachApi && result.apiTestStatus === 200) {
      console.log('  ✅ Tsara is properly configured and working!');
    } else if (result.isConfigured && !result.canReachApi) {
      console.log('  ⚠️  API key is configured but API connection failed');
      console.log('     Possible causes:');
      console.log('     • API key is invalid or revoked');
      console.log('     • Network connectivity issues');
      console.log('     • Tsara API is down');
    } else if (!result.isConfigured) {
      console.log('  ❌ Tsara is NOT configured');
      console.log('     Please add one of these to your .env file:');
      console.log('     TSARA_SECRET_KEY=your_secret_key_here');
      console.log('     Then restart your development server.');
    }
    console.log();
    process.exit(result.isConfigured && result.canReachApi ? 0 : 1);
  })
  .catch((error) => {
    console.error('  ❌ Connection test failed:', error.message);
    console.log();
    process.exit(1);
  });