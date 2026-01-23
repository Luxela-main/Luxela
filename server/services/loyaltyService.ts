import { db } from '../db';
import { loyaltyNFTs, orders } from '../db/schema';
import { eq, sql } from 'drizzle-orm';

type NFTTier = 'bronze' | 'silver' | 'gold' | 'platinum';

interface NFTConfig {
  threshold: number;
  tier: NFTTier;
  title: string;
  rarity: string;
  property: string;
  image: string;
}

const NFT_TIERS: NFTConfig[] = [
  {
    threshold: 500,
    tier: 'platinum',
    title: 'Platinum Collector NFT',
    rarity: 'Platinum',
    property: 'Elite Member',
    image: '/nft-platinum.png',
  },
  {
    threshold: 100,
    tier: 'gold',
    title: 'Gold Collector NFT',
    rarity: 'Gold',
    property: 'Premium Member',
    image: '/nft-gold.png',
  },
  {
    threshold: 50,
    tier: 'silver',
    title: 'Silver Collector NFT',
    rarity: 'Silver',
    property: 'Valued Member',
    image: '/nft-silver.png',
  },
  {
    threshold: 10,
    tier: 'bronze',
    title: 'Bronze Collector NFT',
    rarity: 'Bronze',
    property: 'Welcome Member',
    image: '/nft-bronze.png',
  },
];

/**
 * Get buyer's total spending in dollars
 */
async function getBuyerSpending(buyerId: string): Promise<number> {
  const result = await db
    .select({
      totalSpent: sql`COALESCE(SUM(${orders.amountCents}), 0)`,
    })
    .from(orders)
    .where(eq(orders.buyerId, buyerId));

  const totalCents = Number(result[0]?.totalSpent) || 0;
  return totalCents / 100;
}

/**
 * Check if buyer already has an NFT of a specific tier
 */
async function hasTierNFT(
  buyerId: string,
  tier: NFTTier
): Promise<boolean> {
  const result = await db
    .select({ id: loyaltyNFTs.id })
    .from(loyaltyNFTs)
    .where(
      sql`${loyaltyNFTs.buyerId} = ${buyerId} AND ${loyaltyNFTs.tier} = ${tier}`
    )
    .limit(1);

  return result.length > 0;
}

/**
 * Mint a new NFT for buyer if they haven't reached that tier yet
 */
async function mintNFT(
  buyerId: string,
  config: NFTConfig
): Promise<void> {
  const hasNFT = await hasTierNFT(buyerId, config.tier);
  if (hasNFT) return;

  await db.insert(loyaltyNFTs).values({
    buyerId,
    tier: config.tier,
    title: config.title,
    description: `Unlocked at ${config.rarity} tier by spending $${config.threshold}+`,
    image: config.image,
    loyaltyPoints: config.threshold,
    rarity: config.rarity,
    property: config.property,
    earnedDate: new Date(),
  });
}

/**
 * Process loyalty rewards for a buyer
 * Called after each purchase
 */
export async function processLoyaltyRewards(buyerId: string): Promise<void> {
  try {
    const spending = await getBuyerSpending(buyerId);

    // Check each tier from highest to lowest
    // Mint NFTs for all tiers the buyer has reached
    for (const nftConfig of NFT_TIERS) {
      if (spending >= nftConfig.threshold) {
        await mintNFT(buyerId, nftConfig);
      }
    }
  } catch (error) {
    console.error('Error processing loyalty rewards:', error);
    // Don't throw - loyalty is not critical for purchase flow
  }
}

/**
 * Get buyer's current loyalty tier based on spending
 */
export async function getBuyerLoyaltyTier(
  buyerId: string
): Promise<NFTTier | null> {
  const spending = await getBuyerSpending(buyerId);

  for (const config of NFT_TIERS) {
    if (spending >= config.threshold) {
      return config.tier;
    }
  }

  return null;
}

/**
 * Get all earned NFTs for a buyer
 */
export async function getBuyerNFTs(buyerId: string) {
  return db
    .select({
      id: loyaltyNFTs.id,
      tier: loyaltyNFTs.tier,
      title: loyaltyNFTs.title,
      image: loyaltyNFTs.image,
      rarity: loyaltyNFTs.rarity,
      property: loyaltyNFTs.property,
      loyaltyPoints: loyaltyNFTs.loyaltyPoints,
      earnedDate: loyaltyNFTs.earnedDate,
    })
    .from(loyaltyNFTs)
    .where(eq(loyaltyNFTs.buyerId, buyerId));
}