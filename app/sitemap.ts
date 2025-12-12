import { NextResponse } from "next/server";
import { db } from "@/server/db";
import { listings } from "@/server/db/schema";

export const GET = async () => {
  const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

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

  const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${allUrls
    .map(
      (url) => `
    <url>
      <loc>${url}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.8</priority>
    </url>
  `
    )
    .join("")}
</urlset>`;

  return new NextResponse(sitemapXml, {
    headers: {
      "Content-Type": "application/xml",
    },
  });
};
