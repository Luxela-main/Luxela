import { router, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { db } from '../db';
import { reviews, buyers, listings, users, sellerNotifications, notifications as buyerNotificationsTable } from '../db/schema';
import { notifyReviewPosted } from '../services/buyerNotificationService';
import { eq, desc } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const reviewRouter = router({
  // Create a review - will automatically create a notification for the seller
  createReview: publicProcedure
    .input(
      z.object({
        buyerId: z.string().uuid(),
        listingId: z.string().uuid(),
        rating: z.number().int().min(1).max(5),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        // Create the review
        const newReview = await db
          .insert(reviews)
          .values({
            buyerId: input.buyerId,
            listingId: input.listingId,
            rating: input.rating,
            comment: input.comment || null,
          })
          .returning();

        // Fetch buyer and listing details for notification
        const buyerData = await db
          .select({
            displayName: users.displayName,
            email: users.email,
          })
          .from(buyers)
          .leftJoin(users, eq(buyers.userId, users.id))
          .where(eq(buyers.id, input.buyerId))
          .limit(1);

        const listingData = await db
          .select({
            title: listings.title,
            sellerId: listings.sellerId,
          })
          .from(listings)
          .where(eq(listings.id, input.listingId))
          .limit(1);

        // Create buyer notification - review posted successfully
        if (buyerData.length > 0 && listingData.length > 0) {
          try {
            await notifyReviewPosted(
              input.buyerId,
              listingData[0].title,
              input.rating,
              input.listingId
            );
          } catch (notifError) {
            console.error('[Review Router] Failed to create buyer notification:', notifError);
            // Don't fail the review creation if notification fails
          }
        }

        if (!listingData[0]) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Listing not found',
          });
        }

        const buyer = buyerData[0];
        const listing = listingData[0];
        const buyerName = buyer?.displayName || 'Anonymous Buyer';
        const stars = '⭐'.repeat(input.rating);
        const commentPreview = input.comment
          ? input.comment.substring(0, 100) + (input.comment.length > 100 ? '...' : '')
          : '(No comment)';

        // Create seller notification
        await db.insert(sellerNotifications).values({
          sellerId: listing.sellerId,
          type: 'new_review',
          title: `New ${input.rating}-star review from ${buyerName}`,
          message: `${stars} Review on "${listing.title}": "${commentPreview}"`,
          severity: input.rating >= 4 ? 'info' : input.rating === 1 ? 'critical' : 'warning',
          isRead: false,
          isStarred: false,
          relatedEntityId: input.listingId,
          relatedEntityType: 'listing',
          metadata: {
            buyerName,
            buyerEmail: buyer?.email,
            rating: input.rating,
            comment: input.comment,
            reviewId: newReview[0].id,
          },
        });

        return newReview[0];
      } catch (error) {
        console.error('[reviewRouter] Error creating review:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create review',
        });
      }
    }),

  // Get reviews for a listing with buyer names
  getReviewsByListing: publicProcedure
    .input(z.object({ listingId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const reviewData = await db
          .select({
            id: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            createdAt: reviews.createdAt,
            buyerName: users.displayName,
            buyerEmail: users.email,
          })
          .from(reviews)
          .leftJoin(buyers, eq(reviews.buyerId, buyers.id))
          .leftJoin(users, eq(buyers.userId, users.id))
          .where(eq(reviews.listingId, input.listingId))
          .orderBy(desc(reviews.createdAt));

        return reviewData.map((review: any) => ({
          ...review,
          buyerName: review.buyerName || 'Anonymous Buyer',
        }));
      } catch (error) {
        console.error('[reviewRouter] Error fetching reviews:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reviews',
        });
      }
    }),

  // Get all reviews for a buyer
  getReviewsByBuyer: publicProcedure
    .input(z.object({ buyerId: z.string().uuid() }))
    .query(async ({ input }) => {
      try {
        const reviewData = await db
          .select({
            id: reviews.id,
            listingId: reviews.listingId,
            rating: reviews.rating,
            comment: reviews.comment,
            createdAt: reviews.createdAt,
            productTitle: listings.title,
          })
          .from(reviews)
          .leftJoin(listings, eq(reviews.listingId, listings.id))
          .where(eq(reviews.buyerId, input.buyerId))
          .orderBy(desc(reviews.createdAt));

        return reviewData;
      } catch (error) {
        console.error('[reviewRouter] Error fetching buyer reviews:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to fetch reviews',
        });
      }
    }),

  // Delete a review
  deleteReview: publicProcedure
    .input(z.object({ reviewId: z.string().uuid() }))
    .mutation(async ({ input }) => {
      try {
        await db.delete(reviews).where(eq(reviews.id, input.reviewId));
        return { success: true };
      } catch (error) {
        console.error('[reviewRouter] Error deleting review:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to delete review',
        });
      }
    }),

  // Update a review
  updateReview: publicProcedure
    .input(
      z.object({
        reviewId: z.string().uuid(),
        rating: z.number().int().min(1).max(5).optional(),
        comment: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      try {
        const updated = await db
          .update(reviews)
          .set({
            rating: input.rating,
            comment: input.comment,
          })
          .where(eq(reviews.id, input.reviewId))
          .returning();

        return updated[0];
      } catch (error) {
        console.error('[reviewRouter] Error updating review:', error);
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to update review',
        });
      }
    }),
});