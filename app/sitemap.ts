import { MetadataRoute } from "next";

/**
 * Main sitemap for static content
 * Enterprise-level ecommerce sitemap for Luxela
 * Serves as the primary sitemap for Google/Bing
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";
  const today = new Date();

  // Core static pages (high priority)
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 1.0,
    },
    // Buyer Hub
    {
      url: `${SITE_URL}/buyer/brands`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${SITE_URL}/buyer/collections`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.9,
    },
    // Authentication
    {
      url: `${SITE_URL}/signin`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${SITE_URL}/signup`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    // Account/User
    {
      url: `${SITE_URL}/account`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    // Sellers Program
    {
      url: `${SITE_URL}/sellers`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    // Support Pages
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${SITE_URL}/contact`,
      lastModified: today,
      changeFrequency: "monthly",
      priority: 0.5,
    },
    // Cart
    {
      url: `${SITE_URL}/cart`,
      lastModified: today,
      changeFrequency: "daily",
      priority: 0.7,
    },
  ];

  console.log("✓ Generated enterprise sitemap for Luxela");
  console.log(`  → Main pages: ${staticPages.length} URLs`);
  console.log("  → Dynamic products: See /sitemap.xml for brand/collection pagination");

  return staticPages;
}