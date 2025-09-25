.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
})

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
