import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { UserRepository } from "../repositories/UserRepository.js";
import { AppError } from "../../../middleware/errorHandlers.js";
import {
  PermissionService,
  Permission,
} from "../../../services/PermissionService.js";
import { IUser } from "../../../models/User.js";
import { IOrganization } from "../../../models/Organization.js";

export interface RegisterUserData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  role?: string;
  department?: string;
}

export interface UpdateProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  department?: string;
  preferences?: {
    language?: string;
    timezone?: string;
    theme?: "light" | "dark" | "system";
    notifications?: {
      email?: boolean;
      push?: boolean;
      workflow?: boolean;
    };
  };
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
    role: string;
    permissions: string[];
    organizationId?: string;
    department?: string;
    isEmailVerified: boolean;
    lastLogin?: Date;
    preferences: any;
  };
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  expiresAt: string;
  organization?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    features: string[];
  };
}

export interface SSOLoginData {
  provider: "google" | "microsoft" | "okta" | "auth0";
  ssoId: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationSlug?: string;
}

export class AuthService {
  private userRepository: UserRepository;
  private permissionService: PermissionService;

  constructor() {
    this.userRepository = new UserRepository();
    this.permissionService = PermissionService.getInstance();
  }

  /**
   * Generate JWT access token with user context
   */
  private generateToken(user: IUser, organization?: IOrganization): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const permissions = this.permissionService.getEffectivePermissions(
      user.role,
      user.permissions,
    );

