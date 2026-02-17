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
      console.log(
        `[Tsara] Reusing existing customer ID for buyer ${buyerId}: ${buyer.tsaraCustomerId}`
      );
      return buyer.tsaraCustomerId;
    }

    // Fetch buyer account details to get email
    const buyerDetails = await db.query.buyerAccountDetails.findFirst({
      where: eq(buyerAccountDetails.buyerId, buyerId),
    });

    if (!buyerDetails) {
      throw new Error(`Buyer account details not found for buyer ${buyerId}`);
    }

    // Create Tsara customer with retry logic
    console.log(
      `[Tsara] Creating new customer for buyer ${buyerId} with email ${buyerDetails.email}`
    );

    let response;
    let lastError: Error | null = null;

    // Retry up to 3 times with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        response = await createCustomer({
          email: buyerDetails.email,
          name: buyerDetails.fullName || undefined,
          phone: buyerDetails.phoneNumber || undefined,
          metadata: {
            buyerId: buyerId,
            username: buyerDetails.username,
          },
        });

        // Validate response structure
        if (!response?.data?.id) {
          lastError = new Error(
            'Tsara customer creation failed: No customer ID in response'
          );
          console.warn(
            `[Tsara] Attempt ${attempt}/3 failed: Missing customer ID in response. Retrying...`
          );

          // Only retry if not the last attempt
          if (attempt < 3) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * attempt)
            );
          }
          continue;
        }

        const tsaraCustomerId = response.data.id;

        // Save the Tsara customer ID to the buyers table
        await db
          .update(buyers)
          .set({ tsaraCustomerId })
          .where(eq(buyers.id, buyerId));

        console.log(
          `[Tsara] Successfully created and saved customer ID for buyer ${buyerId}: ${tsaraCustomerId}`
        );
        return tsaraCustomerId;
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[Tsara] Attempt ${attempt}/3 failed: ${error.message}`
        );

        if (attempt < 3) {
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * attempt)
          );
        }
      }
    }

    // All retries exhausted
    throw (
      lastError ||
      new Error('Failed to create Tsara customer after 3 attempts')
    );
  } catch (error: any) {
    console.error(
      `[Tsara] Error in getOrCreateTsaraCustomer for buyer ${buyerId}:`,
      {
        message: error.message,
        error: error,
      }
    );
    throw new Error(
      `Failed to get or create Tsara customer: ${error.message}`
    );
  }
}