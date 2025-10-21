import type { ICache } from '../interfaces/ICache';
import type { IEventBus } from '../interfaces/IEventBus';
import type { ILogger } from '../interfaces/ILogger';
import type { ServiceDependencies } from '../types/ServiceDependencies';
import { Retry } from '../utils/Retry';

/**
 * Base service class providing common functionality for all services
 * Implements patterns for caching, retrying, error handling, and logging
 */
export abstract class BaseService<_T = unknown> {
  protected readonly logger: ILogger;
  protected readonly cache?: ICache;
  protected readonly eventBus?: IEventBus;

  constructor(dependencies: ServiceDependencies) {
    this.logger = dependencies.logger;
    this.cache = dependencies.cache;
    this.eventBus = dependencies.eventBus;
  }

  /**
   * Execute operation with automatic retry on failure
   */
  protected async executeWithRetry<R>(
    operation: () => Promise<R>,
    options: {
      maxRetries?: number;
      retryDelay?: number;
      exponentialBackoff?: boolean;
    } = {}
  ): Promise<R> {
    const { maxRetries = 3, retryDelay = 1000, exponentialBackoff = true } = options;

    return Retry.execute(operation, {
      maxAttempts: maxRetries,
      delay: retryDelay,
      backoffMultiplier: exponentialBackoff ? 2 : 1,
    });
  }

  /**
   * Execute operation with caching
   */
  protected async executeWithCache<R>(
    key: string,
    operation: () => Promise<R>,
    ttl = 3600
  ): Promise<R> {
    const cached = await this.cache?.get<R>(key);
    if (cached !== null && cached !== undefined) {
      this.logger.debug(`Cache hit for key: ${key}`);
      return cached;
    }

    const result = await operation();
    await this.cache?.set(key, result, ttl);
    this.logger.debug(`Cache set for key: ${key}`);

    return result;
  }

  /**
   * Invalidate cache entries by pattern
   */
  protected async invalidateCache(pattern: string): Promise<void> {
    await this.cache?.deletePattern(pattern);
    this.logger.debug(`Cache invalidated for pattern: ${pattern}`);
  }

  /**
   * Publish domain event
   */
  protected async publishEvent(eventType: string, payload: unknown): Promise<void> {
    await this.eventBus?.publish(eventType, payload);
    this.logger.debug(`Event published: ${eventType}`);
  }

  /**
   * Execute operation with performance tracking
   */
  protected async executeWithMetrics<R>(
    operationName: string,
    operation: () => Promise<R>
  ): Promise<R> {
    const startTime = Date.now();

    try {
      const result = await operation();
      const duration = Date.now() - startTime;

      this.logger.info(`Operation completed: ${operationName}`, {
        duration,
        success: true,
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      this.logger.error(`Operation failed: ${operationName}`, {
        duration,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      });

      throw error;
    }
  }

  /**
   * Batch operations for better performance
   */
  protected async executeBatch<I, O>(
    items: I[],
    operation: (item: I) => Promise<O>,
    batchSize = 10
  ): Promise<O[]> {
    const results: O[] = [];

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      const batchResults = await Promise.all(batch.map((item) => operation(item)));
      results.push(...batchResults);
    }

    return results;
  }

  /**
   * Check if service is healthy
   */
  public async healthCheck(): Promise<{
    healthy: boolean;
    details: Record<string, unknown>;
  }> {
    return {
      healthy: true,
      details: {
        service: this.constructor.name,
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Cleanup resources
   */
  public async dispose(): Promise<void> {
    this.logger.info(`Disposing service: ${this.constructor.name}`);
  }
}
