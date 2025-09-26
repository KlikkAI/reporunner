import { BaseMiddleware, MiddlewareContext, BaseMiddlewareOptions } from '../BaseMiddleware';

/**
 * Extended context for security operations
 */
export interface SecurityContext extends MiddlewareContext {
  secure?: boolean;
  user?: any;
  roles?: string[];
  permissions?: string[];
  scope?: string[];
  securityResult?: SecurityResult;
}

/**
 * Result of security checks
 */
export interface SecurityResult {
  allowed: boolean;
  errors: SecurityError[];
  metadata?: Record<string, unknown>;
}

/**
 * Security error details
 */
export interface SecurityError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Extended options for security middleware
 */
export interface SecurityMiddlewareOptions extends BaseMiddlewareOptions {
  /**
   * Whether to require authentication
   */
  requireAuth?: boolean;

  /**
   * Required roles
   */
  requiredRoles?: string[];

  /**
   * Required permissions
   */
  requiredPermissions?: string[];

  /**
   * Required OAuth scopes
   */
  requiredScopes?: string[];

  /**
   * Whether to apply CORS
   */
  cors?: {
    enabled?: boolean;
    origins?: string[];
    methods?: string[];
    headers?: string[];
    credentials?: boolean;
    maxAge?: number;
  };
}

/**
 * Base class for security middleware implementations
 */
export abstract class BaseSecurityMiddleware extends BaseMiddleware {
  protected securityOptions: Required<SecurityMiddlewareOptions>;

  constructor(options: SecurityMiddlewareOptions = {}) {
    super(options);

    this.securityOptions = {
      ...this.options,
      requireAuth: false,
      requiredRoles: [],
      requiredPermissions: [],
      requiredScopes: [],
      cors: {
        enabled: false,
        origins: [],
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
        headers: ['Content-Type', 'Authorization'],
        credentials: false,
        maxAge: 86400
      },
      ...options
    };
  }

  /**
   * Main security implementation
   */
  protected async implementation(context: MiddlewareContext): Promise<void> {
    const securityContext = await this.createSecurityContext(context);

    // Handle preflight requests first
    if (this.securityOptions.cors?.enabled && 
        securityContext.req.method === 'OPTIONS') {
      await this.handlePreflight(securityContext);
      return;
    }

    // Run security checks
    const result = await this.checkSecurity(securityContext);
    securityContext.securityResult = result;

    if (!result.allowed) {
      const error = result.errors[0];
      throw new Error(error.message);
    }

    // Apply security headers
    await this.applySecurityHeaders(securityContext);
  }

  /**
   * Create enhanced security context
   */
  protected async createSecurityContext(context: MiddlewareContext): Promise<SecurityContext> {
    const securityContext: SecurityContext = {
      ...context,
      secure: this.isSecureRequest(context),
      user: await this.getUser(context),
      roles: await this.getUserRoles(context),
      permissions: await this.getUserPermissions(context),
      scope: await this.getUserScopes(context)
    };

    return securityContext;
  }

  /**
   * Check if request is secure (HTTPS)
   */
  protected isSecureRequest(context: MiddlewareContext): boolean {
    const req = context.req;
    return req.secure || req.headers['x-forwarded-proto'] === 'https';
  }

  /**
   * Get current user
   */
  protected abstract getUser(context: MiddlewareContext): Promise<any>;

  /**
   * Get user roles
   */
  protected abstract getUserRoles(context: MiddlewareContext): Promise<string[]>;

  /**
   * Get user permissions
   */
  protected abstract getUserPermissions(context: MiddlewareContext): Promise<string[]>;

  /**
   * Get user OAuth scopes
   */
  protected abstract getUserScopes(context: MiddlewareContext): Promise<string[]>;

  /**
   * Perform security checks
   */
  protected async checkSecurity(context: SecurityContext): Promise<SecurityResult> {
    const result: SecurityResult = {
      allowed: true,
      errors: []
    };

    // Authentication check
    if (this.securityOptions.requireAuth && !context.user) {
      result.allowed = false;
      result.errors.push({
        code: 'UNAUTHORIZED',
        message: 'Authentication required'
      });
      return result;
    }

    // Role check
    if (this.securityOptions.requiredRoles.length > 0) {
      const hasRole = this.securityOptions.requiredRoles.some(
        role => context.roles?.includes(role)
      );

      if (!hasRole) {
        result.allowed = false;
        result.errors.push({
          code: 'FORBIDDEN',
          message: `Required roles: ${this.securityOptions.requiredRoles.join(', ')}`
        });
        return result;
      }
    }

    // Permission check
    if (this.securityOptions.requiredPermissions.length > 0) {
      const hasPermission = this.securityOptions.requiredPermissions.some(
        permission => context.permissions?.includes(permission)
      );

      if (!hasPermission) {
        result.allowed = false;
        result.errors.push({
          code: 'FORBIDDEN',
          message: `Required permissions: ${this.securityOptions.requiredPermissions.join(', ')}`
        });
        return result;
      }
    }

    // Scope check
    if (this.securityOptions.requiredScopes.length > 0) {
      const hasScope = this.securityOptions.requiredScopes.some(
        scope => context.scope?.includes(scope)
      );

      if (!hasScope) {
        result.allowed = false;
        result.errors.push({
          code: 'FORBIDDEN',
          message: `Required scopes: ${this.securityOptions.requiredScopes.join(', ')}`
        });
        return result;
      }
    }

    return result;
  }

  /**
   * Handle CORS preflight requests
   */
  protected async handlePreflight(context: SecurityContext): Promise<void> {
    const { cors } = this.securityOptions;
    const { req, res } = context;

    if (!cors.enabled) {
      return;
    }

    // Check origin
    const origin = req.headers.origin;
    if (!origin) {
      return;
    }

    const allowedOrigin = cors.origins.includes('*') ? '*' :
      cors.origins.find(o => o === origin);

    if (!allowedOrigin) {
      throw new Error('CORS origin not allowed');
    }

    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', allowedOrigin);

    if (cors.credentials) {
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    if (cors.headers.length > 0) {
      res.setHeader(
        'Access-Control-Allow-Headers',
        cors.headers.join(', ')
      );
    }

    if (cors.methods.length > 0) {
      res.setHeader(
        'Access-Control-Allow-Methods',
        cors.methods.join(', ')
      );
    }

    if (cors.maxAge) {
      res.setHeader('Access-Control-Max-Age', cors.maxAge.toString());
    }

    res.status(204).end();
  }

  /**
   * Apply security headers
   */
  protected abstract applySecurityHeaders(context: SecurityContext): Promise<void>;
}