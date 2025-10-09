import { z } from 'zod';
import type {
  ApiKey,
  AuthTokens,
  ChangePasswordRequest,
  CreateApiKeyRequest,
  LoginCredentials,
  LoginResponse,
  MfaSetupRequest,
  MfaVerifyRequest,
  PasswordResetConfirm,
  RegisterRequest,
  SessionInfo,
  UpdateProfileRequest,
  UserProfile,
} from '../schemas';
import {
  ApiKeyApiResponseSchema,
  ApiKeyListApiResponseSchema,
  ApiResponseSchema,
  AuthTokensApiResponseSchema,
  EmailVerificationResponseSchema,
  LoginApiResponseSchema,
  LogoutResponseSchema,
  PasswordResetResponseSchema,
  SessionInfoApiResponseSchema,
} from '../schemas';
import { configService } from '../services/ConfigService';
import { ApiErrorHandler } from '../utils/apiErrorHandler';
import { ApiClientError, apiClient } from './ApiClient';

/**
 * Type-safe Authentication API Service
 *
 * Handles all authentication operations with full type safety
 * Supports login, registration, password management, MFA, API keys, and session management
 */
export class AuthApiService {
  // ==========================================
  // PRIVATE HELPER METHODS
  // ==========================================

  /**
   * Transform user data from backend response to UserProfile
   */
  private transformUserProfile(userData: any): UserProfile {
    return {
      id: userData.id,
      email: userData.email,
      firstName: userData.firstName,
      lastName: userData.lastName,
      role: userData.role,
      fullName: userData.fullName,
      lastLogin: userData.lastLogin, // Backend uses lastLogin
      avatar: userData.avatar,
      timezone: userData.timezone,
      preferences: userData.preferences,
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt,
      lastLoginAt: userData.lastLoginAt || userData.lastLogin, // Map lastLogin to lastLoginAt
      isActive: userData.isActive ?? true,
      isEmailVerified: userData.isEmailVerified ?? false,
    };
  }
  // ==========================================
  // AUTHENTICATION OPERATIONS
  // ==========================================

  /**
   * Authenticate user with email and password
   */
  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const result = await ApiErrorHandler.withErrorHandling(
      async () => {
        const response: any = await apiClient.post('/auth/login', credentials, LoginApiResponseSchema as any);

        // Store tokens in localStorage
        if (response.token) {
          localStorage.setItem(configService.get('auth').tokenKey, response.token);
        }
        if (response.refreshToken) {
          localStorage.setItem(configService.get('auth').refreshTokenKey, response.refreshToken);
        }

        return response;
      },
      'AuthApiService.login',
      { showToast: true }
    );

    if (!result.success) {
      throw new ApiClientError(result.error.message, result.error.statusCode || 0, 'LOGIN_ERROR');
    }

