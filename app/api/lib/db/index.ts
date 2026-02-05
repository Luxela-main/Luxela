import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "server/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

declare global {
  var _pgPool: InstanceType<typeof Pool> | undefined;
  var _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

const pool = global._pgPool ?? new Pool({
  connectionString: DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000
});

if (!global._pgPool) global._pgPool = pool;

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

export const db = global._db ?? drizzle(pool, { schema });
if (!global._db) global._db = db;

export { pool as rawPgPool };