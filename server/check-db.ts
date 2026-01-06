import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error("❌ DATABASE_URL is not set in .env or Vercel environment");
  process.exit(1);
}

// Global singletons for serverless environments
declare global {
  var _pgSqlClient: ReturnType<typeof postgres> | undefined;
  var _db: ReturnType<typeof drizzle> | undefined;
}

// Create or reuse a postgres client
export const sql = global._pgSqlClient ?? postgres(DATABASE_URL, { prepare: false });
if (!global._pgSqlClient) global._pgSqlClient = sql;

// Create or reuse a drizzle instance
export const db = global._db ?? drizzle({ client: sql });
if (!global._db) global._db = db;

// Simple DB health check
export async function waitForDB(retries = 10, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await sql`SELECT 1`;
      console.log("✅ Supabase Postgres is reachable");
      return;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.warn(`⏳ Attempt ${attempt} failed: ${msg}`);
      if (attempt < retries) {
        await new Promise((res) => setTimeout(res, delay));
      } else {
        console.error("❌ Could not connect to Supabase Postgres after multiple attempts.");
        process.exit(1);
      }
    }
  }
}

// keep-alive ping for local development
const PING_INTERVAL = 30_000;
export function startKeepAlive() {
  console.log(`🔄 Starting DB keep-alive pings every ${PING_INTERVAL / 1000}s`);
  setInterval(async () => {
    try {
      await sql`SELECT 1`;
      console.log(`💓 DB ping successful at ${new Date().toLocaleTimeString()}`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error(`❌ Lost DB connection at ${new Date().toLocaleTimeString()}:`, msg);
    }
  }, PING_INTERVAL);
}

// Auto-run keep-alive only in local dev
if (process.env.NODE_ENV === "development") {
  (async () => {
    await waitForDB();
    startKeepAlive();
  })();
}