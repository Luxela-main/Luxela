import { db } from './index';
import { shippingRates } from './schema';
import { eq, and } from 'drizzle-orm';

const nigeriaShippingZones = [
  {
    zone: 'Lagos',
    country: 'Nigeria',
    baseCostCents: 160000,
    costPerKgCents: 5000,
    currency: 'NGN',
    estimatedDays: 1,
  },
  {
    zone: 'Abuja',
    country: 'Nigeria',
    baseCostCents: 250000,
    costPerKgCents: 8000,
    currency: 'NGN',
    estimatedDays: 2,
  },
  {
    zone: 'Accra',
    country: 'Ghana',
    baseCostCents: 300000,
    costPerKgCents: 10000,
    currency: 'NGN',
    estimatedDays: 3,
  },
  {
    zone: 'Port Harcourt',
    country: 'Nigeria',
    baseCostCents: 280000,
    costPerKgCents: 9000,
    currency: 'NGN',
    estimatedDays: 2,
  },
  {
    zone: 'Kano',
    country: 'Nigeria',
    baseCostCents: 320000,
    costPerKgCents: 10000,
    currency: 'NGN',
    estimatedDays: 3,
  },
  {
    zone: 'Enugu',
    country: 'Nigeria',
    baseCostCents: 270000,
    costPerKgCents: 8500,
    currency: 'NGN',
    estimatedDays: 2,
  },
];

async function seed() {
  try {
    console.log('🌱 Starting database seed...');

    for (const zone of nigeriaShippingZones) {
      const existing = await db
        .select()
        .from(shippingRates)
        .where(
          and(
            eq(shippingRates.shippingZone, zone.zone),
            eq(shippingRates.currency, zone.currency)
          )
        )
        .limit(1);

      if (!existing || existing.length === 0) {
        await db.insert(shippingRates).values({
          sellerId: 'default-seller-id',
          shippingZone: zone.zone,
          minWeight: '0',
          maxWeight: '100',
          rateCents: zone.baseCostCents,
          currency: zone.currency,
          estimatedDays: zone.estimatedDays,
          shippingType: 'standard',
        });
        console.log(`✓ Created shipping rate for ${zone.zone}`);
      } else {
        console.log(`✓ Shipping rate for ${zone.zone} already exists`);
      }
    }

    console.log('✅ Seed completed successfully');
  } catch (error) {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  }
}

seed().then(() => process.exit(0));