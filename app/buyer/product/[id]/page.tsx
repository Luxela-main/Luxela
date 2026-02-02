"use client";

import { use } from "react";
import { useListings } from "@/context/ListingsContext";
import ProductImageGallery from "@/components/buyer/ProductImageGallery";
import ProductInfo from "@/components/buyer/ProductInfo";
import ProductDescription from "@/components/buyer/ProductDescription";
import ProductReviews from "@/components/buyer/ProductReviews";
import VendorDetails from "@/components/buyer/VendorDetails";
import RelatedProducts from "@/components/buyer/RelatedProducts";
import Breadcrumb from "@/components/buyer/Breadcrumb";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo/structured-data";
import { SITE } from "@/lib/seo/config";

function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getListingById, getListingsByBrand, loading } = useListings();

  if (loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  const product = getListingById(id);
  const business = product?.sellers?.seller_business?.[0];

  if (!product) {
    return (
      <div className="bg-black min-h-screen flex flex-col justify-center text-white p-8 text-center">
        <h1 className="text-2xl text-center">Product not found</h1>
      </div>
    );
  }

  const brandProducts = getListingsByBrand(business?.brand_name || "").filter(
    (p) => p.id !== id
  );

  const productSchema = generateProductSchema({
    id: product.id,
    name: product.title || "Product",
    description: product.description || "",
    image: product.image || "",
    price: ((product.price_cents || 0) / 100).toString(),
    currency: product.currency || "NGN",
    availability: product.quantity_available && product.quantity_available > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    brand: business?.brand_name || "Luxela",
    url: `${SITE.url}/buyer/product/${product.id}`,
  });

  const breadcrumbSchema = generateBreadcrumbSchema([
    { name: "Home", url: SITE.url },
    { name: "Products", url: `${SITE.url}/buyer` },
    { name: product.title || "Product", url: `${SITE.url}/buyer/product/${product.id}` },
  ]);

  return (
    <>
      <JsonLdScript data={productSchema} id="product-schema" />
      <JsonLdScript data={breadcrumbSchema} id="breadcrumb-schema" />
      <div className="bg-black min-h-screen text-white lg:px-12">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <Breadcrumb product={product as any} business={business} />

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <ProductImageGallery product={product} />
          <ProductInfo product={product} business={business} />
        </div>

        <div className="grid lg:grid-cols-2 gap-8 mb-16">
          <div className="lg:col-span-6">
            <ProductDescription product={product} />
            <VendorDetails
              business={business}
              totalItems={brandProducts.length}
            />
          </div>

          <div className="lg:col-span-6">
            <ProductReviews productId={product.id} />
          </div>
        </div>

        <RelatedProducts
          products={brandProducts}
          brandName={business?.brand_name}
        />
      </div>
    </div>
    </>
  );
}

export default ProductDetailPage;