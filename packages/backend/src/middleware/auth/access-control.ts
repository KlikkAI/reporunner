next();
} catch (error)
{
  next(error);
}
}
}

/**
 * Require email verification
 */
requireEmailVerification = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> =>
{
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user.isEmailVerified) {
      throw new AppError('Email verification required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Check resource ownership or admin access
 */
requireOwnershipOrAdmin = (resourceUserIdField: string = 'userId') => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Admin and super_admin can access any resource
      if (['admin', 'super_admin'].includes(req.user.role)) {
        return next();
      }

      // Get resource user ID from params, body, or query
      const resourceUserId =
        req.params[resourceUserIdField] ||
        req.body[resourceUserIdField] ||
        req.query[resourceUserIdField];

      if (!resourceUserId) {
        throw new AppError('Resource ownership cannot be determined', 400);
      }

      // Check if user owns the resource
      if (req.user.id !== resourceUserId) {
        throw new AppError('Access denied: insufficient privileges', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Rate limiting by user
 */
rateLimitByUser = (maxRequests: number, windowMs: number) => {
    const userRequests = new Map<string, { count: number; resetTime: number }>();

    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new AppError('Authentication required', 401);
        }

        const userId = req.user.id;
        const now = Date.now();
        const userLimit = userRequests.get(userId);

        if (!userLimit || now > userLimit.resetTime) {
          // Reset window
          userRequests.set(userId, {
            count: 1,
            resetTime: now + windowMs,
          });
          return next();
        }

        if (userLimit.count >= maxRequests) {
          res.status(429).json({
            success: false,
            error: 'Too many requests',
            retryAfter: Math.ceil((userLimit.resetTime - now) / 1000),
          });
          return;
