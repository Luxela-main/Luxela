'use server';

import { db } from '@/server/db';
import { buyerFavorites, listings, buyers, buyerNotifications } from '@/server/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/utils/getCurrentUser';

export async function addToFavorites(listingId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
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
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      return { success: false, error: 'Listing not found' };
    }

    // Check if already in favorites
    const existingFavorite = await db.query.buyerFavorites.findFirst({
      where: and(
        eq(buyerFavorites.buyerId, buyer.id),
        eq(buyerFavorites.listingId, listingId)
      ),
    });

    if (existingFavorite) {
      return { success: false, error: 'Already in favorites' };
    }

    // Add to favorites
    await db.insert(buyerFavorites).values({
      buyerId: buyer.id,
      listingId: listingId,
    });

    // Create notification for buyer
    try {
      await db.insert(buyerNotifications).values({
        id: uuidv4(),
        buyerId: buyer.id,
        type: 'favorite_added' as any,
        title: 'Added to Favorites',
        message: `You added "${listing.title}" to your favorites!`,
        relatedEntityId: listingId,
        relatedEntityType: 'listing',
        actionUrl: `/buyer/product/${listingId}`,
        isRead: false,
        metadata: {
          notificationType: 'favorite_added',
          listingId: listingId,
          listingTitle: listing.title,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    } catch (notifErr) {
      // Log but don't fail if notification fails
      console.error('Failed to create favorite notification:', notifErr);
    }

    return { success: true, message: 'Added to favorites' };
  } catch (error) {
    console.error('Error adding to favorites:', error);
    return { success: false, error: 'Failed to add to favorites' };
  }
}

export async function removeFromFavorites(listingId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    // Get buyer record for the user
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.userId, user.id),
    });

    if (!buyer) {
      return { success: false, error: 'Buyer profile not found' };
    }

    // Remove from favorites
    await db.delete(buyerFavorites).where(
      and(
        eq(buyerFavorites.buyerId, buyer.id),
        eq(buyerFavorites.listingId, listingId)
      )
    );

    return { success: true, message: 'Removed from favorites' };
  } catch (error) {
    console.error('Error removing from favorites:', error);
    return { success: false, error: 'Failed to remove from favorites' };
  }
}

export async function isFavorite(listingId: string) {
  try {
    const user = await getCurrentUser();
    
    if (!user) {
      return { isFavorite: false };
    }

    // Get buyer record for the user
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.userId, user.id),
    });

    if (!buyer) {
      return { isFavorite: false };
    }

    // Check if in favorites
    const favorite = await db.query.buyerFavorites.findFirst({
      where: and(
        eq(buyerFavorites.buyerId, buyer.id),
        eq(buyerFavorites.listingId, listingId)
      ),
    });

    return { isFavorite: !!favorite };
  } catch (error) {
    console.error('Error checking favorite status:', error);
    return { isFavorite: false };
  }
}

export async function getBuyerFavorites() {
  try {
    console.log('[FAVORITES] Starting getBuyerFavorites...');
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('[FAVORITES] User not authenticated');
      return { success: false, error: 'User not authenticated', favorites: [] };
    }

    console.log('[FAVORITES] Got user:', user.id);

    // Get buyer record for the user
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.userId, user.id),
    });

    if (!buyer) {
      console.log('[FAVORITES] Buyer profile not found for user:', user.id);
      return { success: false, error: 'Buyer profile not found', favorites: [] };
    }

    console.log('[FAVORITES] Got buyer:', buyer.id);

    // Get favorites with listing data
    const favoritesList = await db.query.buyerFavorites.findMany({
      where: eq(buyerFavorites.buyerId, buyer.id),
      with: {
        listing: true,
      },
    });

    console.log('[FAVORITES] Found', favoritesList.length, 'favorites');

    // Transform the data to match the expected frontend structure
    const transformedFavorites = favoritesList
      .filter((fav: any): fav is typeof fav & { listing: NonNullable<typeof fav.listing> } => fav.listing !== null)
      .map((fav: any) => ({
        id: fav.id,
        listing: {
          id: fav.listing.id,
          title: fav.listing.title,
          image: fav.listing.image || '',
          price_cents: fav.listing.priceCents,
          currency: fav.listing.currency,
          quantity_available: fav.listing.quantityAvailable,
        },
      }));

    console.log('[FAVORITES] Successfully returning', transformedFavorites.length, 'favorites');
    return { success: true, favorites: transformedFavorites };
  } catch (error) {
    console.error('[FAVORITES] Error fetching favorites:', error);
    if (error instanceof Error) {
      console.error('[FAVORITES] Error message:', error.message);
      console.error('[FAVORITES] Stack:', error.stack);
    }
    return { success: false, error: 'Failed to fetch favorites', favorites: [] };
  }
}