/**
 * Base controller class with common functionality
 * Reduces duplication across domain controllers
 */
import { Request, Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
}

export abstract class BaseController {
  protected sendSuccess<T>(res: Response, data?: T, message?: string): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString()
    };
    return res.status(200).json(response);
  }

  protected sendCreated<T>(res: Response, data: T, message?: string): Response {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message: message || 'Resource created successfully',
      timestamp: new Date().toISOString()
    };
    return res.status(201).json(response);
  }

  protected sendError(res: Response, message: string, statusCode: number = 400): Response {
    const response: ApiResponse = {
      success: false,
      error: message,
      timestamp: new Date().toISOString()
    };
    return res.status(statusCode).json(response);
  }

  protected sendNotFound(res: Response, message: string = 'Resource not found'): Response {
    return this.sendError(res, message, 404);
  }

  protected sendInternalError(res: Response, message: string = 'Internal server error'): Response {
    return this.sendError(res, message, 500);
  }

  protected sendUnauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.sendError(res, message, 401);
  }

  protected sendBadRequest(res: Response, message: string = 'Bad request'): Response {
    return this.sendError(res, message, 400);
  }

  protected extractUserId(req: Request): string {
    // Common logic to extract user ID from request
    return req.user?.id || req.headers['x-user-id'] as string;
  }

  protected handleError(res: Response, error: Error | any, context: string = 'Operation'): Response {
    console.error(`${context} error:`, error);

    if (error.name === 'ValidationError') {
      return this.sendBadRequest(res, error.message);
    }

    if (error.name === 'UnauthorizedError') {
      return this.sendUnauthorized(res, error.message);
    }

    return this.sendInternalError(res, `${context} failed`);
  }
}