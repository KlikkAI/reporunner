if (error instanceof jwt.JsonWebTokenError) {
  next(new AppError('Invalid authentication token', 401));
} else if (error instanceof jwt.TokenExpiredError) {
  next(new AppError('Authentication token has expired', 401));
} else {
  next(error);
}
}
  }

/**
 * Optional authentication - doesn't throw error if no token
 */
optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> =>
{
  try {
    const token = this.extractToken(req);
    if (!token) {
      return next();
    }

    await this.authenticate(req, res, next);
  } catch (_error) {
    // For optional auth, continue without user data
    next();
  }
}

/**
 * Require specific permission
 */
requirePermission = (permission: Permission) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Super admin has all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Check if user has the required permission
      if (!req.user.permissions.includes(permission)) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require one of multiple permissions
 */
requireAnyPermission = (permissions: Permission[]) => {
  return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        throw new AppError('Authentication required', 401);
      }

      // Super admin has all permissions
      if (req.user.role === 'super_admin') {
        return next();
      }

      // Check if user has any of the required permissions
      const hasPermission = permissions.some((permission) =>
        req.user?.permissions.includes(permission)
      );

      if (!hasPermission) {
        throw new AppError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Require specific role
 */
requireRole = (roles: string | string[]) => {
    const roleArray = Array.isArray(roles) ? roles : [roles];

    return async (req: Request, _res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.user) {
          throw new AppError('Authentication required', 401);
        }

        if (!roleArray.includes(req.user.role)) {
          throw new AppError('Insufficient role privileges', 403);
        }
