/**
 * Structured Data (JSON-LD) generators for enterprise SEO
 * Provides rich snippets for Google, Bing, and other search engines
 */

import { SITE } from './config';

/**
 * Base schema context and type
 */
interface BaseSchema {
  '@context': 'https://schema.org';
  '@type': string;
  [key: string]: any;
}

/**
 * Generate Product schema with comprehensive fields
 */
export function generateProductSchema({
  id,
  name,
  description,
  image,
  brand = SITE.name,
  price,
  currency = 'USD',
  availability = 'https://schema.org/InStock',
  url,
  rating,
  reviewCount,
  seller,
  sku,
  category,
}: {
  id: string;
  name: string;
  description: string;
  image: string | string[];
  brand?: string;
  price: number | string;
  currency?: string;
  availability?: string;
  url?: string;
  rating?: number;
  reviewCount?: number;
  seller?: string;
  sku?: string;
  category?: string;
}): BaseSchema {
  const images = Array.isArray(image) ? image : [image];

  const schema: BaseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: images.map((img) =>
      img.startsWith('http') ? img : `${SITE.url}${img}`
    ),
    brand: {
      '@type': 'Brand',
      name: brand,
    },
    offers: {
      '@type': 'Offer',
      url: url || `${SITE.url}/buyer/product/${id}`,
      priceCurrency: currency,
      price: String(price),
      availability,
      seller: seller
        ? {
            '@type': 'Organization',
            name: seller,
          }
        : undefined,
    },
  };

  // Add optional fields
  if (rating && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, rating)),
      reviewCount,
    };
  }

  if (sku) schema.sku = sku;
  if (category) schema.category = category;

  // Remove undefined values
  Object.keys(schema).forEach(
    (key) => schema[key] === undefined && delete schema[key]
  );

  return schema;
}

/**
 * Generate Breadcrumb schema for navigation
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url?: string }>
): BaseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url || `${SITE.url}/${crumb.name.toLowerCase()}`,
    })),
  };
}

/**
 * Generate Organization schema
 */
export function generateOrganizationSchema({
  name = SITE.name,
  url = SITE.url,
  logo = `${SITE.url}/luxela-logo.svg`,
  description = SITE.description,
  socialProfiles = [],
  email = 'support@theluxela.com',
  phone = '',
  address = {},
}: {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  socialProfiles?: string[];
  email?: string;
  phone?: string;
  address?: Record<string, string>;
}): BaseSchema {
  const schema: BaseSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description,
    sameAs: socialProfiles,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email,
      ...(phone && { telephone: phone }),
    },
    address: {
      '@type': 'PostalAddress',
      ...address,
    },
  };

  // Clean up undefined values
  Object.keys(schema).forEach(
    (key) => schema[key] === undefined && delete schema[key]
  );

  return schema;
}

/**
 * Generate LocalBusiness schema
 */
export function generateLocalBusinessSchema({
  name = SITE.name,
  type = 'ECommerce Business',
  url = SITE.url,
  logo = `${SITE.url}/luxela-logo.svg`,
  description = SITE.description,
  email = 'support@theluxela.com',
  phone = '',
  address = {
    streetAddress: '',
    addressLocality: 'Lagos',
    addressRegion: 'Lagos',
    postalCode: '',
    addressCountry: 'NG',
  },
  priceRange = '$$',
  openingHours = [],
}: {
  name?: string;
  type?: string;
  url?: string;
  logo?: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: Record<string, string>;
  priceRange?: string;
  openingHours?: string[];
}): BaseSchema {
  const schema: BaseSchema = {
    '@context': 'https://schema.org',
    '@type': 'LocalBusiness',
    name,
    description,
    url,
    logo,
    address: {
      '@type': 'PostalAddress',
      ...address,
    },
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email,
      ...(phone && { telephone: phone }),
    },
    priceRange,
    sameAs: [
      'https://www.instagram.com/luxelaplace',
      'https://www.twitter.com/LuxelaPlace',
    ],
  };

  if (openingHours.length > 0) {
    schema.openingHoursSpecification = openingHours;
  }

  return schema;
}

/**
 * Generate WebSite schema with search action
 */
export function generateWebSiteSchema({
  url = SITE.url,
  name = SITE.name,
  searchUrl = `${SITE.url}/buyer/search`,
}: {
  url?: string;
  name?: string;
  searchUrl?: string;
}): BaseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    url,
    name,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${searchUrl}?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

/**
 * Generate CollectionPage schema
 */
export function generateCollectionSchema({
  name,
  description,
  url,
  image,
  itemCount = 0,
}: {
  name: string;
  description: string;
  url: string;
  image?: string;
  itemCount?: number;
}): BaseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name,
    description,
    url,
    image: image || `${SITE.url}/luxela-banner.jpg`,
    ...(itemCount && { numberOfItems: itemCount }),
  };
}

/**
 * Generate FAQPage schema
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
): BaseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

/**
 * Generate Article/BlogPosting schema
 */
export function generateArticleSchema({
  title,
  description,
  content,
  image,
  author,
  datePublished,
  dateModified,
  url,
}: {
  title: string;
  description: string;
  content: string;
  image: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  url: string;
}): BaseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: title,
    description,
    image,
    content,
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished,
    dateModified: dateModified || datePublished,
    url,
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': url,
    },
  };
}

/**
 * Generate AggregateOffer schema for product variants
 */
export function generateAggregateOfferSchema({
  lowestPrice,
  highestPrice,
  currency = 'USD',
  availability = 'https://schema.org/InStock',
  priceCurrency,
  offerCount,
  url,
}: {
  lowestPrice: number | string;
  highestPrice: number | string;
  currency?: string;
  availability?: string;
  priceCurrency?: string;
  offerCount?: number;
  url?: string;
}): BaseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'AggregateOffer',
    priceCurrency: priceCurrency || currency,
    lowPrice: String(lowestPrice),
    highPrice: String(highestPrice),
    offerCount: offerCount || 1,
    availability,
    url,
  };
}

/**
 * Generate ImageObject schema
 */
export function generateImageSchema({
  url,
  width,
  height,
  description,
}: {
  url: string;
  width?: number;
  height?: number;
  description?: string;
}): BaseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ImageObject',
    url: url.startsWith('http') ? url : `${SITE.url}${url}`,
    width,
    height,
    description,
  };
}

/**
 * Generate Review schema
 */
export function generateReviewSchema({
  reviewRating,
  author,
  datePublished,
  reviewBody,
  name,
}: {
  reviewRating: number;
  author: string;
  datePublished: string;
  reviewBody: string;
  name?: string;
}): BaseSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Review',
    reviewRating: {
      '@type': 'Rating',
      ratingValue: reviewRating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      '@type': 'Person',
      name: author,
    },
    datePublished,
    reviewBody,
    ...(name && { name }),
  };
}

/**
 * Combine multiple schemas into an array (for use in Script component)
 */
export function combineSchemas(...schemas: BaseSchema[]): string {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@graph': schemas,
  });
}

/**
 * Serialize a single schema for Script tag
 */
export function serializeSchema(schema: BaseSchema): string {
  return JSON.stringify(schema);
}