}
throw error;
}
  }

  /**
   * Revoke all tokens in a family (used when reuse is detected)
   */
  private revokeTokenFamily(tokenFamily: string): void
{
  for (const [tokenId, data] of this.refreshTokenStore.entries()) {
    if (data.tokenFamily === tokenFamily) {
      this.refreshTokenStore.delete(tokenId);
    }
  }
}

/**
 * Revoke specific session tokens
 */
revokeSession(sessionId: string)
: void
{
  for (const [tokenId, data] of this.refreshTokenStore.entries()) {
    if (data.sessionId === sessionId) {
      this.refreshTokenStore.delete(tokenId);
    }
  }
}

/**
 * Clean up expired tokens
 */
cleanupExpiredTokens();
: void
{
  const now = new Date();
  for (const [tokenId, data] of this.refreshTokenStore.entries()) {
    if (data.expiresAt < now) {
      this.refreshTokenStore.delete(tokenId);
    }
  }
}

/**
 * Convert expiry string to seconds
 */
private
getExpiryInSeconds(expiry: string)
: number
{
  const units: { [key: string]: number } = {
    s: 1,
    m: 60,
    h: 3600,
    d: 86400,
    w: 604800,
  };

  const match = expiry.match(/^(\d+)([smhdw])$/);
  if (!match) {
    throw new Error(`Invalid expiry format: ${expiry}`);
  }

  const value = parseInt(match[1], 10);
  const unit = match[2];

  return value * units[unit];
}

/**
 * Generate API key
 */
generateApiKey();
:
{
  key: string;
  hash: string;
  prefix: string;
}
{
  const key = `rr_${uuidv4().replace(/-/g, '')}`;
  const hash = createHash('sha256').update(key).digest('hex');
  const prefix = key.substring(0, 7);

  return { key, hash, prefix };
}

/**
 * Verify API key
 */
verifyApiKey(key: string, hash: string)
: boolean
{
  const keyHash = createHash('sha256').update(key).digest('hex');
  return keyHash === hash;
}
}

export default TokenManager;
