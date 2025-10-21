import { randomBytes } from 'node:crypto';
import type { DatabaseService } from '@reporunner/backend/database';
import {
  AUTH,
  ERROR_CODES,
  type ILoginRequest,
  type ILoginResponse,
  type IRegisterRequest,
  type IUser,
  UserRole,
} from '@reporunner/shared';
import bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import type { TokenManager } from '../jwt/token-manager';
import { PermissionEngine } from '../rbac/permission-engine';

export interface AuthServiceConfig {
  database: DatabaseService;
  tokenManager: TokenManager;
  emailService?: { sendEmail: (to: string, subject: string, body: string) => Promise<void> };
}

export interface RegisterUserData extends IRegisterRequest {
  organizationId?: string;
  role?: UserRole;
}

export interface SSOLoginData {
  provider: 'google' | 'microsoft' | 'okta' | 'auth0';
  ssoId: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationSlug?: string;
}

export class AuthService {
  private db: DatabaseService;
  private tokenManager: TokenManager;
  private emailService: {
    sendEmail: (to: string, subject: string, body: string) => Promise<void>;
  } | null;

  constructor(config: AuthServiceConfig) {
    this.db = config.database;
    this.tokenManager = config.tokenManager;
    this.emailService = config.emailService;
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterUserData): Promise<ILoginResponse> {
    try {
      // Check if user already exists
      const existingUser = await this.db.mongo.users.findOne({
        email: userData.email.toLowerCase(),
      });
      if (existingUser) {
        throw new AuthError(
          'User already exists with this email',
          ERROR_CODES.RESOURCE_ALREADY_EXISTS
        );
      }

      // Generate user ID
      const userId = uuidv4();

      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, AUTH.PASSWORD_SALT_ROUNDS);

      // Get default role and permissions
      const role = userData.role || UserRole.VIEWER;
      const permissions = PermissionEngine.getRolePermissions(role);

      // Create user document
      const newUser: IUser = {
        id: userId,
        email: userData.email.toLowerCase(),
        firstName: userData.firstName,
        lastName: userData.lastName,
        role,
        permissions,
        organizationId: userData.organizationId || uuidv4(),
        isActive: true,
        isEmailVerified: false,
        mfaEnabled: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Save user to database with password in a separate field
      await this.db.mongo.users.insertOne({
        ...newUser,
        password: hashedPassword,
        emailVerificationToken: this.generateVerificationToken(),
        emailVerificationExpires: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      });

      // Generate session ID
      const sessionId = uuidv4();

      // Generate tokens
      const tokenPair = await this.tokenManager.generateTokenPair(newUser, sessionId);

      // Save session
      await this.saveSession(userId, sessionId, tokenPair.refreshToken);

      // Send verification email (async, don't wait)
      this.sendVerificationEmail(newUser.email, newUser.firstName);

      // Log analytics event
      await this.db.postgres.logEvent('user.registered', userId, {
        email: newUser.email,
        role: newUser.role,
      });

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        user: newUser,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Registration failed', ERROR_CODES.SYSTEM_ERROR);
    }
  }

