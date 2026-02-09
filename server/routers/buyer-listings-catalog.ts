import { createTRPCRouter, publicProcedure } from '../trpc/trpc';
import { db } from '../db';
import { listings, sellers, sellerBusiness, listingReviews, products, productImages, collections, collectionItems } from '../db/schema';
import { and, eq, desc, asc, sql, count as countFn, ilike, inArray } from 'drizzle-orm';
import { z } from 'zod';

export const buyerListingsCatalogRouter = createTRPCRouter({
  getListingById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/buyer/listings/{listingId}',
        tags: ['Buyer Listings'],
        summary: 'Get complete listing details for product page',
      },
    })
    .input(z.object({ listingId: z.string().uuid() }))
    .output(
      z.object({
        id: z.string().uuid(),
        title: z.string(),
        description: z.string().nullable(),
        image: z.string().nullable(),
        imagesJson: z.string().nullable(),
        price: z.number(),
        price_cents: z.number(),
        quantity_available: z.number(),
        category: z.string().nullable(),
        type: z.enum(['single', 'collection']),
        seller: z.object({
          id: z.string().uuid(),
          brandName: z.string().nullable(),
        }),
        status: z.enum(['in_stock', 'low_stock', 'sold_out']),
        createdAt: z.date(),
        // Detailed specifications
        sku: z.string().nullable().optional(),
        barcode: z.string().nullable().optional(),
        currency: z.string().nullable().optional(),
        supplyCapacity: z.string().nullable().optional(),
        sizes: z.array(z.string()).nullable().optional(),
        colors: z.array(z.object({
          colorName: z.string(),
          colorHex: z.string(),
        })).nullable().optional(),
        materialComposition: z.string().nullable().optional(),
        shippingOption: z.string().nullable().optional(),
        etaDomestic: z.string().nullable().optional(),
        etaInternational: z.string().nullable().optional(),
        refundPolicy: z.string().nullable().optional(),
        localPricing: z.string().nullable().optional(),
        videoUrl: z.string().nullable().optional(),
        careInstructions: z.string().nullable().optional(),
        limitedEditionBadge: z.string().nullable().optional(),
        releaseDuration: z.string().nullable().optional(),
        additionalTargetAudience: z.string().nullable().optional(),
        slug: z.string().nullable().optional(),
        metaDescription: z.string().nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      console.log('[BUYER_CATALOG] getListingById called for:', input.listingId);

      const listing = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.id, input.listingId),
            eq(listings.status, 'approved')
          )
        )
        .limit(1);

      if (!listing.length) {
        throw new Error('Listing not found or not approved');
      }

      const listingData = listing[0];

      const seller = await db
        .select()
        .from(sellers)
        .where(eq(sellers.id, listingData.sellerId))
        .limit(1);

      if (!seller.length) {
        throw new Error('Seller not found');
      }

      const sellerBiz = await db
        .select()
        .from(sellerBusiness)
        .where(eq(sellerBusiness.sellerId, seller[0].id))
        .limit(1);

      // Fetch ALL images from productImages table
      let listingImages: any[] = [];
      if (listingData.productId) {
        listingImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, listingData.productId))
          .orderBy(productImages.position);
      }
      
      // Fallback to parsing imagesJson if no images in productImages table
      if (listingImages.length === 0 && listingData.imagesJson) {
        try {
          const parsedImages = JSON.parse(listingData.imagesJson);
          if (Array.isArray(parsedImages)) {
            listingImages = parsedImages.map((img: any, index: number) => ({
              imageUrl: typeof img === 'string' ? img : img.imageUrl || img.url,
              position: index,
            }));
          }
        } catch (e) {
          console.warn('[BUYER_CATALOG] Failed to parse imagesJson for listing:', listingData.id);
        }
      }
      
      // Extract just the URLs from image objects for cleaner JSON format
      let imageUrls = listingImages
        .map((img) => img.imageUrl || img.url || (typeof img === 'string' ? img : ''))
        .filter((url) => url && typeof url === 'string' && url.trim() !== '');

      // If no images found through product images, ensure we have at least the primary image
      if (imageUrls.length === 0 && listingData.image) {
        imageUrls = [listingData.image];
        console.log('[BUYER_CATALOG] Using primary image as fallback for listing:', listingData.id);
      }

      console.log('[BUYER_CATALOG] Image URLs extracted:', {
        listingId: listingData.id,
        count: imageUrls.length,
        urls: imageUrls.slice(0, 2), // Log first 2 for debugging
      });

      // Parse colors and sizes
      let colors = null;
      let sizes = null;
      if (listingData.colorsAvailable) {
        try {
          colors = JSON.parse(listingData.colorsAvailable);
        } catch (e) {
          colors = null;
        }
      }
      if (listingData.sizesJson) {
        try {
          sizes = JSON.parse(listingData.sizesJson);
        } catch (e) {
          sizes = null;
        }
      }

      // Determine stock status
      const qty = listingData.quantityAvailable || 0;
      let status: 'in_stock' | 'low_stock' | 'sold_out' = 'in_stock';
      if (qty === 0) {
        status = 'sold_out';
      } else if (qty <= 5) {
        status = 'low_stock';
      }

      return {
        id: listingData.id,
        title: listingData.title,
        description: listingData.description,
        image: listingData.image,
        imagesJson: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        price: (listingData.priceCents ?? 0) / 100,
        price_cents: listingData.priceCents ?? 0,
        quantity_available: qty,
        category: listingData.category,
        type: (listingData.type ?? 'single') as 'single' | 'collection',
        seller: {
          id: seller[0].id,
          brandName: sellerBiz.length > 0 ? sellerBiz[0].brandName : null,
        },
        status,
        createdAt: listingData.createdAt,
        // Detailed specifications
        sku: listingData.sku || null,
        barcode: listingData.barcode || null,
        currency: listingData.currency || null,
        supplyCapacity: listingData.supplyCapacity || null,
        sizes: sizes || null,
        colors: colors || null,
        materialComposition: listingData.materialComposition || null,
        shippingOption: listingData.shippingOption || null,
        etaDomestic: listingData.etaDomestic || null,
        etaInternational: listingData.etaInternational || null,
        refundPolicy: listingData.refundPolicy || null,
        localPricing: listingData.localPricing || null,
        videoUrl: listingData.videoUrl || null,
        careInstructions: listingData.careInstructions || null,
        limitedEditionBadge: listingData.limitedEditionBadge || null,
        releaseDuration: listingData.releaseDuration || null,
        additionalTargetAudience: listingData.additionalTargetAudience || null,
        slug: listingData.slug || null,
        metaDescription: listingData.metaDescription || null,
      };
    }),

  getApprovedListingsCatalog: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/buyer/listings/catalog',
        tags: ['Buyer Listings'],
        summary: 'Get paginated approved listings for catalog',
      },
    })
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        sortBy: z.enum(['newest', 'oldest']).default('newest'),
      })
    )
    .output(
      z.object({
        listings: z.array(
          z.object({
            id: z.string().uuid(),
            title: z.string(),
            description: z.string().nullable(),
            image: z.string().nullable(),
            imagesJson: z.string().nullable(),
            price: z.number(),
            price_cents: z.number(),
            quantity_available: z.number(),
            category: z.string().nullable(),
            type: z.enum(['single', 'collection']),
            seller: z.object({
              id: z.string().uuid(),
              brandName: z.string().nullable(),
            }),
            status: z.enum(['in_stock', 'low_stock', 'sold_out']),
            createdAt: z.date(),
            sku: z.string().nullable().optional(),
            barcode: z.string().nullable().optional(),
            currency: z.string().nullable().optional(),
            supplyCapacity: z.string().nullable().optional(),
            sizes: z.array(z.string()).nullable().optional(),
            colors: z.array(z.object({
              colorName: z.string(),
              colorHex: z.string(),
            })).nullable().optional(),
            materialComposition: z.string().nullable().optional(),
            shippingOption: z.string().nullable().optional(),
            etaDomestic: z.string().nullable().optional(),
            etaInternational: z.string().nullable().optional(),
            refundPolicy: z.string().nullable().optional(),
            localPricing: z.string().nullable().optional(),
            videoUrl: z.string().nullable().optional(),
            careInstructions: z.string().nullable().optional(),
            limitedEditionBadge: z.string().nullable().optional(),
            releaseDuration: z.string().nullable().optional(),
            additionalTargetAudience: z.string().nullable().optional(),
            slug: z.string().nullable().optional(),
            metaDescription: z.string().nullable().optional(),
          })
        ),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;

      const countResult = await db
        .select({ count: countFn() })
        .from(listings)
        .where(eq(listings.status, 'approved'));

      const total = Number(countResult[0]?.count ?? 0);

      const approvedListings = await db
        .select()
        .from(listings)
        .where(eq(listings.status, 'approved'))
        .orderBy(
          input.sortBy === 'newest'
            ? desc(listings.createdAt)
            : asc(listings.createdAt)
        )
        .limit(input.limit)
        .offset(offset);

      const listingsWithSeller = await Promise.all(
        approvedListings.map(async (listing) => {
          const seller = await db
            .select()
            .from(sellers)
            .where(eq(sellers.id, listing.sellerId))
            .limit(1);

          const sellerBiz = seller.length > 0
            ? await db
                .select()
                .from(sellerBusiness)
                .where(eq(sellerBusiness.sellerId, seller[0].id))
                .limit(1)
            : null;

          // Fetch images - ALWAYS from productImages table for complete image data
          let listingImages: any[] = [];
          if (listing.productId) {
            listingImages = await db
              .select()
              .from(productImages)
              .where(eq(productImages.productId, listing.productId))
              .orderBy(productImages.position);
          }
          
          // If no images found in productImages table, fallback to parsing imagesJson
          if (listingImages.length === 0 && listing.imagesJson) {
            try {
              const parsedImages = JSON.parse(listing.imagesJson);
              if (Array.isArray(parsedImages)) {
                listingImages = parsedImages.map((img: any, index: number) => ({
                  imageUrl: typeof img === 'string' ? img : img.imageUrl || img.url,
                  position: index,
                }));
              }
            } catch (e) {
              console.warn('[BUYER_CATALOG] Failed to parse imagesJson for listing:', listing.id);
            }
          }
          
          // Extract just the URLs from image objects for cleaner JSON format
          let imageUrls = listingImages
            .map((img) => img.imageUrl || img.url || (typeof img === 'string' ? img : ''))
            .filter((url) => url && typeof url === 'string' && url.trim() !== '');

          // If no images found through product images, ensure we have at least the primary image
          if (imageUrls.length === 0 && listing.image) {
            imageUrls = [listing.image];
          }

          // Parse colors and sizes
          let colors = null;
          let sizes = null;
          if (listing.colorsAvailable) {
            try {
              colors = JSON.parse(listing.colorsAvailable);
            } catch (e) {
              colors = null;
            }
          }
          if (listing.sizesJson) {
            try {
              sizes = JSON.parse(listing.sizesJson);
            } catch (e) {
              sizes = null;
            }
          }

          // Determine stock status
          const qty = listing.quantityAvailable || 0;
          let status: 'in_stock' | 'low_stock' | 'sold_out' = 'in_stock';
          if (qty === 0) {
            status = 'sold_out';
          } else if (qty <= 5) {
            status = 'low_stock';
          }

          return {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            image: listing.image,
            imagesJson: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
            price: (listing.priceCents ?? 0) / 100,
            price_cents: listing.priceCents ?? 0,
            quantity_available: qty,
            category: listing.category,
            type: (listing.type ?? 'single') as 'single' | 'collection',
            seller: {
              id: seller[0].id,
              brandName: sellerBiz?.[0]?.brandName ?? null,
            },
            status,
            createdAt: listing.createdAt,
            // Detailed specifications
            sku: listing.sku || null,
            barcode: listing.barcode || null,
            currency: listing.currency || null,
            supplyCapacity: listing.supplyCapacity || null,
            sizes: sizes || null,
            colors: colors || null,
            materialComposition: listing.materialComposition || null,
            shippingOption: listing.shippingOption || null,
            etaDomestic: listing.etaDomestic || null,
            etaInternational: listing.etaInternational || null,
            refundPolicy: listing.refundPolicy || null,
            localPricing: listing.localPricing || null,
            videoUrl: listing.videoUrl || null,
            careInstructions: listing.careInstructions || null,
            limitedEditionBadge: listing.limitedEditionBadge || null,
            releaseDuration: listing.releaseDuration || null,
            additionalTargetAudience: listing.additionalTargetAudience || null,
            slug: listing.slug || null,
            metaDescription: listing.metaDescription || null,
          };
        })
      );

      console.log(
        '[BUYER_CATALOG] Returning response with',
        listingsWithSeller.length,
        'approved listings'
      );

      return {
        listings: listingsWithSeller,
        total,
        page: input.page,
        totalPages: Math.ceil(total / input.limit),
      };
    }),

  getApprovedCollectionById: publicProcedure
    .input(z.object({ collectionId: z.string().uuid() }))
    .query(async ({ input }) => {
      console.log('[BUYER_CATALOG] getApprovedCollectionById called for:', input.collectionId);

      const listing = await db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.collectionId, input.collectionId),
            eq(listings.status, 'approved')
          )
        )
        .limit(1);

      if (!listing.length) return null;

      const collectionListing = listing[0];
      const [seller] = await db
        .select()
        .from(sellers)
        .where(eq(sellers.id, collectionListing.sellerId))
        .limit(1);

      if (!seller) return null;

      const sellerBiz = seller
        ? await db
            .select()
            .from(sellerBusiness)
            .where(eq(sellerBusiness.sellerId, seller.id))
            .limit(1)
        : null;

      const [collectionMetadata] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      const collectionItemsList = await db
        .select()
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, input.collectionId))
        .orderBy(collectionItems.position);

      const productIds = collectionItemsList.map((item) => item.productId);
      let productsInCollection: any[] = [];
      let allProductImages: any[] = [];
      let productListings: any[] = [];

      if (productIds.length > 0) {
        productsInCollection = await db
          .select()
          .from(products)
          .where(inArray(products.id, productIds));

        productListings = await db
          .select()
          .from(listings)
          .where(inArray(listings.productId, productIds));

        allProductImages = await db
          .select()
          .from(productImages)
          .where(inArray(productImages.productId, productIds))
          .orderBy(productImages.position);
      }

      const imagesByProductId: Record<string, string[]> = {};
      allProductImages.forEach((img) => {
        if (!imagesByProductId[img.productId]) {
          imagesByProductId[img.productId] = [];
        }
        imagesByProductId[img.productId].push(img.imageUrl);
      });

      const productDataByProductId: Record<string, any> = {};
      productListings.forEach((prodListing) => {
        if (prodListing.productId) {
          let colors = null;
          let sizes = null;
          if (prodListing.colorsAvailable) {
            try {
              colors = JSON.parse(prodListing.colorsAvailable);
            } catch (e) {
              colors = null;
            }
          }
          if (prodListing.sizesJson) {
            try {
              sizes = JSON.parse(prodListing.sizesJson);
            } catch (e) {
              sizes = null;
            }
          }
          productDataByProductId[prodListing.productId] = {
            careInstructions: prodListing.careInstructions || null,
            colors,
            sizes,
          };
        }
      });

      const collectionProducts = collectionItemsList
        .map((collectionItem) => {
          const product = productsInCollection.find(
            (p) => p.id === collectionItem.productId
          );
          if (!product) return null;

          const productImages = imagesByProductId[product.id] || [];
          const productData = productDataByProductId[product.id] || {};
          const imagesJsonStr =
            productImages.length > 0
              ? JSON.stringify(productImages.map((url) => ({ url })))
              : null;

          return {
            id: product.id,
            title: product.name,
            description: product.description,
            priceCents: product.priceCents,
            currency: product.currency || 'NGN',
            sku: product.sku || null,
            category: product.category || null,
            images: productImages,
            imagesJson: imagesJsonStr,
            material: product.material || null,
            careInstructions: productData.careInstructions,
            sizes: productData.sizes,
            colors: productData.colors,
          };
        })
        .filter((p) => p !== null);

      let listingImages: any[] = [];
      if (collectionListing.productId) {
        listingImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, collectionListing.productId))
          .orderBy(productImages.position);
      }

      let colors = null;
      let sizes = null;
      if (collectionListing.colorsAvailable) {
        try {
          colors = JSON.parse(collectionListing.colorsAvailable);
        } catch (e) {
          colors = null;
        }
      }
      if (collectionListing.sizesJson) {
        try {
          sizes = JSON.parse(collectionListing.sizesJson);
        } catch (e) {
          sizes = null;
        }
      }

      let totalPrice = 0;
      collectionProducts.forEach((product: any) => {
        totalPrice += product.priceCents / 100;
      });

      let qty = collectionListing.quantityAvailable || 0;
      let status: 'in_stock' | 'low_stock' | 'sold_out' = 'in_stock';
      if (qty === 0) status = 'sold_out';
      else if (qty <= 5) status = 'low_stock';

      return {
        id: collectionListing.id,
        title: collectionListing.title,
        description: collectionListing.description,
        image: collectionListing.image,
        imagesJson: JSON.stringify(
          listingImages.map((img) => ({
            imageUrl: img.imageUrl,
            position: img.position,
          }))
        ),
        price: (collectionListing.priceCents ?? 0) / 100,
        price_cents: collectionListing.priceCents ?? 0,
        quantity_available: qty,
        category: collectionListing.category,
        type: 'collection',
        seller: {
          id: seller.id,
          brandName: sellerBiz?.[0]?.brandName ?? null,
        },
        status,
        createdAt: collectionListing.createdAt,
        sku: collectionListing.sku || null,
        barcode: collectionListing.barcode || null,
        currency: collectionListing.currency || null,
        supplyCapacity: collectionListing.supplyCapacity || null,
        sizes: sizes || null,
        colors: colors || null,
        materialComposition: collectionListing.materialComposition || null,
        shippingOption: collectionListing.shippingOption || null,
        etaDomestic: collectionListing.etaDomestic || null,
        etaInternational: collectionListing.etaInternational || null,
        refundPolicy: collectionListing.refundPolicy || null,
        localPricing: collectionListing.localPricing || null,
        videoUrl: collectionListing.videoUrl || null,
        careInstructions: collectionListing.careInstructions || null,
        limitedEditionBadge: collectionListing.limitedEditionBadge || null,
        releaseDuration: collectionListing.releaseDuration || null,
        additionalTargetAudience: collectionListing.additionalTargetAudience || null,
        slug: collectionListing.slug || null,
        metaDescription: collectionListing.metaDescription || null,
        collectionId: input.collectionId,
        collectionName: collectionMetadata?.name || null,
        collectionDescription: collectionMetadata?.description || null,
        collectionItemCount: collectionProducts.length,
        collectionTotalPrice: totalPrice,
        collectionProducts,
      };
    }),
});