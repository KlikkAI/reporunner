// Re-export auth components with explicit exports to avoid conflicts

// Middleware exports - only export what exists
export {
  createJWTMiddleware,
  JWTConfig,
  AuthenticatedRequest
} from './middleware/jwt-middleware';

export {
  createSessionMiddleware,
  SessionConfig
} from './middleware/session-middleware';

export {
  createRoleMiddleware,
  RBACConfig,
  Permission as MiddlewarePermission,
  Role as MiddlewareRole
} from './middleware/rbac-middleware';

// Strategy exports
export * from './strategies';

// Type exports - export what exists in types directory
export {
  Permission as TypePermission,
  Role as TypeRole,
  PermissionSchema,
  RoleSchema,
  PermissionType,
  RoleType
} from './types/rbac-security-types';

export {
  OAuthConfig,
  SAMLConfig as TypeSAMLConfig
} from './types/auth-provider-types';

export {
  UserProfile
} from './types/user-organization-types';

// Provider exports with existing exports
export * from './providers';

// Utility exports
export * from './utils';