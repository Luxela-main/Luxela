import { db } from '../db';
import { buyers, buyerAccountDetails } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createCustomer } from './tsaraCustomer';

export async function getOrCreateTsaraCustomer(buyerId: string): Promise<string> {
  try {
    // Fetch buyer record
    const buyer = await db.query.buyers.findFirst({
      where: eq(buyers.id, buyerId),
    });

    if (!buyer) {
      throw new Error(`Buyer not found: ${buyerId}`);
    }

    // If buyer already has a Tsara customer ID, return it
    if (buyer.tsaraCustomerId) {
      console.log(`[Tsara] Reusing existing customer ID for buyer ${buyerId}: ${buyer.tsaraCustomerId}`);
      return buyer.tsaraCustomerId;
    }

    // Fetch buyer account details to get email
    const buyerDetails = await db.query.buyerAccountDetails.findFirst({
      where: eq(buyerAccountDetails.buyerId, buyerId),
    });

    if (!buyerDetails) {
      throw new Error(`Buyer account details not found for buyer ${buyerId}`);
    }

    // Create Tsara customer
    console.log(`[Tsara] Creating new customer for buyer ${buyerId} with email ${buyerDetails.email}`);
    const response = await createCustomer({
      email: buyerDetails.email,
      name: buyerDetails.fullName || undefined,
      phone: buyerDetails.phoneNumber || undefined,
      metadata: {
        buyerId: buyerId,
        username: buyerDetails.username,
      },
    });

    if (!response.data?.id) {
      throw new Error('Tsara customer creation failed: No customer ID in response');
    }

    const tsaraCustomerId = response.data.id;

    // Save the Tsara customer ID to the buyers table
    await db.update(buyers)
      .set({ tsaraCustomerId })
      .where(eq(buyers.id, buyerId));

    console.log(`[Tsara] Successfully created and saved customer ID for buyer ${buyerId}: ${tsaraCustomerId}`);
    return tsaraCustomerId;
  } catch (error: any) {
    console.error(`[Tsara] Error in getOrCreateTsaraCustomer for buyer ${buyerId}:`, {
      message: error.message,
      error: error,
    });
    throw new Error(`Failed to get or create Tsara customer: ${error.message}`);
  }
}