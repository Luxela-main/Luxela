
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import { sql } from 'drizzle-orm';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

const db = drizzle(pool);

async function runMigration() {
  console.log('Running manual migration...');
  
  try {
    // Check if columns exist first to avoid errors
    await db.execute(sql`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_business' AND column_name = 'store_description') THEN
          ALTER TABLE "seller_business" ADD COLUMN "store_description" text;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_business' AND column_name = 'store_logo') THEN
          ALTER TABLE "seller_business" ADD COLUMN "store_logo" text;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'seller_business' AND column_name = 'store_banner') THEN
          ALTER TABLE "seller_business" ADD COLUMN "store_banner" text;
        END IF;
      END $$;
    `);
    
    console.log('Migration completed successfully.');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    await pool.end();
  }
}

runMigration();
