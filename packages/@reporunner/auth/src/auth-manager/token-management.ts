await this.config.database.updateUser(userId, {
  twoFactorEnabled: true,
});

await this.emitAuthEvent(AuthEvent.TWO_FACTOR_ENABLED, { userId });
return true;
}

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<User | null>
{
  try {
    const decoded = jwt.verify(token, this.config.jwtSecret) as JWTPayload;

    if (decoded.type !== 'access') {
      return null;
    }

    const user = await this.config.database.findUserById(decoded.sub);
    return user?.isActive ? user : null;
  } catch (_error) {
    return null;
  }
}

/**
 * Refresh access token
 */
async;
refreshToken(refreshToken: string)
: Promise<
{
  token: string;
}
| null>
{
  try {
    const decoded = jwt.verify(refreshToken, this.config.jwtRefreshSecret) as JWTPayload;

    if (decoded.type !== 'refresh') {
      return null;
    }

    const user = await this.config.database.findUserById(decoded.sub);
    if (!user || !user.isActive) {
      return null;
    }

    const token = this.generateAccessToken(user);
    return { token };
  } catch (_error) {
    return null;
  }
}

/**
 * Change user password
 */
async;
changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  )
: Promise<boolean>
{
  try {
    const user = await this.config.database.findUserById(userId);
    if (!user) {
      return false;
    }

    // Verify current password
    const isValidCurrent = await bcrypt.compare(currentPassword, user.password as string);
    if (!isValidCurrent) {
      return false;
    }

    // Validate new password
    const passwordValidation = this.passwordValidator.validate(newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(`Password validation failed: ${passwordValidation.errors.join(', ')}`);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await this.config.database.updateUser(userId, {
      password: hashedPassword,
    } as any);

    await this.emitAuthEvent(AuthEvent.PASSWORD_CHANGED, { userId });
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Generate access and refresh tokens
 */
private
async;
generateTokens(user: User)
: Promise<
{
  token: string;
  refreshToken: string;
}
>
{
  const token = this.generateAccessToken(user);
  const refreshToken = this.generateRefreshToken(user);
  return { token, refreshToken };
}

/**
   * Generate access token
