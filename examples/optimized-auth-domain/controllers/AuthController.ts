/**
 * Example: Optimized Controller using shared base classes
 *
 * BEFORE: Custom controller with duplicate response handling
 * AFTER: Extends BaseController, focuses on business logic
 */

import { BaseController, LoggingUtils, StringUtils } from '@klikkflow/shared';
import type { Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import type { GetUserByIdUseCase } from '../use-cases/GetUserByIdUseCase';

@injectable()
export class AuthController extends BaseController {
  constructor(@inject('GetUserByIdUseCase') private getUserByIdUseCase: GetUserByIdUseCase) {
    super();
  }

  async getUserProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);

      if (!userId) {
        return this.sendUnauthorized(res, 'User ID required');
      }

      // Use shared utility instead of custom validation
      if (StringUtils.trim(userId).length === 0) {
        return this.sendBadRequest(res, 'Invalid user ID');
      }

      const user = await this.getUserByIdUseCase.execute(userId);

      if (!user) {
        return this.sendNotFound(res, 'User not found');
      }

      // Use inherited response methods
      return this.sendSuccess(res, user, 'User profile retrieved successfully');
    } catch (error) {
      // Use inherited error handling
      return this.handleError(res, error, 'Get user profile');
    }
  }

  async updateProfile(req: Request, res: Response): Promise<Response> {
    try {
      const userId = this.extractUserId(req);
      const _updates = req.body;

      // Domain-specific validation using shared utilities
      if (!userId || StringUtils.trim(userId).length === 0) {
        return this.sendBadRequest(res, 'Valid user ID required');
      }

      // Business logic here...
      LoggingUtils.info('Profile update requested', { userId });

      return this.sendSuccess(res, null, 'Profile updated successfully');
    } catch (error) {
      return this.handleError(res, error, 'Update profile');
    }
  }
}

// REDUCTION: ~200 lines → ~80 lines (60% reduction)
// Eliminates duplicate response handling across all controllers
