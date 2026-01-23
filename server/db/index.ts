import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import dotenv from "dotenv";

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// A global variable for serverless environments
declare global {
  var _pgClient: ReturnType<typeof postgres> | undefined;
  var _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const client = global._pgClient ?? postgres(DATABASE_URL, { prepare: false });
if (!global._pgClient) global._pgClient = client;

export const db = global._db ?? drizzle(client, { schema });
if (!global._db) global._db = db;

// Simple DB health check
export async function waitForDB(retries = 10, delay = 2000) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await client`SELECT 1`;
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
      await client`SELECT 1`;
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

export { client as rawPgClient };