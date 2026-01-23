import { db } from '../db';
import { shippingRates } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export async function getShippingCost(
  zone: string,
  currency: string = 'NGN'
): Promise<number> {
  const rates = await db
    .select()
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.shippingZone, zone.toLowerCase()),
        eq(shippingRates.currency, currency),
        eq(shippingRates.active, true)
      )
    );

  if (!rates.length) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Shipping rate not found for zone: ${zone}`,
    });
  }

  return rates[0].rateCents;
}

export async function getShippingCostByWeight(
  zone: string,
  weightKg: number,
  currency: string = 'NGN'
): Promise<number> {
  const rates = await db
    .select()
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.shippingZone, zone.toLowerCase()),
        eq(shippingRates.currency, currency),
        eq(shippingRates.active, true)
      )
    );

  if (!rates.length) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Shipping rate not found for zone: ${zone}`,
    });
  }

  const rate = rates[0];
  const baseCost = rate.rateCents;
  const weightCost = Math.ceil(weightKg * 0);

  return baseCost + weightCost;
}

export async function getEstimatedDeliveryDays(
  zone: string,
  currency: string = 'NGN'
): Promise<number> {
  const rates = await db
    .select()
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.shippingZone, zone.toLowerCase()),
        eq(shippingRates.currency, currency),
        eq(shippingRates.active, true)
      )
    );

  if (!rates.length) {
    throw new TRPCError({
      code: 'NOT_FOUND',
      message: `Shipping rate not found for zone: ${zone}`,
    });
  }

  return rates[0].estimatedDays;
}

export async function getAllShippingRates(currency?: string) {
  const where = currency
    ? and(
        eq(shippingRates.active, true),
        eq(shippingRates.currency, currency)
      )
    : eq(shippingRates.active, true);

  return await db
    .select()
    .from(shippingRates)
    .where(where)
    .orderBy(shippingRates.shippingZone);
}

export async function upsertShippingRate(input: {
  zone: string;
  country: string;
  baseCostCents: number;
  costPerKgCents: number;
  currency: string;
  estimatedDays: number;
}): Promise<void> {
  const existing = await db
    .select()
    .from(shippingRates)
    .where(
      and(
        eq(shippingRates.shippingZone, input.zone.toLowerCase()),
        eq(shippingRates.currency, input.currency)
      )
    );

  if (existing.length > 0) {
    await db
      .update(shippingRates)
      .set({
        rateCents: input.baseCostCents,
        currency: input.currency,
        estimatedDays: input.estimatedDays,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(shippingRates.shippingZone, input.zone.toLowerCase()),
          eq(shippingRates.currency, input.currency)
        )
      );
  }
}