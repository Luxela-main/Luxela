import { db } from '../db';
import { buyers, buyerAccountDetails } from '../db/schema';
import { eq } from 'drizzle-orm';
import { createCustomer } from './tsaraCustomer';

export async function getOrCreateTsaraCustomer(buyerId: string): Promise<string> {
  try {
    console.log(`[Tsara] Getting or creating customer for buyer: ${buyerId}`);
    
    // Fetch buyer record using proper drizzle query
    const buyerResult = await db
      .select()
      .from(buyers)
      .where(eq(buyers.id, buyerId))
      .limit(1);
    
    const buyer = buyerResult[0];

    if (!buyer) {
      console.error(`[Tsara] Buyer not found in database: ${buyerId}`);
      throw new Error(`Buyer not found: ${buyerId}`);
    }
    
    console.log(`[Tsara] Found buyer record:`, { 
      buyerId: buyer.id, 
      hasTsaraCustomerId: !!buyer.tsaraCustomerId,
      tsaraCustomerId: buyer.tsaraCustomerId 
    });

    // If buyer already has a Tsara customer ID, return it
    if (buyer.tsaraCustomerId) {
      console.log(
        `[Tsara] Reusing existing customer ID for buyer ${buyerId}: ${buyer.tsaraCustomerId}`
      );
      return buyer.tsaraCustomerId;
    }

    // Fetch buyer account details to get email
    const buyerDetailsResult = await db
      .select()
      .from(buyerAccountDetails)
      .where(eq(buyerAccountDetails.buyerId, buyerId))
      .limit(1);
    
    const buyerDetails = buyerDetailsResult[0];

    if (!buyerDetails) {
      console.error(`[Tsara] Buyer account details not found for buyer: ${buyerId}`);
      throw new Error(`Buyer account details not found for buyer ${buyerId}`);
    }
    
    console.log(`[Tsara] Found buyer details:`, { 
      email: buyerDetails.email,
      hasFullName: !!buyerDetails.fullName,
      hasPhone: !!buyerDetails.phoneNumber 
    });

    // Create Tsara customer with retry logic
    console.log(
      `[Tsara] Creating new customer for buyer ${buyerId} with email ${buyerDetails.email}`
    );

    let response;
    let lastError: Error | null = null;

    // Retry up to 3 times with exponential backoff
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        console.log(`[Tsara] Attempt ${attempt}/3: Calling createCustomer API...`);
        
        response = await createCustomer({
          email: buyerDetails.email,
          name: buyerDetails.fullName || undefined,
          phone: buyerDetails.phoneNumber || undefined,
          metadata: {
            buyerId: buyerId,
            username: buyerDetails.username,
          },
        });
        
        console.log(`[Tsara] Attempt ${attempt}/3: Raw response:`, JSON.stringify(response, null, 2));

        // Validate response structure - handle both {data: {id}} and {id} formats
        let customerId: string | null = null;
        
        if (response?.data?.id) {
          customerId = response.data.id;
        } else if ((response as any)?.id) {
          customerId = (response as any).id;
        } else if (response?.data?.data?.id) {
          // Nested data structure
          customerId = response.data.data.id;
        }
        
        if (!customerId) {
          lastError = new Error(
            `Tsara customer creation failed: No customer ID in response. Response: ${JSON.stringify(response)}`
          );
          console.warn(
            `[Tsara] Attempt ${attempt}/3 failed: Missing customer ID in response.`,
            `Response structure:`, Object.keys(response || {}),
            `Data structure:`, Object.keys(response?.data || {})
          );

          // Only retry if not the last attempt
          if (attempt < 3) {
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * attempt)
            );
          }
          continue;
        }

        const tsaraCustomerId = customerId;

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
        error: error.toString(),
        response: error.response ? {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
        } : undefined,
      }
    );
    throw new Error(
      `Failed to get or create Tsara customer: ${error.message}`
    );
  }
}