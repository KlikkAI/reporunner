import { Request, Response, NextFunction } from 'express';
import { BaseMiddleware, Logger } from '@reporunner/core';

export interface SecurityContext {
  req: Request;
  res: Response;
  next: NextFunction;
}

export interface SecurityConfig {
  /**
   * Whether to enable logging
   */
  enableLogging?: boolean;

  /**
   * Custom logger instance
   */
  logger?: Logger;

  /**
   * Whether to enable debugging
   */
  debug?: boolean;

  /**
   * Additional configuration options
   */
  options?: Record<string, any>;
}

/**
 * Base class for all security-related middleware
 */
export abstract class SecurityMiddleware extends BaseMiddleware {
  protected readonly logger: Logger;
  protected readonly config: SecurityConfig;

  constructor(config: SecurityConfig = {}) {
    super();
    this.config = {
      enableLogging: true,
      debug: false,
      ...config
    };

    this.logger = config.logger || new Logger(this.constructor.name);
  }

  /**
   * Main middleware handler
   */
  public handle = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const context: SecurityContext = { req, res, next };

    try {
      // Log request if enabled
      if (this.config.enableLogging) {
        this.logRequest(req);
      }

      // Run middleware implementation
      await this.implementation(context);

      // Log success if enabled
      if (this.config.enableLogging) {
        this.logSuccess(req);
      }

      next();
    } catch (error) {
      // Log error if enabled
      if (this.config.enableLogging) {
        this.logError(req, error as Error);
      }

      // Handle error
      this.handleError(error as Error, req, res, next);
    }
  };

  /**
   * Main middleware implementation - must be implemented by derived classes
   */
  protected abstract implementation(context: SecurityContext): Promise<void>;

  /**
   * Log incoming request
   */
  protected logRequest(req: Request): void {
    this.logger.debug('Processing request', {
      method: req.method,
      path: req.path,
      ip: req.ip,
      headers: this.config.debug ? req.headers : undefined
    });
  }

  /**
   * Log successful request
   */
  protected logSuccess(req: Request): void {
    this.logger.debug('Request processed successfully', {
      method: req.method,
      path: req.path
    });
  }

  /**
   * Log error
   */
  protected logError(req: Request, error: Error): void {
    this.logger.error('Request processing failed', {
      method: req.method,
      path: req.path,
      error: {
        name: error.name,
        message: error.message,
        stack: this.config.debug ? error.stack : undefined
      }
    });
  }

  /**
   * Handle error - can be overridden by derived classes
   */
  protected handleError(error: Error, _req: Request, _res: Response, next: NextFunction): void {
    next(error);
  }
}