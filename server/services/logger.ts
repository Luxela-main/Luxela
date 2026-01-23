/**
 * Enterprise-Grade Logging Service
 * Provides structured logging with audit trails, error tracking, and operational monitoring
 */

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL',
}

export enum LogCategory {
  // Business Operations
  ORDER = 'ORDER',
  PAYMENT = 'PAYMENT',
  INVENTORY = 'INVENTORY',
  SHIPPING = 'SHIPPING',
  REFUND = 'REFUND',
  USER = 'USER',

  // System Operations
  AUTH = 'AUTH',
  SECURITY = 'SECURITY',
  WEBHOOK = 'WEBHOOK',
  API = 'API',
  DATABASE = 'DATABASE',

  // Integrations
  PAYMENT_PROVIDER = 'PAYMENT_PROVIDER',
  SHIPPING_PROVIDER = 'SHIPPING_PROVIDER',
}

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  category: LogCategory;
  message: string;
  userId?: string;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  error?: {
    message: string;
    stack?: string;
    code?: string;
  };
  duration?: number; // in milliseconds
}

class LoggerService {
  /**
   * Log a business operation
   */
  static logOperation(
    category: LogCategory,
    message: string,
    data?: {
      userId?: string;
      entityId?: string;
      entityType?: string;
      metadata?: Record<string, any>;
      duration?: number;
    }
  ) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.INFO,
      category,
      message,
      userId: data?.userId,
      entityId: data?.entityId,
      entityType: data?.entityType,
      metadata: data?.metadata,
      duration: data?.duration,
    };

    this.persistLog(entry);
  }

  /**
   * Log an error with context
   */
  static logError(
    category: LogCategory,
    message: string,
    error: Error | string,
    data?: {
      userId?: string;
      entityId?: string;
      entityType?: string;
      metadata?: Record<string, any>;
    }
  ) {
    const isError = error instanceof Error;
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.ERROR,
      category,
      message,
      userId: data?.userId,
      entityId: data?.entityId,
      entityType: data?.entityType,
      metadata: data?.metadata,
      error: {
        message: isError ? error.message : String(error),
        stack: isError ? error.stack : undefined,
      },
    };

    this.persistLog(entry);
    this.notifyAlert(entry);
  }

  /**
   * Log a critical error that needs immediate attention
   */
  static logCritical(
    category: LogCategory,
    message: string,
    error: Error | string,
    data?: {
      userId?: string;
      entityId?: string;
      entityType?: string;
      metadata?: Record<string, any>;
    }
  ) {
    const isError = error instanceof Error;
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.CRITICAL,
      category,
      message,
      userId: data?.userId,
      entityId: data?.entityId,
      entityType: data?.entityType,
      metadata: data?.metadata,
      error: {
        message: isError ? error.message : String(error),
        stack: isError ? error.stack : undefined,
      },
    };

    this.persistLog(entry);
    this.notifyAlert(entry);
  }

  /**
   * Log a warning
   */
  static logWarning(
    category: LogCategory,
    message: string,
    data?: {
      userId?: string;
      entityId?: string;
      entityType?: string;
      metadata?: Record<string, any>;
    }
  ) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.WARN,
      category,
      message,
      userId: data?.userId,
      entityId: data?.entityId,
      entityType: data?.entityType,
      metadata: data?.metadata,
    };

    this.persistLog(entry);
  }

  /**
   * Log audit trail for business-critical events
   */
  static logAudit(
    action: string,
    entityType: string,
    entityId: string,
    userId: string,
    details?: Record<string, any>
  ) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: LogLevel.INFO,
      category: LogCategory.API,
      message: `[AUDIT] ${action} on ${entityType}`,
      userId,
      entityId,
      entityType,
      metadata: {
        action,
        ...details,
      },
    };

    this.persistLog(entry);
  }

  /**
   * Track performance metric
   */
  static logPerformance(
    operation: string,
    duration: number,
    metadata?: Record<string, any>
  ) {
    const entry: LogEntry = {
      timestamp: new Date(),
      level: duration > 5000 ? LogLevel.WARN : LogLevel.DEBUG,
      category: LogCategory.API,
      message: `Performance: ${operation} took ${duration}ms`,
      metadata: {
        operation,
        ...metadata,
      },
      duration,
    };

    this.persistLog(entry);
  }

  /**
   * Persist log to database (stub - implement with your DB)
   */
  private static persistLog(entry: LogEntry) {
    // In production, persist to:
    // - Application database for audit trails
    // - Logging service (DataDog, New Relic, etc.)
    // - Cloud storage for archival

    console.log(`[${entry.level}] [${entry.category}] ${entry.message}`, {
      userId: entry.userId,
      entityId: entry.entityId,
      entityType: entry.entityType,
      metadata: entry.metadata,
      error: entry.error,
      duration: entry.duration,
    });
  }

  /**
   * Send alert for critical issues
   */
  private static notifyAlert(entry: LogEntry) {
    // In production, send to:
    // - Slack/Teams
    // - PagerDuty
    // - Email
    // - Monitoring dashboard

    if (entry.level === LogLevel.CRITICAL || entry.level === LogLevel.ERROR) {
      console.error(`🚨 ALERT: ${entry.message}`, entry);
    }
  }
}

export default LoggerService;