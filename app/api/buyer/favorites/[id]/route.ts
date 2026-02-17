import { getCurrentUser } from '@/lib/utils/getCurrentUser';
import { db } from '@/server/db';
import { buyerFavorites, buyers } from '@/server/db/schema';
import { eq, and } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id: favoriteId } = await params;

    // Get buyer record
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.userId, user.id),
    });

    if (!buyer) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      );
    }

    // Get favorite to verify ownership
    const favorite = await db.query.buyerFavorites.findFirst({
      where: eq(buyerFavorites.id, favoriteId),
    });

    if (!favorite || favorite.buyerId !== buyer.id) {
      return NextResponse.json(
        { error: 'Favorite not found' },
        { status: 404 }
      );
    }

    // Delete the favorite
    await db.delete(buyerFavorites).where(
      eq(buyerFavorites.id, favoriteId)
    );

    return NextResponse.json(
      { message: 'Favorite removed successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting favorite:', error);
    return NextResponse.json(
      { error: 'Failed to delete favorite' },
      { status: 500 }
    );
  }
}