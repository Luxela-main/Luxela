import { db } from "../db";
import { sellers, buyers, buyerAccountDetails } from "../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";

export async function getSeller(userId: string): Promise<typeof sellers.$inferSelect> {
  try {
    const existingSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, userId));

    if (existingSeller.length > 0) {
      return existingSeller[0];
    }

    const newSeller = {
      id: uuidv4(),
      userId,
      brandId: null,
      profilePhoto: null,
      payoutMethods: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(sellers).values(newSeller);
    return newSeller;
  } catch (err: any) {
    console.error("Error in getSeller:", err);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get or create seller profile",
    });
  }
}

export async function getBuyer(userId: string): Promise<typeof buyers.$inferSelect> {
  try {
    // Validate userId format
    if (!userId || typeof userId !== 'string') {
      console.error('[getBuyer] Invalid userId:', { userId, type: typeof userId });
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Invalid user ID provided",
      });
    }

    console.log('[getBuyer] Attempting to find buyer for userId:', userId);

    const existingBuyer = await db
      .select()
      .from(buyers)
      .where(eq(buyers.userId, userId));

    if (existingBuyer.length > 0) {
      console.log('[getBuyer] Found existing buyer:', existingBuyer[0].id);
      return existingBuyer[0];
    }

    console.log('[getBuyer] No existing buyer found, creating new one...');

    const newBuyerId = uuidv4();
    
    // First create the buyer record
    const newBuyer = {
      id: newBuyerId,
      userId,
      tsaraCustomerId: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    console.log('[getBuyer] Inserting new buyer:', newBuyerId);

    await db.insert(buyers).values(newBuyer);
    
    console.log('[getBuyer] Successfully created new buyer:', newBuyerId);

    // Note: Tsara customers are created automatically when payment links are processed
    // No need to manually create customers here

    return newBuyer;
  } catch (err: any) {
    console.error("[getBuyer] Error:", {
      message: err?.message,
      code: err?.code,
      name: err?.name,
      userId,
      stack: err?.stack,
      detail: err?.detail,
      isQueryError: err?.query !== undefined,
    });
    
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get or create buyer profile. Please try again.",
    });
  }
}