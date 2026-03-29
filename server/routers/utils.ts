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
    
    // Note: Tsara customers are created automatically when payment links are processed
    // No need to manually create customers here

    return newBuyer;
  } catch (err: any) {
    console.error("Error in getBuyer:", err);
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Failed to get or create buyer profile",
    });
  }
}