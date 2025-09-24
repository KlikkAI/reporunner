import { z } from 'zod';
import { ApiResponseSchema, IdSchema, MetadataSchema, TimestampSchema } from './BaseSchemas';

// User schemas (aligned with backend roles)
export const UserRoleSchema = z.enum(['super_admin', 'admin', 'member', 'viewer']);

export const UserProfileSchema = z.object({
  id: IdSchema,
  email: z.string().email(),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  role: UserRoleSchema,
  // Optional fields that might not always be provided by backend
  fullName: z.string().optional(),
  lastLogin: z.string().optional(), // Backend uses lastLogin instead of lastLoginAt
  avatar: z.string().url().optional(),
  timezone: z.string().optional(),
  preferences: z
    .object({
      theme: z.enum(['light', 'dark', 'system']).default('system'),
      language: z.string().default('en'),
      notifications: z
        .object({
          email: z.boolean().default(true),
          workflow: z.boolean().default(true),
          system: z.boolean().default(true),
        })
        .default({
          email: true,
          workflow: true,
          system: true,
        }),
    })
    .default({
      theme: 'system',
      language: 'en',
      notifications: {
        email: true,
        workflow: true,
        system: true,
      },
    })
    .optional(),
  createdAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema.optional(),
  lastLoginAt: TimestampSchema.optional(),
  isActive: z.boolean().default(true).optional(),
  isEmailVerified: z.boolean().default(false).optional(),
});

// Authentication schemas
export const LoginCredentialsSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  rememberMe: z.boolean().default(false),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  acceptTerms: z
    .boolean()
    .refine((val) => val === true, 'You must accept the terms and conditions'),
});

export const AuthTokensSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  tokenType: z.string().default('Bearer'),
  expiresIn: z.number().int().min(0), // seconds
  expiresAt: TimestampSchema,
  scope: z.array(z.string()).default([]),
});

export const LoginResponseSchema = z.object({
  user: UserProfileSchema,
  token: z.string(),
  refreshToken: z.string(),
  // Optional fields that backend may not always provide
  permissions: z.array(z.string()).default([]).optional(),
  sessionId: z.string().optional(),
});

// Password reset schemas
export const PasswordResetRequestSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

