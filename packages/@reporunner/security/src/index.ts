/**
 * @reporunner/security - Security utilities and services
 */

// Encryption service (commented out until implemented)
// export * from "./encryption";

// Audit logging
export * from './audit-logger';
export {
  AuditEventType,
  AuditLogger,
  AuditSeverity,
  auditLogger,
} from './audit-logger';

// JWT Session management
export * from './jwt-session';
export { JWTSessionManager, jwtSessionManager } from './jwt-session';
export * from './middleware/auth.middleware';
export {
  createAuthMiddleware,
  createLogoutMiddleware,
  createRefreshTokenMiddleware,
  createSessionManagementMiddleware,
  optionalAuth,
  requirePermission,
  requireRole,
} from './middleware/auth.middleware';
// File upload security
export * from './middleware/file-upload.middleware';
export {
  createFieldSizeLimiter,
  createFileCleanupMiddleware,
  createFileTypeValidator,
  createFileUploadMiddleware,
  createSecureDownloadMiddleware,
} from './middleware/file-upload.middleware';
export * from './middleware/rate-limit.middleware';
export {
  apiKeyGenerator,
  combinedKeyGenerator,
  createApiRateLimiter,
  createExecutionRateLimiter,
  createExportRateLimiter,
  createLoginRateLimiter,
  createMultiRateLimiter,
  createPasswordResetRateLimiter,
  createRateLimitMiddleware,
  createTieredRateLimiter,
  createUploadRateLimiter,
  createWebhookRateLimiter,
  endpointKeyGenerator,
  userKeyGenerator,
} from './middleware/rate-limit.middleware';
// Security headers (CORS, CSP)
export * from './middleware/security-headers.middleware';
export {
  createCombinedSecurityMiddleware,
  createCorsMiddleware,
  createCSPMiddleware,
  createCSPReportHandler,
  createCSPWithNonce,
  createNonceMiddleware,
  createSecurityHeadersMiddleware,
  getEnvironmentConfig,
} from './middleware/security-headers.middleware';
// Input validation and sanitization
export * from './middleware/validation.middleware';
export {
  CommonSchemas,
  createCommandInjectionProtection,
  createNoSQLInjectionProtection,
  createPathTraversalProtection,
  createSecurityValidationMiddleware,
  createSQLInjectionProtection,
  createValidationMiddleware,
  createXSSProtection,
} from './middleware/validation.middleware';
// Rate limiting
export * from './rate-limiter';
// Re-export commonly used items
// export { EncryptionService } from "./encryption.service";
export { AdvancedRateLimiter, rateLimiter } from './rate-limiter';
