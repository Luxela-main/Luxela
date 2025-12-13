import type { Metadata } from "next";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://theluxela.com";

export interface SEOOptions {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
  sitemapUrls?: string[];
}

export function generateSEO({
  title = "Luxela – Premium Fashion, Beauty & Luxury Shopping",
  description = "Discover luxury fashion, beauty essentials, curated deals, and premium lifestyle products on Luxela.",
  url = BASE_URL,
  image = `${BASE_URL}/og-image.jpg`,
  sitemapUrls = [],
}: SEOOptions = {}): Metadata {
  // Default JSON-LD for WebSite + sitemap URLs
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Luxela",
    url: BASE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: `${BASE_URL}/search?q={search_term_string}`,
      "query-input": "required name=search_term_string",
    },
    sitemap: sitemapUrls.map((u) => ({ "@type": "SiteNavigationElement", url: u })),
  };

  return {
    metadataBase: new URL(BASE_URL),
    title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title,
      description,
      url,
      type: "website",
      siteName: "Luxela",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
    other: {
      "script:ld+json": JSON.stringify(jsonLd),
    },
  };
}