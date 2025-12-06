import { db } from "../db";
import { sellers } from "../db/schema";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

/**
 * Get or create a seller record for a given user ID.
 * 
 * This function ensures that every user with the 'seller' role has a corresponding
 * seller record in the database. If the seller doesn't exist, it will be created automatically.
 * 
 * @param userId - The user ID to get or create a seller for
 * @returns The seller record
 * @throws Error if seller creation fails
 */
export async function getOrCreateSeller(userId: string) {
  try {
    // Check if seller exists
    const existingSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, userId));

    if (existingSeller.length > 0) {
      return existingSeller[0];
    }

    // Create new seller
    const sellerId = randomUUID();
    await db.insert(sellers).values({
      id: sellerId,
      userId,
    });

    // Fetch newly created seller
    const newSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.id, sellerId));

    if (!newSeller[0]) {
      throw new Error("Failed to create seller record");
    }

    return newSeller[0];
  } catch (err: any) {
    console.error("Error in getOrCreateSeller:", err);
    throw new Error(`getOrCreateSeller failed: ${err?.message || err}`);
  }
}