    return result.data as LoginResponse;
  }

  /**
   * Register new user account
   */
  async register(userData: RegisterRequest): Promise<LoginResponse> {
    try {
      const response: any = await apiClient.post('/auth/register', userData, LoginApiResponseSchema as any);

      // Store tokens in localStorage
      if (response.token) {
        localStorage.setItem(configService.get('auth').tokenKey, response.token);
      }
      if (response.refreshToken) {
        localStorage.setItem(configService.get('auth').refreshTokenKey, response.refreshToken);
      }

      return response as LoginResponse;
    } catch (error) {
      throw new ApiClientError('Registration failed', 0, 'REGISTRATION_ERROR', error);
    }
  }

  /**
   * Logout current user
   */
  async logout(): Promise<{ message: string; sessionId: string }> {
    try {
      const response = await apiClient.post('/auth/logout', {}, LogoutResponseSchema as any);

      // Clear stored tokens
      this.clearAuthData();

      return response as { message: string; sessionId: string };
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      this.clearAuthData();

      throw new ApiClientError('Logout failed', 0, 'LOGOUT_ERROR', error);
    }
  }

  /**
   * Refresh authentication tokens
   */
  async refreshTokens(refreshToken?: string): Promise<AuthTokens> {
    try {
      const token = refreshToken || localStorage.getItem(configService.get('auth').refreshTokenKey);
      if (!token) {
        throw new ApiClientError('No refresh token available', 401, 'NO_REFRESH_TOKEN');
      }

      const response: any = await apiClient.post(
        '/auth/refresh',
        { refreshToken: token },
        AuthTokensApiResponseSchema as any
      );

      // Update stored tokens
      localStorage.setItem(configService.get('auth').tokenKey, response.accessToken);
      if (response.refreshToken) {
        localStorage.setItem(configService.get('auth').refreshTokenKey, response.refreshToken);
      }

      return response as AuthTokens;
    } catch (error) {
      // If refresh fails, clear tokens and throw error
      this.clearAuthData();

      throw new ApiClientError('Token refresh failed', 401, 'TOKEN_REFRESH_ERROR', error);
    }
  }

  // ==========================================
  // PASSWORD MANAGEMENT
  // ==========================================

  /**
   * Request password reset email
   */
  async requestPasswordReset(email: string): Promise<{ message: string; email: string }> {
    try {
      return await apiClient.post(
        '/auth/password/reset-request',
        { email },
        PasswordResetResponseSchema as any
      );
    } catch (error) {
      throw new ApiClientError(
        'Password reset request failed',
        0,
        'PASSWORD_RESET_REQUEST_ERROR',
        error
      );
    }
  }

  /**
   * Confirm password reset with token
   */
  async confirmPasswordReset(resetData: PasswordResetConfirm): Promise<{ message: string }> {
    try {
      return await apiClient.post(
        '/auth/password/reset-confirm',
        resetData,
        ApiResponseSchema(z.object({ message: z.string() })) as any
      );
    } catch (error) {
      throw new ApiClientError(
        'Password reset confirmation failed',
        0,
        'PASSWORD_RESET_CONFIRM_ERROR',
        error
      );
    }
  }

  /**
   * Change password for authenticated user
   */
  async changePassword(passwordData: ChangePasswordRequest): Promise<{ message: string }> {
    try {
      return await apiClient.post(
        '/auth/password/change',
        passwordData,
        ApiResponseSchema(z.object({ message: z.string() })) as any
      );
    } catch (error) {
      throw new ApiClientError('Password change failed', 0, 'PASSWORD_CHANGE_ERROR', error);
    }
  }

  // ==========================================
  // USER PROFILE MANAGEMENT
  // ==========================================

  /**
   * Get current user profile
   */
  async getProfile(): Promise<UserProfile> {
    try {
      // Use raw API call since backend returns nested { data: { user: UserProfile } }
      const response = await apiClient.raw({
        method: 'GET',
        url: '/auth/profile',
      });

      // Backend returns: { success, data: { user: UserProfile } }
      // Extract user from nested structure
      const responseData = response.data as any;
      const userData = responseData.data?.user || responseData.user;

      if (!userData) {
        throw new ApiClientError('Invalid profile response structure', 422, 'INVALID_RESPONSE');
      }

      // Transform and validate the user data
      return this.transformUserProfile(userData);
    } catch (error) {
      throw new ApiClientError('Failed to fetch user profile', 0, 'PROFILE_FETCH_ERROR', error);
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(updates: UpdateProfileRequest): Promise<UserProfile> {
    try {
      // Use raw API call since backend returns nested { data: { user: UserProfile } }
      const response = await apiClient.raw({
        method: 'PUT',
        url: '/auth/profile',
        data: updates,
      });

      // Backend returns: { success, data: { user: UserProfile } }
      // Extract user from nested structure
      const responseData = response.data as any;
      const userData = responseData.data?.user || responseData.user;

      if (!userData) {
        throw new ApiClientError('Invalid profile response structure', 422, 'INVALID_RESPONSE');
      }

      // Transform and validate the user data
      return this.transformUserProfile(userData);
    } catch (error) {
      throw new ApiClientError('Failed to update profile', 0, 'PROFILE_UPDATE_ERROR', error);
    }
  }

  /**
   * Upload profile avatar
   */
  async uploadAvatar(file: File): Promise<{ avatarUrl: string }> {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      const response = await apiClient.raw({
        method: 'POST',
        url: '/auth/profile/avatar',
        data: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      return response.data as { avatarUrl: string };
    } catch (error) {
      throw new ApiClientError('Failed to upload avatar', 0, 'AVATAR_UPLOAD_ERROR', error);
    }
  }

  // ==========================================
  // EMAIL VERIFICATION
  // ==========================================

  /**
   * Request email verification
   */
  async requestEmailVerification(): Promise<{
    message: string;
    emailSent: boolean;
  }> {
    try {
      return await apiClient.post(
        '/auth/email/verify-request',
        {},
        EmailVerificationResponseSchema as any
      );
    } catch (error) {
      throw new ApiClientError(
        'Email verification request failed',
        0,
        'EMAIL_VERIFICATION_REQUEST_ERROR',
        error
      );
    }
  }

  /**
   * Confirm email verification with token
   */
  async confirmEmailVerification(token: string): Promise<{ message: string }> {
    try {
      return await apiClient.post(
        '/auth/email/verify-confirm',
        { token },
        ApiResponseSchema(z.object({ message: z.string() })) as any
      );
    } catch (error) {
      throw new ApiClientError(
        'Email verification confirmation failed',
        0,
        'EMAIL_VERIFICATION_CONFIRM_ERROR',
        error
      );
    }
  }

  // ==========================================
  // SESSION MANAGEMENT
  // ==========================================

  /**
   * Get current session information
   */
  async getSessionInfo(): Promise<SessionInfo> {
    try {
      return await apiClient.get('/auth/session', SessionInfoApiResponseSchema as any);
    } catch (error) {
      throw new ApiClientError(
        'Failed to fetch session information',
        0,
        'SESSION_INFO_ERROR',
        error
      );
    }
  }

  /**
   * Get all active sessions for current user
   */
  async getActiveSessions(): Promise<SessionInfo[]> {
    try {
      return await apiClient.get(
        '/auth/sessions',
        ApiResponseSchema(z.array(z.any())) as any // Use any for now to avoid circular refs
      );
    } catch (error) {
      throw new ApiClientError(
        'Failed to fetch active sessions',
        0,
        'ACTIVE_SESSIONS_ERROR',
        error
      );
    }
  }

  /**
   * Revoke a specific session
   */
  async revokeSession(sessionId: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete(
        `/auth/sessions/${sessionId}`,
        ApiResponseSchema(z.object({ message: z.string() })) as any
      );
    } catch (error) {
      throw new ApiClientError(
        `Failed to revoke session ${sessionId}`,
        0,
        'SESSION_REVOKE_ERROR',
        error
      );
    }
  }

  // ==========================================
  // API KEY MANAGEMENT
  // ==========================================

  /**
   * Get user's API keys
   */
  async getApiKeys(): Promise<ApiKey[]> {
    try {
      return await apiClient.get('/auth/api-keys', ApiKeyListApiResponseSchema as any);
    } catch (error) {
      throw new ApiClientError('Failed to fetch API keys', 0, 'API_KEYS_FETCH_ERROR', error);
    }
  }

  /**
   * Create new API key
   */
  async createApiKey(keyData: CreateApiKeyRequest): Promise<ApiKey> {
    try {
      return await apiClient.post('/auth/api-keys', keyData, ApiKeyApiResponseSchema as any);
    } catch (error) {
      throw new ApiClientError('Failed to create API key', 0, 'API_KEY_CREATE_ERROR', error);
    }
  }

  /**
   * Revoke an API key
   */
  async revokeApiKey(keyId: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete(
        `/auth/api-keys/${keyId}`,
        ApiResponseSchema(z.object({ message: z.string() })) as any
      );
    } catch (error) {
      throw new ApiClientError(
        `Failed to revoke API key ${keyId}`,
        0,
        'API_KEY_REVOKE_ERROR',
        error
      );
    }
  }

  // ==========================================
  // MULTI-FACTOR AUTHENTICATION
  // ==========================================

  /**
   * Setup MFA for user account
   */
  async setupMfa(mfaData: MfaSetupRequest): Promise<{
    secret?: string; // For TOTP
    qrCode?: string; // For TOTP
    backupCodes: string[];
  }> {
    try {
      return (await apiClient.post(
        '/auth/mfa/setup',
        mfaData,
        ApiResponseSchema(
          z.object({
            secret: z.string().optional(),
            qrCode: z.string().optional(),
            backupCodes: z.array(z.string()),
          })
        ) as any
      )) as {
        secret?: string | undefined;
        qrCode?: string | undefined;
        backupCodes: string[];
      };
    } catch (error) {
      throw new ApiClientError('MFA setup failed', 0, 'MFA_SETUP_ERROR', error);
    }
  }

  /**
   * Verify MFA code
   */
  async verifyMfa(mfaData: MfaVerifyRequest): Promise<{ message: string; verified: boolean }> {
    try {
      return await apiClient.post(
        '/auth/mfa/verify',
        mfaData,
        ApiResponseSchema(
          z.object({
            message: z.string(),
            verified: z.boolean(),
          })
        ) as any
      );
    } catch (error) {
      throw new ApiClientError('MFA verification failed', 0, 'MFA_VERIFY_ERROR', error);
    }
  }

  /**
   * Disable MFA for user account
   */
  async disableMfa(password: string): Promise<{ message: string }> {
    try {
      return await apiClient.post(
        '/auth/mfa/disable',
        { password },
        ApiResponseSchema(z.object({ message: z.string() })) as any
      );
    } catch (error) {
      throw new ApiClientError('Failed to disable MFA', 0, 'MFA_DISABLE_ERROR', error);
    }
  }

  // ==========================================
  // UTILITY METHODS
  // ==========================================

  /**
   * Check if user is authenticated (has valid token)
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem(configService.get('auth').tokenKey);
    return !!token;
  }

  /**
   * Get current auth token
   */
  getAuthToken(): string | null {
    return localStorage.getItem(configService.get('auth').tokenKey);
  }

  /**
   * Clear all authentication data
   */
  clearAuthData(): void {
    localStorage.removeItem(configService.get('auth').tokenKey);
    localStorage.removeItem(configService.get('auth').refreshTokenKey);
  }
}

// Export singleton instance
export const authApiService = new AuthApiService();
