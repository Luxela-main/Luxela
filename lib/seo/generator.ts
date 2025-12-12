import type { Metadata } from "next";
import { SITE } from "./config";

export function createMetadata({
  title,
  description,
  canonical,
  images = [],
  keywords = [],
  openGraph = {},
}: {
  title: string;
  description?: string;
  canonical: string;
  images?: string[];
  keywords?: string[];
  openGraph?: Partial<Metadata["openGraph"]>;
}): Metadata {
  const metaTitle = `${title} | ${SITE.name}`;
  const metaDescription = description ?? SITE.description;

  return {
    title: metaTitle,
    description: metaDescription,
    keywords: [...SITE.keywords, ...keywords].join(", "),
    alternates: {
      canonical,
    },
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      siteName: SITE.name,
      locale: SITE.locale,
      type: "website",
      images: images.map((i) => ({
        url: i,
        width: 1200,
        height: 630,
        alt: title,
      })),
      ...openGraph,
    },
    twitter: {
      card: "summary_large_image",
      creator: SITE.twitter,
      title: metaTitle,
      description: metaDescription,
      images,
    },
  };
}