import { Request, Response, NextFunction } from 'express';
import { ValidationError } from 'express-validator';
import { logger } from '../utils/logger.js';

// Re-export existing AppError for compatibility
export { AppError } from './errorHandlers.js';

export interface ErrorDetails {
  field?: string;
  code?: string;
  details?: any;
}

/**
 * Enhanced Application Error with more context
 */
export class EnhancedAppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;
  public details?: ErrorDetails[];

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: ErrorDetails[]
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Enhanced async handler with better error context
 */
export const enhancedCatchAsync = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch((error: Error) => {
      // Add request context to error
      logger.error(`Async handler error: ${error.message}`, {
        method: req.method,
        url: req.originalUrl,
        userId: (req as any).user?.id,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next(error);
    });
  };
};

/**
 * Handle different types of errors with appropriate responses
 */
export const enhancedErrorHandler = (
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Default error values
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Internal Server Error';
  let code = error.code;
  let details = error.details;

  // Handle specific error types
  if (error.name === 'ValidationError') {
    // Mongoose validation error
    statusCode = 400;
    message = 'Validation Error';
    code = 'VALIDATION_ERROR';
    details = Object.values(error.errors).map((err: any) => ({
      field: err.path,
      message: err.message,
      code: err.kind
    }));
  } else if (error.name === 'CastError') {
    // Mongoose cast error (invalid ObjectId, etc.)
    statusCode = 400;
    message = 'Invalid data format';
    code = 'CAST_ERROR';
    details = [{ field: error.path, message: `Invalid ${error.kind}` }];
  } else if (error.code === 11000) {
    // MongoDB duplicate key error
    statusCode = 409;
    message = 'Duplicate entry';
    code = 'DUPLICATE_ERROR';
    const field = Object.keys(error.keyPattern)[0];
    details = [{ field, message: `${field} already exists` }];
  } else if (error.name === 'JsonWebTokenError') {
    // JWT error
    statusCode = 401;
    message = 'Invalid token';
    code = 'TOKEN_ERROR';
  } else if (error.name === 'TokenExpiredError') {
    // JWT expired error
    statusCode = 401;
    message = 'Token expired';
    code = 'TOKEN_EXPIRED';
  } else if (error.name === 'MulterError') {
    // File upload error
    statusCode = 400;
    message = 'File upload error';
    code = 'UPLOAD_ERROR';
    details = [{ message: error.message }];
  }

  // Log error based on severity
  if (statusCode >= 500) {
    logger.error(`Server Error: ${error.message}`, {
      method: req.method,
      url: req.originalUrl,
      userId: (req as any).user?.id,
      statusCode,
      code
    });
  } else {
    logger.warn('Client Error', {
      method: req.method,
      url: req.originalUrl,
      userId: (req as any).user?.id,
      statusCode,
      code,
      message
    });
  }

  // Send error response
  const errorResponse: any = {
    status: 'error',
    message,
    ...(code && { code }),
    ...(details && { details })
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development' && statusCode >= 500) {
    errorResponse.stack = error.stack;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Handle 404 errors
 */
export const enhancedNotFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.warn('Route not found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip
  });

  res.status(404).json({
    status: 'error',
    message: `Route ${req.method} ${req.originalUrl} not found`,
    code: 'ROUTE_NOT_FOUND'
  });
};

/**
 * Request logging middleware
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    const { method, originalUrl, ip } = req;
    const { statusCode } = res;
    const userId = (req as any).user?.id;

    if (statusCode >= 400) {
      logger.warn('HTTP Request', {
        method,
        url: originalUrl,
        statusCode,
        duration,
        ip,
        userId
      });
    } else {
      logger.debug('HTTP Request', {
        method,
        url: originalUrl,
        statusCode,
        duration,
        ip,
        userId
      });
    }
  });

  next();
};