import { MetadataRoute } from "next";
import { db } from "@/server/db";
import { listings } from "@/server/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, lastModified: new Date(), changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/buyer/brands`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/buyer/collections`, lastModified: new Date(), changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE_URL}/#about`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.4 },
  ];

  let productPages: MetadataRoute.Sitemap = [];

  try {
    const rows = await db.select({
      id: listings.id,
      updatedAt: listings.updatedAt,
      image: listings.image,
    }).from(listings);

    productPages = rows.map(product => ({
      url: `${SITE_URL}/buyer/product/${product.id}`,
      lastModified: product.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: product.image ? [product.image.startsWith("http") ? product.image : `${SITE_URL}${product.image}`] : undefined,
    }));
  } catch (error) {
    console.error("Failed to generate product sitemap:", error);
  }

  return [...staticPages, ...productPages];
}