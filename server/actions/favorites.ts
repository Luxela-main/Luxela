'use server';

import { db } from '@/server/db';
import { buyerFavorites, listings, buyers, buyerNotifications, collectionItems, products } from '@/server/db/schema';
import { v4 as uuidv4 } from 'uuid';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { getCurrentUser } from '@/lib/utils/getCurrentUser';

export async function addToFavorites(listingId: string) {
  try {
    console.log('[FAVORITES] addToFavorites called for listing:', listingId);
    const user = await getCurrentUser();
    
    if (!user) {
      console.log('[FAVORITES] No user found');
      return { success: false, error: 'User not authenticated' };
    }

    console.log('[FAVORITES] User authenticated:', user.id);

    // Get buyer record for the user
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.userId, user.id),
    });

    if (!buyer) {
      console.log('[FAVORITES] Buyer profile not found for user:', user.id);
      return { success: false, error: 'Buyer profile not found' };
    }

    console.log('[FAVORITES] Found buyer:', buyer.id);

    // Check if listing exists
    const listing = await db.query.listings.findFirst({
      where: eq(listings.id, listingId),
    });

    if (!listing) {
      console.log('[FAVORITES] Listing not found:', listingId);
      return { success: false, error: 'Listing not found' };
    }

    console.log('[FAVORITES] Found listing:', listing.id, listing.title);

    // Check if already in favorites
    const existingFavorite = await db.query.buyerFavorites.findFirst({
      where: and(
        eq(buyerFavorites.buyerId, buyer.id),
        eq(buyerFavorites.listingId, listingId)
      ),
    });

    if (existingFavorite) {
      console.log('[FAVORITES] Already in favorites');
      return { success: false, error: 'Already in favorites' };
    }

    // Add to favorites
    console.log('[FAVORITES] Inserting favorite for buyer:', buyer.id, 'listing:', listingId);
    const result = await db.insert(buyerFavorites).values({
      buyerId: buyer.id,
      listingId: listingId,
    });
    console.log('[FAVORITES] Insert result:', result);

    // Create notification for buyer (non-blocking)
    console.log('[FAVORITES] Creating notification');
    db.insert(buyerNotifications).values({
      buyerId: buyer.id,
      type: 'favorite_added',
      title: 'Added to Favorites',
      message: `You added "${listing.title}" to your favorites!`,
      relatedEntityId: listingId,
      relatedEntityType: 'listing',
      actionUrl: `/buyer/product/${listingId}`,
      isRead: false,
      isStarred: false,
      metadata: {
        notificationType: 'favorite_added',
        listingId: listingId,
        listingTitle: listing.title,
      },
    }).catch((notifErr: any) => {
      // Log but don't fail if notification fails
      console.error('[FAVORITES] Failed to create notification:', notifErr);
    });

    console.log('[FAVORITES] Successfully added to favorites:', listingId);
    return { success: true, message: 'Added to favorites' };
  } catch (error) {
    console.error('[FAVORITES] Error adding to favorites:', error);
    if (error instanceof Error) {
      console.error('[FAVORITES] Error details:', error.message, error.stack);
    }
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
    
    let user;
    try {
      user = await getCurrentUser();
    } catch (authErr) {
      console.error('[FAVORITES] Error getting current user:', authErr);
      return { success: false, error: 'Authentication error', favorites: [] };
    }
    
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

    // Get favorites with listing data - limit to 500 for performance
    const favoritesList = await db.query.buyerFavorites.findMany({
      where: eq(buyerFavorites.buyerId, buyer.id),
      with: {
        listing: true,
      },
      limit: 500,
    });

    console.log('[FAVORITES] Found', favoritesList.length, 'favorites');

    // Get collection IDs from favorites that are collections
    const collectionListingIds = favoritesList
      .filter((fav: any) => fav.listing?.type === 'collection' && fav.listing?.collectionId)
      .map((fav: any) => fav.listing.collectionId);

    // Fetch collection items with product prices if there are any collection favorites
    let collectionItemsData: any[] = [];
    if (collectionListingIds.length > 0) {
      collectionItemsData = await db
        .select({
          collectionId: collectionItems.collectionId,
          priceCents: products.priceCents,
          productId: products.id,
        })
        .from(collectionItems)
        .innerJoin(products, eq(collectionItems.productId, products.id))
        .where(inArray(collectionItems.collectionId, collectionListingIds));
    }

    // Group collection items by collectionId for easy lookup
    const collectionItemsByCollectionId = collectionItemsData.reduce((acc, item) => {
      if (!acc[item.collectionId]) {
        acc[item.collectionId] = [];
      }
      acc[item.collectionId].push(item);
      return acc;
    }, {} as Record<string, typeof collectionItemsData>);

    // Transform the data to match the expected frontend structure
    const transformedFavorites = favoritesList
      .filter((fav: any): fav is typeof fav & { listing: NonNullable<typeof fav.listing> } => fav.listing !== null)
      .map((fav: any) => {
        const listing = fav.listing;
        let priceCents = listing.priceCents;
        let quantityAvailable = listing.quantityAvailable;

        // For collections, calculate total price from items
        if (listing.type === 'collection' && listing.collectionId) {
          const items = collectionItemsByCollectionId[listing.collectionId] || [];
          
          if (items.length > 0) {
            // Sum up all item prices
            priceCents = items.reduce((sum: number, item: { priceCents: number | null }) => sum + (item.priceCents || 0), 0);
            // For collections, show total quantity as number of items
            quantityAvailable = items.length;
          }
        }

        return {
          id: fav.id,
          listing: {
            id: listing.id,
            title: listing.title,
            image: listing.image || '',
            price_cents: priceCents,
            currency: listing.currency,
            quantity_available: quantityAvailable,
            type: listing.type,
          },
        };
      });

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