res.cookie('refresh_token', tokens.refreshToken, {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
}

return res.json({
        success: true,
        data: tokens,
      });
} catch (error: any)
{
  return res.status(401).json({
        success: false,
        error: {
          code: ERROR_CODES.UNAUTHORIZED,
          message: error.message,
        },
      });
}
}
}

/**
 * Create logout middleware
 */
export function createLogoutMiddleware(sessionManager: JWTSessionManager) {
  return async (req: Request, res: Response) => {
    try {
      const { logoutAll = false } = req.body;

      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Not authenticated',
          },
        });
      }

      if (logoutAll) {
        // Revoke all user tokens
        sessionManager.revokeAllUserTokens(req.user.id);
      } else if (req.sessionId) {
        // Revoke current session
        sessionManager.revokeSession(req.sessionId);
      } else if (req.user?.tokenId) {
        // Revoke current token
        sessionManager.revokeToken(req.user.tokenId);
      }

      // Clear cookies
      if (req.cookies) {
        res.clearCookie('access_token');
        res.clearCookie('refresh_token');
      }

      return res.json({
        success: true,
        message: logoutAll ? 'All sessions have been terminated' : 'Logged out successfully',
      });
    } catch (_error: any) {
      return res.status(500).json({
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: 'Failed to logout',
        },
      });
    }
  };
}

/**
 * Create session management middleware
 */
export function createSessionManagementMiddleware(sessionManager: JWTSessionManager) {
  return {
    // Get all user sessions
    getSessions: async (req: Request, res: Response) => {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          error: {
            code: ERROR_CODES.UNAUTHORIZED,
            message: 'Not authenticated',
          },
        });
      }

      const sessions = sessionManager.getUserSessions(req.user.id);

      return res.json({
        success: true,
        data: sessions.map((session) => ({
          sessionId: session.sessionId,
          createdAt: session.issuedAt,
          expiresAt: session.expiresAt,
