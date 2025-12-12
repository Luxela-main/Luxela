// Adjust these imports based on your DB setup
import { db } from "@/server/db"; 
import { products, categories, blogs } from "@/server/db/schema";

export async function fetchAllProducts() {
  try {
    return await db.select().from(products);
  } catch {
    return [];
  }
}

export async function fetchAllCategories() {
  try {
    return await db.select().from(categories);
  } catch {
    return [];
  }
}

export async function fetchAllBlogs() {
  try {
    return await db.select().from(blogs);
  } catch {
    return [];
  }
}