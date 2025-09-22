/**
 * Advanced Authentication Types
 *
 * Comprehensive authentication system with:
 * - Multi-factor authentication (MFA)
 * - Role-based access control (RBAC)
 * - Single sign-on (SSO) integration
 * - API key management
 * - Session management
 * - User invitation system
 */

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role: UserRole;
  status: 'active' | 'inactive' | 'pending' | 'suspended';
  createdAt: number;
  lastLoginAt?: number;
  mfaEnabled: boolean;
  ssoProvider?: SSOProvider;
  preferences: UserPreferences;
  permissions: Permission[];
  projects: ProjectAccess[];
}

export interface UserRole {
  id: string;
  name: string;
  description: string;
  level: number; // Higher number = more privileges
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  createdAt: number;
  updatedAt: number;
}

export interface Permission {
  id: string;
  resource: ResourceType;
  action: ActionType;
  conditions?: AccessCondition[];
  scope?: 'global' | 'project' | 'organization';
}

export interface AccessCondition {
  type: 'time' | 'ip' | 'location' | 'device' | 'custom';
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'in'
    | 'not_in'
    | 'before'
    | 'after';
  value: any;
}

export interface ProjectAccess {
  projectId: string;
  role: string;
  permissions: Permission[];
  grantedAt: number;
  grantedBy: string;
}

export interface SSOProvider {
  id: string;
  name: string;
  type: 'saml' | 'oidc' | 'oauth2';
  enabled: boolean;
  configuration: SSOConfiguration;
  metadata: SSOMetadata;
}

export interface SSOConfiguration {
  issuer: string;
  clientId: string;
  clientSecret?: string;
  redirectUri: string;
  scopes: string[];
  endpoints: {
    authorization: string;
    token: string;
    userInfo: string;
    logout?: string;
  };
  attributes: {
    email: string;
    name: string;
    groups?: string;
  };
}

export interface SSOMetadata {
  logo?: string;
  description?: string;
  documentation?: string;
  supportEmail?: string;
}

export interface MFAConfig {
  enabled: boolean;
  methods: MFAMethod[];
  backupCodes: string[];
  recoveryEmail?: string;
}

export interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'hardware';
  name: string;
  enabled: boolean;
  verified: boolean;
  createdAt: number;
  lastUsed?: number;
  metadata?: Record<string, any>;
}

export interface APIKey {
  id: string;
  name: string;
  key: string;
  keyHash: string;
  permissions: Permission[];
  expiresAt?: number;
  lastUsedAt?: number;
  createdAt: number;
  createdBy: string;
  status: 'active' | 'revoked' | 'expired';
  metadata: {
    ipWhitelist?: string[];
    userAgent?: string;
    description?: string;
  };
}

export interface Session {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  expiresAt: number;
  createdAt: number;
  lastActivityAt: number;
  ipAddress: string;
  userAgent: string;
  location?: {
    country: string;
    region: string;
    city: string;
  };
  device?: {
    type: 'desktop' | 'mobile' | 'tablet';
    os: string;
    browser: string;
  };
  isActive: boolean;
  mfaVerified: boolean;
}

export interface UserInvitation {
  id: string;
  email: string;
  role: string;
  permissions: Permission[];
  projects: string[];
  invitedBy: string;
  invitedAt: number;
  expiresAt: number;
  acceptedAt?: number;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  message?: string;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  timezone: string;
  notifications: {
    email: boolean;
    push: boolean;
    inApp: boolean;
    workflows: boolean;
    executions: boolean;
    security: boolean;
  };
  dashboard: {
    layout: 'grid' | 'list';
    widgets: string[];
    refreshInterval: number;
  };
  editor: {
    autoSave: boolean;
    autoComplete: boolean;
    syntaxHighlighting: boolean;
    wordWrap: boolean;
  };
}

