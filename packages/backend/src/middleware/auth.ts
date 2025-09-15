import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { User } from '../models/User.js';
import { AppError } from './errorHandlers.js';
import { catchAsync } from './errorHandlers.js';

interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    firstName: string;
    lastName: string;
  };
}

/**
 * Middleware to verify JWT token and authenticate user
 */
export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    let token: string | undefined;

    // Check for token in Authorization header
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization;
      
      // Support both "Bearer token" and "bearer token" (case-insensitive)
      if (authHeader.toLowerCase().startsWith('bearer ')) {
        token = authHeader.split(' ')[1];
      } else if (!authHeader.includes(' ')) {
        // Legacy support: token without Bearer prefix (only if no spaces)
        token = authHeader;
      }
      // If authorization header exists but doesn't match patterns, token remains undefined
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access token is required'
      });
    }

    try {
      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;

      // Check if user still exists
      const user = await User.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token'
        });
      }

      // Grant access to protected route - include all safe user fields
      req.user = {
        id: user._id.toString(), // Ensure string conversion
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      next();
    } catch (error) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
};

/**
 * Middleware to authorize specific roles
 */
export const authorize = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError('Access denied. Insufficient permissions', 403);
    }

    next();
  };
};

/**
 * Optional authentication - doesn't throw error if no token
 */
export const optionalAuth = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    let token: string | undefined;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (token) {
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        const user = await User.findById(decoded.userId);

        if (user && user.isActive) {
          req.user = {
            id: user._id,
            email: user.email,
            role: user.role,
          };
        }
      } catch (error) {
        // Ignore token errors for optional auth
      }
    }

    next();
  }
);
