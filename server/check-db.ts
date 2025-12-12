import postgres from "postgres";
import dotenv from "dotenv";

dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error("❌ DATABASE_URL is not set in .env");
  process.exit(1);
}

export const sql = postgres(connectionString, {
  ssl: { rejectUnauthorized: false },
  max: 5,
  idle_timeout: 0,
  connect_timeout: 10,
});

const RETRIES = 10;
const DELAY = 2000;
const PING_INTERVAL = 30_000;

async function waitForDB() {
  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      await sql`SELECT 1`;
      console.log("✅ Supabase Postgres is reachable and connection is alive");
      return;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.log(`⏳ Attempt ${attempt} failed: ${message}`);
      if (attempt < RETRIES) {
        console.log(`⏳ Retrying in ${DELAY / 1000}s...`);
        await new Promise((res) => setTimeout(res, DELAY));
      } else {
        console.error("❌ Could not connect to Supabase Postgres after multiple attempts.");
        process.exit(1);
      }
    }
  }
}

// Function to ping DB every interval
function startKeepAlive() {
  console.log(`🔄 Starting keep-alive pings every ${PING_INTERVAL / 1000}s...`);
  setInterval(async () => {
    try {
      await sql`SELECT 1`;
      console.log(`💓 DB ping successful at ${new Date().toLocaleTimeString()}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      console.error(`❌ Lost DB connection at ${new Date().toLocaleTimeString()}:`, message);
    }
  }, PING_INTERVAL);
}

(async function main() {
  await waitForDB();
  startKeepAlive();
})();

export function keepAlive() {
  startKeepAlive();
}
