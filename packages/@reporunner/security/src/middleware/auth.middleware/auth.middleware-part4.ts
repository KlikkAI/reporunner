lastUsedAt: session.lastUsedAt, refreshCount;
: session.refreshCount,
          ipAddress: session.ipAddress,
          userAgent: session.userAgent,
          current: session.sessionId === req.sessionId,
        })),
      })
},

    // Revoke a specific session
    revokeSession: async (req: Request, res: Response) =>
{
  if (!req.user) {
    return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Not authenticated',
          },
        });
  }

  const { sessionId } = req.params;

  // Verify user owns this session
  const sessions = sessionManager.getUserSessions(req.user.id);
  if (!sessions.some((s) => s.sessionId === sessionId)) {
    return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Cannot revoke session that does not belong to you',
          },
        });
  }

  sessionManager.revokeSession(sessionId);

  return res.json({
        success: true,
        message: 'Session revoked successfully',
      });
}
,
  }
}

/**
 * Role-based access control middleware
 */
export function requireRole(...requiredRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
      return;
    }

    if (!req.user.roles || !requiredRoles.some((role) => req.user?.roles?.includes(role))) {
      res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
          message: `One of the following roles is required: ${requiredRoles.join(', ')}`,
        },
      });
      return;
    }

    next();
  };
}

/**
 * Permission-based access control middleware
 */
export function requirePermission(...requiredPermissions: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Authentication required',
        },
      });
      return;
    }

    if (
      !req.user.permissions ||
      !requiredPermissions.some((perm) => req.user?.permissions?.includes(perm))
    ) {
      res.status(403).json({
        success: false,
        error: {
          code: ERROR_CODES.FORBIDDEN,
