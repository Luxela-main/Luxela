import 'dotenv/config';
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;
const IS_BUILD_TIME =
  process.env.IS_BUILDING === "true" ||
  process.env.NEXT_PHASE === "phase-production-build";

if (!DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not defined. Make sure it's set in your .env file."
  );
}

if (IS_BUILD_TIME) {
  console.log("[DB_POOL] Build-time mode: using optimized pool configuration");
}

// Vercel-optimized pool configuration with build-time adjustments
const poolConfig = {
  connectionString: DATABASE_URL,
  max: IS_BUILD_TIME ? 5 : NODE_ENV === "production" ? 10 : 20,
  min: IS_BUILD_TIME ? 1 : NODE_ENV === "production" ? 2 : 1,
  idleTimeoutMillis: IS_BUILD_TIME
    ? 15000
    : NODE_ENV === "production"
      ? 30000
      : 60000,
  connectionTimeoutMillis: IS_BUILD_TIME
    ? 5000
    : NODE_ENV === "production"
      ? 8000
      : 10000,
  statement_timeout: IS_BUILD_TIME
    ? 15000
    : NODE_ENV === "production"
      ? 30000
      : 45000,
  query_timeout: IS_BUILD_TIME
    ? 15000
    : NODE_ENV === "production"
      ? 30000
      : 45000,
  application_name: `luxela-app${IS_BUILD_TIME ? "-build" : ""}`,
  allowExitOnIdle: true,
};

const pool = new Pool(poolConfig);

pool.on("error", (err: any) => {
  console.error("[DB_POOL_ERROR]", err.message);
});

pool.on("connect", () => {
  if (process.env.DEBUG === "true") {
    console.log("[DB_POOL] Client connected");
  }
});

pool.on("remove", () => {
  if (process.env.DEBUG === "true") {
    console.log("[DB_POOL] Client removed");
  }
});

export const db = drizzle(pool, { schema });

export { pool as rawPgPool };

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[DB_POOL] SIGTERM received, closing pool...");
  await pool.end();
  process.exit(0);
});

// Health check function
export async function checkDBHealth(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT 1");
    return result.rows.length > 0;
  } catch (error) {
    console.error("[DB_HEALTH_CHECK] Failed:", error);
    return false;
  }
}