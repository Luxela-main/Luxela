import { db } from '../db';
import { brands } from '../db/schema';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('[Migration] Starting: populateBrandSlugs');
    
    // Generate slugs from brand names for any missing slugs
    const result = await db.execute(sql`
      UPDATE brands
      SET slug = LOWER(
        REGEXP_REPLACE(
          REGEXP_REPLACE(
            REGEXP_REPLACE(name, ' +', '-', 'g'),
            '[^a-z0-9\\-]', '', 'g'
          ),
          '-+', '-', 'g'
        )
      )
      WHERE slug IS NULL OR slug = '' OR slug ~ '^\s*$'
    `);

    console.log('[Migration] Completed: populateBrandSlugs');
    console.log('[Migration] Affected rows:', result);
    
    process.exit(0);
  } catch (error) {
    console.error('[Migration] Error in populateBrandSlugs:', error);
    process.exit(1);
  }
}

main();