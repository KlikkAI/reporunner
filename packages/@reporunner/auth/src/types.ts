import { z } from 'zod';

// User and Organization types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().url().optional(),
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  organizationId: z.string().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  metadata: z.record(z.unknown()).optional(),
});

export type User = z.infer<typeof UserSchema>;

export const OrganizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string().optional(),
  logo: z.string().url().optional(),
  plan: z.enum(['free', 'pro', 'enterprise']),
  settings: z.record(z.unknown()),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Organization = z.infer<typeof OrganizationSchema>;

// Authentication types
export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
  organizationId?: string;
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  refreshToken?: string;
  expiresIn?: number;
  error?: string;
  requiresTwoFactor?: boolean;
  twoFactorToken?: string;
}

export interface JWTPayload {
  sub: string; // user id
  email: string;
  username: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  iat: number;
  exp: number;
  type: 'access' | 'refresh';
}

// OAuth types
export interface OAuthProvider {
  id: string;
  name: string;
  type: 'oauth2' | 'saml' | 'oidc';
  enabled: boolean;
  config: Record<string, unknown>;
}

export const OAuthConfigSchema = z.object({
  clientId: z.string(),
  clientSecret: z.string(),
  callbackURL: z.string(),
  scope: z.array(z.string()).optional(),
  authorizationURL: z.string().optional(),
  tokenURL: z.string().optional(),
  userProfileURL: z.string().optional(),
});

export type OAuthConfig = z.infer<typeof OAuthConfigSchema>;

// SAML types
export const SAMLConfigSchema = z.object({
  entryPoint: z.string().url(),
  issuer: z.string(),
  cert: z.string(),
  privateKey: z.string().optional(),
  callbackUrl: z.string().url(),
  signatureAlgorithm: z.string().optional(),
  digestAlgorithm: z.string().optional(),
  attributeStatementMapping: z.record(z.string()).optional(),
});

export type SAMLConfig = z.infer<typeof SAMLConfigSchema>;

// Two-Factor Authentication
export interface TwoFactorSetup {
  secret: string;
  qrCode: string;
  backupCodes: string[];
}

export interface TwoFactorVerification {
  token: string;
  backupCode?: string;
}

// Role-Based Access Control (RBAC)
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  organizationId: z.string().optional(),
  isSystem: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export type Role = z.infer<typeof RoleSchema>;

export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  resource: z.string(),
  action: z.string(),
  description: z.string().optional(),
  conditions: z.record(z.unknown()).optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;

// Session types
export interface SessionData {
  userId: string;
  email: string;
  organizationId?: string;
  roles: string[];
  permissions: string[];
  loginMethod: 'email' | 'oauth' | 'saml';
  ipAddress: string;
  userAgent: string;
  lastActivity: Date;
  expiresAt: Date;
}

// Audit types
export const AuditLogSchema = z.object({
  id: z.string(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  action: z.string(),
  resource: z.string(),
  resourceId: z.string().optional(),
  details: z.record(z.unknown()).optional(),
  ipAddress: z.string(),
  userAgent: z.string(),
  timestamp: z.date(),
});

export type AuditLog = z.infer<typeof AuditLogSchema>;

// Rate limiting
export interface RateLimitConfig {
  windowMs: number;
  max: number;
  message?: string;
  standardHeaders?: boolean;
  legacyHeaders?: boolean;
}

// Security settings
export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSymbols: boolean;
    maxAge: number; // days
  };
  sessionConfig: {
    maxAge: number; // seconds
    secure: boolean;
    sameSite: 'strict' | 'lax' | 'none';
  };
  rateLimiting: {
    enabled: boolean;
    requests: number;
    window: number; // seconds
  };
  twoFactor: {
    enabled: boolean;
    required: boolean;
    backupCodes: number;
  };
}

// Authentication events
export enum AuthEvent {
  LOGIN_SUCCESS = 'login.success',
  LOGIN_FAILED = 'login.failed',
  LOGOUT = 'logout',
  PASSWORD_CHANGED = 'password.changed',
  PASSWORD_RESET = 'password.reset',
  TWO_FACTOR_ENABLED = 'two_factor.enabled',
  TWO_FACTOR_DISABLED = 'two_factor.disabled',
  ACCOUNT_LOCKED = 'account.locked',
  ACCOUNT_UNLOCKED = 'account.unlocked',
}

export interface AuthEventData {
  event: AuthEvent;
  userId?: string;
  email?: string;
  organizationId?: string;
  metadata?: Record<string, unknown>;
  timestamp: Date;
}

// Provider configuration
export interface AuthProviderConfig {
  local: {
    enabled: boolean;
    allowRegistration: boolean;
    emailVerificationRequired: boolean;
  };
  oauth: {
    google?: OAuthConfig;
    github?: OAuthConfig;
    microsoft?: OAuthConfig;
    slack?: OAuthConfig;
  };
  saml: {
    [key: string]: SAMLConfig;
  };
  oidc: {
    [key: string]: OAuthConfig;
  };
}
