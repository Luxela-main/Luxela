import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/db';
import { listings } from '@/server/db/schema';
import { eq } from 'drizzle-orm';
import type { Listing } from '@/types/listing';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'Product ID is required' },
        { status: 400 }
      );
    }

    const product = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);
    
    if (!product || product.length === 0) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      );
    }

    const response = NextResponse.json(product[0]);
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=3600, stale-while-revalidate=86400'
    );

    return response;
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function HEAD(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    if (!id) {
      return new NextResponse(null, { status: 400 });
    }

    const product = await db
      .select({ id: listings.id })
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (!product || product.length === 0) {
      return new NextResponse(null, { status: 404 });
    }

    return new NextResponse(null, { status: 200 });
  } catch (error) {
    console.error('Error checking product:', error);
    return new NextResponse(null, { status: 500 });
  }
}