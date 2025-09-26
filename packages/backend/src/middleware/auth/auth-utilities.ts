}

        userLimit.count++
next()
} catch (error)
{
  next(error);
}
}
}

/**
 * Organization context validation
 */
requireOrganization = async (req: Request, _res: Response, next: NextFunction): Promise<void> =>
{
  try {
    if (!req.user) {
      throw new AppError('Authentication required', 401);
    }

    if (!req.user.organizationId) {
      throw new AppError('Organization membership required', 403);
    }

    next();
  } catch (error) {
    next(error);
  }
}

/**
 * Extract token from Authorization header or cookies
 */
private
extractToken(req: Request)
: string | null
{
  // Check Authorization header
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Legacy support for bearer (lowercase)
  if (authHeader?.toLowerCase().startsWith('bearer ')) {
    return authHeader.split(' ')[1];
  }

  // Legacy support: token without Bearer prefix (only if no spaces)
  if (authHeader && !authHeader.includes(' ')) {
    return authHeader;
  }

  // Check cookies (for browser requests)
  if (req.cookies?.token) {
    return req.cookies.token;
  }

  // Check query parameter (for websocket connections)
  if (req.query?.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  return null;
}
}

// Export singleton instance
export const authMiddleware = new AuthMiddleware();

// Export individual middleware functions for convenience and backward compatibility
export const authenticate = authMiddleware.authenticate;
export const optionalAuth = authMiddleware.optionalAuth;
export const requirePermission = authMiddleware.requirePermission;
export const requireAnyPermission = authMiddleware.requireAnyPermission;
export const requireRole = authMiddleware.requireRole;
export const requireEmailVerification = authMiddleware.requireEmailVerification;
export const requireOwnershipOrAdmin = authMiddleware.requireOwnershipOrAdmin;
export const rateLimitByUser = authMiddleware.rateLimitByUser;
export const requireOrganization = authMiddleware.requireOrganization;

// Legacy compatibility exports
export const authorize = (...roles: string[]) => {
  return authMiddleware.requireRole(roles);
};
