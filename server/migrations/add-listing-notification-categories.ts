import { db } from '../db';
import { sql } from 'drizzle-orm';

/**
 * Migration: Add listing notification categories to notification_category enum
 * 
 * Purpose: Support seller notifications for listing review status changes
 * - listing_approved: When a seller's listing is approved
 * - listing_rejected: When a seller's listing is rejected
 * - listing_revision_requested: When a seller's listing requires revisions
 */
async function main() {
  try {
    console.log('[Migration] Starting: add-listing-notification-categories\n');

    // Add new enum values to notification_category
    // Note: In PostgreSQL, we need to use ALTER TYPE to add enum values
    const alterEnumQueries = [
      // Add to the end of the enum (before the last value if possible)
      `ALTER TYPE notification_category ADD VALUE IF NOT EXISTS 'listing_approved'`,
      `ALTER TYPE notification_category ADD VALUE IF NOT EXISTS 'listing_rejected'`,
      `ALTER TYPE notification_category ADD VALUE IF NOT EXISTS 'listing_revision_requested'`,
    ];

    for (const query of alterEnumQueries) {
      try {
        await db.execute(sql.raw(query));
        console.log(`✓ Executed: ${query}`);
      } catch (error: any) {
        // If the enum value already exists, that's fine
        if (error.message && error.message.includes('already exists')) {
          console.log(`⚠ Enum value already exists: ${query}`);
        } else {
          throw error;
        }
      }
    }

    console.log('\n[Migration] ✓ Completed: add-listing-notification-categories');
    console.log('[Migration] Added listing-related notification categories');

    process.exit(0);
  } catch (error) {
    console.error('[Migration] Error:', error);
    console.error('\nNote: If you see "cannot have more than one clause for schema element",');
    console.error('this is expected in PostgreSQL. The enum values may already exist.');
    process.exit(1);
  }
}

main();