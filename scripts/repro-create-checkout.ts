#!/usr/bin/env tsx
import { createCheckoutSession } from '../server/services/tsara';

async function run() {
  try {
    console.log('Running createCheckoutSession repro...');
    const resp = await createCheckoutSession({
      amount: 10000, // amount in kobo (100.00 NGN)
      currency: 'NGN',
      reference: `test_${Date.now()}`,
      email: 'test@example.com',
      name: 'Test User',
      phone: '08000000000',
      success_url: 'https://example.com/success',
      cancel_url: 'https://example.com/cancel',
      metadata: { test: 'true' },
    });
    console.log('Repro result:', JSON.stringify(resp, null, 2));
  } catch (err: any) {
    console.error('Repro error:', err?.message || err);
    if (err?.response) console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    process.exit(1);
  }
}

run();
