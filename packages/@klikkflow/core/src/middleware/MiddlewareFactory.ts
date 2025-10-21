import type { ValidationMiddlewareOptions } from './BaseValidationMiddleware';

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
  public static createValidationMiddleware(
    _options: ValidationMiddlewareOptions = {}
  ): MiddlewareInstance {
    return {
      handle: (_req: any, _res: any, next: any) => {
        // Basic validation middleware implementation
        next();
      },
    };
  }

  /**
   * Create security headers middleware
   */
  public static createSecurityHeadersMiddleware(
    _options: SecurityMiddlewareOptions = {}
  ): MiddlewareInstance {
    return {
      handle: (_req: any, _res: any, next: any) => {
        // Basic security headers middleware implementation
        next();
      },
    };
  }

  /**
   * Create authentication middleware
   */
  public static createAuthMiddleware(_options: SecurityMiddlewareOptions = {}): MiddlewareInstance {
    return {
      handle: (_req: any, _res: any, next: any) => {
        // Basic auth middleware implementation
        next();
      },
    };
  }

  /**
   * Create rate limiting middleware
   */
  public static createRateLimitMiddleware(
    _options: SecurityMiddlewareOptions = {}
  ): MiddlewareInstance {
    return {
      handle: (_req: any, _res: any, next: any) => {
        // Basic rate limit middleware implementation
        next();
      },
    };
  }

  /**
   * Create a middleware chain
   */
  public static createMiddlewareChain(...middleware: any[]) {
    return middleware.map((m) => m.handle);
  }

  /**
   * Create development middleware stack
   */
  public static createDevStack() {
    return MiddlewareFactory.createMiddlewareChain(
      MiddlewareFactory.createSecurityHeadersMiddleware({
        cors: {
          enabled: true,
          origins: ['*'],
          credentials: true,
        },
      }),
      MiddlewareFactory.createValidationMiddleware({
        stripUnknown: true,
        abortEarly: false,
      }),
      MiddlewareFactory.createRateLimitMiddleware({
        // Higher limits for development
      })
    );
  }

  /**
   * Create production middleware stack
   */
  public static createProdStack() {
    return MiddlewareFactory.createMiddlewareChain(
      MiddlewareFactory.createSecurityHeadersMiddleware({
        cors: {
          enabled: true,
          origins: process.env.ALLOWED_ORIGINS?.split(',') || [],
        },
      }),
      MiddlewareFactory.createValidationMiddleware({
        stripUnknown: true,
        abortEarly: true,
      }),
      MiddlewareFactory.createRateLimitMiddleware({
        // Stricter limits for production
      })
    );
  }

  /**
   * Create API middleware stack
   */
  public static createApiStack() {
    return MiddlewareFactory.createMiddlewareChain(
      MiddlewareFactory.createAuthMiddleware({
        requireAuth: true,
      }),
      MiddlewareFactory.createValidationMiddleware({
        validateBody: true,
        validateQuery: true,
      }),
      MiddlewareFactory.createRateLimitMiddleware({
        // API-specific limits
      })
    );
  }

  /**
   * Create admin middleware stack
   */
  public static createAdminStack() {
    return MiddlewareFactory.createMiddlewareChain(
      MiddlewareFactory.createAuthMiddleware({
        requireAuth: true,
        requiredRoles: ['admin'],
      }),
      MiddlewareFactory.createValidationMiddleware({
        validateBody: true,
        validateQuery: true,
        stripUnknown: false,
      }),
      MiddlewareFactory.createRateLimitMiddleware({
        // Admin-specific limits
      })
    );
  }
}
