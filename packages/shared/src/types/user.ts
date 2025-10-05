/**
 * User Types - User accounts and authentication
 * Consolidated from @reporunner/types
 */

import type { BaseEntity, ID, Timestamp } from './common';

/**
 * User role
 */
export type UserRole = 'admin' | 'owner' | 'member' | 'viewer';

/**
 * Authentication provider
 */
export type AuthProvider = 'local' | 'google' | 'github' | 'microsoft' | 'saml' | 'ldap';

/**
 * User status
 */
export type UserStatus = 'active' | 'inactive' | 'suspended' | 'pending';

/**
 * User interface
 */
export interface IUser extends BaseEntity {
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  avatar?: string;
  role: UserRole;
  status: UserStatus;
  authProvider: AuthProvider;
  passwordHash?: string; // Only for local auth
  emailVerified: boolean;
  emailVerifiedAt?: Timestamp;
  lastLoginAt?: Timestamp;
  organizationId?: ID;
  settings?: IUserSettings;
  preferences?: IUserPreferences;
}

/**
 * User settings
 */
export interface IUserSettings {
  timezone?: string;
  language?: string;
  dateFormat?: string;
  timeFormat?: string;
  notifications?: INotificationSettings;
  theme?: 'light' | 'dark' | 'system';
}

/**
 * Notification settings
 */
export interface INotificationSettings {
  email?: {
    workflowSuccess?: boolean;
    workflowFailure?: boolean;
    weeklyDigest?: boolean;
  };
  inApp?: {
    workflowEvents?: boolean;
    mentions?: boolean;
    systemUpdates?: boolean;
  };
}

/**
 * User preferences
 */
export interface IUserPreferences {
  defaultWorkflowView?: 'canvas' | 'list';
  sidebarCollapsed?: boolean;
  recentWorkflows?: ID[];
  favoriteWorkflows?: ID[];
}

/**
 * User profile (public subset of user data)
 */
export interface IUserProfile {
  id: ID;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  avatar?: string;
  role: UserRole;
}

/**
 * Organization
 */
export interface IOrganization extends BaseEntity {
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  settings?: IOrganizationSettings;
  ownerId: ID;
  memberCount?: number;
  workflowCount?: number;
}

/**
 * Organization settings
 */
export interface IOrganizationSettings {
  allowMemberInvites?: boolean;
  requireEmailVerification?: boolean;
  ssoEnabled?: boolean;
  ssoProvider?: string;
  maxWorkflows?: number;
  maxExecutionsPerMonth?: number;
}

/**
 * Organization member
 */
export interface IOrganizationMember {
  id: ID;
  organizationId: ID;
  userId: ID;
  role: UserRole;
  joinedAt: Timestamp;
  invitedBy?: ID;
  user?: IUserProfile;
}

/**
 * Authentication token
 */
export interface IAuthToken {
  accessToken: string;
  refreshToken?: string;
  tokenType: 'Bearer';
  expiresIn: number;
  expiresAt: Timestamp;
}

/**
 * Login credentials
 */
export interface ILoginCredentials {
  email: string;
  password: string;
}

/**
 * Registration data
 */
export interface IRegistrationData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationName?: string;
}
