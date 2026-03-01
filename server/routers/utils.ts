import { db } from "../db";
import { sellers, buyers, buyerAccountDetails } from "../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";
import { createCustomer } from "../services/tsaraCustomer";

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
    const existingBuyer = await db
      .select()
      .from(buyers)
      .where(eq(buyers.userId, userId));

    if (existingBuyer.length > 0) {
      return existingBuyer[0];
    }

    const newBuyerId = uuidv4();
    
    // First create the buyer record
    const newBuyer = {
      id: newBuyerId,
      userId,
      tsaraCustomerId: null as string | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await db.insert(buyers).values(newBuyer);
    
    // Now try to get user details from users table for Tsara customer creation
    // Note: buyerAccountDetails is created separately after profile setup
    let tsaraCustomerId: string | null = null;
    try {
      const { users } = await import('../db/schema');
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, userId));
      
      if (user?.email) {
        const response = await createCustomer({
          email: user.email,
          name: user.name || user.displayName,
          metadata: {
            buyer_id: newBuyerId,
            user_id: userId,
            platform: 'luxela',
          },
        });
        tsaraCustomerId = response.data?.id || (response.data as any)?.id || null;
        
        // Update buyer with Tsara customer ID
        if (tsaraCustomerId) {
          await db
            .update(buyers)
            .set({ tsaraCustomerId, updatedAt: new Date() })
            .where(eq(buyers.id, newBuyerId));
          console.log('[getBuyer] Created Tsara customer:', tsaraCustomerId);
        }
      }
    } catch (tsaraErr: any) {
      console.warn('[getBuyer] Failed to create Tsara customer, will retry during checkout:', tsaraErr.message);
      // Continue without Tsara customer ID - it will be created during checkout via ensureTsaraCustomerId
    }

    return {
      ...newBuyer,
      tsaraCustomerId,
    };
  } catch (err: any) {
    console.error("Error in getBuyer:", err);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get or create buyer profile",
    });
  }
}