import { db } from "@/server/db";
import { listings } from "@/server/db/schema";

export async function fetchAllProducts() {
  try {
    return await db.select().from(listings);
  } catch {
    return [];
  }
}