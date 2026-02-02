// Re-export from API route db client for unified imports
// This ensures both server and API routes use the same database connection
export { db, rawPgClient as client } from "../../app/api/lib/db";

// For backwards compatibility with keepalive and health checks
export async function waitForDB(retries = 10, delay = 2000) {
  // No-op: connection is managed by Next.js API route
  return;
}

export function startKeepAlive() {
  // No-op: connection is managed by Next.js API route
  return;
}