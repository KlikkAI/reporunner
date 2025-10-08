import type { AuthenticatedUser } from '@reporunner/shared';
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
 * Create authentication middleware
 */
export function createAuthMiddleware(
  sessionManager: JWTSessionManager,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { required = true, permissions = [] } = options;

    // Skip auth for public endpoints
    const publicPaths = ['/health', '/docs', '/openapi.json'];
    if (publicPaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const authHeader = req.headers.authorization;

    if (!authHeader) {
      if (!required) {
        return next();
      }
      return res.status(401).json({
        error: 'No authorization header',
        message: 'Authentication required',
      });
    }

    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Invalid authorization format',
        message: 'Bearer token required',
      });
    }

    const token = authHeader.substring(7);

    try {
      const payload = await sessionManager.verifyToken(token);

      // Convert JWTPayload to AuthenticatedUser
      req.user = {
        id: (payload.userId || payload.sub) as string,
        email: payload.email as string | undefined,
        organizationId: payload.organizationId as string | undefined,
        permissions: (payload.permissions as string[]) || [],
      };
      req.userId = payload.userId || payload.sub;
      req.organizationId = payload.organizationId as string | undefined;

      // Check permissions if required
      if (permissions.length > 0) {
        const userPermissions = (payload.permissions as string[]) || [];
        const hasRequiredPermission = permissions.some((perm) => userPermissions.includes(perm));

        if (!hasRequiredPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            message: `One of the following permissions is required: ${permissions.join(', ')}`,
          });
        }
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
