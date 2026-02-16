import { QueryPromise } from 'drizzle-orm';

type QueryInput<T> = QueryPromise<T> | Promise<{ rows: T[] }> | Promise<T>;

export async function executeQuery<T>(
  query: QueryInput<T>,
  queryName: string,
  maxRetries: number = 1
): Promise<T extends any[] ? T : T extends { rows: any[] } ? T['rows'] : T> {
  let lastError: any = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`[DB_QUERY_RETRY] Attempt ${attempt}/${maxRetries} for ${queryName}`);
        // Add small delay before retry
        await new Promise(resolve => setTimeout(resolve, 100 * attempt));
      }

      const result: any = await query;
      
      if (attempt > 1) {
        console.log(`[DB_QUERY_SUCCESS] Retry succeeded for ${queryName}`);
      }
      
      // Handle raw pg Pool result shape { rows: T[] }
      if (result && typeof result === 'object' && 'rows' in result && Array.isArray(result.rows)) {
        // This is a raw pg Pool QueryResult
        return result.rows as any;
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      const fullErrorObj = error?.fullError ? (typeof error.fullError === 'string' ? JSON.parse(error.fullError) : error.fullError) : null;
      
      console.error(`[DB_QUERY_ERROR] Attempt ${attempt}/${maxRetries} failed for ${queryName}`, {
        message: error?.message || 'Unknown error',
        code: error?.code,
        sqlState: error?.sqlState,
        hasNestedError: !!error?.cause,
        isFinalAttempt: attempt === maxRetries,
        query: fullErrorObj?.query ? fullErrorObj.query.substring(0, 150) : undefined,
        paramsCount: fullErrorObj?.params?.length,
      });

      // If it's not a prepared statement caching issue, don't retry
      if (!error?.message?.includes('Failed query')) {
        throw error;
      }

      // On final attempt, throw the error
      if (attempt === maxRetries) {
        throw error;
      }
    }
  }

  throw lastError;
}

/**
 * Utility to extract safe query info for logging without exposing sensitive data
 */
export function getSafeQueryInfo(error: any): Record<string, any> {
  return {
    message: error?.message ? String(error.message).slice(0, 200) : 'Unknown',
    code: error?.code,
    name: error?.name,
    hasFullError: !!error?.fullError,
    hasCause: !!error?.cause,
  };
}