})

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
