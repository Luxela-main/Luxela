import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Make sure it's set in your .env file.");
}

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: 50,
  min: 5,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 10000,
  statement_timeout: 30000,
  query_timeout: 30000,
  // ssl: { rejectUnauthorized: false },
});

pool.on('error', (err) => {
  console.error('[DB_POOL_ERROR]', err.message);
});

pool.on('connect', () => {
  console.log('[DB_POOL] Client connected');
});

pool.on('remove', () => {
  console.log('[DB_POOL] Client removed');
});

export const db = drizzle(pool, { schema });

export { pool as rawPgPool };

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing pool...');
  await pool.end();
  process.exit(0);
});