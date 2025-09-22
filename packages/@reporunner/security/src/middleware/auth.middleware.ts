import { ERROR_CODES } from '@reporunner/constants';
import type { NextFunction, Request, Response } from 'express';
// Removed unused JwtPayload import
import type { JWTSessionManager } from '../jwt-session';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
      token?: string;
      sessionId?: string;
    }
  }
}

export interface AuthenticatedUser {
  id: string;
  email?: string;
  roles?: string[];
  permissions?: string[];
  sessionId?: string;
  tokenId?: string;
}

export interface AuthMiddlewareOptions {
  required?: boolean;
  roles?: string[];
  permissions?: string[];
  skipPaths?: string[];
  cookieName?: string;
  extractFromCookie?: boolean;
}

/**
 * Create JWT authentication middleware
 */
export function createAuthMiddleware(
  sessionManager: JWTSessionManager,
  options: AuthMiddlewareOptions = {}
) {
  const {
    required = true,
    roles = [],
    permissions = [],
    skipPaths = [],
    cookieName = 'access_token',
    extractFromCookie = false,
  } = options;

  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Skip authentication for certain paths
      if (skipPaths.some((path) => req.path.startsWith(path))) {
        return next();
      }

      // Extract token from request
      let token = sessionManager.extractTokenFromHeader(req.headers.authorization as string);

      // Try cookie if enabled and no header token
      if (!token && extractFromCookie && req.cookies) {
        token = req.cookies[cookieName];
      }

      // Try query parameter as last resort (less secure)
      if (!token && req.query.access_token) {
        token = req.query.access_token as string;
      }

      if (!token) {
        if (required) {
          return res.status(401).json({
            success: false,
            error: {
              code: ERROR_CODES.UNAUTHORIZED,
              message: 'No authentication token provided',
            },
          });
        }
        return next();
      }

      // Verify token
      const decoded = sessionManager.verifyToken(token, false);

      // Check if it's an access token
      if (decoded.type !== 'access') {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Invalid token type',
          },
        });
      }

      // Build user object
      const user: AuthenticatedUser = {
        id: decoded.userId || (decoded.sub as string),
        email: decoded.email,
        roles: decoded.roles || [],
        permissions: decoded.permissions || [],
        sessionId: decoded.sessionId,
        tokenId: decoded.tokenId,
      };

      // Check role requirements
      if (roles.length > 0 && !roles.some((role) => user.roles?.includes(role))) {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Insufficient role privileges',
          },
        });
      }

      // Check permission requirements
      if (permissions.length > 0 && !permissions.some((perm) => user.permissions?.includes(perm))) {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Insufficient permissions',
          },
        });
      }

      // Attach user to request
      req.user = user;
      req.token = token;
      req.sessionId = user.sessionId;

      next();
    } catch (error: any) {
      if (error.message === 'Token has expired') {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.TOKEN_EXPIRED,
            message: 'Access token has expired',
          },
        });
      } else if (error.message === 'Token has been revoked') {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.TOKEN_REVOKED,
            message: 'Access token has been revoked',
          },
        });
      }

      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid authentication token',
        },
      });
    }
  };
}

/**
 * Create refresh token middleware
 */
export function createRefreshTokenMiddleware(sessionManager: JWTSessionManager) {
  return async (req: Request, res: Response) => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.BAD_REQUEST,
            message: 'Refresh token is required',
          },
        });
      }

      // Get IP and user agent for tracking
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Refresh the token
      const tokens = await sessionManager.refreshAccessToken(refreshToken, ipAddress, userAgent);

      // Set cookies if enabled
      if (req.cookies) {
        res.cookie('access_token', tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 minutes
        });

        res.cookie('refresh_token', tokens.refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        });
      }

      return res.json({
        success: true,
        data: tokens,
      });
    } catch (error: any) {
      return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: error.message,
        },
      });
    }
  };
}

/**
 * Create logout middleware
 */
export function createLogoutMiddleware(sessionManager: JWTSessionManager) {
  return async (req: Request, res: Response) => {
    try {
      const { logoutAll = false } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Not authenticated',
          },
        });
      }

      if (logoutAll) {
        // Revoke all user tokens
        sessionManager.revokeAllUserTokens(req.user.id);
      } else if (req.sessionId) {
        // Revoke current session
        sessionManager.revokeSession(req.sessionId);
      } else if (req.user?.tokenId) {
        // Revoke current token
        sessionManager.revokeToken(req.user.tokenId);
      }

      // Clear cookies
      if (req.cookies) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
      }

      return res.json({
        success: true,
        message: logoutAll ? 'All sessions have been terminated' : 'Logged out successfully',
      });
    } catch (error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to logout',
        },
      });
    }
  };
}

/**
 * Create session management middleware
 */
export function createSessionManagementMiddleware(sessionManager: JWTSessionManager) {
  return {
    // Get all user sessions
    getSessions: async (req: Request, res: Response) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Not authenticated',
          },
        });
      }

      const sessions = sessionManager.getUserSessions(req.user.id);

      return res.json({
        success: true,
        data: sessions.map((session) => ({
          sessionId: session.sessionId,
          createdAt: session.issuedAt,
          expiresAt: session.expiresAt,
          lastUsedAt: session.lastUsedAt,
          refreshCount: session.refreshCount,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          current: session.sessionId === req.sessionId,
        })),
      });
    },

    // Revoke a specific session
    revokeSession: async (req: Request, res: Response) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Not authenticated',
          },
        });
      }

      const { sessionId } = req.params;

      // Verify user owns this session
      const sessions = sessionManager.getUserSessions(req.user.id);
      if (!sessions.some((s) => s.sessionId === sessionId)) {
        return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Cannot revoke session that does not belong to you',
          },
        });
      }

      sessionManager.revokeSession(sessionId);

      return res.json({
        success: true,
        message: 'Session revoked successfully',
      });
    },
  };
}

/**
 * Role-based access control middleware
 */
export function requireRole(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!req.user.roles || !requiredRoles.some((role) => req.user!.roles!.includes(role))) {
      res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: `One of the following roles is required: ${requiredRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based access control middleware
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
      return;
    }

    if (
      !req.user.permissions ||
      !requiredPermissions.some((perm) => req.user!.permissions!.includes(perm))
    ) {
      res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: `One of the following permissions is required: ${requiredPermissions.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
export function optionalAuth(sessionManager: JWTSessionManager) {
  return createAuthMiddleware(sessionManager, { required: false });
}
