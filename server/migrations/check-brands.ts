import { db } from '../db';
import { brands } from '../db/schema';

async function main() {
  try {
    console.log('[Check] Fetching all brands from database...\n');
    
    const allBrands = await db.select().from(brands).limit(10);
    
    if (allBrands.length === 0) {
      console.log('❌ No brands found in database!');
      console.log('\nThis could mean:');
      console.log('1. No sellers have created brands yet');
      console.log('2. Brands table is empty');
      console.log('\nTo test, try:');
      console.log('1. Create a seller account');
      console.log('2. Create a brand for that seller');
      process.exit(0);
    }
    
    console.log(`✓ Found ${allBrands.length} brand(s):\n`);
    
    allBrands.forEach((brand: any, index: number) => {
      console.log(`${index + 1}. Brand: ${brand.name}`);
      console.log(`   ID: ${brand.id}`);
      console.log(`   Slug: ${brand.slug || '❌ NULL/EMPTY'}`);
      console.log(`   Seller ID: ${brand.sellerId}`);
      console.log();
    });
    
    const brandsWithoutSlugs = allBrands.filter((b: any) => !b.slug);
    if (brandsWithoutSlugs.length > 0) {
      console.log(`\n⚠️ Found ${brandsWithoutSlugs.length} brand(s) without slugs!`);
      console.log('Running update to generate slugs...\n');
      
      for (const brand of brandsWithoutSlugs) {
        const slug = brand.name
          .toLowerCase()
          .trim()
          .replace(/[^\w\s-]/g, '')
          .replace(/\s+/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-+|-+$/g, '');
        
        console.log(`Updating brand "${brand.name}" → slug: "${slug}"`);
      }
    } else {
      console.log('\n✓ All brands have valid slugs!');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[Check] Error:', error);
    process.exit(1);
  }
}

main();