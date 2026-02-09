import { sql } from 'drizzle-orm';
import { Client } from 'pg';

/**
 * Migration: Add All Missing Notification Category Enum Values
 * 
 * This migration adds missing enum values to the notification_category type
 * for buyer, seller, and admin notifications that are being used in the code
 * but don't exist in the database enum.
 */

const missingValues = [
  'order_update',           // Buyer: generic order updates
  'order_pending',          // Seller: new order awaiting confirmation
  'shipment_due',           // Seller: order ready to ship
  'dispute_open',           // Seller: dispute opened by buyer
  'new_review',             // Seller: new review received
  'low_inventory',          // Seller: low stock warning
  'order_canceled',         // Buyer: order was canceled
  'payment_success',        // Buyer/Seller: payment completed
  'refund_initiated',       // Buyer/Seller: refund started
  'return_initiated',       // Buyer/Seller: return started
  'return_completed',       // Buyer/Seller: return processed
  'dispute_resolved',       // Buyer/Seller: dispute closed
  'listing_update',         // Seller: listing status changed
];

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is not set');
}

export async function up() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
  });
  try {
    await client.connect();
    
    console.log('🔄 Adding missing notification category enum values...');
    
    for (const value of missingValues) {
      try {
        const query = `ALTER TYPE notification_category ADD VALUE IF NOT EXISTS '${value}'`;
        await client.query(query);
        console.log(`✓ Added: ${value}`);
      } catch (error: any) {
        // If the error is that the value already exists, that's fine
        if (error?.message?.includes('already exists')) {
          console.log(`⊘ Already exists: ${value}`);
        } else {
          console.error(`✗ Failed to add ${value}:`, error.message);
        }
      }
    }
    
    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

export async function down() {
  console.log('⚠️  Note: PostgreSQL enums cannot be easily removed. Manual cleanup may be required.');
}

// Auto-run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  up().catch(console.error);
}