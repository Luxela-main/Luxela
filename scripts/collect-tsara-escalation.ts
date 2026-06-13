#!/usr/bin/env tsx
import { db } from '../server/db';
import { payments } from '../server/db/schema';
import { eq } from 'drizzle-orm';
import fetch from 'node-fetch';
import { writeFileSync } from 'fs';

async function run() {
  try {
    const rows = await db.select().from(payments).where(eq(payments.provider, 'tsara')).orderBy(payments.createdAt, 'desc').limit(50 as any);
    const results: any[] = [];
    for (const r of rows) {
      let parsed: any = null;
      try { parsed = JSON.parse(r.gatewayResponse || '{}'); } catch (e) { parsed = { raw: r.gatewayResponse }; }
      const data = parsed?.response?.data || parsed?.data || parsed;
      const url = data?.url || data?.checkout_url || data?.link || data?.payment_url || null;
      let fetchResult: any = null;
      if (url) {
        try {
          const resp = await fetch(url, { method: 'GET', timeout: 15000 });
          const text = await resp.text();
          fetchResult = { status: resp.status, headers: Object.fromEntries(resp.headers.entries()), body: text.substring(0, 2000) };
        } catch (e: any) {
          fetchResult = { error: e?.message || String(e) };
        }
      }
      results.push({ paymentId: r.id, transactionRef: r.transactionRef, createdAt: r.createdAt, plinkCandidate: data?.id || null, url, fetchResult, rawGateway: r.gatewayResponse });
    }
    const dir = 'logs';
    try { require('fs').mkdirSync(dir); } catch (e) { /* ignore if exists */ }
    const fname = `${dir}/tsara-escalation-${Date.now()}.json`;
    writeFileSync(fname, JSON.stringify({ generatedAt: new Date().toISOString(), results }, null, 2));
    console.log('Wrote escalation bundle to', fname);
  } catch (err: any) {
    console.error('Failed to collect escalation bundle:', err?.message || err);
    process.exit(1);
  }
}

run();
