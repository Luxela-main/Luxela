import { rawPgPool as pool } from '@/server/db/client';

let lastHealthCheck = Date.now();
const HEALTH_CHECK_INTERVAL = 30000; // 30 seconds

interface PoolStats {
  totalConnections: number;
  availableConnections: number;
  waitingRequests: number;
  isHealthy: boolean;
}

export async function getPoolStats(): Promise<PoolStats> {
  try {
    return {
      totalConnections: pool.totalCount,
      availableConnections: pool.idleCount,
      waitingRequests: pool.waitingCount,
      isHealthy: pool.totalCount > 0,
    };
  } catch (error) {
    console.error('[DB_POOL] Error getting stats:', error);
    return {
      totalConnections: 0,
      availableConnections: 0,
      waitingRequests: 0,
      isHealthy: false,
    };
  }
}

export async function checkPoolHealth(): Promise<boolean> {
  try {
    const now = Date.now();
    
    // Only check every 30 seconds to avoid overwhelming the pool
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
      return true;
    }

    const client = await Promise.race([
      pool.connect(),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Health check timeout')), 5000)
      ),
    ]);

    await client.query('SELECT 1');
    client.release();
    
    lastHealthCheck = now;
    console.log('[DB_POOL] Health check passed');
    return true;
  } catch (error) {
    console.error('[DB_POOL] Health check failed:', error);
    return false;
  }
}

export async function waitForPoolConnection(
  timeout: number = 10000
): Promise<void> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeout) {
    const stats = await getPoolStats();
    
    if (stats.isHealthy && stats.availableConnections > 0) {
      return;
    }

    // Wait a bit before retrying
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  throw new Error(
    `Database pool connection timeout after ${timeout}ms. ` +
    `Available: ${pool.idleCount}/${pool.totalCount}`
  );
}

export function resetPoolStats(): void {
  lastHealthCheck = 0;
}