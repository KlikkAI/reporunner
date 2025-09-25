/**
 * Revoke all tokens for a user
 */
revokeAllUserTokens(userId: string)
: void
{
  const userSessions = this.userSessions.get(userId);
  if (userSessions) {
    for (const sessionId of userSessions) {
      // Find and revoke all tokens for this session
      for (const [tokenId, data] of this.refreshTokenStore) {
        if (data.userId === userId && data.sessionId === sessionId) {
          this.revokeToken(tokenId);
        }
      }
    }
    this.userSessions.delete(userId);
  }
}

/**
 * Revoke a specific session
 */
revokeSession(sessionId: string)
: void
{
  for (const [tokenId, data] of this.refreshTokenStore) {
    if (data.sessionId === sessionId) {
      this.revokeToken(tokenId);
    }
  }
}

/**
 * Get all active sessions for a user
 */
getUserSessions(userId: string)
: RefreshTokenData[]
{
  const sessions: RefreshTokenData[] = [];
  const userSessionIds = this.userSessions.get(userId);

  if (userSessionIds) {
    for (const [_, data] of this.refreshTokenStore) {
      if (data.userId === userId && userSessionIds.has(data.sessionId)) {
        sessions.push(data);
      }
    }
  }

  return sessions;
}

/**
 * Validate token without throwing
 */
async;
validateToken(
    token: string,
    isRefreshToken: boolean = false
  )
: Promise<
{
  valid: boolean;
  payload?: JwtPayload;
  error?: string;
}
>
{
  try {
    const payload = this.verifyToken(token, isRefreshToken);
    return { valid: true, payload };
  } catch (error: any) {
    return { valid: false, error: error.message };
  }
}

/**
 * Extract token from Authorization header
 */
extractTokenFromHeader(authHeader?: string)
: string | null
{
  if (!authHeader) return null;

  const parts = authHeader.split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }

  return null;
}

/**
 * Sign a token
 */
private
signToken(payload: any, options: SignOptions, isRefreshToken: boolean = false)
: string
{
  const secret = isRefreshToken ? this.config.refreshTokenSecret : this.config.accessTokenSecret;

  const signOptions: SignOptions = {
    ...options,
    issuer: this.config.issuer,
    audience: this.config.audience,
    algorithm: this.config.algorithm,
  };

  return jwt.sign(payload, secret, signOptions);
}

/**
 * Generate a unique session ID
 */
