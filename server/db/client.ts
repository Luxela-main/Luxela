import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined. Make sure it's set in your .env file.");
}

// Pool options:
// - max: max clients in the pool (tune for your environment)
// - idleTimeoutMillis: time a client must sit idle before being closed
// - connectionTimeoutMillis: time to wait for a new client
// - ssl: Uncomment and set when connecting to Supabase if needed (Supabase usually handles SSL in the connection string)
const pool = new Pool({
  connectionString: DATABASE_URL,
  // max: 10,
  // idleTimeoutMillis: 30000,
  // connectionTimeoutMillis: 2000,
  // ssl: { rejectUnauthorized: false },
});

export const db = drizzle(pool, { schema });

// Export pool for graceful shutdowns or raw access in tests
export { pool as rawPgPool };