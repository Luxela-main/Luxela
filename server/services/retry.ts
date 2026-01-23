/**
 * Enterprise-Grade Retry & Circuit Breaker Service
 * Provides resilience patterns for external service calls and critical operations
 */

export interface RetryConfig {
  maxAttempts: number;
  initialDelayMs: number;
  maxDelayMs: number;
  backoffMultiplier: number;
  shouldRetry?: (error: any, attempt: number) => boolean;
}

export interface CircuitBreakerConfig {
  failureThreshold: number;
  successThreshold: number;
  timeout: number; // ms
  resetTimeout: number; // ms
}

export enum CircuitState {
  CLOSED = 'CLOSED', // Normal operation
  OPEN = 'OPEN', // Failing, rejecting requests
  HALF_OPEN = 'HALF_OPEN', // Testing recovery
}

export class CircuitBreaker {
  private state: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private successCount = 0;
  private lastFailureTime: number | null = null;

  constructor(private config: CircuitBreakerConfig) {}

  getState() {
    return this.state;
  }

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === CircuitState.OPEN) {
      if (
        this.lastFailureTime &&
        Date.now() - this.lastFailureTime > this.config.resetTimeout
      ) {
        this.state = CircuitState.HALF_OPEN;
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await Promise.race([
        fn(),
        new Promise<never>((_, reject) =>
          setTimeout(
            () => reject(new Error('Operation timeout')),
            this.config.timeout
          )
        ),
      ]);

      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failureCount = 0;

    if (this.state === CircuitState.HALF_OPEN) {
      this.successCount++;
      if (this.successCount >= this.config.successThreshold) {
        this.state = CircuitState.CLOSED;
        this.successCount = 0;
      }
    }
  }

  private onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (this.failureCount >= this.config.failureThreshold) {
      this.state = CircuitState.OPEN;
    }
  }

  reset() {
    this.state = CircuitState.CLOSED;
    this.failureCount = 0;
    this.successCount = 0;
    this.lastFailureTime = null;
  }
}

class RetryService {
  private static readonly DEFAULT_CONFIG: RetryConfig = {
    maxAttempts: 3,
    initialDelayMs: 100,
    maxDelayMs: 10000,
    backoffMultiplier: 2,
  };

  private static readonly DEFAULT_CIRCUIT_BREAKER_CONFIG: CircuitBreakerConfig = {
    failureThreshold: 5,
    successThreshold: 2,
    timeout: 30000,
    resetTimeout: 60000,
  };

  private static circuitBreakers = new Map<string, CircuitBreaker>();

  /**
   * Execute function with exponential backoff retry
   */
  static async withRetry<T>(
    fn: () => Promise<T>,
    config?: Partial<RetryConfig>,
    context?: string
  ): Promise<T> {
    const finalConfig = { ...this.DEFAULT_CONFIG, ...config };
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        const shouldRetry =
          finalConfig.shouldRetry?.(error, attempt) ?? attempt < finalConfig.maxAttempts;

        if (!shouldRetry) {
          throw lastError;
        }

        const delay = this.calculateBackoff(
          attempt - 1,
          finalConfig.initialDelayMs,
          finalConfig.maxDelayMs,
          finalConfig.backoffMultiplier
        );

        if (attempt < finalConfig.maxAttempts) {
          await this.sleep(delay);
        }
      }
    }

    throw lastError;
  }

  /**
   * Execute with circuit breaker pattern
   */
  static async withCircuitBreaker<T>(
    key: string,
    fn: () => Promise<T>,
    cbConfig?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    let breaker = this.circuitBreakers.get(key);

    if (!breaker) {
      breaker = new CircuitBreaker({
        ...this.DEFAULT_CIRCUIT_BREAKER_CONFIG,
        ...cbConfig,
      });
      this.circuitBreakers.set(key, breaker);
    }

    return breaker.execute(fn);
  }

  /**
   * Execute with both retry AND circuit breaker
   */
  static async withResilientCall<T>(
    key: string,
    fn: () => Promise<T>,
    retryConfig?: Partial<RetryConfig>,
    cbConfig?: Partial<CircuitBreakerConfig>
  ): Promise<T> {
    return this.withCircuitBreaker(
      key,
      () => this.withRetry(fn, retryConfig),
      cbConfig
    );
  }

  /**
   * Get circuit breaker state
   */
  static getCircuitBreakerState(key: string): CircuitState | null {
    return this.circuitBreakers.get(key)?.getState() ?? null;
  }

  /**
   * Reset circuit breaker
   */
  static resetCircuitBreaker(key: string) {
    this.circuitBreakers.get(key)?.reset();
  }

  /**
   * Calculate exponential backoff with jitter
   */
  private static calculateBackoff(
    attempt: number,
    initialDelay: number,
    maxDelay: number,
    multiplier: number
  ): number {
    const exponentialDelay = initialDelay * Math.pow(multiplier, attempt);
    const delayWithCap = Math.min(exponentialDelay, maxDelay);
    // Add jitter to prevent thundering herd
    const jitter = Math.random() * 0.1 * delayWithCap;
    return delayWithCap + jitter;
  }

  private static sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export default RetryService;