/**
 * @reporunner/security - Security utilities and services
 */

// Encryption service
export * from "./encryption";

// Rate limiting
export * from "./rate-limiter";
export * from "./middleware/rate-limit.middleware";

// JWT Session management
export * from "./jwt-session";
export * from "./middleware/auth.middleware";

// Audit logging
export * from "./audit-logger";

// Security headers (CORS, CSP)
export * from "./middleware/security-headers.middleware";

// Input validation and sanitization
export * from "./middleware/validation.middleware";

// File upload security
export * from "./middleware/file-upload.middleware";

// Re-export commonly used items
export { EncryptionService } from "./encryption";
export { AdvancedRateLimiter, rateLimiter } from "./rate-limiter";
export { JWTSessionManager, jwtSessionManager } from "./jwt-session";
export {
  AuditLogger,
  auditLogger,
  AuditEventType,
  AuditSeverity,
} from "./audit-logger";
export {
  createRateLimitMiddleware,
  createLoginRateLimiter,
  createApiRateLimiter,
  createExecutionRateLimiter,
  createUploadRateLimiter,
  createPasswordResetRateLimiter,
  createWebhookRateLimiter,
  createExportRateLimiter,
  createTieredRateLimiter,
  createMultiRateLimiter,
  userKeyGenerator,
  apiKeyGenerator,
  combinedKeyGenerator,
  endpointKeyGenerator,
} from "./middleware/rate-limit.middleware";
export {
  createAuthMiddleware,
  createRefreshTokenMiddleware,
  createLogoutMiddleware,
  createSessionManagementMiddleware,
  requireRole,
  requirePermission,
  optionalAuth,
} from "./middleware/auth.middleware";
export {
  createCorsMiddleware,
  createCSPMiddleware,
  createSecurityHeadersMiddleware,
  createCombinedSecurityMiddleware,
  getEnvironmentConfig,
  createCSPReportHandler,
  createNonceMiddleware,
  createCSPWithNonce,
} from "./middleware/security-headers.middleware";
export {
  createValidationMiddleware,
  createSQLInjectionProtection,
  createNoSQLInjectionProtection,
  createXSSProtection,
  createPathTraversalProtection,
  createCommandInjectionProtection,
  createSecurityValidationMiddleware,
  CommonSchemas,
} from "./middleware/validation.middleware";
export {
  createFileUploadMiddleware,
  createFileCleanupMiddleware,
  createFileTypeValidator,
  createFieldSizeLimiter,
  createSecureDownloadMiddleware,
} from "./middleware/file-upload.middleware";
