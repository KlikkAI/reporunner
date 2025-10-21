import type { AuthenticatedUser } from '@klikkflow/shared';
import type { NextFunction, Request, Response } from 'express';

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
  userId?: string;
  organizationId?: string;
}

interface JWTPayload {
  userId?: string;
  sub?: string;
  organizationId?: string;
  [key: string]: unknown;
}

interface UserSession {
  sessionId: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  lastUsedAt?: Date;
  refreshCount?: number;
  ipAddress?: string;
  userAgent?: string;
}

export interface JWTSessionManager {
  verifyToken(token: string): Promise<JWTPayload>;
  createToken(payload: JWTPayload): Promise<string>;
  refreshToken(token: string): Promise<string>;
  revokeToken(token: string): Promise<void>;

  // Additional methods used by auth.middleware.ts
  extractTokenFromHeader(authorization: string): string | null;
  refreshAccessToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ accessToken: string; refreshToken: string }>;
  revokeAllUserTokens(userId: string): Promise<void>;
  revokeSession(sessionId: string): Promise<void>;
  getUserSessions(userId: string): UserSession[];
}

export interface AuthMiddlewareOptions {
  required?: boolean;
  permissions?: string[];
}

/**
 * Check if the request path is a public endpoint
 */
function isPublicPath(path: string): boolean {
  const publicPaths = ['/health', '/docs', '/openapi.json'];
  return publicPaths.some((publicPath) => path.startsWith(publicPath));
}

/**
 * Validate authorization header format and extract token
 */
function validateAuthHeader(authHeader: string | undefined): {
  valid: boolean;
  token?: string;
  error?: { status: number; body: { error: string; message: string } };
} {
  if (!authHeader) {
    return {
      valid: false,
      error: {
        status: 401,
        body: { error: 'No authorization header', message: 'Authentication required' },
      },
    };
  }

  if (!authHeader.startsWith('Bearer ')) {
    return {
      valid: false,
      error: {
        status: 401,
        body: { error: 'Invalid authorization format', message: 'Bearer token required' },
      },
    };
  }

  return { valid: true, token: authHeader.substring(7) };
}

/**
 * Build authenticated user from JWT payload
 */
function buildAuthenticatedUser(payload: JWTPayload, req: AuthRequest): void {
  req.user = {
    id: (payload.userId || payload.sub) as string,
    email: payload.email as string | undefined,
    organizationId: payload.organizationId as string | undefined,
    permissions: (payload.permissions as string[]) || [],
  };
  req.userId = payload.userId || payload.sub;
  req.organizationId = payload.organizationId as string | undefined;
}

/**
 * Check if user has required permissions
 */
function checkUserPermissions(
  payload: JWTPayload,
  requiredPermissions: string[]
): { allowed: boolean; error?: { status: number; body: { error: string; message: string } } } {
  if (requiredPermissions.length === 0) {
    return { allowed: true };
  }

  const userPermissions = (payload.permissions as string[]) || [];
  const hasRequiredPermission = requiredPermissions.some((perm) => userPermissions.includes(perm));

  if (!hasRequiredPermission) {
    return {
      allowed: false,
      error: {
        status: 403,
        body: {
          error: 'Insufficient permissions',
          message: `One of the following permissions is required: ${requiredPermissions.join(', ')}`,
        },
      },
    };
  }

  return { allowed: true };
}

/**
 * Check if missing auth header should be skipped (for optional auth)
 */
function shouldSkipMissingAuth(
  required: boolean,
  error?: { status: number; body: { error: string; message: string } }
): boolean {
  if (required) {
    return false;
  }
  if (!error || error.status !== 401) {
    return false;
  }
  return error.body.error === 'No authorization header';
}

/**
 * Create authentication middleware
 */
export function createAuthMiddleware(
  sessionManager: JWTSessionManager,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { required = true, permissions = [] } = options;

    // Skip auth for public endpoints
    if (isPublicPath(req.path)) {
      return next();
    }

    // Validate authorization header
    const headerValidation = validateAuthHeader(req.headers.authorization);
    if (!headerValidation.valid) {
      if (shouldSkipMissingAuth(required, headerValidation.error)) {
        return next();
      }
      if (headerValidation.error) {
        return res.status(headerValidation.error.status).json(headerValidation.error.body);
      }
    }

    const token = headerValidation.token as string;

    try {
      const payload = await sessionManager.verifyToken(token);

      // Build authenticated user
      buildAuthenticatedUser(payload, req);

      // Check permissions
      const permissionCheck = checkUserPermissions(payload, permissions);
      if (!permissionCheck.allowed && permissionCheck.error) {
        return res.status(permissionCheck.error.status).json(permissionCheck.error.body);
      }

      next();
    } catch (_error) {
      return res.status(401).json({
        error: 'Invalid token',
        message: 'Authentication failed',
      });
    }
  };
}

/**
 * Required authentication middleware
 */
export function requireAuth(sessionManager: JWTSessionManager, permissions?: string[]) {
  return createAuthMiddleware(sessionManager, { required: true, permissions });
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuth(sessionManager: JWTSessionManager) {
  return createAuthMiddleware(sessionManager, { required: false });
}
