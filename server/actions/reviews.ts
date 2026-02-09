'use server';

import { db } from '@/server/db';
import { reviews, buyers, listings } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/utils/getCurrentUser';

export interface ReviewData {
  listingId: string;
  rating: number;
  comment?: string;
}

export async function submitReview(data: ReviewData) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Validate rating
    if (data.rating < 1 || data.rating > 5) {
      return { success: false, error: 'Rating must be between 1 and 5' };
    }

    // Get buyer record for the user
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.userId, user.id),
    });

    if (!buyer) {
      return { success: false, error: 'Buyer profile not found' };
    }

    // Check if listing exists
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, data.listingId),
    });

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    // Check if buyer has already reviewed this listing
    const existingReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.buyerId, buyer.id),
        eq(reviews.listingId, data.listingId)
      ),
    });

    if (existingReview) {
      return { success: false, error: 'You have already reviewed this product' };
    }

    // Submit review
    console.log('[submitReview] Inserting review:', { buyerId: buyer.id, listingId: data.listingId, rating: data.rating })
    const newReview = await db.insert(reviews).values({
      buyerId: buyer.id,
      listingId: data.listingId,
      rating: data.rating,
      comment: data.comment,
    }).returning();

    console.log('[submitReview] Review inserted successfully:', { id: newReview[0]?.id })
    return { success: true, review: newReview[0] };
  } catch (error) {
    console.error('Error submitting review:', error);
    return { success: false, error: 'Failed to submit review' };
  }
}

export async function getListingReviews(listingId: string, limit: number = 10) {
  try {
    console.log('[getListingReviews] Fetching reviews for listing:', listingId)
    // Check if listing exists
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      console.error('[getListingReviews] Listing not found:', listingId)
      return { success: false, error: 'Listing not found', reviews: [] };
    }

    console.log('[getListingReviews] Listing found, fetching reviews...')
    // Fetch reviews with buyer information
    const listingReviews = await db.query.reviews.findMany({
      where: eq(reviews.listingId, listingId),
      with: {
        buyer: {
          with: {
            account: true,
          },
        },
      },
      limit,
      orderBy: (reviews, { desc }) => [desc(reviews.createdAt)],
    });

    console.log('[getListingReviews] Found reviews:', { count: listingReviews.length })
    return { success: true, reviews: listingReviews };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('[getListingReviews] Error fetching reviews:', { listingId, errorMessage, error });
    return { success: false, error: `Failed to fetch reviews: ${errorMessage}`, reviews: [] };
  }
}

export async function getListingStats(listingId: string) {
  try {
    // Check if listing exists
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    // Get all reviews for the listing
    const listingReviews = await db.query.reviews.findMany({
      where: eq(reviews.listingId, listingId),
    });

    if (listingReviews.length === 0) {
      return {
        success: true,
        stats: {
          totalReviews: 0,
          averageRating: 0,
          ratingDistribution: [
            { stars: 5, count: 0, percentage: 0 },
            { stars: 4, count: 0, percentage: 0 },
            { stars: 3, count: 0, percentage: 0 },
            { stars: 2, count: 0, percentage: 0 },
            { stars: 1, count: 0, percentage: 0 },
          ],
        },
      };
    }

    // Calculate statistics
    const totalReviews = listingReviews.length;
    const totalRating = listingReviews.reduce((sum, r) => sum + r.rating, 0);
    const averageRating = totalReviews > 0 ? totalRating / totalReviews : 0;

    // Create rating distribution
    const ratingCounts = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    listingReviews.forEach((review) => {
      ratingCounts[review.rating as keyof typeof ratingCounts]++;
    });

    const ratingDistribution = [5, 4, 3, 2, 1].map((stars) => ({
      stars,
      count: ratingCounts[stars as keyof typeof ratingCounts],
      percentage:
        totalReviews > 0
          ? Math.round(
              (ratingCounts[stars as keyof typeof ratingCounts] / totalReviews) *
                100
            )
          : 0,
    }));

    return {
      success: true,
      stats: {
        totalReviews,
        averageRating: Math.round(averageRating * 10) / 10,
        ratingDistribution,
      },
    };
  } catch (error) {
    console.error('Error fetching listing stats:', error);
    return { success: false, error: 'Failed to fetch listing stats' };
  }
}

export async function hasUserReviewedListing(listingId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { hasReviewed: false };
    }

    // Get buyer record for the user
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.userId, user.id),
    });

    if (!buyer) {
      return { hasReviewed: false };
    }

    // Check if user has reviewed this listing
    const userReview = await db.query.reviews.findFirst({
      where: and(
        eq(reviews.buyerId, buyer.id),
        eq(reviews.listingId, listingId)
      ),
    });

    return { hasReviewed: !!userReview, review: userReview };
  } catch (error) {
    console.error('Error checking review status:', error);
    return { hasReviewed: false };
  }
}