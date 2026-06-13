#!/usr/bin/env tsx
import { createFiatPaymentLink } from '../server/services/tsara';

async function run() {
  try {
    console.log('Running createFiatPaymentLink repro...');
    const resp = await createFiatPaymentLink({
      amount: 10000, // in kobo
      currency: 'NGN',
      description: 'Test payment link',
      metadata: { test: 'true' },
      redirect_url: 'https://example.com/success'
    });
    console.log('Repro result:', JSON.stringify(resp, null, 2));
  } catch (err: any) {
    console.error('Repro error:', err?.message || err);
    if (err?.response) console.error('Response data:', JSON.stringify(err.response.data, null, 2));
    process.exit(1);
  }
}

run();
