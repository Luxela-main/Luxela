import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/server/db';
import { buyers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Simple in-memory store for brand follows (use Redis in production)
const brandFollowsStore = new Map<string, Set<string>>();

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { brandId, action } = body;

    if (!brandId || !['follow', 'unfollow'].includes(action)) {
      return NextResponse.json(
        { error: 'Missing or invalid brandId/action' },
        { status: 400 }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.slice(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get buyer
    const buyerResult = await db
      .select({ id: buyers.id })
      .from(buyers)
      .where(eq(buyers.userId, user.id))
      .limit(1);

    if (!buyerResult.length) {
      return NextResponse.json(
        { error: 'Buyer profile not found' },
        { status: 404 }
      );
    }

    const buyerId = buyerResult[0].id;
    const followKey = `brand_${brandId}`;

    // Initialize if needed
    if (!brandFollowsStore.has(buyerId)) {
      brandFollowsStore.set(buyerId, new Set());
    }

    const follows = brandFollowsStore.get(buyerId)!;

    if (action === 'follow') {
      follows.add(followKey);
      return NextResponse.json({
        success: true,
        message: 'Brand followed successfully',
        isFollowing: true,
      });
    } else {
      follows.delete(followKey);
      return NextResponse.json({
        success: true,
        message: 'Brand unfollowed successfully',
        isFollowing: false,
      });
    }
  } catch (error) {
    console.error('Follow brand error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ followedBrands: [] });
    }

    const token = authHeader.slice(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ followedBrands: [] });
    }

    // Get buyer
    const buyerResult = await db
      .select({ id: buyers.id })
      .from(buyers)
      .where(eq(buyers.userId, user.id))
      .limit(1);

    if (!buyerResult.length) {
      return NextResponse.json({ followedBrands: [] });
    }

    const buyerId = buyerResult[0].id;
    const follows = brandFollowsStore.get(buyerId) || new Set();

    return NextResponse.json({
      followedBrands: Array.from(follows),
    });
  } catch (error) {
    console.error('Get followed brands error:', error);
    return NextResponse.json({ followedBrands: [] });
  }
}