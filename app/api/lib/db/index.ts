import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "server/db/schema";

const DATABASE_URL = process.env.DATABASE_URL;
const NODE_ENV = process.env.NODE_ENV;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

declare global {
  var _pgPool: InstanceType<typeof Pool> | undefined;
  var _db: ReturnType<typeof drizzle<typeof schema>> | undefined;
}

// Vercel-optimized pool configuration
const poolConfig = {
  connectionString: DATABASE_URL,
  max: NODE_ENV === 'production' ? 10 : 20,
  min: NODE_ENV === 'production' ? 2 : 1,
  idleTimeoutMillis: NODE_ENV === 'production' ? 30000 : 60000,
  connectionTimeoutMillis: NODE_ENV === 'production' ? 8000 : 10000,
  statement_timeout: NODE_ENV === 'production' ? 30000 : 45000,
  query_timeout: NODE_ENV === 'production' ? 30000 : 45000,
  application_name: 'luxela-app',
  allowExitOnIdle: true,
};

const pool = global._pgPool ?? new Pool(poolConfig);

if (!global._pgPool) {
  global._pgPool = pool;
  
  pool.on('error', (err: any) => {
    console.error('[DB_POOL_ERROR]', err.message, err.code);
  });
  
  pool.on('connect', () => {
    if (process.env.DEBUG === 'true') {
      console.log('[DB_POOL] Connection established');
    }
  });
  
  pool.on('remove', () => {
    if (process.env.DEBUG === 'true') {
      console.log('[DB_POOL] Connection removed');
    }
  });
  
  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('[DB_POOL] SIGTERM received, closing pool...');
    await pool.end();
    process.exit(0);
  });
}

export const db = global._db ?? drizzle(pool, { schema });
if (!global._db) global._db = db;

export { pool as rawPgPool };

// Health check function
export async function checkDBHealth(): Promise<boolean> {
  try {
    const result = await pool.query('SELECT 1');
    return result.rows.length > 0;
  } catch (error) {
    console.error('[DB_HEALTH_CHECK] Failed:', error);
    return false;
  }
}

// Keep-alive ping for production (only once per process)
let keepAliveStarted = false;
if (NODE_ENV === 'production' && !keepAliveStarted) {
  keepAliveStarted = true;
  setInterval(async () => {
    try {
      const client = await pool.connect();
      await client.query('SELECT 1');
      client.release();
    } catch (error) {
      console.error('[DB_KEEPALIVE_PING] Failed:', error);
    }
  }, 60000); // Every 60 seconds
}