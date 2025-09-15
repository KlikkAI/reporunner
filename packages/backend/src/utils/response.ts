/**
 * Standard response formatters
 */

import { Response } from 'express';
import { IApiResponse, IPaginationResult } from '../types/common.js';
import { HTTP_STATUS } from '../constants/httpStatus.js';

export class ResponseUtils {
  /**
   * Send success response
   */
  static success<T>(res: Response, data?: T, message?: string, statusCode: number = HTTP_STATUS.OK): Response {
    const response: IApiResponse<T> = {
      success: true,
      message,
      data
    };
    
    return res.status(statusCode).json(response);
  }

  /**
   * Send created response
   */
  static created<T>(res: Response, data?: T, message?: string): Response {
    return this.success(res, data, message, HTTP_STATUS.CREATED);
  }

  /**
   * Send error response
   */
  static error(res: Response, message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR, details?: any): Response {
    const response: IApiResponse = {
      success: false,
      message,
      error: {
        statusCode,
        status: statusCode >= 500 ? 'error' : 'fail',
        isOperational: true
      }
    };

    if (process.env.NODE_ENV === 'development' && details) {
      response.stack = details.stack;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Send fail response (client error)
   */
  static fail(res: Response, message: string, statusCode: number = HTTP_STATUS.BAD_REQUEST): Response {
    const response: IApiResponse = {
      success: false,
      message,
      error: {
        statusCode,
        status: 'fail',
        isOperational: true
      }
    };

    return res.status(statusCode).json(response);
  }

  /**
   * Send paginated response
   */
  static paginated<T>(
    res: Response, 
    data: T[], 
    pagination: { total: number; page: number; limit: number; pages: number },
    message?: string
  ): Response {
    const response: IApiResponse<IPaginationResult<T>> = {
      success: true,
      message,
      data: {
        data,
        pagination
      }
    };

    return res.status(HTTP_STATUS.OK).json(response);
  }

  /**
   * Send not found response
   */
  static notFound(res: Response, resource: string = 'Resource'): Response {
    return this.fail(res, `${resource} not found`, HTTP_STATUS.NOT_FOUND);
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(res: Response, message: string = 'Unauthorized'): Response {
    return this.fail(res, message, HTTP_STATUS.UNAUTHORIZED);
  }

  /**
   * Send forbidden response
   */
  static forbidden(res: Response, message: string = 'Forbidden'): Response {
    return this.fail(res, message, HTTP_STATUS.FORBIDDEN);
  }

  /**
   * Send validation error response
   */
  static validationError(res: Response, errors: any[]): Response {
    return this.fail(res, `Validation failed: ${errors.join(', ')}`, HTTP_STATUS.UNPROCESSABLE_ENTITY);
  }
}