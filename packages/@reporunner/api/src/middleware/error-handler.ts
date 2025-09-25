import type { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

export function errorHandler(
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    code: error.code,
    statusCode: error.statusCode,
    details: error.details,
    path: req.path,
    method: req.method,
  });

  // Set default status code
  const statusCode = error.statusCode || 500;

  // Send error response
  res.status(statusCode).json({
    error: {
      message: error.message || 'Internal server error',
      code: error.code || 'INTERNAL_ERROR',
      details: process.env.NODE_ENV === 'development' ? error.details : undefined,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    },
    timestamp: new Date().toISOString(),
    path: req.path,
  });
}