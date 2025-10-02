import type { PermissionType, UserRole } from './auth-enums';

// Editor Preferences Interface
export interface IEditorPreferences {
  minimap: boolean;
  gridSnap: boolean;
  autoSave: boolean;
  autoSaveInterval?: number;
}

// Organization Interface
export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  ownerId: string;
  plan: 'free' | 'starter' | 'professional' | 'enterprise';
  billingEmail?: string;
  maxUsers?: number;
  maxWorkflows?: number;
  maxExecutions?: number;
  features: string[];
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  settings?: IOrganizationSettings;
  metadata?: Record<string, any>;
}

// Organization Settings
export interface IOrganizationSettings {
  sso?: {
    enabled: boolean;
    provider?: 'saml' | 'oidc' | 'google' | 'microsoft' | 'okta';
    config?: Record<string, any>;
  };
  security?: {
    enforceeMFA: boolean;
    passwordPolicy?: {
      minLength: number;
      requireUppercase: boolean;
      requireLowercase: boolean;
      requireNumbers: boolean;
      requireSpecialChars: boolean;
      expiryDays?: number;
    };
    ipWhitelist?: string[];
    sessionTimeout?: number;
  };
  compliance?: {
    dataRetention: number;
    auditLogRetention: number;
    gdprCompliant: boolean;
    hipaaCompliant: boolean;
    soc2Compliant: boolean;
  };
}

// JWT Token Payload
export interface IJwtPayload {
  sub: string; // User ID
  email: string;
  role: UserRole;
  permissions: PermissionType[];
  organizationId: string;
  sessionId: string;
  iat?: number;
  exp?: number;
  iss?: string;
}

// API Key Interface
export interface IApiKey {
  id: string;
  name: string;
  key: string; // Hashed
  prefix: string; // First few characters for identification
  userId: string;
  organizationId: string;
  permissions: PermissionType[];
  expiresAt?: Date;
  lastUsedAt?: Date;
  createdAt: Date;
  revokedAt?: Date;
  metadata?: Record<string, any>;
}

// Session Interface
export interface ISession {
  id: string;
  userId: string;
  token: string;
  refreshToken?: string;
  ipAddress: string;
  userAgent: string;
  location?: string;
  expiresAt: Date;
  createdAt: Date;
  lastActivityAt: Date;
}

// Auth Request/Response Types are defined in auth-requests.ts
