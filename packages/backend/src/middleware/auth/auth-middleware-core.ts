/**
 * Enhanced Authentication and Authorization Middleware
 * Implements JWT verification with RBAC permission checking
 */

import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { UserRepository } from '../domains/auth/repositories/UserRepository.js';
import { type Permission, PermissionService } from '../services/PermissionService.js';
import { AppError } from './errorHandlers.js';

// Extend Express Request type to include user data
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: string;
        permissions: string[];
        organizationId?: string;
        isEmailVerified: boolean;
      };
    }
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
    permissions: string[];
    organizationId?: string;
    isEmailVerified: boolean;
    firstName?: string;
    lastName?: string;
  };
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: string;
  permissions: string[];
  organizationId?: string;
  isEmailVerified: boolean;
  iat: number;
  exp: number;
}

export class AuthMiddleware {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
    this.permissionService = PermissionService.getInstance();
  }

  /**
   * Verify JWT token and attach user to request
   */
  authenticate = async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      const token = this.extractToken(req);
      if (!token) {
        throw new AppError('Authentication token is required', 401);
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new AppError('JWT secret not configured', 500);
      }

      // Verify and decode token
      const decoded = jwt.verify(token, secret) as AuthPayload;

      // Verify user still exists and is active
      const user = await this.userRepository.findById(decoded.userId);
      if (!user || !user.isActive) {
        throw new AppError('User account not found or inactive', 401);
      }

      // Check if user is locked
      if (user.isLocked()) {
        throw new AppError('Account is temporarily locked', 423);
      }

      // Attach user data to request
      req.user = {
        id: decoded.userId,
        email: decoded.email,
        role: decoded.role,
        permissions: decoded.permissions,
        organizationId: decoded.organizationId,
        isEmailVerified: decoded.isEmailVerified,
      };

      next();
    } catch (error) {
