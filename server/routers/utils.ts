import { db } from "../db";
import { sellers } from "../db/schema";
import { eq } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Get a seller record for a given user ID.
 * 
 * This function ensures that every user with the 'seller' role has a corresponding
 * seller record in the database.
 * 
 * @param userId - The user ID to get a seller for
 * @returns The seller record
 * @throws Error if seller creation fails
 */
export async function getSeller(userId: string) {
  try {
    // Check if seller exists
    const existingSeller = await db
      .select()
      .from(sellers)
      .where(eq(sellers.userId, userId));

    if (existingSeller.length === 0) {
      throw new TRPCError({
        code: "NOT_FOUND",
        message: "Seller profile not found. Please create a profile first.",
      });
    }

    return existingSeller[0];
  } catch (err: any) {
    console.error("Error in getSeller:", err);
    if (err instanceof TRPCError) {
      throw err;
    }
    throw new Error(`getSeller failed: ${err?.message || err}`);
  }
}
