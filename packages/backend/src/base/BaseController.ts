import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import type { IAuthenticatedRequest } from '../interfaces/IController';
import type { IApiResponse } from '../interfaces/IService';
import { AppError } from '../middleware/errorHandlers';

export abstract class BaseController {
  /**
   * Validate request and throw error if validation fails
   */
  protected validateRequest(req: Request): void {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError(
        `Validation failed: ${errors
          .array()
          .map((e) => e.msg)
          .join(', ')}`,
        400
      );
    }
  }

  /**
   * Get authenticated user from request
   */
  protected getAuthenticatedUser(req: Request): { id: string; email: string; role: string } {
    const user = (req as IAuthenticatedRequest).user;
    if (!user) {
      throw new AppError('Not authenticated', 401);
    }
    return user;
  }

  /**
   * Send success response
   */
  protected sendSuccess<T>(res: Response, data?: T, message?: string, meta?: any): void {
    const response: IApiResponse<T> = {
      success: true,
      ...(message && { message }),
      ...(data && { data }),
      ...(meta && { meta }),
    };
    res.json(response);
  }

  /**
   * Send created response (201)
   */
  protected sendCreated<T>(res: Response, data: T, message: string = 'Created successfully'): void {
    const response: IApiResponse<T> = {
      success: true,
      message,
      data,
    };
    res.status(201).json(response);
  }

  /**
   * Send error response
   */
  protected sendError(res: Response, message: string, statusCode: number = 500): void {
    const response: IApiResponse = {
      success: false,
      message,
    };
    res.status(statusCode).json(response);
  }

  /**
   * Extract pagination parameters from request
   */
  protected getPaginationParams(req: Request): { page: number; limit: number; skip: number } {
    const page = Number.parseInt(req.query.page as string, 10) || 1;
    const limit = Math.min(Number.parseInt(req.query.limit as string, 10) || 20, 100); // Max 100 items
    const skip = (page - 1) * limit;

    return { page, limit, skip };
  }

  /**
   * Extract user ID from authenticated request
   */
  protected getUserId(req: Request): string {
    return this.getAuthenticatedUser(req).id;
  }
}
