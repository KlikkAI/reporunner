const options: jwt.SignOptions = {
  expiresIn: this.config.refreshTokenExpiry,
  issuer: this.config.issuer,
  algorithm: 'RS256',
};

const token = jwt.sign(payload, this.config.refreshTokenSecret, options);

// Store refresh token data for rotation tracking
this.refreshTokenStore.set(tokenId, {
  userId,
  sessionId,
  tokenFamily,
  issuedAt: new Date(),
  expiresAt,
  used: false,
});

return token;
}

  /**
   * Verify and decode access token
   */
  async verifyAccessToken(token: string): Promise<IJwtPayload>
{
  try {
    const decoded = jwt.verify(token, this.config.accessTokenSecret, {
      issuer: this.config.issuer,
      audience: this.config.audience,
      algorithms: ['RS256'],
    }) as IJwtPayload;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw error;
  }
}

/**
 * Refresh token rotation for enhanced security
 */
async;
refreshTokenRotation(refreshToken: string, user: IUser)
: Promise<TokenPair>
{
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, this.config.refreshTokenSecret, {
        issuer: this.config.issuer,
        algorithms: ['RS256'],
      }) as any;

      const tokenData = this.refreshTokenStore.get(decoded.jti);

      if (!tokenData) {
        throw new Error('Refresh token not found');
      }

      if (tokenData.used) {
        // Token reuse detected - potential attack
        this.revokeTokenFamily(tokenData.tokenFamily);
        throw new Error('Refresh token reuse detected - all tokens revoked');
      }

      if (tokenData.userId !== user.id) {
        throw new Error('Token user mismatch');
      }

      // Mark current token as used
      tokenData.used = true;

      // Generate new token pair with same family
      const newSessionId = decoded.sessionId;
      const newTokenFamily = tokenData.tokenFamily;

      // Generate new access token
      const accessToken = await this.generateAccessToken(user, newSessionId);

      // Generate new refresh token in same family
      const newRefreshToken = await this.generateRefreshToken(
        user.id,
        newSessionId,
        newTokenFamily
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
        expiresIn: this.getExpiryInSeconds(this.config.accessTokenExpiry),
      };
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Refresh token expired');
      }
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid refresh token');
