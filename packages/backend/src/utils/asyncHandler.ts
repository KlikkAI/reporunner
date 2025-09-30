/**
 * Async error handling utilities
 */

import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Wrapper for async route handlers to catch errors
 */
export const catchAsync = (fn: RequestHandler) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Alias for backward compatibility
export const asyncHandler = catchAsync;

/**
 * Higher-order function for timing async operations
 */
export const withTiming = <T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  operationName?: string
) => {
  return async (...args: T): Promise<R> => {
    const startTime = Date.now();
    try {
      const result = await fn(...args);
      const _duration = Date.now() - startTime;

      if (operationName) {
      }

      return result;
    } catch (error) {
      const _duration = Date.now() - startTime;

      if (operationName) {
      }

      throw error;
    }
  };
};

/**
 * Retry mechanism for async operations
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = 3,
  delay: number = 1000
): Promise<T> => {
  let lastError: Error;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error as Error;

      if (attempt === maxAttempts) {
        throw lastError;
      }

      // Wait before retry
      await new Promise((resolve) => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
};

/**
 * Timeout wrapper for async operations
 */
export const withTimeout = <T>(
  operation: Promise<T>,
  timeoutMs: number,
  timeoutMessage?: string
): Promise<T> => {
  return Promise.race([
    operation,
    new Promise<never>((_, reject) => {
      setTimeout(
        () => reject(new Error(timeoutMessage || `Operation timed out after ${timeoutMs}ms`)),
        timeoutMs
      );
    }),
  ]);
};
