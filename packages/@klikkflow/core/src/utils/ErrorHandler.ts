import type { ILogger } from '../interfaces/ILogger';

export interface ErrorHandlerOptions {
  logger?: ILogger;
  enableStackTrace?: boolean;
  maxRetries?: number;
}

export class ErrorHandler {
  private options: Required<ErrorHandlerOptions>;

  constructor(options: ErrorHandlerOptions = {}) {
    this.options = {
      logger: console as any,
      enableStackTrace: true,
      maxRetries: 3,
      ...options,
    };
  }

  handle(error: Error, context?: string): void {
    const message = context ? `${context}: ${error.message}` : error.message;

    this.options.logger.error(message, {
      error: error.name,
      stack: this.options.enableStackTrace ? error.stack : undefined,
    });
  }

  async handleAsync<T>(
    operation: () => Promise<T>,
    context?: string,
    retries: number = this.options.maxRetries
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === retries) {
          this.handle(lastError, context);
          throw lastError;
        }

        // Exponential backoff
        const delay = 2 ** attempt * 1000;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  wrapAsync<T extends any[], R>(
    fn: (...args: T) => Promise<R>,
    context?: string
  ): (...args: T) => Promise<R> {
    return async (...args: T): Promise<R> => {
      return this.handleAsync(() => fn(...args), context);
    };
  }
}
