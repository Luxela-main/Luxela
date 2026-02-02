import { Metadata } from "next";
import { db } from "@/server/db";
import { products, productImages, reviews } from "@/server/db/schema";
import { eq } from "drizzle-orm";
import { generateProductMetadata } from "@/lib/seo/metadata-generators";
import { SITE } from "@/lib/seo/config";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  try {
    const { id } = await params;

    const productData = await db
      .select()
      .from(products)
      .where(eq(products.id, id))
      .limit(1);

    if (productData.length === 0) {
      return {
        title: "Product Not Found",
        description: "The product you're looking for doesn't exist",
      };
    }

    const product = productData[0];

    // Fetch product images
    const productImageData = await db
      .select()
      .from(productImages)
      .where(eq(productImages.productId, id));

    const imageUrl = productImageData[0]?.imageUrl || "/placeholder.png";

    // Fetch reviews and calculate rating
    const reviewData = await db
      .select()
      .from(reviews)
      .where(eq(reviews.listingId, id));

    // Calculate average rating from reviews
    const averageRating = reviewData.length > 0
      ? reviewData.reduce((sum, review) => sum + review.rating, 0) / reviewData.length
      : 0;

    return generateProductMetadata({
      title: product.name,
      description: product.description || "",
      price: product.price.toString(),
      image: imageUrl,
      rating: averageRating,
      reviewCount: reviewData.length,
      canonical: `${SITE.url}/buyer/product/${product.id}`,
    });
  } catch (error) {
    console.error("Error generating product metadata:", error);
    return {
      title: "Product",
      description: "View product details on Luxela",
    };
  }
}