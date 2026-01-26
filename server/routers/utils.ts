import { db } from "../db";
import { sellers } from "../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { v4 as uuidv4 } from "uuid";

/**
 * Get a seller record for a given user ID.
 * 
 * This function ensures that every user with the 'seller' role has a corresponding
 * seller record in the database. If no seller profile exists, it automatically creates one.
 * 
 * @param userId - The user ID to get a seller for
 * @returns The seller record
 * @throws Error if seller retrieval or creation fails
 */
export async function getSeller(userId: string) {
  try {
    // Check if seller exists
    const existingSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, userId));

    if (existingSeller.length > 0) {
      return existingSeller[0];
    }

    // Auto-create seller profile if it doesn't exist
    const newSeller = {
      id: uuidv4(),
      userId,
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