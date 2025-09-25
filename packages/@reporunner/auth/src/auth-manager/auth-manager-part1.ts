import { EventEmitter } from 'node:events';
import bcrypt from 'bcryptjs';
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
