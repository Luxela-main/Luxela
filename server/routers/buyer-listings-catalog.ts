import { createTRPCRouter, publicProcedure } from '../trpc/trpc';
import { db } from '../db';
import { listings, sellers, sellerBusiness, listingReviews, products, productImages, collections, collectionItems, brands } from '../db/schema';
import type { CollectionItem } from '../db/types';
import { and, eq, desc, asc, sql, count as countFn, ilike, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { getCached, invalidateCache } from '../lib/redis';

export const buyerListingsCatalogRouter = createTRPCRouter({
  // NEW: Complete listing details with ALL images and specifications (mirrors admin method)
  getListingDetailsComplete: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/buyer/listings/complete/{listingId}',
        tags: ['Buyer Listings'],
        summary: 'Get complete listing details with all images and product specifications',
      },
    })
    .input(z.object({ listingId: z.string().uuid() }))
    .output(
      z.object({
        id: z.string().uuid(),
        listingId: z.string().uuid(),
        sellerId: z.string().uuid(),
        title: z.string(),
        description: z.string().nullable().optional(),
        price: z.number().optional(),
        image: z.string().nullable().optional(),
        images: z.array(z.string()),
        imagesJson: z.string().nullable(),
        category: z.string().nullable().optional(),
        priceCents: z.number().nullable().optional(),
        currency: z.string().nullable().optional(),
        quantityAvailable: z.number().nullable().optional(),
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
        status: z.enum(['in_stock', 'low_stock', 'sold_out']),
        createdAt: z.date(),
        sku: z.string().nullable().optional(),
        slug: z.string().nullable().optional(),
        metaDescription: z.string().nullable().optional(),
        barcode: z.string().nullable().optional(),
        videoUrl: z.string().nullable().optional(),
        careInstructions: z.string().nullable().optional(),
        limitedEditionBadge: z.string().nullable().optional(),
        releaseDuration: z.string().nullable().optional(),
        additionalTargetAudience: z.string().nullable().optional(),
        type: z.enum(['single', 'collection']).optional(),
        seller: z.object({
          id: z.string().uuid(),
          brandName: z.string().optional(),
          email: z.string().optional(),
          phoneNumber: z.string().optional(),
          businessAddress: z.string().optional(),
          businessType: z.string().optional(),
        }),
        // Collection details
        collectionId: z.string().uuid().nullable().optional(),
        collectionName: z.string().nullable().optional(),
        collectionDescription: z.string().nullable().optional(),
        collectionItemCount: z.number().optional(),
        collectionTotalPrice: z.number().optional(),
        collectionProducts: z.array(z.object({
          id: z.string().uuid(),
          title: z.string(),
          description: z.string().nullable().optional(),
          priceCents: z.number(),
          currency: z.string(),
          sku: z.string().nullable().optional(),
          category: z.string().nullable().optional(),
          images: z.array(z.string()),
          imagesJson: z.string().nullable(),
          careInstructions: z.string().nullable().optional(),
          colors: z.array(z.object({
            colorName: z.string(),
            colorHex: z.string(),
          })).nullable().optional(),
          sizes: z.array(z.string()).nullable().optional(),
        })).nullable().optional(),
      })
    )
    .query(async ({ input }) => {
      console.log('[BUYER_CATALOG] getListingDetailsComplete called for:', input.listingId);

      // Fetch main listing with seller info
      const result = await db
        .select({
          listing: listings,
          seller: sellers,
          sellerBizInfo: sellerBusiness,
        })
        .from(listings)
        .innerJoin(sellers, eq(listings.sellerId, sellers.id))
        .leftJoin(sellerBusiness, eq(sellers.id, sellerBusiness.sellerId))
        .where(and(
          eq(listings.id, input.listingId),
          eq(listings.status, 'approved')
        ))
        .limit(1);

      if (!result.length) {
        throw new Error('Approved listing not found');
      }

      const item = result[0];
      const listingData = item.listing;
      const sellerData = item.seller;
      const sellerBizData = item.sellerBizInfo || null;

      // Get price
      let price = listingData.priceCents ? listingData.priceCents / 100 : undefined;
      let collectionProducts = null;
      let collectionName = null;
      let collectionDescription = null;
      let collectionItemCount = 0;
      let collectionTotalPrice = 0;

      // Handle collection listings
      if (listingData.type === 'collection' && listingData.collectionId) {
        console.log('[BUYER_CATALOG] Processing collection listing:', listingData.collectionId);

        // Fetch collection metadata
        const collectionData = await db
          .select()
          .from(collections)
          .where(eq(collections.id, listingData.collectionId))
          .limit(1);

        if (collectionData.length > 0) {
          collectionName = collectionData[0].name;
          collectionDescription = collectionData[0].description;
        }

        // Get minimum price in collection
        const collectionPrice = await db
          .select({ minPrice: sql`min(${products.priceCents})` })
          .from(collectionItems)
          .innerJoin(products, eq(collectionItems.productId, products.id))
          .where(eq(collectionItems.collectionId, listingData.collectionId))
          .limit(1);

        if (collectionPrice[0]?.minPrice) {
          price = (collectionPrice[0].minPrice as number) / 100;
        }

        // Fetch all collection items with full product details and images
        const collectionItemsList = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, listingData.collectionId))
          .orderBy(collectionItems.position);

        collectionItemCount = collectionItemsList.length;

        if (collectionItemsList.length > 0) {
          const productIds = collectionItemsList.map((item: any) => item.productId);

          // Fetch all products in the collection
          const productsInCollection = await db
            .select()
            .from(products)
            .where(inArray(products.id, productIds));

          // Fetch all listings for these products to get care instructions and specs
          const productListings = await db
            .select()
            .from(listings)
            .where(inArray(listings.productId, productIds));

          // Fetch all images for all products in one query
          const allProductImages = await db
            .select()
            .from(productImages)
            .where(inArray(productImages.productId, productIds))
            .orderBy(productImages.position);

          // Build map of images by product ID
          const imagesByProductId: Record<string, string[]> = {};
          allProductImages.forEach((img: any) => {
            if (!imagesByProductId[img.productId]) {
              imagesByProductId[img.productId] = [];
            }
            imagesByProductId[img.productId].push(img.imageUrl);
          });

          // Build map of product specs by product ID
          const specsByProductId: Record<string, any> = {};
          productListings.forEach((listing: any) => {
            if (listing.productId) {
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
              specsByProductId[listing.productId] = {
                careInstructions: listing.careInstructions || null,
                colors,
                sizes,
              };
            }
          });

          // Build collection products array
          collectionProducts = collectionItemsList
            .map((collectionItem: any) => {
              const product = productsInCollection.find((p: any) => p.id === collectionItem.productId);
              if (!product) return null;

              const productImages = imagesByProductId[product.id] || [];
              const specs = specsByProductId[product.id] || {};
              const imagesJsonStr = productImages.length > 0
                ? JSON.stringify(productImages.map((url: any) => ({ url })))
                : null;

              collectionTotalPrice += (product.priceCents || 0) / 100;

              return {
                id: product.id,
                title: product.name,
                description: product.description,
                priceCents: product.priceCents,
                currency: product.currency || 'NGN',
                sku: product.sku,
                category: product.category,
                images: productImages,
                imagesJson: imagesJsonStr,
                careInstructions: specs.careInstructions,
                colors: specs.colors,
                sizes: specs.sizes,
              };
            })
            .filter((p: any) => p !== null);
        }
      }

      // Fetch all images for single listings
      let listingImages: any[] = [];
      if (listingData.productId) {
        listingImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, listingData.productId))
          .orderBy(productImages.position);
      }

      // Fallback to imagesJson if no product images
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

      const imageUrls = listingImages
        .map((img) => img.imageUrl || img.url || (typeof img === 'string' ? img : ''))
        .filter((url) => url && typeof url === 'string' && url.trim() !== '');

      // Ensure primary image if no other images
      if (imageUrls.length === 0 && listingData.image) {
        imageUrls.push(listingData.image);
      }

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
      let qty = listingData.quantityAvailable || 0;
      
      // For collections, calculate quantity from collection items
      if (listingData.type === 'collection' && listingData.collectionId) {
        const collectionItemsList = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, listingData.collectionId));
        
        // Sum up quantities from all items in the collection
        qty = collectionItemsList.reduce((sum: number, item: CollectionItem) => sum + ((item as any).quantity || 0), 0);
        console.log('[BUYER_CATALOG] getListingDetailsComplete - Collection quantity calculated:', {
          collectionId: listingData.collectionId,
          itemCount: collectionItemsList.length,
          totalQuantity: qty,
        });
      }
      
      let status: 'in_stock' | 'low_stock' | 'sold_out' = 'in_stock';
      if (qty === 0) {
        status = 'sold_out';
      } else if (qty <= 5) {
        status = 'low_stock';
      }

      console.log('[BUYER_CATALOG] getListingDetailsComplete returning complete data for:', input.listingId);

      return {
        id: listingData.id,
        listingId: listingData.id,
        sellerId: sellerData.id,
        title: listingData.title,
        description: listingData.description,
        image: listingData.image ?? undefined,
        images: imageUrls,
        imagesJson: imageUrls.length > 0 ? JSON.stringify(imageUrls) : null,
        price: price,
        priceCents: listingData.priceCents,
        quantityAvailable: qty,
        category: listingData.category,
        currency: listingData.currency,
        supplyCapacity: listingData.supplyCapacity,
        sizes: sizes,
        colors: colors,
        materialComposition: listingData.materialComposition,
        shippingOption: listingData.shippingOption,
        etaDomestic: listingData.etaDomestic,
        etaInternational: listingData.etaInternational,
        refundPolicy: listingData.refundPolicy,
        localPricing: listingData.localPricing,
        status,
        createdAt: listingData.createdAt,
        sku: listingData.sku,
        slug: listingData.slug,
        metaDescription: listingData.metaDescription,
        barcode: listingData.barcode,
        videoUrl: listingData.videoUrl,
        careInstructions: listingData.careInstructions,
        limitedEditionBadge: listingData.limitedEditionBadge,
        releaseDuration: listingData.releaseDuration,
        additionalTargetAudience: listingData.additionalTargetAudience,
        type: (listingData.type ?? 'single') as 'single' | 'collection',
        seller: {
          id: sellerData.id,
          brandName: sellerBizData?.brandName,
          phoneNumber: sellerBizData?.phoneNumber,
          businessAddress: sellerBizData?.businessAddress,
          businessType: sellerBizData?.businessType,
        },
        collectionId: listingData.collectionId,
        collectionName,
        collectionDescription,
        collectionItemCount,
        collectionTotalPrice,
        collectionProducts,
      };
    }),

  // Fetch individual listing by ID with complete details and all images
  getListingById: publicProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/buyer/listings/{listingId}',
        tags: ['Buyer Listings'],
        summary: 'Get a single approved listing by ID with complete details and all images',
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
          brandSlug: z.string().nullable(),
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
    )
    .query(async ({ input }) => {
      const cacheKey = `buyer:listing:${input.listingId}`;
      
      return await getCached(
        cacheKey,
        async () => {
          console.log('[BUYER_CATALOG] getListingById called for:', input.listingId);

          // Fetch the listing - try direct approved listing first
          let listing = await db
            .select()
            .from(listings)
            .where(and(eq(listings.id, input.listingId), eq(listings.status, 'approved')))
            .limit(1);

      // If not found, check if it's part of an approved collection
      if (listing.length === 0) {
        const item = await db
          .select()
          .from(listings)
          .where(eq(listings.id, input.listingId))
          .limit(1);
        
        if (item.length > 0 && item[0].collectionId) {
          const parent = await db
            .select()
            .from(listings)
            .where(and(
              eq(listings.id, item[0].collectionId),
              eq(listings.status, 'approved')
            ))
            .limit(1);
          
          if (parent.length > 0) {
            listing = item;
          }
        }
      }

      if (listing.length === 0) {
        throw new Error('Listing not found or not approved');
      }

      const listingData = listing[0];

      // Fetch seller info
      const seller = await db
        .select()
        .from(sellers)
        .where(eq(sellers.id, listingData.sellerId))
        .limit(1);

      const sellerBiz = seller.length > 0
        ? await db
            .select()
            .from(sellerBusiness)
            .where(eq(sellerBusiness.sellerId, seller[0].id))
            .limit(1)
        : null;

      // Fetch brand info to get the slug
      const brandInfo = seller.length > 0
        ? await db
            .select()
            .from(brands)
            .where(eq(brands.sellerId, seller[0].id))
            .limit(1)
        : null;

      // Fetch images - ALWAYS from productImages table for complete image data
      let listingImages: any[] = [];
      if (listingData.productId) {
        listingImages = await db
          .select()
          .from(productImages)
          .where(eq(productImages.productId, listingData.productId))
          .orderBy(productImages.position);
      }

      // If no images found in productImages table, fallback to parsing imagesJson
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
      }

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
      let qty = listingData.quantityAvailable || 0;
      
      // For collections, calculate quantity from collection items
      if (listingData.type === 'collection' && listingData.collectionId) {
        const collectionItemsList = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, listingData.collectionId));
        
        // Sum up quantities from all items in the collection
        qty = collectionItemsList.reduce((sum: number, item: CollectionItem) => sum + ((item as any).quantity || 0), 0);
        console.log('[BUYER_CATALOG] Collection quantity calculated:', {
          collectionId: listingData.collectionId,
          itemCount: collectionItemsList.length,
          totalQuantity: qty,
        });
      }
      
      let status: 'in_stock' | 'low_stock' | 'sold_out' = 'in_stock';
      if (qty === 0) {
        status = 'sold_out';
      } else if (qty <= 5) {
        status = 'low_stock';
      }

      console.log('[BUYER_CATALOG] getListingById result:', {
        listingId: listingData.id,
        title: listingData.title,
        imageCount: imageUrls.length,
        status,
      });

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
          brandName: sellerBiz?.[0]?.brandName ?? null,
          brandSlug: brandInfo?.[0]?.slug ?? null,
        },
        status,
        createdAt: listingData.createdAt,
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
        },
        { ttl: 600 }
      );
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
      const cacheKey = `buyer:catalog:page:${input.page}:limit:${input.limit}:sort:${input.sortBy}`;
      
      return await getCached(
        cacheKey,
        async () => {
          const offset = (input.page - 1) * input.limit;

          const countPromise = db
            .select({ count: countFn() })
        .from(listings)
        .where(
          and(
            eq(listings.status, 'approved'),
            eq(listings.type, 'single')
          )
        );

      const dataPromise = db
        .select()
        .from(listings)
        .where(
          and(
            eq(listings.status, 'approved'),
            eq(listings.type, 'single')
          )
        )
        .orderBy(
          input.sortBy === 'newest'
            ? desc(listings.createdAt)
            : asc(listings.createdAt)
        )
        .limit(input.limit)
        .offset(offset);

      let total = 0;
      const countTimeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Count timeout')), 3000)
      );
      
      try {
        const countResult = await Promise.race([countPromise, countTimeout]);
        total = Number((countResult as any)[0]?.count ?? 0);
      } catch (e) {
        console.warn('[BUYER_CATALOG] Count query timed out, using paginated results');
        total = -1;
      }

      const approvedListings = await dataPromise;
      
      console.log('[DEBUG getApprovedListingsCatalog] Listings query result:', {
        fetchedCount: approvedListings.length,
        types: approvedListings.map((l: any) => ({ id: l.id.slice(0, 8), type: l.type, productId: l.productId?.slice(0, 8) })),
      });

      const sellerIds = [...new Set(approvedListings.map((l: any) => l.sellerId))];
      const productIds = [...new Set(approvedListings.map((l: any) => l.productId).filter(Boolean))];

      const [sellersData, sellerBusinessData, imagesData] = await Promise.all([
        sellerIds.length > 0 ? db.select().from(sellers).where(inArray(sellers.id, sellerIds as string[])) : Promise.resolve([]),
        sellerIds.length > 0 ? db.select().from(sellerBusiness).where(inArray(sellerBusiness.sellerId, sellerIds as string[])) : Promise.resolve([]),
        productIds.length > 0 ? db.select().from(productImages).where(inArray(productImages.productId, productIds as string[])).orderBy(productImages.position) : Promise.resolve([]),
      ]);

      const sellerMap = new Map(sellersData.map((s: any) => [s.id, s]));
      const sellerBizMap = new Map(sellerBusinessData.map((sb: any) => [sb.sellerId, sb]));
      const imagesMap = new Map<string, any[]>();
      imagesData.forEach((img: any) => {
        if (!imagesMap.has(img.productId)) imagesMap.set(img.productId, []);
        imagesMap.get(img.productId)!.push(img);
      });

      const listingsWithSeller = approvedListings.map((listing: any) => {
          const seller = sellerMap.get(listing.sellerId);
          const sellerBiz = sellerBizMap.get(listing.sellerId);

          let listingImages = imagesMap.get(listing.productId) || [];
          
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
              id: (seller as any)?.id ?? listing.sellerId,
              brandName: (sellerBiz as any)?.brandName ?? null,
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
      });

      console.log(
        '[BUYER_CATALOG] Returning response with',
        listingsWithSeller.length,
        'approved listings'
      );
      
      console.log('[DEBUG getApprovedListingsCatalog] Final response:', {
        count: listingsWithSeller.length,
        types: listingsWithSeller.map((l: any) => ({ id: l.id.slice(0, 8), type: l.type, title: l.title })),
        total,
      });

      const estimatedTotal = total === -1 ? input.page * input.limit : total;
      const estimatedPages = total === -1 ? input.page + 1 : Math.ceil(total / input.limit);

          return {
            listings: listingsWithSeller,
            total: estimatedTotal,
            page: input.page,
            totalPages: estimatedPages,
          };
        },
        { ttl: 300 }
      );
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

      const productIds = collectionItemsList.map((item: any) => item.productId);
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
        .map((collectionItem: any) => {
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
        .filter((p: any) => p !== null);

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