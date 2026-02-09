import { db } from '../db';
import { brands } from '../db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('[Migration] Starting: fix-brand-slugs-unique\n');
    
    // Get all brands
    const allBrands = await db.select().from(brands);
    
    console.log(`Found ${allBrands.length} brands to update\n`);
    
    // Update each brand with a unique slug
    for (const brand of allBrands) {
      // Create unique slug by combining name with first 8 chars of ID
      const baseSlug = brand.name
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-+|-+$/g, '');
      
      const uniqueId = brand.id.substring(0, 8);
      const uniqueSlug = baseSlug ? `${baseSlug}-${uniqueId}` : uniqueId;
      
      // Update the brand with the unique slug
      await db.execute(
        sql`UPDATE brands SET slug = ${uniqueSlug} WHERE id = ${brand.id}`
      );
      
      console.log(`✓ Updated brand "${brand.name}"`);
      console.log(`  ID: ${brand.id}`);
      console.log(`  New slug: ${uniqueSlug}\n`);
    }
    
    console.log('[Migration] ✓ Completed: fix-brand-slugs-unique');
    console.log(`[Migration] Updated ${allBrands.length} brand(s)`);
    
    process.exit(0);
  } catch (error) {
    console.error('[Migration] Error:', error);
    process.exit(1);
  }
}

main();