"use client";

import { use, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useListings } from "@/context/ListingsContext";
import ProductImageCarousel from "@/components/buyer/product-display/ProductImageCarousel";
import ProductInfo from "@/components/buyer/ProductInfo";
import ProductDescription from "@/components/buyer/ProductDescription";
import ProductReviews from "@/components/buyer/ProductReviews";
import VendorDetails from "@/components/buyer/VendorDetails";
import RelatedProducts from "@/components/buyer/RelatedProducts";
import Breadcrumb from "@/components/buyer/Breadcrumb";
import { JsonLdScript } from "@/components/seo/JsonLdScript";
import { generateProductSchema, generateBreadcrumbSchema } from "@/lib/seo/structured-data";
import { parseListingImages } from "@/modules/buyer/hooks/useUnifiedListings";
import { SITE } from "@/lib/seo/config";
import { Loader2, AlertCircle, Share2, Heart } from "lucide-react";

function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const searchParams = useSearchParams();
  const brandSlug = searchParams.get('brand');
  const { getApprovedListingById, getListingsByBrand, loading, isListingApproved } = useListings();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [brandProducts, setBrandProducts] = useState<any[]>([]);

  // Fetch complete listing details on mount
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setIsLoading(true);
        console.log('[ProductDetailPage] Fetching product:', id);
        const listing = await getApprovedListingById(id);
        if (listing) {
          console.log('[ProductDetailPage] Successfully loaded product:', {
            id: listing.id,
            title: listing.title,
            hasMaterialComposition: !!listing.material_composition,
            hasCareInstructions: !!listing.care_instructions,
            hasVideoUrl: !!listing.video_url,
            hasImagesJson: !!listing.imagesJson,
            imagesJsonLength: listing.imagesJson ? listing.imagesJson.length : 0,
            hasImage: !!listing.image,
            imagesJsonSample: listing.imagesJson ? listing.imagesJson.substring(0, 100) : 'none',
          });
          setProduct(listing);
          setIsApproved(true);
        } else {
          console.warn('[ProductDetailPage] Product not found or not approved:', id);
          setProduct(null);
          setIsApproved(false);
        }
      } catch (err) {
        console.error('[ProductDetailPage] Error fetching product:', {
          id,
          error: err instanceof Error ? err.message : String(err),
        });
        setProduct(null);
        setIsApproved(false);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [id, getApprovedListingById]);

  if (isLoading || loading) {
    return (
      <div className="bg-black min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-[#8451E1] animate-spin mx-auto mb-3" />
          <p className="text-[#acacac]">Loading product...</p>
        </div>
      </div>
    );
  }

  const business = product?.sellers?.seller_business?.[0];

  if (!product || !isApproved) {
    console.warn('[ProductDetailPage] Showing 404 - product:', {
      productExists: !!product,
      isApproved,
      requestedId: id,
      productId: product?.id,
    });
    return (
      <div className="bg-black min-h-screen flex items-center justify-center p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-white mb-2">Product unavailable</h1>
          <p className="text-[#acacac] mb-6">This product is not currently available for purchase. It may have been removed, is out of stock, or is not approved for sale yet.</p>
          <a
            href="/buyer"
            className="inline-block px-6 py-2.5 bg-[#8451E1] text-white rounded-lg font-semibold hover:bg-[#7240D0] transition-colors"
          >
            Back to Browse
          </a>
        </div>
      </div>
    );
  }

  // brandProducts are now set in useEffect above

  const productSchema = product ? generateProductSchema({
    id: product.id,
    name: product.title || "Product",
    description: product.description || "",
    image: parseListingImages(product),
    price: ((product.price_cents || 0) / 100).toString(),
    currency: product.currency || "NGN",
    availability:
      isApproved && product.quantity_available && product.quantity_available > 0
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
    brand: business?.brand_name || "Luxela",
    url: `${SITE.url}/buyer/product/${product.id}`,
  }) : null;

  const breadcrumbSchema = product ? generateBreadcrumbSchema([
    { name: "Home", url: SITE.url },
    { name: "Products", url: `${SITE.url}/buyer` },
    { name: product.title || "Product", url: `${SITE.url}/buyer/product/${product.id}` },
  ]) : null;

  return (
    <>
      {productSchema && <JsonLdScript data={productSchema} id="product-schema" />}
      {breadcrumbSchema && <JsonLdScript data={breadcrumbSchema} id="breadcrumb-schema" />}
      <div className="bg-black min-h-screen text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-12 sm:py-16">
          {/* Breadcrumb */}
          <div className="mb-12">
            <Breadcrumb product={product as any} business={business} />
          </div>

          {/* Product Main Section - Premium Layout */}
          <div className="grid lg:grid-cols-12 gap-12 mb-20">
            {/* Image Gallery - 5 cols */}
            <div className="lg:col-span-6 flex flex-col">
              <ProductImageCarousel
                images={(() => {
                  try {
                    let images: string[] = [];
                    if (typeof product?.imagesJson === 'string') {
                      images = JSON.parse(product.imagesJson);
                    } else if (Array.isArray(product?.imagesJson)) {
                      images = product.imagesJson;
                    } else if (product?.image) {
                      images = [product.image];
                    }
                    return images;
                  } catch (error) {
                    console.error('[ProductImageCarousel] Error parsing images:', error);
                    return product?.image ? [product.image] : [];
                  }
                })()}
                alt={product?.name || product?.title || 'Product'}
              />
            </div>

            {/* Product Info - 7 cols for asymmetric luxury feel */}
            <div className="lg:col-span-6 flex flex-col justify-start">
              <ProductInfo product={product} business={business} />
            </div>
          </div>

          {/* Content Section - Improved spacing and typography */}
          <div className="space-y-20 mb-20">
            {/* Product Description - Full Width */}
            <section>
              <ProductDescription product={product} />
            </section>

            {/* Two Column: Vendor + Reviews */}
            <section className="grid lg:grid-cols-3 gap-12">
              {/* Main Content - 2 columns */}
              <div className="lg:col-span-2">
                <VendorDetails
                  business={business}
                  totalItems={brandProducts.length}
                />
              </div>

              {/* Reviews Sidebar */}
              <div>
                <ProductReviews productId={product.id} />
              </div>
            </section>
          </div>

          {/* Related Products - Full Width */}
          {brandProducts.length > 0 && (
            <section className="border-t border-[#1a1a1a] pt-20">
              <RelatedProducts
                products={brandProducts}
                brandName={business?.brand_name}
              />
            </section>
          )}
        </div>
      </div>
    </>
  );
}

export default ProductDetailPage;