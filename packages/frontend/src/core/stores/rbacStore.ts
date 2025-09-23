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
          // In a real app, would get current user ID from auth store
          // state.refreshPermissions(currentUserId)
        }
      },

      setCurrentTeam: (teamId: string | null) => {
        set({ currentTeamId: teamId });
      },

      // Permission checking methods
      hasPermission: (resource: string, action: string, resourceId?: string) => {
        const { currentOrganizationId } = get();
        // In a real app, would get current user ID from auth store
        const currentUserId = 'current-user-id'; // Placeholder

        return rbacService.hasPermission(
          currentUserId,
          resource,
          action,
          resourceId,
          currentOrganizationId || undefined
        );
      },

      canAccessWorkflow: (workflowId: string, action: string) => {
        return get().hasPermission('workflow', action, workflowId);
      },

      canManageOrganization: () => {
        return get().hasPermission('organization', 'update');
      },

      canManageUsers: () => {
        return get().hasPermission('user', 'update');
      },

      // Organization management
      createOrganization: async (orgData) => {
        set({ isLoading: true, error: null });
        try {
          const organization = rbacService.createOrganization(orgData);

          const state = get();
          set({
            organizations: [...state.organizations, organization],
            currentOrganizationId: organization.id,
            isLoading: false,
          });

          return organization;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to create organization',
          });
          throw error;
        }
      },

      updateOrganization: async (orgId: string, updates: Partial<Organization>) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const orgIndex = state.organizations.findIndex((org) => org.id === orgId);

          if (orgIndex === -1) {
            throw new Error('Organization not found');
          }

          const updatedOrg = {
            ...state.organizations[orgIndex],
            ...updates,
            updatedAt: new Date(),
          };

          const updatedOrganizations = [...state.organizations];
          updatedOrganizations[orgIndex] = updatedOrg;

          set({
            organizations: updatedOrganizations,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to update organization',
          });
          throw error;
        }
      },

      inviteUser: async (
        _organizationId: string,
        _email: string,
        _role: OrganizationMember['role']
      ) => {
        set({ isLoading: true, error: null });
        try {
          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to invite user',
          });
          throw error;
        }
      },

      removeUser: async (organizationId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Remove user from organization
          rbacService.removeRole(userId, 'organization_owner', organizationId);
          rbacService.removeRole(userId, 'workflow_admin', organizationId);
          rbacService.removeRole(userId, 'workflow_editor', organizationId);
          rbacService.removeRole(userId, 'workflow_viewer', organizationId);

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to remove user',
          });
          throw error;
        }
      },

      updateUserRole: async (
        organizationId: string,
        userId: string,
        role: OrganizationMember['role']
      ) => {
        set({ isLoading: true, error: null });
        try {
          // Remove existing organization roles
          await get().removeUser(organizationId, userId);

          // Add new role
          const systemRoleMap: Record<OrganizationMember['role'], string> = {
            owner: 'organization_owner',
            admin: 'workflow_admin',
            member: 'workflow_editor',
            viewer: 'workflow_viewer',
          };

          rbacService.assignRole(userId, systemRoleMap[role], organizationId);

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to update user role',
          });
          throw error;
        }
      },

      // Team management
      createTeam: async (teamData) => {
        set({ isLoading: true, error: null });
        try {
          const team = rbacService.createTeam(teamData);

          const state = get();
          set({
            teams: [...state.teams, team],
            isLoading: false,
          });

          return team;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to create team',
          });
          throw error;
        }
      },

      updateTeam: async (teamId: string, updates: Partial<Team>) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const teamIndex = state.teams.findIndex((team) => team.id === teamId);

          if (teamIndex === -1) {
            throw new Error('Team not found');
          }

          const updatedTeam = {
            ...state.teams[teamIndex],
            ...updates,
          };

          const updatedTeams = [...state.teams];
          updatedTeams[teamIndex] = updatedTeam;

          set({
            teams: updatedTeams,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to update team',
          });
          throw error;
        }
      },

      addTeamMember: async (teamId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          rbacService.addTeamMember(teamId, userId);

          // Refresh teams
          const state = get();
          await state.loadTeams(state.currentOrganizationId || undefined);

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to add team member',
          });
          throw error;
        }
      },

      removeTeamMember: async (teamId: string, userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const state = get();
          const team = state.teams.find((t) => t.id === teamId);

          if (team) {
            const updatedMembers = team.members.filter((id) => id !== userId);
            await state.updateTeam(teamId, { members: updatedMembers });
          }

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to remove team member',
          });
          throw error;
        }
      },

      // Role management
      createRole: async (roleData) => {
        set({ isLoading: true, error: null });
        try {
          const role = rbacService.createCustomRole(
            roleData.name,
            roleData.description,
            roleData.permissions,
            roleData.organizationId
          );

          const state = get();
          set({
            roles: [...state.roles, role],
            isLoading: false,
          });

          return role;
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to create role',
          });
          throw error;
        }
      },

      updateRole: async (roleId: string, updates: Partial<Role>) => {
        set({ isLoading: true, error: null });
        try {
          const updatedRole = rbacService.updateRole(roleId, updates);

          const state = get();
          const roleIndex = state.roles.findIndex((role) => role.id === roleId);

          if (roleIndex !== -1) {
            const updatedRoles = [...state.roles];
            updatedRoles[roleIndex] = updatedRole;

            set({
              roles: updatedRoles,
              isLoading: false,
            });
          }
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to update role',
          });
          throw error;
        }
      },

      deleteRole: async (roleId: string) => {
        set({ isLoading: true, error: null });
        try {
          rbacService.deleteRole(roleId);

          const state = get();
          set({
            roles: state.roles.filter((role) => role.id !== roleId),
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to delete role',
          });
          throw error;
        }
      },

      assignRole: async (userId: string, roleId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { currentOrganizationId } = get();
          rbacService.assignRole(userId, roleId, currentOrganizationId || undefined);

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to assign role',
          });
          throw error;
        }
      },

      removeRole: async (userId: string, roleId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { currentOrganizationId } = get();
          rbacService.removeRole(userId, roleId, currentOrganizationId || undefined);

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to remove role',
          });
          throw error;
        }
      },

      // Data loading
      loadUserContext: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          const { currentOrganizationId } = get();

          const userRoles = rbacService.getUserRoles(userId, currentOrganizationId || undefined);
          const userPermissions = rbacService.getUserPermissions(
            userId,
            currentOrganizationId || undefined
          );

          set({
            userRoles,
            userPermissions,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to load user context',
          });
          throw error;
        }
      },

      loadOrganizations: async () => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, this would fetch from API
          const organizations: Organization[] = [];

          set({
            organizations,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to load organizations',
          });
          throw error;
        }
      },

      loadTeams: async (organizationId?: string) => {
        set({ isLoading: true, error: null });
        try {
          // In a real app, would get current user ID from auth store
          const currentUserId = 'current-user-id'; // Placeholder
          const teams = rbacService.getUserTeams(currentUserId, organizationId);

          set({
            teams,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to load teams',
          });
          throw error;
        }
      },

      loadRoles: async (organizationId?: string) => {
        set({ isLoading: true, error: null });
        try {
          const roles = rbacService.getAllRoles(organizationId);

          set({
            roles,
            isLoading: false,
          });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to load roles',
          });
          throw error;
        }
      },

      // Utility actions
      clearError: () => set({ error: null }),

      refreshPermissions: async (userId: string) => {
        const { currentOrganizationId } = get();
        const userPermissions = rbacService.getUserPermissions(
          userId,
          currentOrganizationId || undefined
        );

        set({ userPermissions });
      },
    }),
    {
      name: 'rbac-storage',
      partialize: (state) => ({
        currentOrganizationId: state.currentOrganizationId,
        currentTeamId: state.currentTeamId,
      }),
    }
  )
);
