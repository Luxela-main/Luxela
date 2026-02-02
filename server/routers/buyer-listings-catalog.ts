import { createTRPCRouter, publicProcedure } from "../trpc/trpc";
import { db } from "../db";
import { listings, sellers, sellerBusiness } from "../db/schema";
import { and, eq, desc, sql, count as countFn } from "drizzle-orm";
import { z } from "zod";

export const buyerListingsCatalogRouter = createTRPCRouter({
  getApprovedListingsCatalog: publicProcedure
    .meta({
      openapi: {
        method: "GET",
        path: "/buyer/listings/catalog",
        tags: ["Buyer Listings"],
        summary: "Get approved listings for buyer catalog",
      },
    })
    .input(
      z.object({
        page: z.number().int().positive().default(1),
        limit: z.number().int().positive().max(100).default(20),
        category: z.string().optional(),
        sortBy: z
          .enum(["newest", "price_low", "price_high", "popular"])
          .default("newest"),
        search: z.string().optional(),
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
            price: z.number(),
            category: z.string().nullable(),
            seller: z.object({
              id: z.string().uuid(),
              brandName: z.string().nullable(),
            }),
            status: z.enum(["in_stock", "low_stock", "sold_out"]),
            createdAt: z.date(),
          })
        ),
        total: z.number(),
        page: z.number(),
        totalPages: z.number(),
      })
    )
    .query(async ({ input }) => {
      const offset = (input.page - 1) * input.limit;
      const conditions = [eq(listings.status, "approved")];

      if (input.category) {
        conditions.push(eq(listings.category, input.category as any));
      }

      if (input.search) {
        conditions.push(
          sql`${listings.title} ILIKE ${"%" + input.search + "%"}`
        );
      }

      const countResult = await db
        .select({ count: countFn() })
        .from(listings)
        .where(and(...conditions));

      const total = Number(countResult[0]?.count as any ?? 0);
      const totalPages = Math.ceil(total as number / input.limit);

      let orderByClause;
      if (input.sortBy === "newest") {
        orderByClause = desc(listings.createdAt);
      } else if (input.sortBy === "price_low") {
        orderByClause = listings.priceCents;
      } else if (input.sortBy === "price_high") {
        orderByClause = desc(listings.priceCents);
      } else {
        orderByClause = desc(listings.createdAt);
      }

      const approvedListings = await db
        .select({
          id: listings.id,
          title: listings.title,
          description: listings.description,
          image: listings.image,
          priceCents: listings.priceCents,
          category: listings.category,
          supplyCapacity: listings.supplyCapacity,
          quantityAvailable: listings.quantityAvailable,
          sellerId: listings.sellerId,
          createdAt: listings.createdAt,
        })
        .from(listings)
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(input.limit)
        .offset(offset);

      const listingsWithSeller = await Promise.all(
        approvedListings.map(async (listing) => {
          const seller = await db.query.sellers.findFirst({
            where: eq(sellers.id, listing.sellerId),
          });

          const sellerBiz = seller
            ? await db.query.sellerBusiness.findFirst({
                where: eq(sellerBusiness.sellerId, listing.sellerId),
              })
            : null;

          let status: "in_stock" | "low_stock" | "sold_out" = "in_stock";
          if (listing.supplyCapacity === "limited") {
            const qty = listing.quantityAvailable ?? 0;
            if (qty <= 0) status = "sold_out";
            else if (qty <= 5) status = "low_stock";
          }

          return {
            id: listing.id,
            title: listing.title,
            description: listing.description,
            image: listing.image,
            price: (listing.priceCents ?? 0) / 100,
            category: listing.category,
            seller: {
              id: listing.sellerId,
              brandName: sellerBiz?.brandName ?? null,
            },
            status,
            createdAt: listing.createdAt,
          };
        })
      );

      return {
        listings: listingsWithSeller,
        total,
        page: input.page,
        totalPages,
      };
    }),
});