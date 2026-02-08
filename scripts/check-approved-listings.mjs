import 'dotenv/config';
import pg from 'pg';

const { Pool } = pg;

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL is not defined');
  process.exit(1);
}

const pool = new Pool({ connectionString: DATABASE_URL });

async function checkListings() {
  try {
    console.log('\n===== LUXELA DATABASE CHECK =====\n');

    // Check all listings by status
    const result = await pool.query(`
      SELECT status, COUNT(*) as count 
      FROM listings 
      GROUP BY status
    `);

    console.log('📊 Listings by status:');
    result.rows.forEach(row => {
      console.log(`   ${row.status}: ${row.count}`);
    });

    // Get count of approved
    const approvedResult = await pool.query(`
      SELECT COUNT(*) as count FROM listings WHERE status = 'approved'
    `);
    const approvedCount = parseInt(approvedResult.rows[0].count);
    console.log(`\n✅ APPROVED LISTINGS: ${approvedCount}`);

    if (approvedCount === 0) {
      console.log('\n⚠️  NO APPROVED LISTINGS!');
      console.log('\nGetting first pending listing to approve...');
      
      const pendingResult = await pool.query(`
        SELECT id, title, status FROM listings WHERE status = 'pending_review' LIMIT 1
      `);

      if (pendingResult.rows.length > 0) {
        const listing = pendingResult.rows[0];
        console.log(`\nFound: ${listing.title}`);
        console.log(`ID: ${listing.id}`);
        console.log(`Current Status: ${listing.status}`);
        console.log('\n💡 To approve this listing, run this SQL:');
        console.log(`   UPDATE listings SET status = 'approved' WHERE id = '${listing.id}';`);
      } else {
        console.log('\nNo pending listings found. Please add listings first.');
      }
    } else {
      console.log('\n📋 Sample approved listings:');
      const sampleResult = await pool.query(`
        SELECT id, title, price_cents, quantity_available 
        FROM listings 
        WHERE status = 'approved' 
        LIMIT 3
      `);

      sampleResult.rows.forEach((row, i) => {
        console.log(`\n  ${i + 1}. ${row.title}`);
        console.log(`     Price: $${(row.price_cents / 100).toFixed(2)}`);
        console.log(`     Qty: ${row.quantity_available}`);
      });
    }

    console.log('\n=====================================\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

checkListings().then(() => process.exit(0));