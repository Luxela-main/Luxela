/**
 * Migration: Fix pending listing reviews
 * 
 * This migration creates missing listingReviews records for all listings
 * with status = 'pending_review' that don't have corresponding review entries.
 * 
 * This fixes the issue where pending listings don't show in the admin dashboard
 * because they were created before the listing review system was implemented.
 */

import { db } from '../db';
import { listings, listingReviews } from '../db/schema';
import { eq, sql, isNull } from 'drizzle-orm';

async function fixPendingListingsReviews() {
  try {
    console.log('Starting migration: fix-pending-listings-reviews');

    // Find all listings with pending_review status
    const pendingListings = await db
      .select({ id: listings.id, sellerId: listings.sellerId })
      .from(listings)
      .where(eq(listings.status, 'pending_review'));

    console.log(`Found ${pendingListings.length} pending_review listings`);

    if (pendingListings.length === 0) {
      console.log('No pending listings found. Migration complete.');
      return;
    }

    // Find which pending listings don't have review records
    const listingIds = pendingListings.map((l: any) => l.id);

    // Get all listing IDs that already have review records
    const reviewedListingIds = await db
      .select({ listingId: listingReviews.listingId })
      .from(listingReviews)
      .where(
        sql`${listingReviews.listingId} IN (${sql.raw(
          `('${listingIds.join("','")}')`
        )})`
      );

    const reviewedIds = new Set(reviewedListingIds.map((r: any) => r.listingId));
    const missingReviews = pendingListings.filter((l: any) => !reviewedIds.has(l.id));

    console.log(`Found ${missingReviews.length} pending listings missing review records`);

    if (missingReviews.length === 0) {
      console.log('All pending listings have review records. Migration complete.');
      return;
    }

    // Create review records for missing listings
    const reviewsToInsert = missingReviews.map((listing: any) => ({
      listingId: listing.id,
      sellerId: listing.sellerId,
      status: 'pending' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    console.log(`Creating ${reviewsToInsert.length} missing review records...`);
    
    await db.insert(listingReviews).values(reviewsToInsert);

    console.log(
      `✅ Migration complete! Created ${reviewsToInsert.length} missing listingReviews records.`
    );
    console.log(
      'Pending listings should now appear in the admin listing review dashboard.'
    );
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

// Run migration if this file is executed directly
if (require.main === module) {
  fixPendingListingsReviews()
    .then(() => process.exit(0))
    .catch(err => {
      console.error(err);
      process.exit(1);
    });
}

export { fixPendingListingsReviews };