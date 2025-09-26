import { Request, Response, NextFunction } from 'express';

/**
 * Core middleware context containing request, response and other shared data
 */
export interface MiddlewareContext {
  req: Request;
  res: Response;
  next: NextFunction;
  startTime?: number;
  metadata?: Record<string, unknown>;
}

/**
 * Core middleware configuration options
 */
export interface BaseMiddlewareOptions {
  /**
   * Enable detailed logging
   */
  enableLogging?: boolean;

  /**
   * Custom error handler
   */
  onError?: (error: Error, context: MiddlewareContext) => Promise<void>;

  /**
   * Custom success handler
   */
  onSuccess?: (context: MiddlewareContext) => Promise<void>;

  /**
   * Whether to abort on first error
   */
  abortEarly?: boolean;

  /**
   * Additional metadata to attach to context
   */
  metadata?: Record<string, unknown>;
}

/**
 * Base class for all middleware implementations
 */
export abstract class BaseMiddleware {
  protected options: Required<BaseMiddlewareOptions>;

  constructor(options: BaseMiddlewareOptions = {}) {
    this.options = {
      enableLogging: false,
      abortEarly: true,
      metadata: {},
      ...options,
      onError: options.onError || this.defaultErrorHandler.bind(this),
      onSuccess: options.onSuccess || this.defaultSuccessHandler.bind(this)
    };
  }

  /**
   * Main middleware handler
   */
  public handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const context: MiddlewareContext = {
      req,
      res,
      next,
      startTime: Date.now(),
      metadata: { ...this.options.metadata }
    };

    try {
      // Pre-process
      await this.preProcess(context);

      // Execute middleware logic
      await this.implementation(context);

      // Post-process
      await this.postProcess(context);

      // Success handling
      await this.options.onSuccess(context);
      next();
    } catch (error) {
      await this.handleError(error as Error, context);
    }
  };

  /**
   * Core middleware implementation to be provided by subclasses
   */
  protected abstract implementation(context: MiddlewareContext): Promise<void>;

  /**
   * Pre-process hook - runs before main implementation
   */
  protected async preProcess(context: MiddlewareContext): Promise<void> {
    this.log('Pre-processing request', { path: context.req.path });
  }

  /**
   * Post-process hook - runs after main implementation
   */
  protected async postProcess(context: MiddlewareContext): Promise<void> {
    if (context.startTime) {
      const duration = Date.now() - context.startTime;
      this.log('Request processed', { path: context.req.path, duration });
    }
  }

  /**
   * Handle errors during middleware execution
   */
  protected async handleError(error: Error, context: MiddlewareContext): Promise<void> {
    this.log('Error in middleware', { error: error.message });
    await this.options.onError(error, context);
    context.next(error);
  }

  /**
   * Default error handler
   */
  protected async defaultErrorHandler(error: Error, context: MiddlewareContext): Promise<void> {
    context.res.status(500).json({
      error: {
        message: error.message,
        type: error.name
      }
    });
  }

  /**
   * Default success handler
   */
  protected async defaultSuccessHandler(context: MiddlewareContext): Promise<void> {
    // No-op by default
  }

  /**
   * Logging utility
   */
  protected log(message: string, data?: Record<string, unknown>): void {
    if (this.options.enableLogging) {
      console.log(`[${this.constructor.name}] ${message}`, data);
    }
  }

  /**
   * Update middleware options
   */
  public updateOptions(options: Partial<BaseMiddlewareOptions>): this {
    this.options = {
      ...this.options,
      ...options
    };
    return this;
  }
}