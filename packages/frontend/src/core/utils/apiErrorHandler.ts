import { Logger } from '@reporunner/core';
import type { AxiosError } from 'axios';

const logger = new Logger('ApiErrorHandler');

export interface ApiError {
  message: string;
  code?: string;
  statusCode?: number;
  details?: any;
  timestamp: string;
}

export interface ApiErrorHandlerOptions {
  defaultMessage?: string;
  logErrors?: boolean;
  showToast?: boolean;
  onError?: (error: ApiError) => void;
}

/**
 * Standardized API error handling utility that eliminates duplication
 * across all API service classes and provides consistent error formatting.
 */
export class ApiErrorHandler {
  private static defaultOptions: ApiErrorHandlerOptions = {
    defaultMessage: 'An unexpected error occurred',
    logErrors: true,
    showToast: false,
  };

  /**
   * Process and standardize API errors from various sources
   */
  static handleError(error: any, context?: string, options?: ApiErrorHandlerOptions): ApiError {
    const opts = { ...ApiErrorHandler.defaultOptions, ...options };

    const apiError: ApiError = {
      message: opts.defaultMessage!,
      timestamp: new Date().toISOString(),
    };

    // Handle Axios errors
    if (ApiErrorHandler.isAxiosError(error)) {
      apiError.statusCode = error.response?.status;
      apiError.code = error.code;

      if (error.response?.data) {
        const responseData = error.response.data;

        // Extract message from various response formats
        apiError.message =
          responseData.message ||
          responseData.error ||
          responseData.detail ||
          ApiErrorHandler.getStatusMessage(error.response.status) ||
          opts.defaultMessage!;

        apiError.details = responseData.details || responseData.errors;
      } else if (error.request) {
        // Network error
        apiError.message = 'Network error - please check your connection';
        apiError.code = 'NETWORK_ERROR';
      }
    }
    // Handle standard Error objects
    else if (error instanceof Error) {
      apiError.message = error.message;
      apiError.code = error.name;
    }
    // Handle string errors
    else if (typeof error === 'string') {
      apiError.message = error;
    }
    // Handle unknown error types
    else if (error && typeof error === 'object') {
      apiError.message = error.message || JSON.stringify(error);
      apiError.details = error;
    }

    // Add context to error message
    if (context) {
      apiError.message = `${context}: ${apiError.message}`;
    }

    // Log error if enabled
    if (opts.logErrors) {
      logger.error('API Error', {
        context,
        error: apiError,
        originalError: error,
      });
    }

    // Call custom error handler
    if (opts.onError) {
      opts.onError(apiError);
    }

    // Show toast notification if enabled
    if (opts.showToast) {
      ApiErrorHandler.showErrorToast(apiError);
    }

    return apiError;
  }

  /**
   * Create a standardized error response for API methods
   */
  static createErrorResponse<_T = any>(
    error: any,
    context?: string,
    options?: ApiErrorHandlerOptions
  ): { success: false; error: ApiError; data: null } {
    const apiError = ApiErrorHandler.handleError(error, context, options);

    return {
      success: false,
      error: apiError,
      data: null,
    };
  }

  /**
   * Create a standardized success response for API methods
   */
  static createSuccessResponse<T>(data: T): { success: true; data: T; error: null } {
    return {
      success: true,
      data,
      error: null,
    };
  }

  /**
   * Async wrapper that automatically handles errors
   */
  static async withErrorHandling<T>(
    operation: () => Promise<T>,
    context?: string,
    options?: ApiErrorHandlerOptions
  ): Promise<
    { success: true; data: T; error: null } | { success: false; error: ApiError; data: null }
  > {
    try {
      const data = await operation();
      return ApiErrorHandler.createSuccessResponse(data);
    } catch (error) {
      return ApiErrorHandler.createErrorResponse(error, context, options);
    }
  }

  /**
   * Retry wrapper with exponential backoff
   */
  static async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number = 3,
    baseDelay: number = 1000,
    context?: string
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;

        // Don't retry on client errors (4xx) except 429 (rate limit)
        if (ApiErrorHandler.isAxiosError(error) && error.response?.status) {
          const status = error.response.status;
          if (status >= 400 && status < 500 && status !== 429) {
            throw error;
          }
        }

        // Don't retry on last attempt
        if (attempt === maxRetries) {
          break;
        }

        // Exponential backoff delay
        const delay = baseDelay * 2 ** (attempt - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));

        logger.warn('API retry attempt', { attempt, maxRetries, context, error });
      }
    }

    throw lastError;
  }

  /**
   * Check if error is an Axios error
   */
  private static isAxiosError(error: any): error is AxiosError {
    return error && error.isAxiosError === true;
  }

  /**
   * Get human-readable message for HTTP status codes
   */
  private static getStatusMessage(status: number): string | null {
    const statusMessages: Record<number, string> = {
      400: 'Bad request - please check your input',
      401: 'Authentication required',
      403: 'Access denied',
      404: 'Resource not found',
      405: 'Method not allowed',
      409: 'Conflict - resource already exists',
      422: 'Validation error',
      429: 'Too many requests - please try again later',
      500: 'Internal server error',
      502: 'Bad gateway',
      503: 'Service unavailable',
      504: 'Gateway timeout',
    };

    return statusMessages[status] || null;
  }

  /**
   * Show error toast notification (placeholder - integrate with actual toast system)
   */
  private static showErrorToast(error: ApiError): void {
    // TODO: Integrate with actual toast notification system
    logger.debug('Toast notification placeholder', { message: error.message });
  }
}

/**
 * Decorator for API service methods to automatically handle errors
 */
export function handleApiErrors(context?: string, options?: ApiErrorHandlerOptions) {
  return (target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      try {
        const result = await originalMethod.apply(this, args);
        return ApiErrorHandler.createSuccessResponse(result);
      } catch (error) {
        return ApiErrorHandler.createErrorResponse(
          error,
          context || `${target.constructor.name}.${propertyKey}`,
          options
        );
      }
    };

    return descriptor;
  };
}

export default ApiErrorHandler;
