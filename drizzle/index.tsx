import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users } from './schema';

const connectionString = process.env.DATABASE_URL!;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set in your environment variables");
}

const client = postgres(connectionString, { prepare: false });
const db = drizzle(client);

async function main() {
  const allUsers = await db.select().from(users);
  console.log(allUsers);
}

main().catch(console.error);
