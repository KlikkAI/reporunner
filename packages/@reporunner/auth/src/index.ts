// Re-export auth components with explicit exports to avoid conflicts

// Middleware exports - only export what exists
export {
  AuthenticatedRequest,
  createJWTMiddleware,
  JWTConfig,
} from './middleware/jwt-middleware';
export {
  createRoleMiddleware,
  Permission as MiddlewarePermission,
  RBACConfig,
  Role as MiddlewareRole,
} from './middleware/rbac-middleware';
export {
  createSessionMiddleware,
  SessionConfig,
} from './middleware/session-middleware';
// Provider exports with existing exports
export * from './providers';
// Strategy exports
export * from './strategies';

export {
  OAuthConfig,
  SAMLConfig as TypeSAMLConfig,
} from './types/auth-provider-types';
// Type exports - export what exists in types directory
export {
  Permission as TypePermission,
  PermissionSchema,
  PermissionType,
  Role as TypeRole,
  RoleSchema,
  RoleType,
} from './types/rbac-security-types';
export { UserProfile } from './types/user-organization-types';

// Utility exports
export * from './utils';
