import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

export interface JWTConfig {
  secret: string;
  algorithms?: jwt.Algorithm[];
  issuer?: string;
  audience?: string;
  expiresIn?: string;
}

export interface AuthenticatedRequest extends Request {
  user?: any;
  userId?: string;
  organizationId?: string;
}

export function createJWTMiddleware(config: JWTConfig) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = extractToken(req);

      if (!token) {
        res.status(401).json({ error: 'No token provided' });
        return;
      }

      const decoded = jwt.verify(token, config.secret, {
        algorithms: config.algorithms || ['HS256'],
        issuer: config.issuer,
        audience: config.audience,
      }) as any;

      req.user = decoded;
      req.userId = decoded.userId || decoded.sub;
      req.organizationId = decoded.organizationId;

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res.status(401).json({ error: 'Token expired' });
        return;
      }
      if (error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ error: 'Invalid token' });
        return;
      }
      res.status(500).json({ error: 'Authentication error' });
    }
  };
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;

  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check for token in query params (less secure, but sometimes needed)
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  // Check for token in cookies
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  return null;
}
