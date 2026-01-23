/**
 * JSON-LD Schema generators for structured data
 * Provides Google, Bing, and other search engines with rich information
 */

export interface ProductSchema {
  '@context': string;
  '@type': string;
  name: string;
  description: string;
  image: string | string[];
  brand: {
    '@type': string;
    name: string;
  };
  offers: {
    '@type': string;
    price: string;
    priceCurrency: string;
    availability: string;
    url?: string;
  };
  aggregateRating?: {
    '@type': string;
    ratingValue: number;
    reviewCount: number;
  };
  seller?: {
    '@type': string;
    name: string;
  };
}

export interface BreadcrumbSchema {
  '@context': string;
  '@type': string;
  itemListElement: Array<{
    '@type': string;
    position: number;
    name: string;
    item?: string;
  }>;
}

export interface OrganizationSchema {
  '@context': string;
  '@type': string;
  name: string;
  url: string;
  logo: string;
  description: string;
  sameAs: string[];
  contactPoint: {
    '@type': string;
    contactType: string;
    email: string;
  };
  address: {
    '@type': string;
    addressCountry: string;
  };
}

/**
 * Generate Product Schema for rich snippets in search results
 */
export function generateProductSchema({
  name,
  description,
  image,
  price,
  currency = 'USD',
  availability = 'InStock',
  ratingValue,
  reviewCount,
  sellerName,
  productUrl,
  brandName = 'Luxela Fashion',
}: {
  name: string;
  description: string;
  image: string | string[];
  price: string;
  currency?: string;
  availability?: string;
  ratingValue?: number;
  reviewCount?: number;
  sellerName?: string;
  productUrl?: string;
  brandName?: string;
}): ProductSchema {
  const schema: ProductSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: Array.isArray(image) ? image : [image],
    brand: {
      '@type': 'Brand',
      name: brandName,
    },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: currency,
      availability: `https://schema.org/${availability}`,
      ...(productUrl && { url: productUrl }),
    },
  };

  if (ratingValue && reviewCount) {
    schema.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Math.min(5, Math.max(1, ratingValue)),
      reviewCount,
    };
  }

  if (sellerName) {
    schema.seller = {
      '@type': 'Organization',
      name: sellerName,
    };
  }

  return schema;
}

/**
 * Generate Breadcrumb Schema for navigation in search results
 */
export function generateBreadcrumbSchema(
  breadcrumbs: Array<{ name: string; url?: string }>
): BreadcrumbSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      ...(crumb.url && { item: crumb.url }),
    })),
  };
}

/**
 * Generate Organization Schema for company information
 */
export function generateOrganizationSchema({
  name = 'Luxela Fashion',
  url = 'https://theluxela.com',
  logo = 'https://theluxela.com/luxela.svg',
  description,
  socialProfiles = [],
  email = 'support@theluxela.com',
}: {
  name?: string;
  url?: string;
  logo?: string;
  description?: string;
  socialProfiles?: string[];
  email?: string;
}): OrganizationSchema {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name,
    url,
    logo,
    description:
      description ||
      'Luxela Fashion offers premium, trendy, and affordable fashion pieces across Africa with fast delivery.',
    sameAs: socialProfiles,
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email,
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'NG',
    },
  };
}

/**
 * Generate WebPage Schema for better indexing
 */
export function generateWebPageSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
}: {
  title: string;
  description: string;
  url: string;
  image: string;
  datePublished?: string;
  dateModified?: string;
}) {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    image,
    datePublished: datePublished || new Date().toISOString(),
    dateModified: dateModified || new Date().toISOString(),
  };
}

/**
 * Generate FAQPage Schema for FAQ content
 */
export function generateFAQSchema(
  faqs: Array<{ question: string; answer: string }>
) {
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