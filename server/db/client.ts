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
  max: IS_BUILD_TIME ? 3 : NODE_ENV === "production" ? 8 : 5,
  min: IS_BUILD_TIME ? 0 : NODE_ENV === "production" ? 1 : 0,
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
  console.error("[DB_POOL_ERROR]", err.message, err.code);
  // Attempt to recover from transient errors
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT' || err.code === 'EHOSTUNREACH') {
    console.warn("[DB_POOL] Transient connection error, pool will attempt to reconnect");
  }
});

pool.on("connect", () => {
  if (process.env.DEBUG_DB_POOL === "true") {
    console.log("[DB_POOL] Client connected");
  }
});

pool.on("remove", () => {
  if (process.env.DEBUG_DB_POOL === "true") {
    console.log("[DB_POOL] Client removed");
  }
});

// Create a proxy around db to ensure connection health
const baseDb = drizzle(pool, { schema });

// Wrap db with connection health check
export const db = new Proxy(baseDb, {
  get(target: any, prop: string) {
    return target[prop];
  },
});

export { pool as rawPgPool };

// Initialize database on startup
if (typeof window === 'undefined') {
  if (process.env.NODE_ENV === 'development') {
    checkDBHealth().catch(err => {
      console.warn('[DB_STARTUP] Health check on startup failed:', err.message);
    });
  }
}

// Handle pool drain safely
pool.on("error", (err: Error) => {
  if (err.message.includes("Client already has a PgTransaction in progress")) {
    console.warn("[DB_POOL] Transaction already in progress, skipping error");
  } else {
    console.error("[DB_POOL_CLIENT_ERROR]", err);
  }
});

// Graceful shutdown
process.on("SIGTERM", async () => {
  console.log("[DB_POOL] SIGTERM received, closing pool...");
  await pool.end();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("[DB_POOL] SIGINT received, closing pool...");
  await pool.end();
  process.exit(0);
});

// Health check function
export async function checkDBHealth(): Promise<boolean> {
  try {
    const result = await pool.query("SELECT 1");
    console.log("[DB_HEALTH_CHECK] Success");
    return result.rows.length > 0;
  } catch (error) {
    console.error("[DB_HEALTH_CHECK] Failed:", error);
    return false;
  }
}

// Function to ensure connection is alive
export async function ensureDBConnection(): Promise<void> {
  const maxRetries = 3;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const isHealthy = await checkDBHealth();
      if (isHealthy) return;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log("[DB] Retrying connection...", i + 1);
      await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
}