private
async;
generateSessionId();
: Promise<string>
{
  const bytes = await randomBytesAsync(32);
  return bytes.toString('hex');
}

/**
 * Generate a unique token ID
 */
private
async;
generateTokenId();
: Promise<string>
{
  const bytes = await randomBytesAsync(16);
  return bytes.toString('hex');
}

/**
 * Calculate expiry date from duration string
 */
private
getExpiryDate(duration: string)
: Date
{
  const match = duration.match(/^(\d+)([smhd])$/);
  if (!match) {
    throw new Error(`Invalid duration format: ${duration}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];
  const now = new Date();

  switch (unit) {
    case 's':
      now.setSeconds(now.getSeconds() + value);
      break;
    case 'm':
      now.setMinutes(now.getMinutes() + value);
      break;
    case 'h':
      now.setHours(now.getHours() + value);
      break;
    case 'd':
      now.setDate(now.getDate() + value);
      break;
  }

  return now;
}

/**
 * Add user session tracking
 */
private
addUserSession(userId: string, sessionId: string)
: void
{
  let sessions = this.userSessions.get(userId);
  if (!sessions) {
    sessions = new Set();
    this.userSessions.set(userId, sessions);
  }
  sessions.add(sessionId);
}

/**
 * Start cleanup interval for expired tokens
 */
private
startCleanupInterval();
: void
{
  setInterval(
    () => {
      const now = new Date();

      // Clean expired refresh tokens
      for (const [tokenId, data] of this.refreshTokenStore) {
        if (data.expiresAt < now) {
          this.refreshTokenStore.delete(tokenId);

          // Remove from user sessions
          const userSessions = this.userSessions.get(data.userId);
          if (userSessions) {
            userSessions.delete(data.sessionId);
            if (userSessions.size === 0) {
              this.userSessions.delete(data.userId);
            }
          }
        }
      }

      // Clean blacklisted tokens older than max refresh token expiry
      // (They would be expired anyway)
      if (this.blacklistedTokens.size > 1000) {
        // Keep only last 1000 blacklisted tokens
        const tokensArray = Array.from(this.blacklistedTokens);
        this.blacklistedTokens = new Set(tokensArray.slice(-1000));
      }
    },
    60 * 60 * 1000
  ); // Run every hour
}

/**
 * Get session statistics
 */
getStatistics();
:
{
    totalSessions: number;
    totalUsers: number;
    blacklistedTokens: number;
    averageRefreshCount: number;
