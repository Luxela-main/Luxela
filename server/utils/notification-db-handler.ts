import { db } from '../db';
import { buyerNotifications, buyers } from '../db/schema';
import { eq } from 'drizzle-orm';

/**
 * Standard PostgreSQL error codes for constraint violations
 * @see https://www.postgresql.org/docs/current/errcodes-appendix.html
 */
export const PG_ERROR_CODES = {
  FOREIGN_KEY_VIOLATION: '23503',    // fk_violation
  UNIQUE_VIOLATION: '23505',          // unique_violation
  NOT_NULL_VIOLATION: '23502',        // not_null_violation
  CHECK_VIOLATION: '23514',           // check_violation
  EXCLUSION_VIOLATION: '23544',       // exclusion_violation
} as const;

/**
 * Comprehensive error details extracted from PostgreSQL errors
 */
export interface PostgresErrorDetail {
  message: string;
  code: string;
  detail: string;
  state?: string;
  sqlState?: string;
  severity?: string;
  routine?: string;
  position?: number;
  internalPosition?: number;
  context?: string;
  file?: string;
  line?: number;
  hint?: string;
}

/**
 * Extract detailed error information from database errors
 */
export function extractPostgresErrorDetails(err: any): PostgresErrorDetail {
  return {
    message: err.message || String(err),
    code: err.code || err.constraint || 'UNKNOWN_CODE',
    detail: err.detail || err.hint || 'No detail provided',
    state: err.state || undefined,
    sqlState: err.sqlState || undefined,
    severity: err.severity || 'UNKNOWN',
    routine: err.routine || undefined,
    position: err.position || undefined,
    internalPosition: err.internalPosition || undefined,
    context: err.context || undefined,
    file: err.file || undefined,
    line: err.line || undefined,
    hint: err.hint || undefined,
  };
}

/**
 * Translate PostgreSQL error code to human-readable constraint type
 */
export function getConstraintTypeFromError(errorCode: string): string {
  switch (errorCode) {
    case PG_ERROR_CODES.FOREIGN_KEY_VIOLATION:
      return 'FOREIGN_KEY_CONSTRAINT';
    case PG_ERROR_CODES.UNIQUE_VIOLATION:
      return 'UNIQUE_CONSTRAINT';
    case PG_ERROR_CODES.NOT_NULL_VIOLATION:
      return 'NOT_NULL_CONSTRAINT';
    case PG_ERROR_CODES.CHECK_VIOLATION:
      return 'CHECK_CONSTRAINT';
    case PG_ERROR_CODES.EXCLUSION_VIOLATION:
      return 'EXCLUSION_CONSTRAINT';
    default:
      return 'UNKNOWN_CONSTRAINT';
  }
}

/**
 * Validate that buyer exists in the database
 * CRITICAL: Must be called before any notification insert attempt
 *
 * @param buyerId - UUID of the buyer
 * @returns boolean - true if buyer exists, false otherwise
 */
export async function validateBuyerExists(buyerId: string): Promise<boolean> {
  try {
    const result = await db
      .select({ id: buyers.id })
      .from(buyers)
      .where(eq(buyers.id, buyerId))
      .limit(1);

    return result.length > 0;
  } catch (error) {
    console.error(`[DB_ERROR] Error validating buyer ${buyerId}:`, error);
    return false;
  }
}

/**
 * Safe notification insertion with comprehensive error handling
 * Logs full error details for debugging and monitoring
 *
 * @param values - Notification data to insert
 * @param context - Additional context for error logging
 * @returns boolean - true if insert succeeded, false otherwise
 */
export async function safeInsertNotification(
  values: any,
  context: Record<string, any> = {}
): Promise<boolean> {
  try {
    await db.insert(buyerNotifications).values(values);
    return true;
  } catch (error: any) {
    const errorDetails = extractPostgresErrorDetails(error);
    const constraintType = getConstraintTypeFromError(errorDetails.code);

    const fullError = {
      ...errorDetails,
      ...context,
      constraintType,
      timestamp: new Date().toISOString(),
    };

    console.error(
      `[DB_ERROR] Notification insert failed for buyer ${values.buyerId}:`,
      fullError
    );

    // Log specific constraint violations for operational awareness
    if (errorDetails.code === PG_ERROR_CODES.FOREIGN_KEY_VIOLATION) {
      console.error(
        `[DB_ERROR] CRITICAL: Buyer ${values.buyerId} does not exist in buyers table`
      );
    } else if (errorDetails.code === PG_ERROR_CODES.UNIQUE_VIOLATION) {
      console.error(
        `[DB_ERROR] Duplicate notification detected for buyer ${values.buyerId}, related entity: ${values.relatedEntityId}`
      );
    } else if (errorDetails.code === PG_ERROR_CODES.NOT_NULL_VIOLATION) {
      console.error(
        `[DB_ERROR] Required field missing in notification insert:`,
        errorDetails.detail
      );
    } else if (errorDetails.message?.includes('invalid input value for enum')) {
      console.error(
        `[DB_ERROR] Invalid enum value for notification type: ${values.type}`
      );
    }

    return false;
  }
}

/**
 * Batch safe notification insertion with error aggregation
 * Returns summary of successes and failures
 *
 * @param values - Array of notification data to insert
 * @param buyerId - Buyer ID for context
 * @returns Object with success/failure counts
 */
export async function safeBatchInsertNotifications(
  values: any[],
  buyerId: string
): Promise<{ succeeded: number; failed: number; errors: any[] }> {
  const results = {
    succeeded: 0,
    failed: 0,
    errors: [] as any[],
  };

  for (const value of values) {
    const success = await safeInsertNotification(value, {
      batchInsert: true,
      totalInBatch: values.length,
    });

    if (success) {
      results.succeeded++;
    } else {
      results.failed++;
    }
  }

  if (results.failed > 0) {
    console.warn(
      `[DB_WARNING] Batch insert for buyer ${buyerId}: ${results.succeeded} succeeded, ${results.failed} failed`
    );
  }

  return results;
}

/**
 * Standard error logging format for notification failures
 * Use this consistently across all notification handlers
 *
 * @param error - The error object
 * @param context - Contextual information about the operation
 */
export function logNotificationError(
  error: any,
  context: Record<string, any>
): void {
  const errorDetails = extractPostgresErrorDetails(error);

  const logEntry = {
    ...errorDetails,
    ...context,
    timestamp: new Date().toISOString(),
    severity: 'ERROR',
  };

  console.error('[DB_ERROR] Notification operation failed:', logEntry);
}

/**
 * Critical validation before notification generation
 * Prevents waste of resources on non-existent buyers
 */
export async function validateNotificationPreconditions(
  buyerId: string
): Promise<{
  valid: boolean;
  errors: string[];
}> {
  const errors: string[] = [];

  // Validate buyer exists
  const buyerExists = await validateBuyerExists(buyerId);
  if (!buyerExists) {
    errors.push(`Buyer ${buyerId} does not exist in buyers table`);
  }

  // Validate buyer ID format (UUID)
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (!uuidRegex.test(buyerId)) {
    errors.push(`Invalid buyer ID format: ${buyerId}`);
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}