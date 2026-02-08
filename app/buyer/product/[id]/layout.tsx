import type { Metadata } from 'next';
import { generatePageMetadata } from '@/lib/seo/metadata-generators';
import { getProductData } from '@/lib/seo/product-data';

interface ProductLayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

export async function generateMetadata(
  { params }: Omit<ProductLayoutProps, 'children'>
): Promise<Metadata> {
  const { id } = await params;

  const product = await getProductData(id);

  if (!product) {
    return {
      title: 'Product Not Found',
      description: 'The product you are looking for does not exist.',
    };
  }

  const price = product.price_cents ? (product.price_cents / 100).toFixed(2) : undefined;
  const currency = product.currency || 'NGN';

  return generatePageMetadata({
    title: product.title,
    description: product.description || `Check out ${product.title} on our platform`,
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/buyer/product/${id}`,
    image: product.image || undefined,
    imageAlt: product.title,
    keywords: [
      product.title,
      product.category,
      product.seller?.seller_business?.[0]?.brandName,
      'buy online',
      'shop',
    ].filter(Boolean) as string[],
    author: product.seller?.storeName || undefined,
    modifiedDate: product.updated_at,
    structuredData: {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.title,
      description: product.description,
      image: product.image,
      brand: {
        '@type': 'Brand',
        name: product.seller?.seller_business?.[0]?.brandName || 'Unknown Brand',
      },
      seller: {
        '@type': 'Organization',
        name: product.seller?.storeName || 'Store',
        logo: product.seller?.storeLogo || undefined,
      },
      ...(price && {
        offers: {
          '@type': 'Offer',
          price: price,
          priceCurrency: currency,
          availability: product.quantity_available ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/buyer/product/${id}`,
        },
      }),
    },
  });
}

export default async function ProductLayout({
  children,
  params,
}: ProductLayoutProps) {
  return <>{children}</>;
}