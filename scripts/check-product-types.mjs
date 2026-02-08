import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function checkProductTypes() {
  try {
    console.log('\n===== CHECKING PRODUCT TYPES =====\n');

    const result = await pool.query(`
      SELECT id, title, type, status 
      FROM listings 
      WHERE status = 'approved'
      ORDER BY created_at DESC
    `);

    console.log('📦 Approved Products:\n');
    result.rows.forEach((row, i) => {
      console.log(`  ${i + 1}. "${row.title}"`);
      console.log(`     ID: ${row.id}`);
      console.log(`     Type: ${row.type || 'null'}`);
      console.log(`     Status: ${row.status}\n`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkProductTypes().then(() => process.exit(0));