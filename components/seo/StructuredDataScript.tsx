'use client';

import Script from 'next/script';

interface StructuredDataScriptProps {
  data: Record<string, any> | Record<string, any>[];
  id?: string;
}

/**
 * Component to render JSON-LD structured data
 * Usage: <StructuredDataScript data={schema} />
 */
export function StructuredDataScript({
  data,
  id = 'structured-data',
}: StructuredDataScriptProps) {
  return (
    <Script
      id={id}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data),
      }}
      strategy="afterInteractive"
    />
  );
}

/**
 * Render multiple structured data schemas
 */
export function MultipleStructuredData({
  schemas,
  prefix = 'structured-data',
}: {
  schemas: Record<string, any>[];
  prefix?: string;
}) {
  return (
    <>
      {schemas.map((schema, index) => (
        <StructuredDataScript
          key={index}
          data={schema}
          id={`${prefix}-${index}`}
        />
      ))}
    </>
  );
}

/**
 * Render breadcrumb schema (commonly used)
 */
export function BreadcrumbScript({
  breadcrumbs,
}: {
  breadcrumbs: Array<{ name: string; url?: string }>;
}) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: breadcrumbs.map((crumb, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: crumb.url,
    })),
  };

  return <StructuredDataScript data={schema} id="breadcrumb-schema" />;
}