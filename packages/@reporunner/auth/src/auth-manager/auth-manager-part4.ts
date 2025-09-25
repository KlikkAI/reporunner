*/
  private generateAccessToken(user: User): string
{
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    organizationId: user.organizationId,
    roles: user.roles,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + this.getTokenExpiration(),
    type: 'access',
  };

  return jwt.sign(payload, this.config.jwtSecret);
}

/**
 * Generate refresh token
 */
private
generateRefreshToken(user: User)
: string
{
  const payload: JWTPayload = {
    sub: user.id,
    email: user.email,
    username: user.username,
    organizationId: user.organizationId,
    roles: user.roles,
    permissions: user.permissions,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + this.getRefreshTokenExpiration(),
    type: 'refresh',
  };

  return jwt.sign(payload, this.config.jwtRefreshSecret);
}

/**
 * Generate temporary two-factor token
 */
private
generateTwoFactorToken(userId: string)
: string
{
  return jwt.sign({ userId, type: '2fa' }, this.config.jwtSecret, { expiresIn: '5m' });
}

/**
 * Get token expiration in seconds
 */
private
getTokenExpiration();
: number
{
  return parseInt(this.config.tokenExpiration, 10) || 3600; // 1 hour default
}

/**
 * Get refresh token expiration in seconds
 */
private
getRefreshTokenExpiration();
: number
{
  return parseInt(this.config.refreshTokenExpiration, 10) || 604800; // 7 days default
}

/**
 * Emit authentication event
 */
private
async;
emitAuthEvent(event: AuthEvent, data: Partial<AuthEventData>)
: Promise<void>
{
  const eventData: AuthEventData = {
    event,
    timestamp: new Date(),
    ...data,
  };

  this.emit('auth:event', eventData);
  await this.auditLogger.log(eventData);
}
}
