import { MetadataRoute } from "next";
import { db } from "@/server/db";
import { listings } from "@/server/db/schema";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

  let listingItems: { id: string; updatedAt: Date }[] = [];

  // Static pages
  const staticUrls = [
    `${SITE_URL}/`,
    `${SITE_URL}/buyer/brands`,
    `${SITE_URL}/buyer/collections`,
    `${SITE_URL}/#about`,
  ];

  // Dynamic product pages
  let productUrls: string[] = [];
  try {
    const rows = await db.select({ id: listings.id }).from(listings);
    productUrls = rows.map((p) => `${SITE_URL}/buyer/product/${p.id}`);
  } catch (err) {
    console.error("Error fetching products for sitemap.xml:", err);
  }

  const allUrls = [...staticUrls, ...productUrls];

const sitemap: MetadataRoute.Sitemap = allUrls.map((url) => ({
  url,
  changeFrequency: "weekly",
  priority: 0.8,
}));

return sitemap;
};
