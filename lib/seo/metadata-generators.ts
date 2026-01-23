/**
 * Advanced metadata generators for enterprise-level SEO
 * Handles dynamic metadata, Open Graph, Twitter Cards, and structured data
 */

import type { Metadata } from 'next';
import { SITE } from './config';

export interface SEOMetadataProps {
  title: string;
  description?: string;
  canonical: string;
  image?: string;
  imageAlt?: string;
  keywords?: string[];
  author?: string;
  publishedDate?: string;
  modifiedDate?: string;
  noindex?: boolean;
  robots?: string;
  twitterHandle?: string;
  structuredData?: Record<string, any>;
}

/**
 * Generate comprehensive metadata for any page
 */
export function generatePageMetadata({
  title,
  description,
  canonical,
  image = SITE.defaultImage,
  imageAlt = title,
  keywords = [],
  author,
  publishedDate,
  modifiedDate,
  noindex = false,
  robots,
  twitterHandle = SITE.twitter,
  structuredData,
}: SEOMetadataProps): Metadata {
  const metaTitle = `${title} | ${SITE.name}`;
  const metaDescription = description || SITE.description;
  const allKeywords = [...SITE.keywords, ...keywords];

  const metadata: Metadata = {
    title: metaTitle,
    description: metaDescription,
    keywords: allKeywords.length > 0 ? allKeywords.join(', ') : undefined,
    authors: author ? [{ name: author }] : undefined,
    openGraph: {
      title: metaTitle,
      description: metaDescription,
      url: canonical,
      siteName: SITE.name,
      locale: SITE.locale,
      type: 'website',
      images: [
        {
          url: image,
          width: 1200,
          height: 630,
          alt: imageAlt,
        },
        {
          url: image,
          width: 800,
          height: 600,
          alt: imageAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: metaTitle,
      description: metaDescription,
      creator: twitterHandle,
      images: [image],
    },
    alternates: {
      canonical,
    },
    robots: {
      index: !noindex,
      follow: !noindex,
      nocache: noindex,
      ...(robots && { all: robots }),
      googleBot: {
        index: !noindex,
        follow: !noindex,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
    },
    category: 'Fashion',
    ...(publishedDate && { other: { 'article:published_time': publishedDate } }),
    ...(modifiedDate && { other: { 'article:modified_time': modifiedDate } }),
  };

  return metadata;
}

/**
 * Generate product-specific metadata with rich snippets
 */
export function generateProductMetadata({
  title,
  description,
  canonical,
  image,
  price,
  currency = 'USD',
  availability = 'InStock',
  rating,
  reviewCount,
  seller,
  imageAlt = title,
  keywords = [],
}: SEOMetadataProps & {
  price: number | string;
  currency?: string;
  availability?: 'InStock' | 'OutOfStock' | 'PreOrder';
  rating?: number;
  reviewCount?: number;
  seller?: string;
}): Metadata {
  const baseMetadata = generatePageMetadata({
    title,
    description,
    canonical,
    image,
    imageAlt,
    keywords: ['product', 'buy', ...keywords],
  });

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: 'website',
    },
    other: {
      'og:type': 'product',
      ...(price && { 'product:price:amount': String(price) }),
      ...(currency && { 'product:price:currency': currency }),
    },
  };
}

/**
 * Generate collection/category metadata
 */
export function generateCollectionMetadata({
  title,
  description,
  canonical,
  image,
  itemCount,
  imageAlt = title,
  keywords = [],
}: SEOMetadataProps & {
  itemCount?: number;
}): Metadata {
  const metaDescription = description || `Explore our ${title} collection`;
  
  return generatePageMetadata({
    title,
    description: metaDescription,
    canonical,
    image,
    imageAlt,
    keywords: ['collection', 'shop', ...keywords],
  });
}

/**
 * Generate brand/seller metadata
 */
export function generateBrandMetadata({
  title,
  description,
  canonical,
  image,
  imageAlt = title,
  keywords = [],
  author,
}: SEOMetadataProps): Metadata {
  return generatePageMetadata({
    title,
    description,
    canonical,
    image,
    imageAlt,
    keywords: ['brand', 'shop', ...keywords],
    author,
  });
}

/**
 * Generate article/blog metadata
 */
export function generateArticleMetadata({
  title,
  description,
  canonical,
  image,
  author,
  publishedDate,
  modifiedDate,
  imageAlt = title,
  keywords = [],
}: SEOMetadataProps): Metadata {
  const baseMetadata = generatePageMetadata({
    title,
    description,
    canonical,
    image,
    imageAlt,
    author,
    publishedDate,
    modifiedDate,
    keywords: ['article', 'blog', ...keywords],
  });

  return {
    ...baseMetadata,
    openGraph: {
      ...baseMetadata.openGraph,
      type: 'article',
    },
  };
}

/**
 * Generate 404 page metadata (with noindex)
 */
export function generate404Metadata(): Metadata {
  return generatePageMetadata({
    title: 'Page Not Found',
    description: 'The page you are looking for does not exist.',
    canonical: `${SITE.url}/404`,
    noindex: true,
  });
}

/**
 * Construct full URL for canonical and Open Graph
 */
export function constructFullUrl(path: string): string {
  const baseUrl = SITE.url.endsWith('/') ? SITE.url.slice(0, -1) : SITE.url;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${baseUrl}${cleanPath}`;
}

/**
 * Validate and sanitize metadata values
 */
export function sanitizeMetadata(value: string | undefined): string | undefined {
  if (!value) return undefined;
  
  // Remove special characters but keep reasonable length
  return value
    .replace(/[\n\r\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 160); // Meta description limit
}

/**
 * Generate mobile app metadata for PWA
 */
export function generatePWAMetadata(): Record<string, any> {
  return {
    'mobile-web-app-capable': 'yes',
    'mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-status-bar-style': 'black-translucent',
    'apple-mobile-web-app-title': SITE.name,
    'theme-color': '#000000',
  };
}