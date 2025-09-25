import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  type Organization,
  type OrganizationMember,
  type Permission,
  type Role,
  rbacService,
  type Team,
  type UserRole,
} from '@/core/services/rbacService';

interface RBACState {
  // Current user context
  currentOrganizationId: string | null;
  currentTeamId: string | null;
  userRoles: UserRole[];
  userPermissions: Permission[];

  // Data
  organizations: Organization[];
  teams: Team[];
  roles: Role[];
  organizationMembers: OrganizationMember[];

  // Loading states
  isLoading: boolean;
  error: string | null;

  // Actions
  setCurrentOrganization: (organizationId: string | null) => void;
  setCurrentTeam: (teamId: string | null) => void;

  // Permission checking
  hasPermission: (resource: string, action: string, resourceId?: string) => boolean;
  canAccessWorkflow: (workflowId: string, action: string) => boolean;
  canManageOrganization: () => boolean;
  canManageUsers: () => boolean;

  // Organization management
  createOrganization: (
    orgData: Omit<Organization, 'id' | 'createdAt' | 'updatedAt'>
  ) => Promise<Organization>;
  updateOrganization: (orgId: string, updates: Partial<Organization>) => Promise<void>;
  inviteUser: (
    organizationId: string,
    email: string,
    role: OrganizationMember['role']
  ) => Promise<void>;
  removeUser: (organizationId: string, userId: string) => Promise<void>;
  updateUserRole: (
    organizationId: string,
    userId: string,
    role: OrganizationMember['role']
  ) => Promise<void>;

  // Team management
  createTeam: (teamData: Omit<Team, 'id' | 'createdAt'>) => Promise<Team>;
  updateTeam: (teamId: string, updates: Partial<Team>) => Promise<void>;
  addTeamMember: (teamId: string, userId: string) => Promise<void>;
  removeTeamMember: (teamId: string, userId: string) => Promise<void>;

  // Role management
  createRole: (roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Role>;
  updateRole: (roleId: string, updates: Partial<Role>) => Promise<void>;
  deleteRole: (roleId: string) => Promise<void>;
  assignRole: (userId: string, roleId: string) => Promise<void>;
  removeRole: (userId: string, roleId: string) => Promise<void>;

  // Data loading
  loadUserContext: (userId: string) => Promise<void>;
  loadOrganizations: () => Promise<void>;
  loadTeams: (organizationId?: string) => Promise<void>;
  loadRoles: (organizationId?: string) => Promise<void>;

  // Utility actions
  clearError: () => void;
  refreshPermissions: (userId: string) => Promise<void>;
}

export const useRBACStore = create<RBACState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentOrganizationId: null,
      currentTeamId: null,
      userRoles: [],
      userPermissions: [],
      organizations: [],
      teams: [],
      roles: [],
      organizationMembers: [],
      isLoading: false,
      error: null,

      // Context setters
      setCurrentOrganization: (organizationId: string | null) => {
        set({ currentOrganizationId: organizationId });
        // Reload user permissions for new context
        if (organizationId) {
