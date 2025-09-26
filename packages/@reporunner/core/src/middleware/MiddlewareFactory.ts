import { ValidationMiddlewareOptions } from './validation/BaseValidationMiddleware';
import { SecurityMiddlewareOptions } from './security/BaseSecurityMiddleware';
import { ValidationMiddleware } from './validation/ValidationMiddleware';
import { SecurityHeadersMiddleware } from './security/SecurityHeadersMiddleware';
import { AuthMiddleware } from './security/AuthMiddleware';
import { RateLimitMiddleware } from './security/RateLimitMiddleware';

/**
 * Factory for creating middleware instances
 */
export class MiddlewareFactory {
  /**
   * Create validation middleware
   */
  public static createValidationMiddleware(options: ValidationMiddlewareOptions = {}) {
    return new ValidationMiddleware(options);
  }

  /**
   * Create security headers middleware
   */
  public static createSecurityHeadersMiddleware(options: SecurityMiddlewareOptions = {}) {
    return new SecurityHeadersMiddleware(options);
  }

  /**
   * Create authentication middleware
   */
  public static createAuthMiddleware(options: SecurityMiddlewareOptions = {}) {
    return new AuthMiddleware(options);
  }

  /**
   * Create rate limiting middleware
   */
  public static createRateLimitMiddleware(options: SecurityMiddlewareOptions = {}) {
    return new RateLimitMiddleware(options);
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