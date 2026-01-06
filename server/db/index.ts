import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined");
}

// A global variable for serverless environments
declare global {
  var _pgClient: ReturnType<typeof postgres> | undefined;
  var _db: ReturnType<typeof drizzle> | undefined;
}

const client = global._pgClient ?? postgres(DATABASE_URL, { prepare: false });
if (!global._pgClient) global._pgClient = client;

export const db = global._db ?? drizzle({ client });
if (!global._db) global._db = db;

export { client as rawPgClient };