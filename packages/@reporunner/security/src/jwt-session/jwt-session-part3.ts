sessionId: decoded.sessionId, tokenId;
: newTokenId,
type: 'refresh', refreshCount;
: refreshTokenData.refreshCount,
        }

newRefreshToken = this.signToken(
  newRefreshTokenPayload,
{
  expiresIn: this.config.refreshTokenExpiry as any, subject;
  : decoded.userId,
}
,
  true
)

refreshTokenExpiry = this.getExpiryDate(this.config.refreshTokenExpiry);

// Update token store
this.refreshTokenStore.delete(tokenId);
this.refreshTokenStore.set(newTokenId, {
  ...refreshTokenData,
  tokenId: newTokenId,
  expiresAt: refreshTokenExpiry,
});

// Blacklist old refresh token
if (this.config.enableBlacklist) {
  this.blacklistedTokens.add(tokenId);
}
} else
{
  // Update existing token data
  this.refreshTokenStore.set(tokenId, refreshTokenData);
}

return {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
        accessTokenExpiry,
        refreshTokenExpiry,
      };
} catch (error: any)
{
  throw new Error(`Token refresh failed: ${error.message}`);
}
}

  /**
   * Verify and decode a token
   */
  verifyToken(token: string, isRefreshToken: boolean = false): JwtPayload
{
  try {
    const secret = isRefreshToken ? this.config.refreshTokenSecret : this.config.accessTokenSecret;

    const options: VerifyOptions = {
      issuer: this.config.issuer,
      audience: this.config.audience,
      algorithms: [this.config.algorithm],
    };

    const decoded = jwt.verify(token, secret, options) as JwtPayload;

    // Check if token is blacklisted
    if (this.config.enableBlacklist && decoded.tokenId) {
      if (this.blacklistedTokens.has(decoded.tokenId)) {
        throw new Error('Token has been revoked');
      }
    }

    return decoded;
  } catch (error: any) {
    if (error.name === 'TokenExpiredError') {
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      throw new Error('Invalid token');
    }
    throw error;
  }
}

/**
 * Revoke a token (add to blacklist)
 */
revokeToken(tokenId: string)
: void
{
  if (this.config.enableBlacklist) {
    this.blacklistedTokens.add(tokenId);

    // Also remove from refresh token store
    const refreshTokenData = this.refreshTokenStore.get(tokenId);
    if (refreshTokenData) {
      this.refreshTokenStore.delete(tokenId);

      // Remove from user sessions
      const userSessions = this.userSessions.get(refreshTokenData.userId);
      if (userSessions) {
        userSessions.delete(refreshTokenData.sessionId);
      }
    }
  }
}
