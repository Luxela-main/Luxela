import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc/trpc';
import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { db } from '../db';
import { shippingRates } from '../db/schema';
import { eq, and, desc } from 'drizzle-orm';

// Standardized shipping zones and costs
const SHIPPING_ZONES = {
  LOCAL: 'local',
  REGIONAL: 'regional',
  NATIONAL: 'national',
  INTERNATIONAL: 'international',
} as const;

// Base shipping costs in cents by weight and zone
const SHIPPING_RATES = {
  local: {
    base: 100,
    perKg: 50,
  },
  regional: {
    base: 250,
    perKg: 75,
  },
  national: {
    base: 500,
    perKg: 100,
  },
  international: {
    base: 2000,
    perKg: 300,
  },
};

export const shippingRouter = createTRPCRouter({
  // Calculate standardized shipping cost
  calculateShippingCost: publicProcedure
    .input(
      z.object({
        weight: z.number().positive('Weight must be positive'),
        fromZipCode: z.string().min(3),
        toZipCode: z.string().min(3),
        country: z.string().default('US'),
      })
    )
    .query(async ({ input }) => {
      try {
        let zone: keyof typeof SHIPPING_RATES = 'national';

        if (input.country !== 'US') {
          zone = 'international';
        } else {
          const fromPrefix = input.fromZipCode.substring(0, 3);
          const toPrefix = input.toZipCode.substring(0, 3);

          if (fromPrefix === toPrefix) {
            zone = 'local';
          } else if (fromPrefix.substring(0, 2) === toPrefix.substring(0, 2)) {
            zone = 'regional';
          } else {
            zone = 'national';
          }
        }

        const rates = SHIPPING_RATES[zone];
        const weightInKg = parseFloat(input.weight.toFixed(2));

        const costCents = Math.ceil(rates.base + weightInKg * rates.perKg);

        return {
          zone,
          weightInKg,
          costCents,
          costUSD: (costCents / 100).toFixed(2),
          breakdown: {
            baseCost: (rates.base / 100).toFixed(2),
            weightCost: ((weightInKg * rates.perKg) / 100).toFixed(2),
            totalCost: (costCents / 100).toFixed(2),
          },
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to calculate shipping cost',
        });
      }
    }),

  // Get shipping rates for reference
  getShippingRates: publicProcedure.query(async () => {
    try {
      return {
        zones: SHIPPING_ZONES,
        rates: Object.entries(SHIPPING_RATES).map(([zone, rates]) => ({
          zone,
          baseCostUSD: (rates.base / 100).toFixed(2),
          perKgCostUSD: (rates.perKg / 100).toFixed(2),
          exampleRates: [
            {
              weight: 0.5,
              costUSD: ((rates.base + 0.5 * rates.perKg) / 100).toFixed(2),
            },
            {
              weight: 1,
              costUSD: ((rates.base + 1 * rates.perKg) / 100).toFixed(2),
            },
            {
              weight: 5,
              costUSD: ((rates.base + 5 * rates.perKg) / 100).toFixed(2),
            },
            {
              weight: 10,
              costUSD: ((rates.base + 10 * rates.perKg) / 100).toFixed(2),
            },
          ],
        })),
      };
    } catch (error: any) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error?.message || 'Failed to fetch shipping rates',
      });
    }
  }),

  // Estimate multiple shipping options
  estimateShippingOptions: publicProcedure
    .input(
      z.object({
        weight: z.number().positive(),
        fromZipCode: z.string().min(3),
        toZipCode: z.string().min(3),
        country: z.string().default('US'),
      })
    )
    .query(async ({ input }) => {
      try {
        const options = [];

        for (const [zone, rates] of Object.entries(SHIPPING_RATES)) {
          const weightInKg = parseFloat(input.weight.toFixed(2));
          const costCents = Math.ceil(rates.base + weightInKg * rates.perKg);

          let deliveryDays = 14;
          if (zone === 'local') deliveryDays = 1;
          else if (zone === 'regional') deliveryDays = 3;
          else if (zone === 'national') deliveryDays = 5;
          else if (zone === 'international') deliveryDays = 14;

          options.push({
            zone,
            costUSD: (costCents / 100).toFixed(2),
            costCents,
            deliveryDays,
            label: `${zone.toUpperCase()} - $${(costCents / 100).toFixed(2)}`,
          });
        }

        return {
          weight: input.weight,
          options: options.sort((a, b) => a.costCents - b.costCents),
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to estimate shipping options',
        });
      }
    }),

  // Validate zip codes for shipping
  validateShippingAddress: publicProcedure
    .input(
      z.object({
        zipCode: z.string().min(3),
        country: z.string().default('US'),
      })
    )
    .query(async ({ input }) => {
      try {
        const isValid =
          /^\d{3,10}$/.test(input.zipCode) &&
          (input.country === 'US' || input.zipCode.length >= 3);

        return {
          valid: isValid,
          zipCode: input.zipCode,
          country: input.country,
          message: isValid
            ? 'Valid shipping address'
            : 'Invalid zip code format',
        };
      } catch (error: any) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error?.message || 'Failed to validate shipping address',
        });
      }
    }),

  // Database-driven seller shipping rates
  getSellerShippingRates: protectedProcedure
    .input(z.object({ sellerId: z.string().uuid() }))
    .query(async ({ ctx, input }) => {
      const rates = await db
        .select()
        .from(shippingRates)
        .where(eq(shippingRates.sellerId, input.sellerId))
        .orderBy(shippingRates.shippingZone);

      return rates;
    }),

  // Create seller shipping rate
  createShippingRate: protectedProcedure
    .input(
      z.object({
        sellerId: z.string().uuid(),
        shippingZone: z.string().min(1),
        minWeight: z.number().positive(),
        maxWeight: z.number().positive(),
        rateCents: z.number().nonnegative(),
        currency: z.string().default('USD'),
        estimatedDays: z.number().int().positive(),
        shippingType: z.enum(['same_day', 'next_day', 'express', 'standard', 'domestic', 'international', 'both']),
        active: z.boolean().default(true),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rate = await db
        .insert(shippingRates)
        .values({
          sellerId: input.sellerId,
          shippingZone: input.shippingZone,
          minWeight: input.minWeight.toString(),
          maxWeight: input.maxWeight.toString(),
          rateCents: input.rateCents,
          currency: input.currency,
          estimatedDays: input.estimatedDays,
          shippingType: input.shippingType,
          active: input.active,
        })
        .returning();

      return rate[0];
    }),

  // Update shipping rate
  updateShippingRate: protectedProcedure
    .input(
      z.object({
        rateId: z.string().uuid(),
        baseCost: z.number().nonnegative().optional(),
        costPerKg: z.number().nonnegative().optional(),
        estimatedDays: z.number().int().positive().optional(),
        enabled: z.boolean().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const rate = await db
        .update(shippingRates)
        .set({
          ...(input.baseCost !== undefined && { baseCost: input.baseCost }),
          ...(input.costPerKg !== undefined && { costPerKg: input.costPerKg }),
          ...(input.estimatedDays && { estimatedDays: input.estimatedDays }),
          ...(input.enabled !== undefined && { enabled: input.enabled }),
          updatedAt: new Date(),
        })
        .where(eq(shippingRates.id, input.rateId))
        .returning();

      return rate[0];
    }),

  // Delete shipping rate
  deleteShippingRate: protectedProcedure
    .input(z.object({ rateId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      await db
        .delete(shippingRates)
        .where(eq(shippingRates.id, input.rateId));

      return { success: true };
    }),

  // Calculate shipping cost from database
  calculateShippingCostFromRate: protectedProcedure
    .input(
      z.object({
        sellerId: z.string().uuid(),
        weight: z.number().positive(),
        zone: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const rate = await db
        .select()
        .from(shippingRates)
        .where(
          and(
            eq(shippingRates.sellerId, input.sellerId),
            eq(shippingRates.shippingZone, input.zone),
            eq(shippingRates.active, true)
          )
        );

      if (!rate.length) {
        throw new Error('Shipping rate not found for zone');
      }

      const shippingRate = rate[0];
      const cost = shippingRate.rateCents + 0 * input.weight;

      return {
        cost,
        estimatedDays: shippingRate.estimatedDays,
        zone: input.zone,
      };
    }),

  // Get shipping zones
  getShippingZones: publicProcedure.query(async () => {
    return {
      zones: [
        {
          type: 'local',
          description: 'Same city',
          estimatedDays: '1-2',
          baseCost: '$1.00',
        },
        {
          type: 'regional',
          description: 'Same state/region',
          estimatedDays: '3-5',
          baseCost: '$2.50',
        },
        {
          type: 'national',
          description: 'Domestic',
          estimatedDays: '5-7',
          baseCost: '$5.00',
        },
        {
          type: 'international',
          description: 'International',
          estimatedDays: '14-21',
          baseCost: '$20.00',
        },
      ],
    };
  }),
});