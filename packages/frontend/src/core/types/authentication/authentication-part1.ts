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
