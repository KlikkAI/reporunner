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
