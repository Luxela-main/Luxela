#!/usr/bin/env tsx
import { db } from '../server/db';
import { payments } from '../server/db/schema';
import { sql } from 'drizzle-orm';

async function run() {
  try {
    const rows = await db.select().from(payments).where(sql`provider = 'tsara'`).orderBy(sql`created_at DESC`).limit(20);
    console.log('Found', rows.length, 'recent Tsara payments');
    for (const r of rows) {
      let parsed: any = null;
      try { parsed = JSON.parse(r.gatewayResponse || '{}'); } catch (e) { parsed = { raw: r.gatewayResponse }; }
      const data = parsed?.data || parsed?.response?.data || parsed?.data?.data || parsed;
      const plinkId = data?.id || data?.payment_id || data?.request_id || r.transactionRef;
      const url = data?.url || data?.checkout_url || data?.link || data?.payment_url;
      console.log('---');
      console.log('payment_id:', r.id);
      console.log('transactionRef:', r.transactionRef);
      console.log('created_at:', r.createdAt);
      console.log('plinkId candidate:', plinkId);
      console.log('url candidate:', url);
      console.log('raw gateway_response (truncated):', String(r.gatewayResponse).substring(0, 1000));
    }
  } catch (err: any) {
    console.error('Failed to dump payments:', err?.message || err);
    process.exit(1);
  }
}

run();
