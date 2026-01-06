import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./db/schema";

// Global singletons for serverless environments
declare global {
  var _pgClient: ReturnType<typeof postgres> | undefined;
  var _db: ReturnType<typeof drizzle> | undefined;
}

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("❌ DATABASE_URL is not defined in .env or Vercel environment");
}

// Connection options for Postgres
const pgOptions: Record<string, unknown> = {
  prepare: false,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : undefined,
};

// Reuse or create a new postgres client
export const sql = global._pgClient ?? postgres(DATABASE_URL, pgOptions);
if (!global._pgClient) global._pgClient = sql;

// Reuse or create a new Drizzle ORM instance
export const db = global._db ?? drizzle({ client: sql, schema });
if (!global._db) global._db = db;

export { sql as rawPgClient };
