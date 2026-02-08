import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function testApprovedListingsQuery() {
  try {
    console.log('\n===== TESTING APPROVED LISTINGS QUERY =====\n');

    // Simplified query - just get approved listings
    const result = await pool.query(`
      SELECT 
        l.id,
        l.title,
        l.description,
        l.image,
        l.price_cents,
        l.quantity_available,
        l.category,
        l.status,
        s.id as seller_id,
        sb.brand_name
      FROM listings l
      INNER JOIN sellers s ON l.seller_id = s.id
      LEFT JOIN seller_business sb ON s.id = sb.seller_id
      WHERE l.status = 'approved'
      ORDER BY l.created_at DESC
      LIMIT 10
    `);

    console.log(`✅ Query successful! Found ${result.rows.length} approved listings\n`);

    if (result.rows.length === 0) {
      console.log('❌ No results returned');
    } else {
      console.log('📋 Results:');
      result.rows.forEach((row, i) => {
        console.log(`\n  ${i + 1}. ${row.title}`);
        console.log(`     ID: ${row.id}`);
        console.log(`     Status: ${row.status}`);
        console.log(`     Price: $${(row.price_cents / 100).toFixed(2)}`);
        console.log(`     Qty: ${row.quantity_available}`);
        console.log(`     Seller: ${row.brand_name || 'N/A'}`);
        console.log(`     Seller ID: ${row.seller_id}`);
      });
    }

    console.log('\n==========================================\n');

  } catch (error) {
    console.error('❌ Query Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

testApprovedListingsQuery().then(() => process.exit(0));