/**
 * Frontend-Specific Authentication Types
 *
 * This file extends @reporunner/types with frontend-specific auth types
 * following the "extend, don't replace" pattern.
 *
 * Base types from @reporunner/types:
 * - IUser: Basic user entity
 * - IAuthToken: JWT tokens
 * - IUserSettings: User preferences
 *
 * Frontend extensions:
 * - Enhanced user preferences (dashboard, editor, notifications)
 * - Enterprise features (roles, permissions, SSO)
 * - Team collaboration (invitations)
 * - API key management
 */

import type {
  UserRole as BaseUserRole,
  ID,
  IUser,
  IUserSettings,
  Timestamp,
} from '@reporunner/shared';

// ============================================================================
// Extended User Types
// ============================================================================

/**
 * Frontend-specific user preferences
 * Extends the baseline IUserSettings with UI-specific configuration
 */
export interface FrontendUserPreferences extends Omit<IUserSettings, 'notifications'> {
  theme: 'light' | 'dark';
  language: string;
  timezone: string;
  notifications: {
    email: {
      workflowSuccess?: boolean;
      workflowFailure?: boolean;
      weeklyDigest?: boolean;
    };
    push: boolean;
    inApp: {
      workflowEvents?: boolean;
      mentions?: boolean;
      systemUpdates?: boolean;
    };
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

/**
 * Frontend User - extends IUser with UI-specific fields
 *
 * Adds:
 * - name, avatar: Display information
 * - role: Base user role (from @reporunner/types)
 * - mfaEnabled: Security status
 * - preferences: Enhanced UI preferences
 * - permissions: Granular permission system
 * - projects: Project associations
 * - lastLoginAt: Session tracking
 */
export interface User extends Omit<IUser, 'settings' | 'preferences' | 'role'> {
  name: string;
  avatar?: string;
  role: BaseUserRole; // Use the base type alias from @reporunner/types
  mfaEnabled: boolean;
  preferences: FrontendUserPreferences;
  permissions: Permission[];
  projects: string[];
  lastLoginAt?: Timestamp;
}

// ============================================================================
// Enterprise Role & Permission System
// ============================================================================

/**
 * User Role Definition (Full Enterprise Object)
 * Enterprise-grade role system with hierarchical levels
 * Note: This is different from BaseUserRole which is just a string type
 */
export interface UserRoleDefinition {
  id: string;
  name: string;
  description: string;
  level: number; // 0-10, higher = more privileges
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/**
 * Granular Permission System
 */
export interface Permission {
  id: string;
  resource: ResourceType;
  actions: Action[];
  conditions?: PermissionCondition[];
}

export type ResourceType =
  | 'workflow'
  | 'execution'
  | 'credential'
  | 'integration'
  | 'user'
  | 'organization'
  | 'settings'
  | 'api_key';

export type Action = 'create' | 'read' | 'update' | 'delete' | 'execute' | 'share' | 'manage';

export interface PermissionCondition {
  field: string;
  operator: 'equals' | 'contains' | 'in' | 'notIn';
  value: string | string[];
}

// ============================================================================
// API Key Management
// ============================================================================

/**
 * API Key for programmatic access
 */
export interface APIKey {
  id: ID;
  name: string;
  key: string; // Visible key (prefix shown)
  keyHash: string; // Hashed key stored in DB
  permissions: Permission[];
  expiresAt?: Timestamp;
  lastUsedAt?: Timestamp;
  createdAt: Timestamp;
  createdBy: ID;
  status: 'active' | 'revoked' | 'expired';
  metadata: {
    description?: string;
    ipWhitelist?: string[];
    rateLimitTier?: 'standard' | 'premium' | 'enterprise';
  };
}

// ============================================================================
// User Invitation System
// ============================================================================

/**
 * User Invitation for team collaboration
 */
export interface UserInvitation {
  id: ID;
  email: string;
  role: string; // Role ID to assign
  permissions: Permission[];
  projects: string[];
  invitedBy: ID;
  invitedAt: Timestamp;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  status: 'pending' | 'accepted' | 'expired' | 'revoked';
  token: string;
  message?: string;
}

// ============================================================================
// Enterprise SSO Configuration
// ============================================================================

/**
 * Single Sign-On Provider Configuration
 */
export interface SSOProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'saml' | 'oidc' | 'ldap';
  enabled: boolean;
  configuration: SSOConfiguration;
  metadata: {
    logo?: string;
    description?: string;
    supportUrl?: string;
  };
}

export interface SSOConfiguration {
  issuer: string;
  clientId: string;
  clientSecret?: string; // Never sent to frontend in production
  redirectUri: string;
  scopes: string[];
  endpoints: {
    authorization: string;
    token: string;
    userInfo: string;
    revocation?: string;
  };
  attributes: {
    email: string; // Claim mapping
    name: string;
    groups?: string;
  };
  security?: {
    pkce?: boolean;
    state?: boolean;
    nonce?: boolean;
  };
}

// ============================================================================
// Multi-Factor Authentication (MFA)
// ============================================================================

/**
 * MFA Configuration
 */
export interface MFAConfig {
  enabled: boolean;
  methods: MFAMethod[];
  backupCodes?: string[];
  lastVerifiedAt?: Timestamp;
}

export interface MFAMethod {
  id: string;
  type: 'totp' | 'sms' | 'email' | 'hardware_key';
  name: string;
  isPrimary: boolean;
  isVerified: boolean;
  createdAt: Timestamp;
  lastUsedAt?: Timestamp;
}

// ============================================================================
// Session Management
// ============================================================================

/**
 * User Session Information
 */
export interface Session {
  id: ID;
  userId: ID;
  token: string;
  deviceInfo: {
    userAgent: string;
    ip: string;
    location?: string;
  };
  createdAt: Timestamp;
  expiresAt: Timestamp;
  lastActivityAt: Timestamp;
  isActive: boolean;
}

// ============================================================================
// Type Guards and Utilities
// ============================================================================

/**
 * Check if user has specific permission
 */
export function hasPermission(user: User, resource: ResourceType, action: Action): boolean {
  return user.permissions.some((p) => p.resource === resource && p.actions.includes(action));
}

/**
 * Check if user has role level at or above threshold
 * Note: Since role is a string, we map roles to levels for comparison
 */
export function hasRoleLevel(user: User, minLevel: number): boolean {
  const roleLevels: Record<string, number> = {
    viewer: 1,
    member: 3,
    editor: 5,
    manager: 7,
    admin: 9,
    owner: 10,
  };
  const userLevel = roleLevels[user.role as string] || 0;
  return userLevel >= minLevel;
}

/**
 * Check if user is admin
 */
export function isAdmin(user: User): boolean {
  return user.role === 'admin' || user.role === 'owner';
}

/**
 * Check if invitation is still valid
 */
export function isInvitationValid(invitation: UserInvitation): boolean {
  return invitation.status === 'pending' && new Date(invitation.expiresAt).getTime() > Date.now();
}

/**
 * Check if API key is usable
 */
export function isAPIKeyActive(apiKey: APIKey): boolean {
  if (apiKey.status !== 'active') {
    return false;
  }
  if (!apiKey.expiresAt) {
    return true;
  }
  return new Date(apiKey.expiresAt).getTime() > Date.now();
}

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create default user preferences
 */
export function createDefaultPreferences(): FrontendUserPreferences {
  return {
    theme: 'dark',
    language: 'en',
    timezone: 'UTC',
    notifications: {
      email: {
        workflowSuccess: true,
        workflowFailure: true,
        weeklyDigest: true,
      },
      push: false,
      inApp: {
        workflowEvents: true,
        mentions: true,
        systemUpdates: true,
      },
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
  };
}

/**
 * Create MFA configuration
 */
export function createMFAConfig(): MFAConfig {
  return {
    enabled: false,
    methods: [],
    backupCodes: [],
  };
}
