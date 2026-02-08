import { MetadataRoute } from "next";
import { db } from "@/server/db";
import { listings } from "@/server/db/schema";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${SITE_URL}/`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/buyer/brands`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/buyer/collections`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE_URL}/#about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
  ];

  let productPages: MetadataRoute.Sitemap = [];

  // Skip database queries during build if we're in a build environment without proper DB connection
  if (
    process.env.SKIP_DB_DURING_BUILD === "true" ||
    !process.env.DATABASE_URL
  ) {
    console.warn(
      "Skipping product sitemap generation (database not available during build)"
    );
    return staticPages;
  }

  try {
    // Retry logic for database queries with exponential backoff
    const maxRetries = 3;
    const baseTimeoutMs = 10000; // 10 seconds base timeout
    let rows: any[] = [];
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const timeoutMs = baseTimeoutMs * Math.pow(1.5, attempt);
        console.log(
          `Sitemap query attempt ${attempt + 1}/${maxRetries} (timeout: ${Math.round(timeoutMs)}ms)`
        );

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error("Database query timeout")),
            timeoutMs
          )
        );

        const queryPromise = db
          .select({
            id: listings.id,
            updatedAt: listings.updatedAt,
            image: listings.image,
          })
          .from(listings);

        rows = (await Promise.race([queryPromise, timeoutPromise])) as any[];
        lastError = null;
        break; // Success, exit retry loop
      } catch (err) {
        lastError = err as Error;
        console.warn(
          `Sitemap query attempt ${attempt + 1} failed:`,
          err instanceof Error ? err.message : err
        );

        if (attempt < maxRetries - 1) {
          // Wait before retrying with exponential backoff
          const delayMs = 1000 * Math.pow(1.5, attempt);
          console.log(
            `Retrying in ${Math.round(delayMs)}ms (attempt ${attempt + 2}/${maxRetries})`
          );
          await new Promise((resolve) => setTimeout(resolve, delayMs));
        }
      }
    }

    if (lastError && rows.length === 0) {
      throw lastError;
    }

    productPages = rows.map((product) => ({
      url: `${SITE_URL}/buyer/product/${product.id}`,
      lastModified: product.updatedAt ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.9,
      images: product.image
        ? [
            product.image.startsWith("http")
              ? product.image
              : `${SITE_URL}${product.image}`,
          ]
        : undefined,
    }));

    console.log(`✓ Successfully generated sitemap with ${rows.length} products`);
  } catch (error) {
    console.warn(
      "Failed to generate product sitemap, returning static pages only:",
      error instanceof Error ? error.message : error
    );
    // Return only static pages if database is unavailable
  }

  return [...staticPages, ...productPages];
}