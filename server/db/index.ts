import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// Connection options:
// - prepare: false disables prepared statement caching (safe for dev). Set to true in production for better perf.
// - ssl: Uncomment and enable only if needed by your environment. Supabase usually handles SSL via the DATABASE_URL.
const sqlOptions: Record<string, unknown> = {
  prepare: false,
  // ssl: { rejectUnauthorized: false },
};

const client = postgres(DATABASE_URL, sqlOptions);
export const db = drizzle({ client });

// Export raw client for low-level operations or graceful shutdowns in tests/CI
export { client as rawPgClient };