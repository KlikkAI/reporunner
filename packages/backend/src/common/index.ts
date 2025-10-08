import type { NextFunction, Request, Response } from 'express';

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface RequestContext {
  requestId: string;
  userId?: string;
  organizationId?: string;
  roles?: string[];
  permissions?: string[];
  ip: string;
  userAgent: string;
  startTime: Date;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }

  static badRequest(message: string, details?: unknown): ApiError {
    return new ApiError(400, 'BAD_REQUEST', message, details);
  }

  static unauthorized(message: string = 'Unauthorized'): ApiError {
    return new ApiError(401, 'UNAUTHORIZED', message);
  }

  static forbidden(message: string = 'Forbidden'): ApiError {
    return new ApiError(403, 'FORBIDDEN', message);
  }

  static notFound(message: string = 'Resource not found'): ApiError {
    return new ApiError(404, 'NOT_FOUND', message);
  }

  static conflict(message: string, details?: unknown): ApiError {
    return new ApiError(409, 'CONFLICT', message, details);
  }

  static validationFailed(errors: ValidationError[]): ApiError {
    return new ApiError(422, 'VALIDATION_FAILED', 'Validation failed', errors);
  }

  static tooManyRequests(message: string = 'Too many requests'): ApiError {
    return new ApiError(429, 'TOO_MANY_REQUESTS', message);
  }

  static internalError(message: string = 'Internal server error', details?: unknown): ApiError {
    return new ApiError(500, 'INTERNAL_ERROR', message, details);
  }

  static serviceUnavailable(message: string = 'Service unavailable'): ApiError {
    return new ApiError(503, 'SERVICE_UNAVAILABLE', message);
  }
}

export class ResponseHelper {
  static success<T>(data: T, meta?: Partial<ApiResponse['meta']>): ApiResponse<T> {
    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: ResponseHelper.generateRequestId(),
        ...meta,
      },
    };
  }

  static error(error: ApiError | Error, requestId?: string): ApiResponse {
    const isApiError = error instanceof ApiError;

    return {
      success: false,
      error: {
        code: isApiError ? error.code : 'INTERNAL_ERROR',
        message: error.message,
        details: isApiError ? error.details : undefined,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || ResponseHelper.generateRequestId(),
      },
    };
  }

  static paginated<T>(
    data: T[],
    pagination: PaginationOptions,
    total: number,
    requestId?: string
  ): ApiResponse<T[]> {
    const totalPages = Math.ceil(total / pagination.limit);

    return {
      success: true,
      data,
      meta: {
        timestamp: new Date().toISOString(),
        requestId: requestId || ResponseHelper.generateRequestId(),
        pagination: {
          page: pagination.page,
          limit: pagination.limit,
          total,
          totalPages,
        },
      },
    };
  }

  private static generateRequestId(): string {
    return Math.random().toString(36).substr(2, 9);
  }
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const contextMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  const context: RequestContext = {
    requestId: Math.random().toString(36).substr(2, 9),
    userId: req.user?.id,
    organizationId: req.user?.organizationId,
    roles: req.user?.roles || (req.user?.role ? [req.user.role] : []),
    permissions: req.user?.permissions || [],
    ip: req.ip || req.connection.remoteAddress || 'unknown',
    userAgent: req.get('User-Agent') || 'unknown',
    startTime: new Date(),
  };

  req.context = context;
  res.setHeader('X-Request-ID', context.requestId);

  next();
};

export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  const context = req.context as RequestContext;
  const requestId = context?.requestId;

  if (error instanceof ApiError) {
    res.status(error.statusCode).json(ResponseHelper.error(error, requestId));
  } else {
    const internalError = ApiError.internalError();
    res.status(500).json(ResponseHelper.error(internalError, requestId));
  }
};

export const notFoundHandler = (req: Request, res: Response, _next: NextFunction): void => {
  const context = req.context as RequestContext;
  const error = ApiError.notFound(`Route ${req.method} ${req.path} not found`);
  res.status(404).json(ResponseHelper.error(error, context?.requestId));
};

export const validatePagination = (req: Request, _res: Response, next: NextFunction): void => {
  const page = Number.parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(Number.parseInt(req.query.limit as string, 10) || 20, 100);
  const sortBy = req.query.sortBy as string;
  const sortOrder = (req.query.sortOrder as string) === 'desc' ? 'desc' : 'asc';

  if (page < 1) {
    throw ApiError.badRequest('Page must be greater than 0');
  }

  if (limit < 1) {
    throw ApiError.badRequest('Limit must be greater than 0');
  }

  req.pagination = {
    page,
    limit,
    skip: (page - 1) * limit,
    sortBy,
    sortOrder,
  };

  next();
};

// Extend Express Request interface with backend-specific properties
// user and pagination are already declared in shared package
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
    }
  }
}

export * from './middleware';
export * from './utils';
export * from './validation';
