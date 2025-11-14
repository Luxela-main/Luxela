import 'dotenv/config';
import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL);

(async () => {
  try {
    const result = await sql`SELECT NOW()`;
    console.log('✅ Connected! Current time from DB:', result);
    await sql.end({ timeout: 5 });
  } catch (err) {
    console.error(err);
  }
})();