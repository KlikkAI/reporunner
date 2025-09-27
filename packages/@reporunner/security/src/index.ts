/**
 * @reporunner/security - Security middleware and utilities
 * Re-exports all existing security implementations
 */

// Rate limiting - reuse existing implementation
export * from './middleware/rate-limit.middleware';

// Security headers - reuse existing implementations
export * from './middleware/security-headers.middleware';
export * from './middleware/security-headers/builders/SecurityHeadersBuilder';
export { CSPBuilder } from './middleware/security-headers/builders/CSPBuilder';
export * from './middleware/security-headers/builders/HSTSBuilder';

// Authentication - reuse existing implementations
export * from './middleware/auth.middleware';
export * from './middleware/auth/AuthMiddleware';
export * from './middleware/auth/services/TokenService';

// Validation - reuse existing implementation
export * from './middleware/validation.middleware';
export * from './middleware/validation/ValidationMiddleware';

// JWT Session - reuse existing interface
export * from './jwt-session';

// Rate limiter - reuse existing implementation
export * from './rate-limiter';

// Audit logging - reuse existing implementation
export * from './audit-logger';

// Encryption service - reuse existing implementation
export * from './encryption.service';

// File upload middleware - reuse existing implementation
export * from './middleware/file-upload.middleware';