    const payload = {
      userId: user._id.toString(),
      email: user.email,
      role: user.role,
      permissions,
      organizationId: user.organizationId,
      isEmailVerified: user.isEmailVerified,
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    } as SignOptions);
  }

  /**
   * Generate refresh token
   */
  private generateRefreshToken(userId: string): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("JWT_SECRET is not defined");
    }

    const payload = {
      userId,
      type: "refresh",
      iat: Math.floor(Date.now() / 1000),
    };

    return jwt.sign(payload, secret, {
      expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "30d",
    } as SignOptions);
  }

  /**
   * Generate email verification token
   */
  private generateEmailVerificationToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    return { token, expires };
  }

  /**
   * Generate password reset token
   */
  private generatePasswordResetToken(): { token: string; expires: Date } {
    const token = crypto.randomBytes(32).toString("hex");
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
    return { token, expires };
  }

  /**
   * Register a new user
   */
  async register(userData: RegisterUserData): Promise<LoginResponse> {
    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError("User already exists with this email", 409);
    }

    // Set default role if not provided
    if (!userData.role) {
      userData.role = "member";
    }

    // Create new user
    const user = await this.userRepository.create(userData);

    // Generate email verification token if email verification is required
    const { token: emailToken, expires: emailExpires } =
      this.generateEmailVerificationToken();
    user.emailVerificationToken = emailToken;
    user.emailVerificationTokenExpires = emailExpires;
    await user.save();

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    // Store refresh token
    user.refreshTokens.push(refreshToken);
    await user.save();

    const permissions = this.permissionService.getEffectivePermissions(
      user.role,
      user.permissions,
    );
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        permissions,
        organizationId: user.organizationId,
        department: user.department,
        isEmailVerified: user.isEmailVerified,
        preferences: user.preferences,
      },
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  /**
   * Login user with enhanced security
   */
  async login(email: string, password: string): Promise<LoginResponse> {
    // Find user and include password
    const user = await this.userRepository.findByEmailWithPassword(email);
    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    // Check if account is locked
    if (user.isLocked()) {
      throw new AppError(
        "Account is temporarily locked due to failed login attempts. Please try again later.",
        423,
      );
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError(
        "Account is deactivated. Please contact your administrator.",
        403,
      );
    }

    // Verify password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // Increment failed login attempts
      await user.incLoginAttempts();
      throw new AppError("Invalid email or password", 401);
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await user.resetLoginAttempts();
    }

    // Update last login
    await this.userRepository.updateLastLogin(user._id);

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    // Store refresh token (limit to 5 active tokens)
    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5); // Keep only last 5 tokens
    }
    await user.save();

    const permissions = this.permissionService.getEffectivePermissions(
      user.role,
      user.permissions,
    );
    const expiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        permissions,
        organizationId: user.organizationId,
        department: user.department,
        isEmailVerified: user.isEmailVerified,
        lastLogin: new Date(),
        preferences: user.preferences,
      },
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string) {
    try {
      const decoded = jwt.verify(
        refreshToken,
        process.env.JWT_SECRET as string,
      ) as any;
      const user = await this.userRepository.findById(decoded.userId);

      if (!user || !user.isActive) {
        throw new AppError("Invalid refresh token", 401);
      }

      const newToken = this.generateToken(user);
      const newRefreshToken = this.generateRefreshToken(user._id.toString());

      return {
        accessToken: newToken,
        refreshToken: newRefreshToken,
        tokenType: "Bearer",
        expiresIn: 7 * 24 * 60 * 60, // 7 days in seconds
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        scope: [],
      };
    } catch (error) {
      throw new AppError("Invalid refresh token", 401);
    }
  }

  /**
   * Get user profile
   */
  async getUserProfile(userId: string) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    return {
      id: user._id.toString(),
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      role: user.role,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
    };
  }

  /**
   * Update user profile
   */
  async updateProfile(userId: string, updateData: UpdateProfileData) {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    const updatedUser = await this.userRepository.updateProfile(
      userId,
      updateData,
    );

    return {
      id: updatedUser._id.toString(),
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      fullName: updatedUser.fullName,
      role: updatedUser.role,
    };
  }

  /**
   * Change user password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.userRepository.findByIdWithPassword(userId);
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw new AppError("Current password is incorrect", 400);
    }

    await this.userRepository.updatePassword(userId, newPassword);
  }

  /**
   * SSO Login - Create or login user via SSO provider
   */
  async ssoLogin(ssoData: SSOLoginData): Promise<LoginResponse> {
    // Find user by SSO ID and provider
    let user = await this.userRepository.findBySSOId(
      ssoData.provider,
      ssoData.ssoId,
    );

    if (!user) {
      // Find user by email to link existing account
      user = await this.userRepository.findByEmail(ssoData.email);

      if (user) {
        // Link existing account to SSO
        user.ssoProvider = ssoData.provider;
        user.ssoId = ssoData.ssoId;
        user.isEmailVerified = true; // SSO emails are pre-verified
        await user.save();
      } else {
        // Create new user from SSO data
        const userData: RegisterUserData = {
          email: ssoData.email,
          password: crypto.randomBytes(32).toString("hex"), // Random password for SSO users
          firstName: ssoData.firstName,
          lastName: ssoData.lastName,
          role: "member",
        };

        user = await this.userRepository.create(userData);
        user.ssoProvider = ssoData.provider;
        user.ssoId = ssoData.ssoId;
        user.isEmailVerified = true;
        await user.save();
      }
    }

    // Check if account is active
    if (!user.isActive) {
      throw new AppError(
        "Account is deactivated. Please contact your administrator.",
        403,
      );
    }

    // Update last login
    await this.userRepository.updateLastLogin(user._id);

    // Generate tokens
    const accessToken = this.generateToken(user);
    const refreshToken = this.generateRefreshToken(user._id.toString());

    // Store refresh token
    user.refreshTokens.push(refreshToken);
    if (user.refreshTokens.length > 5) {
      user.refreshTokens = user.refreshTokens.slice(-5);
    }
    await user.save();

    const permissions = this.permissionService.getEffectivePermissions(
      user.role,
      user.permissions,
    );
    const expiresIn = 7 * 24 * 60 * 60;

    return {
      user: {
        id: user._id.toString(),
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
        role: user.role,
        permissions,
        organizationId: user.organizationId,
        department: user.department,
        isEmailVerified: user.isEmailVerified,
        lastLogin: new Date(),
        preferences: user.preferences,
      },
      accessToken,
      refreshToken,
      tokenType: "Bearer",
      expiresIn,
      expiresAt: new Date(Date.now() + expiresIn * 1000).toISOString(),
    };
  }

  /**
   * Verify email address
   */
  async verifyEmail(token: string): Promise<void> {
    const user = await this.userRepository.findByEmailVerificationToken(token);

    if (
      !user ||
      !user.emailVerificationTokenExpires ||
      user.emailVerificationTokenExpires < new Date()
    ) {
      throw new AppError("Invalid or expired verification token", 400);
    }

    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationTokenExpires = undefined;
    await user.save();
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(email: string): Promise<void> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      // Don't reveal that user doesn't exist
      return;
    }

    const { token, expires } = this.generatePasswordResetToken();
    user.passwordResetToken = token;
    user.passwordResetTokenExpires = expires;
    await user.save();

    // TODO: Send password reset email
    console.log(`Password reset token for ${email}: ${token}`);
  }

  /**
   * Reset password with token
   */
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userRepository.findByPasswordResetToken(token);

    if (
      !user ||
      !user.passwordResetTokenExpires ||
      user.passwordResetTokenExpires < new Date()
    ) {
      throw new AppError("Invalid or expired reset token", 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetTokenExpires = undefined;
    user.refreshTokens = []; // Invalidate all refresh tokens
    await user.save();
  }

  /**
   * Logout user (invalidate refresh token)
   */
  async logout(userId: string, refreshToken: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (user) {
      user.refreshTokens = user.refreshTokens.filter(
        (token) => token !== refreshToken,
      );
      await user.save();
    }
  }

  /**
   * Logout from all devices (invalidate all refresh tokens)
   */
  async logoutAll(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (user) {
      user.refreshTokens = [];
      await user.save();
    }
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(
    userId: string,
    permission: Permission,
  ): Promise<boolean> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return false;
    }

    return this.permissionService.canAccessResource(
      user.role,
      user.permissions,
      permission,
    );
  }

  /**
   * Get user's effective permissions
   */
  async getUserPermissions(userId: string): Promise<Permission[]> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      return [];
    }

    return this.permissionService.getEffectivePermissions(
      user.role,
      user.permissions,
    );
  }

  /**
   * Update user permissions (admin only)
   */
  async updateUserPermissions(
    userId: string,
    permissions: string[],
  ): Promise<void> {
    const validPermissions = permissions.filter((p) =>
      this.permissionService.isValidPermission(p),
    );
    await this.userRepository.updatePermissions(userId, validPermissions);
  }

  /**
   * Deactivate user account
   */
  async deactivateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.isActive = false;
    user.refreshTokens = []; // Invalidate all sessions
    await user.save();
  }

  /**
   * Reactivate user account
   */
  async reactivateUser(userId: string): Promise<void> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new AppError("User not found", 404);
    }

    user.isActive = true;
    user.failedLoginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }
}
