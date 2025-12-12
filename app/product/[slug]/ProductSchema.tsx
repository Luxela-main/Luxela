"use client";

export function ProductSchema({ product }: { product: any }) {
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    image: product.images,
    description: product.shortDescription,
    sku: product.sku,
    brand: { "@type": "Brand", name: "Luxela Fashion" },
    offers: {
      "@type": "Offer",
      priceCurrency: "NGN",
      price: product.price,
      availability: product.inStock ? "InStock" : "OutOfStock",
      url: `https://theluxela.com/product/${product.slug}`,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(schema),
      }}
    />
  );
}
