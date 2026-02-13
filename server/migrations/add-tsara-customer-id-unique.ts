import { Client } from 'pg';

/**
 * Migration: Add Unique Constraint to tsara_customer_id
 * 
 * This migration ensures that each buyer can only have one Tsara customer ID
 * and prevents duplicate customer creation.
 */

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

async function run() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Check if constraint already exists
    const result = await client.query(`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE table_name = 'buyers' 
      AND constraint_type = 'UNIQUE' 
      AND constraint_name = 'buyers_tsara_customer_id_unique'
    `);

    if (result.rows.length > 0) {
      console.log('✓ Unique constraint already exists on tsara_customer_id');
      return;
    }

    // Add unique constraint
    await client.query(`
      ALTER TABLE buyers 
      ADD CONSTRAINT buyers_tsara_customer_id_unique 
      UNIQUE (tsara_customer_id)
    `);

    console.log('✓ Added unique constraint to tsara_customer_id');

  } catch (error: any) {
    if (error.code === '23505') {
      console.log('⚠ Unique constraint violation detected. There may be duplicate tsara_customer_id values.');
      throw new Error('Cannot add unique constraint due to existing duplicates. Please clean up duplicate records first.');
    }
    throw error;
  } finally {
    await client.end();
  }
}

run().catch((error) => {
  console.error('Migration failed:', error);
  process.exit(1);
});