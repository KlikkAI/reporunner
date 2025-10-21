// User and Organization types reusing patterns from API types
export interface UserProfile {
  id: string;
  email: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  mfaEnabled: boolean;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationInfo {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  settings: {
    allowSignup: boolean;
    requireEmailVerification: boolean;
    enforceStrongPasswords: boolean;
    sessionTimeout: number;
    maxUsers?: number;
  };
  subscription?: {
    plan: string;
    status: string;
    expiresAt?: Date;
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  isSystemRole: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMembership {
  userId: string;
  organizationId: string;
  roleId: string;
  status: 'active' | 'pending' | 'suspended';
  invitedBy?: string;
  joinedAt: Date;
  expiresAt?: Date;
}

export interface AuthUser extends UserProfile {
  organizationId: string;
  role: UserRole;
  permissions: string[];
  membership: UserMembership;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  organizationId: string;
  roleId?: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  displayName?: string;
  avatar?: string;
}

export interface CreateOrganizationRequest {
  name: string;
  slug: string;
  description?: string;
  settings?: Partial<OrganizationInfo['settings']>;
}

export interface UpdateOrganizationRequest {
  name?: string;
  description?: string;
  logo?: string;
  settings?: Partial<OrganizationInfo['settings']>;
}
