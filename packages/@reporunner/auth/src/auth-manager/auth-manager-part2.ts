await this.config.database.updateUser(user.id, {
  lastLoginAt: new Date(),
});

await this.emitAuthEvent(AuthEvent.LOGIN_SUCCESS, {
  userId: user.id,
  email: user.email,
  organizationId: user.organizationId,
  metadata,
});

return {
        success: true,
        user,
        token,
        refreshToken,
        expiresIn: this.getTokenExpiration(),
      };
} catch (_error)
{
  return { success: false, error: 'Authentication failed' };
}
}

  /**
   * Verify two-factor authentication
   */
  async verifyTwoFactor(
    twoFactorToken: string,
    verification: TwoFactorVerification,
    metadata:
{
  ipAddress: string;
  userAgent: string;
}
): Promise<AuthResult>
{
  try {
    const decoded = jwt.verify(twoFactorToken, this.config.jwtSecret) as any;
    const user = await this.config.database.findUserById(decoded.userId);

    if (!user) {
      return { success: false, error: 'Invalid token' };
    }

    const isValid = verification.backupCode
      ? await this.twoFactorService.verifyBackupCode(user.id, verification.backupCode)
      : await this.twoFactorService.verifyToken(user.id, verification.token);

    if (!isValid) {
      await this.emitAuthEvent(AuthEvent.LOGIN_FAILED, {
        userId: user.id,
        email: user.email,
        metadata: { reason: 'invalid_2fa', ...metadata },
      });
      return { success: false, error: 'Invalid two-factor code' };
    }

    // Generate tokens
    const { token, refreshToken } = await this.generateTokens(user);

    // Update last login
    await this.config.database.updateUser(user.id, {
      lastLoginAt: new Date(),
    });

    await this.emitAuthEvent(AuthEvent.LOGIN_SUCCESS, {
      userId: user.id,
      email: user.email,
      organizationId: user.organizationId,
      metadata,
    });

    return {
        success: true,
        user,
        token,
        refreshToken,
        expiresIn: this.getTokenExpiration(),
      };
  } catch (_error) {
    return { success: false, error: 'Invalid two-factor token' };
  }
}

/**
 * Setup two-factor authentication
 */
async;
setupTwoFactor(userId: string)
: Promise<TwoFactorSetup>
{
  const user = await this.config.database.findUserById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  return this.twoFactorService.setup(user.email);
}

/**
 * Enable two-factor authentication
 */
async;
enableTwoFactor(userId: string, token: string)
: Promise<boolean>
{
    const isValid = await this.twoFactorService.verifyToken(userId, token);
    if (!isValid) {
      return false;
    }
