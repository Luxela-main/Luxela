/**
 * Helper utilities for fetching and transforming collection product data
 * Provides data transformation, filtering, and enrichment functions
 */

export interface ProductImage {
  id: string;
  product_id: string;
  image_url: string;
  imageUrl?: string;
  position: number;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size?: string;
  color_name?: string;
  color_hex?: string;
  stock_quantity?: number;
}

export interface InventoryItem {
  id: string;
  product_id?: string;
  variant_id?: string;
  quantity: number;
  reserved_quantity?: number;
}

export interface CollectionProduct {
  id: string;
  listingId: string;
  title: string;
  slug?: string;
  description?: string;
  price: number;
  priceCents: number;
  images: string[];
  image: string | null;
  rating: number;
  reviewCount: number;
  category?: string;
  sku?: string;
  position: number;
  stock_quantity?: number;
  colors_available: string[];
  sizes: string[];
  quantity_available: number;
  variants: Array<{
    id: string;
    size?: string;
    color?: string;
    colorHex?: string;
    stockQuantity?: number;
  }>;
  inventory: Array<{
    id: string;
    variantId?: string;
    quantity: number;
    reservedQuantity: number;
  }>;
}

/**
 * Extract and organize product images by product ID
 */
export function organizeProductImages(
  allImages: ProductImage[]
): Map<string, string[]> {
  const imagesByProduct = new Map<string, string[]>();

  allImages.forEach((img) => {
    const productId = img.product_id;
    const imageUrl = img.image_url || img.imageUrl;

    if (!imagesByProduct.has(productId)) {
      imagesByProduct.set(productId, []);
    }

    const images = imagesByProduct.get(productId)!;
    if (imageUrl && !images.includes(imageUrl)) {
      images.push(imageUrl);
    }
  });

  // Sort images by position
  allImages
    .sort((a, b) => a.position - b.position)
    .forEach((img) => {
      const productId = img.product_id;
      const imageUrl = img.image_url || img.imageUrl;
      const images = imagesByProduct.get(productId);
      if (images && imageUrl && !images.includes(imageUrl)) {
        images.push(imageUrl);
      }
    });

  return imagesByProduct;
}

/**
 * Extract available colors and sizes from variants
 */
export function extractVariantOptions(
  variants: ProductVariant[]
): { colors: string[]; sizes: string[] } {
  const colors = [...new Set(variants.map((v) => v.color_name).filter(Boolean))] as string[];
  const sizes = [...new Set(variants.map((v) => v.size).filter(Boolean))] as string[];

  return {
    colors: colors.sort(),
    sizes: sizes.sort((a, b) => {
      const sizeOrder = ['XS', 'S', 'M', 'L', 'XL', 'XXL'];
      const aIdx = sizeOrder.indexOf(a);
      const bIdx = sizeOrder.indexOf(b);
      return (aIdx === -1 ? 999 : aIdx) - (bIdx === -1 ? 999 : bIdx);
    }),
  };
}

/**
 * Calculate available quantity from inventory
 */
export function calculateAvailableQuantity(
  variants: ProductVariant[],
  inventory: InventoryItem[]
): number {
  const variantIds = new Set(variants.map((v) => v.id));

  return inventory
    .filter((inv) => variantIds.has(inv.variant_id || ''))
    .reduce((sum, inv) => {
      const reserved = inv.reserved_quantity || 0;
      return sum + Math.max(0, inv.quantity - reserved);
    }, 0);
}

/**
 * Transform raw collection item data to standardized format
 */
export function transformCollectionProduct(
  item: any,
  allImages: ProductImage[],
  allVariants: ProductVariant[],
  allInventory: InventoryItem[],
  productsDataMap: Record<string, any>,
  listingsDataMap: Record<string, any>
): CollectionProduct {
  const productId = item.product_id;
  const product = productsDataMap[productId];
  const listing = listingsDataMap[productId];

  // Get images for this product
  const productImages = allImages.filter((img) => img.product_id === productId);
  const imageUrls = productImages
    .sort((a, b) => a.position - b.position)
    .map((img) => img.image_url || img.imageUrl)
    .filter(Boolean) as string[];

  // Get variants for this product
  const productVariants = allVariants.filter((v) => v.product_id === productId);
  const variantOptions = extractVariantOptions(productVariants);

  // Get inventory for this product's variants
  const productInventory = allInventory.filter((inv) =>
    productVariants.find((v) => v.id === inv.variant_id)
  );
  const availableQuantity = calculateAvailableQuantity(productVariants, productInventory);

  // Get pricing from listing or product
  const priceCents = listing?.price_cents || product?.price_cents || 0;
  const price = priceCents / 100;

  return {
    id: productId,
    listingId: listing?.id || productId,
    title: product?.name || listing?.title || 'Unknown Product',
    slug: product?.slug || listing?.slug,
    description: product?.description || listing?.description,
    price: price,
    priceCents: priceCents,
    images: imageUrls,
    image: imageUrls[0] || listing?.image || null,
    rating: product?.rating || listing?.rating || 0,
    reviewCount: product?.review_count || listing?.review_count || 0,
    category: product?.category || listing?.category,
    sku: product?.sku,
    position: item.position || 0,
    stock_quantity: product?.stock_quantity,
    colors_available: variantOptions.colors,
    sizes: variantOptions.sizes,
    quantity_available: availableQuantity,
    variants: productVariants.map((v) => ({
      id: v.id,
      size: v.size,
      color: v.color_name,
      colorHex: v.color_hex,
      stockQuantity: v.stock_quantity,
    })),
    inventory: productInventory.map((inv) => ({
      id: inv.id,
      variantId: inv.variant_id,
      quantity: inv.quantity,
      reservedQuantity: inv.reserved_quantity || 0,
    })),
  };
}

/**
 * Parse JSON safely
 */
export function safeParseJSON<T = any>(jsonString: string | null | undefined, defaultValue: T | null = null): T | null {
  if (!jsonString) return defaultValue;
  try {
    return JSON.parse(jsonString) as T;
  } catch (e) {
    console.warn('Failed to parse JSON:', jsonString, e);
    return defaultValue;
  }
}

/**
 * Format collection metadata
 */
export interface CollectionMetadata {
  id: string;
  title: string;
  slug: string | null;
  description: string | null;
  image: string | null;
  images: string[];
  price: number | null;
  shipping: string | null;
  refund: string | null;
  seller: {
    id: string;
    business_name: string;
    logo: string | null;
    hero_image: string | null;
  };
}

export function formatCollectionMetadata(
  collectionListing: any,
  sellerInfo: any
): CollectionMetadata {
  const images = safeParseJSON<string[]>(collectionListing?.imagesJson, []);
  const primaryImage = collectionListing?.image;

  return {
    id: collectionListing?.id,
    title: collectionListing?.title || 'Untitled Collection',
    slug: collectionListing?.slug,
    description: collectionListing?.description,
    image: primaryImage,
    images: Array.isArray(images) ? [primaryImage, ...images].filter(Boolean) : [primaryImage].filter(Boolean),
    price: collectionListing?.priceCents ? collectionListing.priceCents / 100 : null,
    shipping: collectionListing?.shippingOption,
    refund: collectionListing?.refundPolicy,
    seller: {
      id: sellerInfo?.id || '',
      business_name: sellerInfo?.business_name || 'Unknown Seller',
      logo: sellerInfo?.logo || null,
      hero_image: sellerInfo?.hero_image || null,
    },
  };
}