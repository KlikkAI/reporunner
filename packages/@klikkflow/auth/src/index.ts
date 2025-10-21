// Re-export auth components with explicit exports to avoid conflicts

// Middleware exports
export * from './middleware/jwt-middleware';
export * from './middleware/rbac-middleware';
export * from './middleware/session-middleware';

// Provider exports
export * from './providers';

// Strategy exports
export * from './strategies';

// Type exports - explicit exports to avoid conflicts
export type {
  AuthEvent,
  AuthEventData,
  AuthProviderConfig,
  OAuthConfig,
  SAMLConfig,
  TwoFactorSettings,
} from './types/auth-provider-types';

export type {
  Permission as TypePermission,
  PermissionType,
  Role as TypeRole,
  RoleType,
  SecurityPolicy,
  SecurityRule,
  SecuritySession,
  TwoFactorSetup,
  TwoFactorVerification,
} from './types/rbac-security-types';

export {
  PermissionSchema,
  RoleSchema,
} from './types/rbac-security-types';

export type {
  AuthUser,
  CreateOrganizationRequest,
  CreateUserRequest,
  OrganizationInfo,
  UpdateOrganizationRequest,
  UpdateUserRequest,
  UserMembership,
  UserProfile,
  UserRole,
} from './types/user-organization-types';

// Utility exports
export * from './utils';
