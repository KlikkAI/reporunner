}

export const validatePagination = (req: Request, _res: Response, next: NextFunction): void => {
  const page = parseInt(req.query.page as string, 10) || 1;
  const limit = Math.min(parseInt(req.query.limit as string, 10) || 20, 100);
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
    sortBy,
    sortOrder,
  };

  next();
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      context?: RequestContext;
      user?: {
        id: string;
        organizationId: string;
        roles: string[];
        permissions: string[];
      };
      pagination?: PaginationOptions;
    }
  }
}

export * from './middleware';
export * from './utils';
export * from './validation';
