import { MetadataRoute } from "next";
import { db } from "@/server/db";
import { listings } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

  let listingItems: { id: string; updatedAt: Date }[] = [];

  try {
    const rows = await db
      .select({
        id: listings.id,
        updatedAt: listings.updatedAt,
      })
      .from(listings);

    listingItems = rows.map((item) => ({
      id: item.id,
      updatedAt: new Date(item.updatedAt),
    }));
  } catch (error) {
    console.error("Error querying listings for sitemap:", error);
  }

  const listingUrls = listingItems.map((product) => ({
    url: `${SITE_URL}/product/${product.id}`,
    lastModified: product.updatedAt,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1,
    },
    ...listingUrls,
  ];
}