export interface AuthContext {
  user: User | null;
  session: Session | null;
  permissions: Permission[];
  projects: ProjectAccess[];
  isLoading: boolean;
  error: string | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  mfaToken?: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  name: string;
  invitationToken?: string;
  acceptTerms: boolean;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetConfirm {
  token: string;
  password: string;
}

export interface MFAChallenge {
  method: MFAMethod['type'];
  challenge: string;
  expiresAt: number;
}

export interface MFAVerification {
  method: MFAMethod['type'];
  code: string;
  backupCode?: string;
}

// Enums
export type ResourceType =
  | 'workflow'
  | 'execution'
  | 'credential'
  | 'user'
  | 'project'
  | 'organization'
  | 'integration'
  | 'audit'
  | 'settings';

export type ActionType =
  | 'create'
  | 'read'
  | 'update'
  | 'delete'
  | 'execute'
  | 'share'
  | 'export'
  | 'import'
  | 'manage';

// Factory functions
export const createUser = (data: Partial<User>): User => ({
  id: `user_${Date.now()}`,
  email: '',
  name: '',
  role: createDefaultRole(),
  status: 'pending',
  createdAt: Date.now(),
  mfaEnabled: false,
  preferences: createDefaultPreferences(),
  permissions: [],
  projects: [],
  ...data,
});

export const createDefaultRole = (): UserRole => ({
  id: 'viewer',
  name: 'Viewer',
  description: 'Can view workflows and executions',
  level: 1,
  permissions: [
    { id: 'read_workflow', resource: 'workflow', action: 'read' },
    { id: 'read_execution', resource: 'execution', action: 'read' },
  ],
  isSystem: true,
  createdAt: Date.now(),
  updatedAt: Date.now(),
});

export const createDefaultPreferences = (): UserPreferences => ({
  theme: 'dark',
  language: 'en',
  timezone: 'UTC',
  notifications: {
    email: true,
    push: false,
    inApp: true,
    workflows: true,
    executions: true,
    security: true,
  },
  dashboard: {
    layout: 'grid',
    widgets: ['workflows', 'executions', 'recent'],
    refreshInterval: 30000,
  },
  editor: {
    autoSave: true,
    autoComplete: true,
    syntaxHighlighting: true,
    wordWrap: true,
  },
});

export const createAPIKey = (data: Partial<APIKey>): APIKey => ({
  id: `key_${Date.now()}`,
  name: '',
  key: '',
  keyHash: '',
  permissions: [],
  createdAt: Date.now(),
  createdBy: '',
  status: 'active',
  metadata: {},
  ...data,
});

export const createUserInvitation = (data: Partial<UserInvitation>): UserInvitation => ({
  id: `invite_${Date.now()}`,
  email: '',
  role: 'viewer',
  permissions: [],
  projects: [],
  invitedBy: '',
  invitedAt: Date.now(),
  expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  status: 'pending',
  token: '',
  ...data,
});

// Permission checking utilities
export const hasPermission = (
  userPermissions: Permission[],
  resource: ResourceType,
  action: ActionType,
  context?: any
): boolean => {
  return userPermissions.some(
    (permission) =>
      permission.resource === resource &&
      permission.action === action &&
      (!permission.conditions || evaluateConditions(permission.conditions, context))
  );
};

export const hasAnyPermission = (
  userPermissions: Permission[],
  checks: Array<{ resource: ResourceType; action: ActionType }>
): boolean => {
  return checks.some((check) => hasPermission(userPermissions, check.resource, check.action));
};

export const hasAllPermissions = (
  userPermissions: Permission[],
  checks: Array<{ resource: ResourceType; action: ActionType }>
): boolean => {
  return checks.every((check) => hasPermission(userPermissions, check.resource, check.action));
};

export const evaluateConditions = (conditions: AccessCondition[], context: any): boolean => {
  return conditions.every((condition) => {
    const value = getContextValue(context, condition.type);

    switch (condition.operator) {
      case 'equals':
        return value === condition.value;
      case 'not_equals':
        return value !== condition.value;
      case 'contains':
        return String(value).includes(String(condition.value));
      case 'not_contains':
        return !String(value).includes(String(condition.value));
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(value);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(value);
      case 'before':
        return new Date(value) < new Date(condition.value);
      case 'after':
        return new Date(value) > new Date(condition.value);
      default:
        return false;
    }
  });
};

export const getContextValue = (context: any, type: string): any => {
  switch (type) {
    case 'time':
      return new Date().getTime();
    case 'ip':
      return context?.ipAddress;
    case 'location':
      return context?.location;
    case 'device':
      return context?.device;
    default:
      return context?.[type];
  }
};

// Role hierarchy utilities
export const getRoleLevel = (roleName: string): number => {
  const roleLevels: Record<string, number> = {
    owner: 10,
    admin: 8,
    manager: 6,
    editor: 4,
    viewer: 2,
    guest: 1,
  };
  return roleLevels[roleName] || 0;
};

export const canManageRole = (userRole: string, targetRole: string): boolean => {
  return getRoleLevel(userRole) > getRoleLevel(targetRole);
};

export const getAvailableRoles = (userRole: string): string[] => {
  const userLevel = getRoleLevel(userRole);
  const allRoles = ['owner', 'admin', 'manager', 'editor', 'viewer', 'guest'];
  return allRoles.filter((role) => getRoleLevel(role) < userLevel);
};
