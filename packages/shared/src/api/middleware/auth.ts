import type { NextFunction, Request, Response } from 'express';

export interface AuthRequest extends Request {
  user?: any;
  userId?: string;
  organizationId?: string;
}

export function authMiddleware(req: AuthRequest, res: Response, next: NextFunction): void {
  // Skip auth for public endpoints
  const publicPaths = [
    '/health',
    '/docs',
    '/openapi.json',
    '/api/auth/login',
    '/api/auth/register',
  ];

  if (publicPaths.some((path) => req.path.startsWith(path))) {
    return next();
  }

  // Check for authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ error: 'No authorization header' }) as any;
  }

  if (!authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Invalid authorization format' }) as any;
  }

  const token = authHeader.substring(7);

  // Mock token validation
  // In production, validate with JWT or your auth service
  if (token) {
    // Mock user data
    req.user = {
      id: '123',
      email: 'user@example.com',
      organizationId: 'org-123',
    };
    req.userId = '123';
    req.organizationId = 'org-123';
    next();
  } else {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// Alias for compatibility
export const authRequired = authMiddleware;