export const PasswordResetConfirmSchema = z.object({
  token: z.string().min(1, 'Reset token is required'),
  email: z.string().email('Please enter a valid email address'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// Password change (authenticated user)
export const ChangePasswordRequestSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
});

// Profile update schemas
export const UpdateProfileRequestSchema = UserProfileSchema.pick({
  firstName: true,
  lastName: true,
  avatar: true,
  timezone: true,
  preferences: true,
}).partial();

// Email verification
export const EmailVerificationRequestSchema = z.object({
  email: z.string().email(),
});

export const EmailVerificationConfirmSchema = z.object({
  token: z.string().min(1, 'Verification token is required'),
  email: z.string().email(),
});

// Session management
export const RefreshTokenRequestSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const SessionInfoSchema = z.object({
  sessionId: z.string(),
  userId: IdSchema,
  createdAt: TimestampSchema,
  lastAccessedAt: TimestampSchema,
  expiresAt: TimestampSchema,
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  isActive: z.boolean(),
});

// API Key management (for developers)
export const ApiKeySchema = z.object({
  id: IdSchema,
  name: z.string().min(1).max(100),
  key: z.string(), // This will be masked in responses except creation
  permissions: z.array(z.string()),
  createdAt: TimestampSchema,
  lastUsedAt: TimestampSchema.optional(),
  expiresAt: TimestampSchema.optional(),
  isActive: z.boolean().default(true),
});

export const CreateApiKeyRequestSchema = z.object({
  name: z.string().min(1).max(100),
  permissions: z.array(z.string()).default(['read']),
  expiresIn: z.number().int().min(86400).max(31536000).optional(), // 1 day to 1 year in seconds
});

// Multi-factor authentication
export const MfaSetupRequestSchema = z.object({
  method: z.enum(['totp', 'sms', 'email']),
  phoneNumber: z.string().optional(), // Required if method is 'sms'
});

export const MfaVerifyRequestSchema = z.object({
  code: z.string().regex(/^\d{6}$/, 'Code must be 6 digits'),
  method: z.enum(['totp', 'sms', 'email']),
});

export const MfaBackupCodesSchema = z.object({
  codes: z.array(z.string()),
  generatedAt: TimestampSchema,
});

// Audit log schemas
export const AuditLogSchema = z.object({
  id: IdSchema,
  userId: IdSchema,
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: MetadataSchema.optional(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
  timestamp: TimestampSchema,
});

// API Response schemas
export const LoginApiResponseSchema = ApiResponseSchema(LoginResponseSchema);
export const UserProfileApiResponseSchema = ApiResponseSchema(UserProfileSchema);
export const AuthTokensApiResponseSchema = ApiResponseSchema(AuthTokensSchema);
export const SessionInfoApiResponseSchema = ApiResponseSchema(SessionInfoSchema);
export const ApiKeyApiResponseSchema = ApiResponseSchema(ApiKeySchema);
export const ApiKeyListApiResponseSchema = ApiResponseSchema(z.array(ApiKeySchema));
export const MfaBackupCodesApiResponseSchema = ApiResponseSchema(MfaBackupCodesSchema);

// Generic success responses
export const PasswordResetResponseSchema = ApiResponseSchema(
  z.object({
    message: z.string(),
    email: z.string().email(),
  })
);

export const EmailVerificationResponseSchema = ApiResponseSchema(
  z.object({
    message: z.string(),
    emailSent: z.boolean(),
  })
);

export const LogoutResponseSchema = ApiResponseSchema(
  z.object({
    message: z.string(),
    sessionId: z.string(),
  })
);

// Type exports
export type UserRole = z.infer<typeof UserRoleSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type LoginCredentials = z.infer<typeof LoginCredentialsSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
export type AuthTokens = z.infer<typeof AuthTokensSchema>;
export type LoginResponse = z.infer<typeof LoginResponseSchema>;
export type PasswordResetRequest = z.infer<typeof PasswordResetRequestSchema>;
export type PasswordResetConfirm = z.infer<typeof PasswordResetConfirmSchema>;
export type ChangePasswordRequest = z.infer<typeof ChangePasswordRequestSchema>;
export type UpdateProfileRequest = z.infer<typeof UpdateProfileRequestSchema>;
export type EmailVerificationRequest = z.infer<typeof EmailVerificationRequestSchema>;
export type EmailVerificationConfirm = z.infer<typeof EmailVerificationConfirmSchema>;
export type RefreshTokenRequest = z.infer<typeof RefreshTokenRequestSchema>;
export type SessionInfo = z.infer<typeof SessionInfoSchema>;
export type ApiKey = z.infer<typeof ApiKeySchema>;
export type CreateApiKeyRequest = z.infer<typeof CreateApiKeyRequestSchema>;
export type MfaSetupRequest = z.infer<typeof MfaSetupRequestSchema>;
export type MfaVerifyRequest = z.infer<typeof MfaVerifyRequestSchema>;
export type MfaBackupCodes = z.infer<typeof MfaBackupCodesSchema>;
export type AuditLog = z.infer<typeof AuditLogSchema>;
export type LoginApiResponse = z.infer<typeof LoginApiResponseSchema>;
export type UserProfileApiResponse = z.infer<typeof UserProfileApiResponseSchema>;
export type AuthTokensApiResponse = z.infer<typeof AuthTokensApiResponseSchema>;
export type SessionInfoApiResponse = z.infer<typeof SessionInfoApiResponseSchema>;
export type ApiKeyApiResponse = z.infer<typeof ApiKeyApiResponseSchema>;
export type ApiKeyListApiResponse = z.infer<typeof ApiKeyListApiResponseSchema>;
export type MfaBackupCodesApiResponse = z.infer<typeof MfaBackupCodesApiResponseSchema>;
export type PasswordResetResponse = z.infer<typeof PasswordResetResponseSchema>;
export type EmailVerificationResponse = z.infer<typeof EmailVerificationResponseSchema>;
export type LogoutResponse = z.infer<typeof LogoutResponseSchema>;