  /**
   * Login user
   */
  async login(credentials: ILoginRequest): Promise<ILoginResponse> {
    try {
      // Find user with password field
      const userDoc = await this.db.mongo.users.findOne(
        { email: credentials.email.toLowerCase() },
        { projection: { password: 1 } }
      );

      if (!userDoc) {
        throw new AuthError('Invalid credentials', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(credentials.password, userDoc.password);
      if (!isValidPassword) {
        // Increment login attempts
        await this.incrementLoginAttempts(userDoc.id);
        throw new AuthError('Invalid credentials', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
      }

      // Get full user data (without password)
      const user = (await this.db.mongo.users.findOne(
        { id: userDoc.id },
        { projection: { password: 0 } }
      )) as IUser;

      // Check if account is locked
      if (userDoc.lockUntil && userDoc.lockUntil > new Date()) {
        throw new AuthError('Account is temporarily locked', ERROR_CODES.AUTH_ACCOUNT_LOCKED);
      }

      // Check if email is verified (if required)
      if (!user.isEmailVerified && process.env.REQUIRE_EMAIL_VERIFICATION === 'true') {
        throw new AuthError('Please verify your email first', ERROR_CODES.AUTH_EMAIL_NOT_VERIFIED);
      }

      // Check if MFA is required
      if (user.mfaEnabled && !credentials.mfaCode) {
        throw new AuthError('MFA code required', ERROR_CODES.AUTH_MFA_REQUIRED);
      }

      // Verify MFA if provided
      if (user.mfaEnabled && credentials.mfaCode) {
        const isValidMFA = await this.verifyMFACode(user.id, credentials.mfaCode);
        if (!isValidMFA) {
          throw new AuthError('Invalid MFA code', ERROR_CODES.AUTH_MFA_INVALID);
        }
      }

      // Generate session ID
      const sessionId = uuidv4();

      // Generate tokens
      const tokenPair = await this.tokenManager.generateTokenPair(user, sessionId);

      // Reset login attempts
      await this.resetLoginAttempts(user.id);

      // Update last login
      await this.db.mongo.users.updateOne(
        { id: user.id },
        {
          $set: {
            lastLogin: new Date(),
            loginAttempts: 0,
            lockUntil: null,
          },
        }
      );

      // Save session
      await this.saveSession(user.id, sessionId, tokenPair.refreshToken);

      // Log analytics event
      await this.db.postgres.logEvent('user.login', user.id, {
        email: user.email,
        method: 'password',
      });

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        user,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Login failed', ERROR_CODES.SYSTEM_ERROR);
    }
  }

  /**
   * SSO Login
   */
  async ssoLogin(ssoData: SSOLoginData): Promise<ILoginResponse> {
    try {
      // Find or create user from SSO data
      let user = (await this.db.mongo.users.findOne({
        email: ssoData.email.toLowerCase(),
      })) as IUser;

      if (!user) {
        // Create new user from SSO
        const userId = uuidv4();
        const role = UserRole.VIEWER;
        const permissions = PermissionEngine.getRolePermissions(role);

        user = {
          id: userId,
          email: ssoData.email.toLowerCase(),
          firstName: ssoData.firstName,
          lastName: ssoData.lastName,
          role,
          permissions,
          organizationId: uuidv4(), // Create new org or find by slug
          isActive: true,
          isEmailVerified: true, // SSO emails are pre-verified
          mfaEnabled: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        // Save with SSO provider info
        await this.db.mongo.users.insertOne({
          ...user,
          ssoProvider: ssoData.provider,
          ssoId: ssoData.ssoId,
        });
      } else {
        // Update SSO info if needed
        await this.db.mongo.users.updateOne(
          { id: user.id },
          {
            $set: {
              ssoProvider: ssoData.provider,
              ssoId: ssoData.ssoId,
              lastLogin: new Date(),
            },
          }
        );
      }

      // Generate session and tokens
      const sessionId = uuidv4();
      const tokenPair = await this.tokenManager.generateTokenPair(user, sessionId);

      // Save session
      await this.saveSession(user.id, sessionId, tokenPair.refreshToken);

      // Log event
      await this.db.postgres.logEvent('user.login', user.id, {
        email: user.email,
        method: 'sso',
        provider: ssoData.provider,
      });

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        user,
      };
    } catch (_error) {
      throw new AuthError('SSO login failed', ERROR_CODES.AUTH_INVALID_CREDENTIALS);
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<ILoginResponse> {
    try {
      // Get user from refresh token
      const session = await this.getSessionByRefreshToken(refreshToken);
      if (!session) {
        throw new AuthError('Invalid refresh token', ERROR_CODES.AUTH_TOKEN_INVALID);
      }

      // Get user
      const user = (await this.db.mongo.users.findOne({
        id: session.userId,
      })) as IUser;
      if (!user) {
        throw new AuthError('User not found', ERROR_CODES.RESOURCE_NOT_FOUND);
      }

      // Rotate tokens
      const tokenPair = await this.tokenManager.refreshTokenRotation(refreshToken, user);

      // Update session with new refresh token
      await this.updateSessionRefreshToken(session.id, tokenPair.refreshToken);

      return {
        accessToken: tokenPair.accessToken,
        refreshToken: tokenPair.refreshToken,
        expiresIn: tokenPair.expiresIn,
        user,
      };
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Token refresh failed', ERROR_CODES.AUTH_TOKEN_INVALID);
    }
  }

  /**
   * Logout user
   */
  async logout(userId: string, sessionId: string): Promise<void> {
    try {
      // Revoke session
      this.tokenManager.revokeSession(sessionId);

      // Remove session from database
      await this.db.mongo.db.collection('sessions').deleteOne({
        userId,
        sessionId,
      });

      // Log event
      await this.db.postgres.logEvent('user.logout', userId, { sessionId });
    } catch (_error) {
      throw new AuthError('Logout failed', ERROR_CODES.SYSTEM_ERROR);
    }
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    try {
      const user = await this.db.mongo.users.findOne({
        email: email.toLowerCase(),
      });

      if (!user) {
        // Don't reveal if user exists
        return;
      }

      // Generate reset token
      const resetToken = this.generateVerificationToken();
      const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      // Save reset token
      await this.db.mongo.users.updateOne(
        { id: user.id },
        {
          $set: {
            passwordResetToken: resetToken,
            passwordResetExpires: resetExpires,
          },
        }
      );

      // Send reset email
      await this.sendPasswordResetEmail(user.email, user.firstName, resetToken);
    } catch (_error) {
      // Ignore email sending errors for password reset
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      // Find user with valid reset token
      const user = await this.db.mongo.users.findOne({
        passwordResetToken: token,
        passwordResetExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new AuthError('Invalid or expired reset token', ERROR_CODES.AUTH_TOKEN_INVALID);
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, AUTH.PASSWORD_SALT_ROUNDS);

      // Update password and clear reset token
      await this.db.mongo.users.updateOne(
        { id: user.id },
        {
          $set: {
            password: hashedPassword,
            passwordChangedAt: new Date(),
          },
          $unset: {
            passwordResetToken: 1,
            passwordResetExpires: 1,
          },
        }
      );

      // Revoke all existing sessions
      await this.revokeAllUserSessions(user.id);

      // Log event
      await this.db.postgres.logEvent('user.password_reset', user.id, {});
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Password reset failed', ERROR_CODES.SYSTEM_ERROR);
    }
  }

  /**
   * Verify email with token
   */
  async verifyEmail(token: string): Promise<void> {
    try {
      const user = await this.db.mongo.users.findOne({
        emailVerificationToken: token,
        emailVerificationExpires: { $gt: new Date() },
      });

      if (!user) {
        throw new AuthError(
          'Invalid or expired verification token',
          ERROR_CODES.AUTH_TOKEN_INVALID
        );
      }

      // Mark email as verified
      await this.db.mongo.users.updateOne(
        { id: user.id },
        {
          $set: {
            isEmailVerified: true,
            emailVerifiedAt: new Date(),
          },
          $unset: {
            emailVerificationToken: 1,
            emailVerificationExpires: 1,
          },
        }
      );

      // Log event
      await this.db.postgres.logEvent('user.email_verified', user.id, {});
    } catch (error) {
      if (error instanceof AuthError) {
        throw error;
      }
      throw new AuthError('Email verification failed', ERROR_CODES.SYSTEM_ERROR);
    }
  }

  // Helper methods
  private generateVerificationToken(): string {
    return randomBytes(32).toString('hex');
  }

  private async saveSession(
    userId: string,
    sessionId: string,
    refreshToken: string
  ): Promise<void> {
    await this.db.mongo.db.collection('sessions').insertOne({
      id: sessionId,
      userId,
      refreshToken,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
    });
  }

  private async getSessionByRefreshToken(
    refreshToken: string
  ): Promise<{ userId: string; refreshToken: string } | null> {
    return await this.db.mongo.db.collection('sessions').findOne({ refreshToken });
  }

  private async updateSessionRefreshToken(
    sessionId: string,
    newRefreshToken: string
  ): Promise<void> {
    await this.db.mongo.db
      .collection('sessions')
      .updateOne(
        { id: sessionId },
        { $set: { refreshToken: newRefreshToken, updatedAt: new Date() } }
      );
  }

  private async revokeAllUserSessions(userId: string): Promise<void> {
    await this.db.mongo.db.collection('sessions').deleteMany({ userId });
  }

  private async incrementLoginAttempts(userId: string): Promise<void> {
    const result = await this.db.mongo.users.findOneAndUpdate(
      { id: userId },
      { $inc: { loginAttempts: 1 } },
      { returnDocument: 'after' }
    );

    if (result && result.loginAttempts >= AUTH.MAX_LOGIN_ATTEMPTS) {
      await this.db.mongo.users.updateOne(
        { id: userId },
        { $set: { lockUntil: new Date(Date.now() + AUTH.LOCK_TIME) } }
      );
    }
  }

  private async resetLoginAttempts(userId: string): Promise<void> {
    await this.db.mongo.users.updateOne(
      { id: userId },
      {
        $set: { loginAttempts: 0 },
        $unset: { lockUntil: 1 },
      }
    );
  }

  private async verifyMFACode(_userId: string, _code: string): Promise<boolean> {
    // TODO: Implement MFA verification (TOTP, SMS, etc.)
    return true;
  }

  private async sendVerificationEmail(email: string, firstName: string): Promise<void> {
    // TODO: Implement email sending
    if (this.emailService) {
      await this.emailService.sendVerificationEmail(email, firstName);
    }
  }

  private async sendPasswordResetEmail(
    email: string,
    firstName: string,
    token: string
  ): Promise<void> {
    // TODO: Implement email sending
    if (this.emailService) {
      await this.emailService.sendPasswordResetEmail(email, firstName, token);
    }
  }
}

// Custom error class
export class AuthError extends Error {
  constructor(
    message: string,
    public code: number,
    public statusCode: number = 401
  ) {
    super(message);
    this.name = 'AuthError';
  }
}

export default AuthService;
