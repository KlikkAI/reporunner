timestamp: new Date().toISOString(), requestId;
: ResponseHelper.generateRequestId(),
        ...meta,
      },
    }
}

  static error(error: ApiError | Error, requestId?: string): ApiResponse
{
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

static
paginated<T>(
    data: T[],
    pagination: PaginationOptions,
    total: number,
    requestId?: string
  )
: ApiResponse<T[]>
{
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

private
static
generateRequestId();
: string
{
  return Math.random().toString(36).substr(2, 9);
}
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
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
    roles: req.user?.roles || [],
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
