email: decoded.email, roles;
: decoded.roles || [],
        permissions: decoded.permissions || [],
        sessionId: decoded.sessionId,
        tokenId: decoded.tokenId,
      }

// Check role requirements
if (roles.length > 0 && !roles.some((role) => user.roles?.includes(role))) {
  return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Insufficient role privileges',
          },
        });
}

// Check permission requirements
if (permissions.length > 0 && !permissions.some((perm) => user.permissions?.includes(perm))) {
  return res.status(403).json({
          success: false,
          error: {
            code: ERROR_CODES.FORBIDDEN,
            message: 'Insufficient permissions',
          },
        });
}

// Attach user to request
req.user = user;
req.token = token;
req.sessionId = user.sessionId;

next();
} catch (error: any)
{
  if (error.message === 'Token has expired') {
    return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.TOKEN_EXPIRED,
            message: 'Access token has expired',
          },
        });
  } else if (error.message === 'Token has been revoked') {
    return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.TOKEN_REVOKED,
            message: 'Access token has been revoked',
          },
        });
  }

  return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: 'Invalid authentication token',
        },
      });
}
}
}

/**
 * Create refresh token middleware
 */
export function createRefreshTokenMiddleware(sessionManager: JWTSessionManager) {
  return async (req: Request, res: Response) => {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refresh_token;

      if (!refreshToken) {
        return res.status(400).json({
          success: false,
          error: {
            code: ERROR_CODES.BAD_REQUEST,
            message: 'Refresh token is required',
          },
        });
      }

      // Get IP and user agent for tracking
      const ipAddress =
        (req.headers['x-forwarded-for'] as string)?.split(',')[0] || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      // Refresh the token
      const tokens = await sessionManager.refreshAccessToken(refreshToken, ipAddress, userAgent);

      // Set cookies if enabled
      if (req.cookies) {
        res.cookie('access_token', tokens.accessToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 15 * 60 * 1000, // 15 minutes
        });
