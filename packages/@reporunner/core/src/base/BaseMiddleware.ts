import { Request, Response, NextFunction } from 'express';
import { ErrorTypes } from '../utils/errors';

export interface MiddlewareConfig {
  /**
   * Whether to skip error handling
   */
  skipErrorHandling?: boolean;

  /**
   * Custom error handler
   */
  errorHandler?: (error: Error, req: Request, res: Response, next: NextFunction) => void;

  /**
   * Additional middleware options
   */
  options?: Record<string, any>;
}

export interface BaseMiddlewareContext {
  req: Request;
  res: Response;
  next: NextFunction;
  config?: MiddlewareConfig;
}

/**
 * Base class for all middleware implementations
 */
export abstract class BaseMiddleware {
  protected config: MiddlewareConfig;

  constructor(config: MiddlewareConfig = {}) {
    this.config = config;
  }

  /**
   * Main middleware handler that wraps the implementation
   */
  public handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const context: BaseMiddlewareContext = { req, res, next, config: this.config };
      
      // Run pre-execution hooks
      await this.beforeHandle(context);

      // Execute the main middleware logic
      await this.implementation(context);

      // Run post-execution hooks
      await this.afterHandle(context);

      next();
    } catch (error) {
      if (this.config.skipErrorHandling) {
        next(error);
        return;
      }

      if (this.config.errorHandler) {
        this.config.errorHandler(error as Error, req, res, next);
        return;
      }

      this.handleError(error as Error, req, res, next);
    }
  };

  /**
   * Hook that runs before the main implementation
   */
  protected async beforeHandle(_context: BaseMiddlewareContext): Promise<void> {
    // Optional hook - override in derived classes if needed
  }

  /**
   * Main middleware implementation - must be overridden by derived classes
   */
  protected abstract implementation(context: BaseMiddlewareContext): Promise<void>;

  /**
   * Hook that runs after the main implementation
   */
  protected async afterHandle(_context: BaseMiddlewareContext): Promise<void> {
    // Optional hook - override in derived classes if needed
  }

  /**
   * Default error handler
   */
  protected handleError(error: Error, _req: Request, res: Response, _next: NextFunction): void {
    if (error.name === ErrorTypes.ValidationError) {
      res.status(400).json({
        error: 'Validation Error',
        message: error.message
      });
      return;
    }

    if (error.name === ErrorTypes.AuthenticationError) {
      res.status(401).json({
        error: 'Authentication Error',
        message: error.message
      });
      return;
    }

    if (error.name === ErrorTypes.AuthorizationError) {
      res.status(403).json({
        error: 'Authorization Error',
        message: error.message
      });
      return;
    }

    // Default to 500 for unhandled errors
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An unexpected error occurred'
    });
  }
}