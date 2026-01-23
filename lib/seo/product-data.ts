import type { Listing } from '@/types/listing';
import { db } from '@/server/db';
import { listings, sellers } from '@/server/db/schema';
import { eq } from 'drizzle-orm';

type ListingWithSeller = Listing & {
  seller?: {
    id: string;
    storeName: string | null;
    storeLogo: string | null;
    seller_business: any[];
  };
};

export async function getProductData(id: string): Promise<ListingWithSeller | null> {
  try {
    const product = await db
      .select()
      .from(listings)
      .leftJoin(sellers, eq(listings.sellerId, sellers.id))
      .where(eq(listings.id, id))
      .limit(1);

    if (!product || product.length === 0) {
      return null;
    }

    const result = product[0];
    const listing = result.listings;
    const seller = result.sellers;

    return {
      id: listing.id,
      title: listing.title,
      description: listing.description,
      image: listing.image || '',
      price_cents: listing.priceCents || 0,
      currency: listing.currency || 'USD',
      category: listing.category || '',
      colors_available: listing.colorsAvailable,
      type: listing.type,
      quantity_available: listing.quantityAvailable || 0,
      sizes_json: listing.sizesJson,
      material_composition: listing.materialComposition,
      limited_edition_badge: listing.limitedEditionBadge,
      shipping_option: listing.shippingOption,
      eta_domestic: listing.etaDomestic,
      eta_international: listing.etaInternational,
      additional_target_audience: listing.additionalTargetAudience,
      supply_capacity: listing.supplyCapacity,
      release_duration: listing.releaseDuration,
      items_json: listing.itemsJson,
      created_at: listing.createdAt.toISOString(),
      updated_at: listing.updatedAt.toISOString(),
      seller_id: listing.sellerId,
      product_id: listing.productId,
      sellers: seller ? {
        id: seller.id,
        seller_business: [],
      } : {
        id: '',
        seller_business: [],
      },
    } as ListingWithSeller;
  } catch (error) {
    console.error(`Error fetching product ${id}:`, error);
    return null;
  }
}

export function generateProductBreadcrumbs(product: ListingWithSeller) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: `${process.env.NEXT_PUBLIC_SITE_URL}`,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Shop',
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/shop`,
      },
      ...(product.category
        ? [
            {
              '@type': 'ListItem',
              position: 3,
              name: product.category,
              item: `${process.env.NEXT_PUBLIC_SITE_URL}/shop?category=${encodeURIComponent(
                product.category
              )}`,
            },
          ]
        : []),
      {
        '@type': 'ListItem',
        position: product.category ? 4 : 3,
        name: product.title,
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/buyer/product/${product.id}`,
      },
    ],
  };
}

export function formatPriceForSchema(priceCents?: number): string | undefined {
  if (!priceCents) return undefined;
  return (priceCents / 100).toFixed(2);
}