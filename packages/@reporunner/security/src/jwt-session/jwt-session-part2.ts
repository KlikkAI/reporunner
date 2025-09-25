})

const refreshToken = this.signToken(
  refreshTokenPayload,
  {
    expiresIn: this.config.refreshTokenExpiry as any,
    subject: payload.userId,
  },
  true
);

// Calculate expiry dates
const accessTokenExpiry = this.getExpiryDate(this.config.accessTokenExpiry);
const refreshTokenExpiry = this.getExpiryDate(this.config.refreshTokenExpiry);

// Store refresh token data
const refreshTokenData: RefreshTokenData = {
  tokenId,
  userId: payload.userId,
  sessionId,
  refreshCount: 0,
  issuedAt: new Date(),
  expiresAt: refreshTokenExpiry,
};

this.refreshTokenStore.set(tokenId, refreshTokenData);

// Track user session
this.addUserSession(payload.userId, sessionId);

return {
      accessToken,
      refreshToken,
      accessTokenExpiry,
      refreshTokenExpiry,
    };
}

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(
    refreshToken: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<TokenPair>
{
    try {
      // Verify refresh token
      const decoded = this.verifyToken(refreshToken, true) as JwtPayload;

      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }

      const tokenId = decoded.tokenId;
      const refreshTokenData = this.refreshTokenStore.get(tokenId);

      if (!refreshTokenData) {
        throw new Error('Refresh token not found or expired');
      }

      // Check if token is blacklisted
      if (this.config.enableBlacklist && this.blacklistedTokens.has(tokenId)) {
        throw new Error('Token has been revoked');
      }

      // Check refresh count
      if (refreshTokenData.refreshCount >= this.config.maxRefreshCount) {
        throw new Error('Maximum refresh count exceeded');
      }

      // Update refresh token data
      refreshTokenData.refreshCount++;
      refreshTokenData.lastUsedAt = new Date();
      if (ipAddress) refreshTokenData.ipAddress = ipAddress;
      if (userAgent) refreshTokenData.userAgent = userAgent;

      // Generate new access token
      const newAccessTokenPayload: SessionPayload = {
        userId: decoded.userId,
        sessionId: decoded.sessionId,
        tokenId: this.config.enableRotation ? await this.generateTokenId() : tokenId,
        type: 'access',
      };

      const newAccessToken = this.signToken(newAccessTokenPayload, {
        expiresIn: this.config.accessTokenExpiry as any,
        subject: decoded.userId,
      });

      const accessTokenExpiry = this.getExpiryDate(this.config.accessTokenExpiry);

      // Rotate refresh token if enabled
      let newRefreshToken = refreshToken;
      let refreshTokenExpiry = refreshTokenData.expiresAt;

      if (this.config.enableRotation) {
        const newTokenId = await this.generateTokenId();
        const newRefreshTokenPayload = {
          userId: decoded.userId,
