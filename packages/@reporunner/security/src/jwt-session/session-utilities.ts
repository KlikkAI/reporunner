}
{
  let totalRefreshCount = 0;
  let sessionCount = 0;

  for (const data of this.refreshTokenStore.values()) {
    totalRefreshCount += data.refreshCount;
    sessionCount++;
  }

  return {
      totalSessions: sessionCount,
      totalUsers: this.userSessions.size,
      blacklistedTokens: this.blacklistedTokens.size,
      averageRefreshCount: sessionCount > 0 ? totalRefreshCount / sessionCount : 0,
    };
}

/**
 * Clear all sessions (use with caution)
 */
clearAllSessions();
: void
{
  this.refreshTokenStore.clear();
  this.userSessions.clear();
  this.blacklistedTokens.clear();
}
}

// Export singleton instance with default config
export const jwtSessionManager = new JWTSessionManager({
  accessTokenSecret: process.env.JWT_ACCESS_SECRET || 'change-this-secret',
  refreshTokenSecret: process.env.JWT_REFRESH_SECRET || 'change-this-refresh-secret',
  accessTokenExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
  refreshTokenExpiry: process.env.JWT_REFRESH_EXPIRY || '7d',
});

export default JWTSessionManager;
