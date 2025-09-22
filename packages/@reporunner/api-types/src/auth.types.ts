import { z } from "zod";

// User Roles
export enum UserRole {
  SUPER_ADMIN = "SUPER_ADMIN",
  ADMIN = "ADMIN",
  EDITOR = "EDITOR",
  VIEWER = "VIEWER",
  GUEST = "GUEST",
}

// Permission Types
export enum PermissionType {
  // Workflow permissions
  WORKFLOW_VIEW = "WORKFLOW_VIEW",
  WORKFLOW_CREATE = "WORKFLOW_CREATE",
  WORKFLOW_EDIT = "WORKFLOW_EDIT",
  WORKFLOW_DELETE = "WORKFLOW_DELETE",
  WORKFLOW_EXECUTE = "WORKFLOW_EXECUTE",

  // Execution permissions
  EXECUTION_VIEW = "EXECUTION_VIEW",
  EXECUTION_DELETE = "EXECUTION_DELETE",
  EXECUTION_RETRY = "EXECUTION_RETRY",
  EXECUTION_CANCEL = "EXECUTION_CANCEL",

  // Credential permissions
  CREDENTIAL_VIEW = "CREDENTIAL_VIEW",
  CREDENTIAL_CREATE = "CREDENTIAL_CREATE",
  CREDENTIAL_EDIT = "CREDENTIAL_EDIT",
  CREDENTIAL_DELETE = "CREDENTIAL_DELETE",

  // User management permissions
  USER_VIEW = "USER_VIEW",
  USER_CREATE = "USER_CREATE",
  USER_EDIT = "USER_EDIT",
  USER_DELETE = "USER_DELETE",

  // Organization permissions
  ORG_VIEW = "ORG_VIEW",
  ORG_EDIT = "ORG_EDIT",
  ORG_BILLING = "ORG_BILLING",

  // System permissions
  SYSTEM_ADMIN = "SYSTEM_ADMIN",
  AUDIT_VIEW = "AUDIT_VIEW",
  API_KEY_MANAGE = "API_KEY_MANAGE",
}

// User Interface
export interface IUser {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  role: UserRole;
  permissions: PermissionType[];
  organizationId: string;
  teamIds?: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  settings?: IUserSettings;
  metadata?: Record<string, any>;
}

// User Settings
export interface IUserSettings {
  timezone?: string;
  locale?: string;
  theme?: "light" | "dark" | "system";
  notifications?: {
    email: boolean;
    inApp: boolean;
    workflowErrors: boolean;
    workflowSuccess: boolean;
    systemUpdates: boolean;
  };
  editorPreferences?: {
    minimap: boolean;
    gridSnap: boolean;
    autoSave: boolean;
    autoSaveInterval?: number;
  };
}

// Organization Interface
export interface IOrganization {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  description?: string;
  ownerId: string;
  plan: "free" | "starter" | "professional" | "enterprise";
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
    provider?: "saml" | "oidc" | "google" | "microsoft" | "okta";
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

// Auth Request/Response Types
export interface ILoginRequest {
  email: string;
  password: string;
  mfaCode?: string;
  rememberMe?: boolean;
}

export interface ILoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: IUser;
}

export interface IRegisterRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
  inviteCode?: string;
}

export interface IPasswordResetRequest {
  email: string;
}

export interface IPasswordResetConfirm {
  token: string;
  newPassword: string;
}

// Zod Schemas
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  username: z.string().optional(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  avatar: z.string().url().optional(),
  role: z.nativeEnum(UserRole),
  permissions: z.array(z.nativeEnum(PermissionType)),
  organizationId: z.string(),
  teamIds: z.array(z.string()).optional(),
  isActive: z.boolean(),
  isEmailVerified: z.boolean(),
  mfaEnabled: z.boolean(),
  lastLogin: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  settings: z
    .object({
      timezone: z.string().optional(),
      locale: z.string().optional(),
      theme: z.enum(["light", "dark", "system"]).optional(),
      notifications: z
        .object({
          email: z.boolean(),
          inApp: z.boolean(),
          workflowErrors: z.boolean(),
          workflowSuccess: z.boolean(),
          systemUpdates: z.boolean(),
        })
        .optional(),
      editorPreferences: z
        .object({
          minimap: z.boolean(),
          gridSnap: z.boolean(),
          autoSave: z.boolean(),
          autoSaveInterval: z.number().optional(),
        })
        .optional(),
    })
    .optional(),
  metadata: z.record(z.any()).optional(),
});

export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  mfaCode: z.string().optional(),
  rememberMe: z.boolean().optional(),
});

export const RegisterRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  organizationName: z.string().optional(),
  inviteCode: z.string().optional(),
});

export type User = z.infer<typeof UserSchema>;
export type LoginRequest = z.infer<typeof LoginRequestSchema>;
export type RegisterRequest = z.infer<typeof RegisterRequestSchema>;
