export interface RetryOptions {
  maxAttempts?: number;
  delay?: number;
  backoffMultiplier?: number;
  maxDelay?: number;
  retryIf?: (error: Error) => boolean;
}

export class Retry {
  static async execute<T>(
    operation: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxAttempts = 3,
      delay = 1000,
      backoffMultiplier = 2,
      maxDelay = 30000,
      retryIf = () => true,
    } = options;

    let lastError: Error;
    let currentDelay = delay;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === maxAttempts || !retryIf(lastError)) {
          throw lastError;
        }

        await new Promise(resolve => setTimeout(resolve, currentDelay));
        currentDelay = Math.min(currentDelay * backoffMultiplier, maxDelay);
      }
    }

    throw lastError!;
  }

  static withOptions(options: RetryOptions) {
    return <T>(operation: () => Promise<T>) => Retry.execute(operation, options);
  }

  static exponentialBackoff(baseDelay: number = 1000, maxAttempts: number = 3) {
    return Retry.withOptions({
      maxAttempts,
      delay: baseDelay,
      backoffMultiplier: 2,
      maxDelay: baseDelay * Math.pow(2, maxAttempts - 1),
    });
  }

  static linearBackoff(baseDelay: number = 1000, maxAttempts: number = 3) {
    return Retry.withOptions({
      maxAttempts,
      delay: baseDelay,
      backoffMultiplier: 1,
      maxDelay: baseDelay,
    });
  }
}
