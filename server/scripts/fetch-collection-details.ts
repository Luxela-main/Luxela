import { db } from '../db';
import { collections, collectionItems, listings, sellers, users, reviews, buyers, products } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

/**
 * Fetch all collection products with complete details
 * Includes: product info, listing details, reviews, seller info
 */
async function fetchAllCollectionDetails() {
  try {
    console.log('🔍 Fetching all collection items with complete details...\n');

    const result = await db
      .select({
        // Collection Info
        collectionId: collections.id,
        collectionName: collections.name,
        collectionSlug: collections.slug,
        collectionDescription: collections.description,

        // Product Info
        productId: products.id,

        // Listing Info (Complete)
        listingId: listings.id,
        listingTitle: listings.title,
        listingDescription: listings.description,
        category: listings.category,
        primaryImage: listings.image,
        additionalImages: listings.imagesJson,
        priceCents: listings.priceCents,
        currency: listings.currency,
        stockAvailable: listings.quantityAvailable,
        material: listings.materialComposition,
        availableColors: listings.colorsAvailable,
        availableSizes: listings.sizesJson,
        shippingOption: listings.shippingOption,
        domesticShippingEta: listings.etaDomestic,
        internationalShippingEta: listings.etaInternational,
        refundPolicy: listings.refundPolicy,
        sku: listings.sku,
        barcode: listings.barcode,
        productVideo: listings.videoUrl,
        careInstructions: listings.careInstructions,
        metaDescription: listings.metaDescription,
        listingStatus: listings.status,

        // Seller Info
        sellerId: sellers.id,
        sellerName: users.name,
        sellerEmail: users.email,

        // Review counts and averages (will need subqueries)
      })
      .from(collections)
      .innerJoin(collectionItems, eq(collections.id, collectionItems.collectionId))
      .innerJoin(products, eq(collectionItems.productId, products.id))
      .innerJoin(listings, eq(products.id, listings.productId))
      .innerJoin(sellers, eq(listings.sellerId, sellers.id))
      .innerJoin(users, eq(sellers.userId, users.id));

    console.log(`✅ Found ${result.length} collection items\n`);

    // For each result, get reviews
    const collectionDetailsWithReviews = await Promise.all(
      result.map(async (item: typeof result[number]) => {
        const itemReviews = await db
          .select({
            reviewId: reviews.id,
            rating: reviews.rating,
            comment: reviews.comment,
            createdAt: reviews.createdAt,
            reviewerName: users.name,
            reviewerEmail: users.email,
          })
          .from(reviews)
          .innerJoin(buyers, eq(reviews.buyerId, buyers.id))
          .innerJoin(users, eq(buyers.userId, users.id))
          .where(eq(reviews.listingId, item.listingId));

        return {
          ...item,
          reviews: itemReviews,
          reviewCount: itemReviews.length,
          averageRating:
            itemReviews.length > 0
              ? (itemReviews.reduce((sum: number, r: typeof itemReviews[number]) => sum + r.rating, 0) / itemReviews.length).toFixed(2)
              : 'No reviews',
        };
      })
    );

    // Group by collection
    const groupedByCollection = collectionDetailsWithReviews.reduce(
      (acc, item) => {
        const collectionName = item.collectionName;
        if (!acc[collectionName]) {
          acc[collectionName] = {
            collectionId: item.collectionId,
            collectionName,
            collectionSlug: item.collectionSlug,
            collectionDescription: item.collectionDescription,
            items: [],
          };
        }
        acc[collectionName].items.push({
          listingId: item.listingId,
          title: item.listingTitle,
          description: item.listingDescription,
          category: item.category,
          image: item.primaryImage,
          additionalImages: item.additionalImages,
          price: {
            cents: item.priceCents,
            currency: item.currency,
            formatted: item.priceCents
              ? `${item.currency} ${(item.priceCents / 100).toLocaleString()}`
              : 'N/A',
          },
          stock: item.stockAvailable,
          material: item.material,
          colors: item.availableColors,
          sizes: item.availableSizes,
          shipping: {
            option: item.shippingOption,
            domesticEta: item.domesticShippingEta,
            internationalEta: item.internationalShippingEta,
          },
          refundPolicy: item.refundPolicy,
          sku: item.sku,
          barcode: item.barcode,
          videoUrl: item.productVideo,
          careInstructions: item.careInstructions,
          metaDescription: item.metaDescription,
          status: item.listingStatus,
          seller: {
            id: item.sellerId,
            name: item.sellerName,
            email: item.sellerEmail,
          },
          reviews: {
            count: item.reviewCount,
            averageRating: item.averageRating,
            data: item.reviews,
          },
        });
        return acc;
      },
      {} as Record<string, any>
    );

    // Print formatted output
    console.log('📦 COLLECTION ITEMS DETAILS\n');
    console.log('='.repeat(80));

    Object.values(groupedByCollection).forEach((collection: any) => {
      console.log(`\n📚 Collection: ${collection.collectionName}`);
      console.log(`   ID: ${collection.collectionId}`);
      console.log(`   Slug: ${collection.collectionSlug}`);
      console.log(`   Description: ${collection.collectionDescription || 'N/A'}`);
      console.log(`   Items: ${collection.items.length}\n`);

      collection.items.forEach((item: any, index: number) => {
        console.log(`   ${index + 1}. ${item.title}`);
        console.log(`      ID: ${item.listingId}`);
        console.log(`      Price: ${item.price.formatted}`);
        console.log(`      Stock: ${item.stock} units`);
        console.log(`      Category: ${item.category || 'N/A'}`);
        console.log(`      Material: ${item.material || 'N/A'}`);
        console.log(`      Colors: ${item.colors || 'N/A'}`);
        console.log(`      Sizes: ${item.sizes || 'N/A'}`);
        console.log(`      Seller: ${item.seller.name} (${item.seller.email})`);
        console.log(`      Reviews: ${item.reviews.count} (${item.reviews.averageRating} avg)`);
        console.log(`      Video: ${item.videoUrl ? '✅' : '❌'}`);
        console.log(`      Care Instructions: ${item.careInstructions ? '✅' : '❌'}`);
        console.log(`      Status: ${item.status}`);
        console.log(`      Shipping: ${item.shipping.option} (Domestic: ${item.shipping.domesticEta}, Intl: ${item.shipping.internationalEta})`);
        console.log(`      Refund Policy: ${item.refundPolicy}`);

        if (item.reviews.data.length > 0) {
          console.log(`      Recent Reviews:`);
          item.reviews.data.slice(0, 3).forEach((review: any) => {
            console.log(
              `        - ${review.reviewerName}: ${review.rating}/5 - "${review.comment?.substring(0, 50)}${review.comment && review.comment.length > 50 ? '...' : ''}"`
            );
          });
        }
        console.log();
      });
    });

    // Summary statistics
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 SUMMARY STATISTICS\n');
    const totalItems = Object.values(groupedByCollection).reduce(
      (sum, col: any) => sum + col.items.length,
      0
    );
    const totalCollections = Object.keys(groupedByCollection).length;
    const totalReviews = Object.values(groupedByCollection).reduce((sum, col: any) => {
      return (
        sum +
        col.items.reduce((itemSum: number, item: any) => itemSum + item.reviews.count, 0)
      );
    }, 0);

    console.log(`Total Collections: ${totalCollections}`);
    console.log(`Total Items: ${totalItems}`);
    console.log(`Total Reviews: ${totalReviews}`);
    console.log(`\n✅ Fetch complete!\n`);

    return groupedByCollection;
  } catch (error) {
    console.error('❌ Error fetching collection details:', error);
    throw error;
  }
}

// Run the script
fetchAllCollectionDetails()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });