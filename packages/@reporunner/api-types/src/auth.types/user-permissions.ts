import { z } from 'zod';

// User Roles
export enum UserRole {
  SUPER_ADMIN = 'SUPER_ADMIN',
  ADMIN = 'ADMIN',
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
  GUEST = 'GUEST',
}

// Permission Types
export enum PermissionType {
  // Workflow permissions
  WORKFLOW_VIEW = 'WORKFLOW_VIEW',
  WORKFLOW_CREATE = 'WORKFLOW_CREATE',
  WORKFLOW_EDIT = 'WORKFLOW_EDIT',
  WORKFLOW_DELETE = 'WORKFLOW_DELETE',
  WORKFLOW_EXECUTE = 'WORKFLOW_EXECUTE',

  // Execution permissions
  EXECUTION_VIEW = 'EXECUTION_VIEW',
  EXECUTION_DELETE = 'EXECUTION_DELETE',
  EXECUTION_RETRY = 'EXECUTION_RETRY',
  EXECUTION_CANCEL = 'EXECUTION_CANCEL',

  // Credential permissions
  CREDENTIAL_VIEW = 'CREDENTIAL_VIEW',
  CREDENTIAL_CREATE = 'CREDENTIAL_CREATE',
  CREDENTIAL_EDIT = 'CREDENTIAL_EDIT',
  CREDENTIAL_DELETE = 'CREDENTIAL_DELETE',

  // User management permissions
  USER_VIEW = 'USER_VIEW',
  USER_CREATE = 'USER_CREATE',
  USER_EDIT = 'USER_EDIT',
  USER_DELETE = 'USER_DELETE',

  // Organization permissions
  ORG_VIEW = 'ORG_VIEW',
  ORG_EDIT = 'ORG_EDIT',
  ORG_BILLING = 'ORG_BILLING',

  // System permissions
  SYSTEM_ADMIN = 'SYSTEM_ADMIN',
  AUDIT_VIEW = 'AUDIT_VIEW',
  API_KEY_MANAGE = 'API_KEY_MANAGE',
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

  // Additional fields for database implementation (optional to keep interface clean)
  password?: string;
  passwordChangedAt?: Date;
  loginAttempts?: number;
  lockUntil?: Date;
  emailVerificationToken?: string;
  emailVerificationExpires?: Date;
  mfaSecret?: string;
  mfaBackupCodes?: string[];
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

// User Settings
export interface IUserSettings {
  timezone?: string;
  locale?: string;
  theme?: 'light' | 'dark' | 'system';
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
