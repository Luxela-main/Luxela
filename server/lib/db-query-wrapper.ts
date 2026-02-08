import { checkPoolHealth, waitForPoolConnection } from './db-pool';

interface QueryOptions {
  timeout?: number;
  retries?: number;
  retryDelay?: number;
}

const DEFAULT_OPTIONS: Required<QueryOptions> = {
  timeout: 15000,
  retries: 2,
  retryDelay: 1000,
};

export async function executeQuery<T>(
  queryFn: () => Promise<T>,
  options: QueryOptions = {}
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt <= opts.retries; attempt++) {
    try {
      // Check pool health before executing query
      const isHealthy = await checkPoolHealth();
      if (!isHealthy) {
        throw new Error('Database pool is unhealthy');
      }

      // Execute query with timeout
      const result = await Promise.race([
        queryFn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error(`Query timeout after ${opts.timeout}ms`)),
            opts.timeout
          )
        ),
      ]);

      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
      
      // Don't retry on certain errors
      if (
        lastError.message.includes('not found') ||
        lastError.message.includes('foreign key') ||
        lastError.message.includes('validation')
      ) {
        throw lastError;
      }

      // If this is the last attempt, throw the error
      if (attempt === opts.retries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => 
        setTimeout(resolve, opts.retryDelay * (attempt + 1))
      );

      console.log(
        `[DB_QUERY] Retry attempt ${attempt + 1}/${opts.retries} after error: ${lastError.message}`
      );
    }
  }

  throw lastError || new Error('Query failed with unknown error');
}

export async function executeBatchQueries<T>(
  queries: Array<() => Promise<T>>,
  options: QueryOptions = {}
): Promise<T[]> {
  // Execute queries sequentially with error handling
  const results: T[] = [];
  
  for (const queryFn of queries) {
    const result = await executeQuery(queryFn, options);
    results.push(result);
  }

  return results;
}