import path from 'path';
import { fileURLToPath } from 'url';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, rawPgPool } from './client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Check if we're in a build environment without database access
const isBuildTime = process.env.IS_BUILDING === 'true' || 
                    process.env.NEXT_PHASE === 'phase-production-build' ||
                    process.env.VERCEL_ENV === 'production';

const DATABASE_URL = process.env.DATABASE_URL || process.env.DIRECT_URL;

async function runMigrations() {
  // Skip migrations during build if no database URL is available
  if (!DATABASE_URL) {
    if (isBuildTime) {
      console.log('⚠️  DATABASE_URL not available during build, skipping migrations');
      console.log('   Migrations should be run separately after deployment');
      process.exit(0);
    }
    console.error('❌ DATABASE_URL is not defined. Set it in your .env file or environment.');
    process.exit(1);
  }

  try {
    console.log('🔄 Starting database migrations...');
    console.log(`   Database: ${DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
    
    const migrationsFolder = path.join(__dirname, '../../drizzle');
    console.log(`   Migrations folder: ${migrationsFolder}`);
    
    await migrate(db as any, { migrationsFolder });
    
    console.log('✅ Migrations completed successfully!');
    await rawPgPool.end();
    process.exit(0);
  } catch (error: any) {
    console.error('❌ Migration failed:');
    console.error('   Error:', error.message);
    if (error.code) console.error('   Code:', error.code);
    if (error.detail) console.error('   Detail:', error.detail);
    if (error.hint) console.error('   Hint:', error.hint);
    
    // Provide helpful guidance based on error type
    if (error.message?.includes('ECONNREFUSED') || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Cannot connect to database. Check that:');
      console.error('   1. DATABASE_URL is correct');
      console.error('   2. Database server is running');
      console.error('   3. Network/firewall allows connection');
    } else if (error.message?.includes('authentication failed') || error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check that:');
      console.error('   1. Database password in DATABASE_URL is correct');
      console.error('   2. User has permission to access the database');
    } else if (error.code === '42P07') {
      console.error('\n💡 Object already exists - migration may have partially run');
    }
    
    try {
      await rawPgPool.end();
    } catch (e) {
      // Ignore pool close errors
    }
    process.exit(1);
  }
}

// Run migrations when executed directly
runMigrations();

export { runMigrations };