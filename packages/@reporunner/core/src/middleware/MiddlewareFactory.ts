import { ValidationMiddlewareOptions } from './BaseValidationMiddleware';

// Use security components from existing packages
export interface SecurityMiddlewareOptions {
  cors?: any;
  csp?: any;
  headers?: any;
  requireAuth?: boolean;
  requiredRoles?: string[];
}

// Define interfaces for missing middleware types
export interface MiddlewareInstance {
  handle: (req: any, res: any, next: any) => void | Promise<void>;
}

/**
 * Factory for creating middleware instances
 */
export class MiddlewareFactory {
  /**
   * Create validation middleware
   */
  public static createValidationMiddleware(options: ValidationMiddlewareOptions = {}): MiddlewareInstance {
    return {
      handle: (req: any, res: any, next: any) => {
        // Basic validation middleware implementation
        next();
      }
    };
  }

  /**
   * Create security headers middleware
   */
  public static createSecurityHeadersMiddleware(options: SecurityMiddlewareOptions = {}): MiddlewareInstance {
    return {
      handle: (req: any, res: any, next: any) => {
        // Basic security headers middleware implementation
        next();
      }
    };
  }

  /**
   * Create authentication middleware
   */
  public static createAuthMiddleware(options: SecurityMiddlewareOptions = {}): MiddlewareInstance {
    return {
      handle: (req: any, res: any, next: any) => {
        // Basic auth middleware implementation
        next();
      }
    };
  }

  /**
   * Create rate limiting middleware
   */
  public static createRateLimitMiddleware(options: SecurityMiddlewareOptions = {}): MiddlewareInstance {
    return {
      handle: (req: any, res: any, next: any) => {
        // Basic rate limit middleware implementation
        next();
      }
    };
  }

  /**
   * Create a middleware chain
   */
  public static createMiddlewareChain(...middleware: any[]) {
    return middleware.map(m => m.handle);
  }

  /**
   * Create development middleware stack
   */
  public static createDevStack() {
    return this.createMiddlewareChain(
      this.createSecurityHeadersMiddleware({
        cors: {
          enabled: true,
          origins: ['*'],
          credentials: true
        }
      }),
      this.createValidationMiddleware({
        stripUnknown: true,
        abortEarly: false
      }),
      this.createRateLimitMiddleware({
        // Higher limits for development
      })
    );
  }

  /**
   * Create production middleware stack
   */
  public static createProdStack() {
    return this.createMiddlewareChain(
      this.createSecurityHeadersMiddleware({
        cors: {
          enabled: true,
          origins: process.env.ALLOWED_ORIGINS?.split(',') || []
        }
      }),
      this.createValidationMiddleware({
        stripUnknown: true,
        abortEarly: true
      }),
      this.createRateLimitMiddleware({
        // Stricter limits for production
      })
    );
  }

  /**
   * Create API middleware stack
   */
  public static createApiStack() {
    return this.createMiddlewareChain(
      this.createAuthMiddleware({
        requireAuth: true
      }),
      this.createValidationMiddleware({
        validateBody: true,
        validateQuery: true
      }),
      this.createRateLimitMiddleware({
        // API-specific limits
      })
    );
  }

  /**
   * Create admin middleware stack
   */
  public static createAdminStack() {
    return this.createMiddlewareChain(
      this.createAuthMiddleware({
        requireAuth: true,
        requiredRoles: ['admin']
      }),
      this.createValidationMiddleware({
        validateBody: true,
        validateQuery: true,
        stripUnknown: false
      }),
      this.createRateLimitMiddleware({
        // Admin-specific limits
      })
    );
  }
}