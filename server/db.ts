import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './db/schema';
const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl:
    process.env.NODE_ENV === "development"
      ? { rejectUnauthorized: false }
      : false,
});

export const db = drizzle(pool, { schema }); 