import bcrypt from 'bcryptjs';
import { EventEmitter } from 'events';
import jwt from 'jsonwebtoken';
import {
  type AuthCredentials,
  AuthEvent,
  type AuthEventData,
  type AuthResult,
  type JWTPayload,
  type SecuritySettings,
  type TwoFactorSetup,
  type TwoFactorVerification,
  type User,
} from './types';
import { AuditLogger } from './utils/audit-logger';
import { PasswordValidator } from './utils/password-validator';
import { TwoFactorService } from './utils/two-factor';

export interface AuthManagerConfig {
  jwtSecret: string;
  jwtRefreshSecret: string;
  tokenExpiration: string;
  refreshTokenExpiration: string;
  security: SecuritySettings;
  database: {
    findUserByEmail: (email: string) => Promise<User | null>;
    findUserById: (id: string) => Promise<User | null>;
    updateUser: (id: string, data: Partial<User>) => Promise<User>;
    createUser: (data: Omit<User, 'id' | 'createdAt' | 'updatedAt'>) => Promise<User>;
  };
}

export class AuthManager extends EventEmitter {
  private config: AuthManagerConfig;
  private twoFactorService: TwoFactorService;
  private auditLogger: AuditLogger;
  private passwordValidator: PasswordValidator;

  constructor(config: AuthManagerConfig) {
    super();
    this.config = config;
    this.twoFactorService = new TwoFactorService();
    this.auditLogger = new AuditLogger();
    this.passwordValidator = new PasswordValidator(config.security.passwordPolicy);
  }

  /**
   * Authenticate user with email and password
   */
  async authenticate(
    credentials: AuthCredentials,
    metadata: { ipAddress: string; userAgent: string }
  ): Promise<AuthResult> {
    try {
      const user = await this.config.database.findUserByEmail(credentials.email);

      if (!user) {
        await this.emitAuthEvent(AuthEvent.LOGIN_FAILED, {
          email: credentials.email,
          metadata: { reason: 'user_not_found', ...metadata },
        });
        return { success: false, error: 'Invalid credentials' };
      }

      if (!user.isActive) {
        await this.emitAuthEvent(AuthEvent.LOGIN_FAILED, {
          userId: user.id,
          email: user.email,
          metadata: { reason: 'account_inactive', ...metadata },
        });
        return { success: false, error: 'Account is inactive' };
      }

      // Verify password (assuming it's stored hashed)
      const isValidPassword = await bcrypt.compare(credentials.password, user.password as string);

      if (!isValidPassword) {
        await this.emitAuthEvent(AuthEvent.LOGIN_FAILED, {
          userId: user.id,
          email: user.email,
          metadata: { reason: 'invalid_password', ...metadata },
        });
        return { success: false, error: 'Invalid credentials' };
      }

      // Check if 2FA is required
      if (user.twoFactorEnabled) {
        const twoFactorToken = this.generateTwoFactorToken(user.id);
        return {
          success: false,
          requiresTwoFactor: true,
          twoFactorToken,
          error: 'Two-factor authentication required',
        };
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
    } catch (error) {
      console.error('Authentication error:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Verify two-factor authentication
   */
  async verifyTwoFactor(
    twoFactorToken: string,
    verification: TwoFactorVerification,
    metadata: { ipAddress: string; userAgent: string }
  ): Promise<AuthResult> {
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
    } catch (error) {
      return { success: false, error: 'Invalid two-factor token' };
    }
  }

  /**
   * Setup two-factor authentication
   */
  async setupTwoFactor(userId: string): Promise<TwoFactorSetup> {
    const user = await this.config.database.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    return this.twoFactorService.setup(user.email);
  }

  /**
   * Enable two-factor authentication
   */
  async enableTwoFactor(userId: string, token: string): Promise<boolean> {
    const isValid = await this.twoFactorService.verifyToken(userId, token);
    if (!isValid) {
      return false;
    }

    await this.config.database.updateUser(userId, {
      twoFactorEnabled: true,
    });

    await this.emitAuthEvent(AuthEvent.TWO_FACTOR_ENABLED, { userId });
    return true;
  }

  /**
   * Verify JWT token
   */
  async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, this.config.jwtSecret) as JWTPayload;

      if (decoded.type !== 'access') {
        return null;
      }

      const user = await this.config.database.findUserById(decoded.sub);
      return user && user.isActive ? user : null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<{ token: string } | null> {
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
    } catch (error) {
      return null;
    }
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<boolean> {
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
    } catch (error) {
      console.error('Password change error:', error);
      return false;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(user: User): Promise<{ token: string; refreshToken: string }> {
    const token = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);
    return { token, refreshToken };
  }

  /**
   * Generate access token
   */
  private generateAccessToken(user: User): string {
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
  private generateRefreshToken(user: User): string {
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
  private generateTwoFactorToken(userId: string): string {
    return jwt.sign({ userId, type: '2fa' }, this.config.jwtSecret, { expiresIn: '5m' });
  }

  /**
   * Get token expiration in seconds
   */
  private getTokenExpiration(): number {
    return parseInt(this.config.tokenExpiration) || 3600; // 1 hour default
  }

  /**
   * Get refresh token expiration in seconds
   */
  private getRefreshTokenExpiration(): number {
    return parseInt(this.config.refreshTokenExpiration) || 604800; // 7 days default
  }

  /**
   * Emit authentication event
   */
  private async emitAuthEvent(event: AuthEvent, data: Partial<AuthEventData>): Promise<void> {
    const eventData: AuthEventData = {
      event,
      timestamp: new Date(),
      ...data,
    };

    this.emit('auth:event', eventData);
    await this.auditLogger.log(eventData);
  }
}
