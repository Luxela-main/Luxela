import { Metadata } from "next";
import { db } from "@/server/db";
import { collections, collectionItems, productImages, listings } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { SITE } from "@/lib/seo/config";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  try {
    const { id } = await params;

    // First, resolve the listing ID to get the collection ID
    const listingData = await db
      .select()
      .from(listings)
      .where(eq(listings.id, id))
      .limit(1);

    if (listingData.length === 0) {
      return {
        title: "Collection Not Found",
        description: "The collection you're looking for doesn't exist",
      };
    }

    const collectionId = listingData[0].collectionId;
    const listing = listingData[0];

    // Check if collectionId exists
    if (!collectionId) {
      return {
        title: "Collection Not Found",
        description: "The collection you're looking for doesn't exist",
      };
    }

    // Now get the collection data using the resolved collection ID
    const collectionData = await db
      .select()
      .from(collections)
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (collectionData.length === 0) {
      return {
        title: "Collection Not Found",
        description: "The collection you're looking for doesn't exist",
      };
    }

    const collection = collectionData[0];

    // Get product count in collection
    const itemsData = await db
      .select()
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, collectionId));

    const productCount = itemsData.length;

    // Get first product image for OG image
    const firstProductId = itemsData[0]?.productId;
    let ogImage: string | undefined;

    if (firstProductId) {
      const imageData = await db
        .select()
        .from(productImages)
        .where(eq(productImages.productId, firstProductId))
        .limit(1);

      ogImage = imageData[0]?.imageUrl;
    }

    return {
      title: `${collection.name} | Luxela Fashion Collection`,
      description:
        collection.description ||
        `Explore our ${collection.name} collection with ${productCount} items`,
      keywords: [collection.name, "fashion", "collection", "shop"],
      openGraph: {
        title: `${collection.name} | Luxela Fashion`,
        description:
          collection.description ||
          `Explore our ${collection.name} collection with ${productCount} items`,
        type: "website",
        url: `${SITE.url}/buyer/collection/${id}`,
        images: ogImage
          ? [
              {
                url: ogImage,
                width: 1200,
                height: 630,
                alt: collection.name,
              },
            ]
          : undefined,
      },
      twitter: {
        card: "summary_large_image",
        title: `${collection.name} | Luxela Fashion`,
        description:
          collection.description ||
          `Explore our ${collection.name} collection with ${productCount} items`,
        images: ogImage ? [ogImage] : undefined,
      },
      alternates: {
        canonical: `${SITE.url}/buyer/collection/${id}`,
      },
    };
  } catch (error) {
    console.error("Error generating collection metadata:", error);
    return {
      title: "Collection",
      description: "Explore our fashion collections on Luxela",
    };
  }
}