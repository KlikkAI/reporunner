/**
 * RBAC (Role-Based Access Control) Store
 * Manages user permissions, roles, and organization access
 */

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

/**
 * User role types
 */
export type UserRole = 'admin' | 'owner' | 'member' | 'viewer';

/**
 * Permission type
 */
export type Permission =
  | 'workflow:read'
  | 'workflow:write'
  | 'workflow:delete'
  | 'workflow:execute'
  | 'organization:read'
  | 'organization:write'
  | 'organization:delete'
  | 'user:read'
  | 'user:write'
  | 'user:delete'
  | 'credential:read'
  | 'credential:write'
  | 'credential:delete';

/**
 * Organization interface
 */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  role: UserRole;
  permissions: Permission[];
}

/**
 * RBAC Store State
 */
interface RBACState {
  // Current user role
  currentRole: UserRole;

  // Organizations the user belongs to
  organizations: Organization[];

  // Current organization
  currentOrganization: Organization | null;

  // User permissions
  permissions: Permission[];

  // Actions
  setCurrentRole: (role: UserRole) => void;
  setOrganizations: (organizations: Organization[]) => void;
  setCurrentOrganization: (organization: Organization | null) => void;
  addPermission: (permission: Permission) => void;
  removePermission: (permission: Permission) => void;
  hasPermission: (permission: Permission) => boolean;
  canManageOrganization: () => boolean;
  canEditWorkflow: () => boolean;
  canDeleteWorkflow: () => boolean;
  canExecuteWorkflow: () => boolean;
  reset: () => void;
}

/**
 * Initial state
 */
const initialState = {
  currentRole: 'viewer' as UserRole,
  organizations: [],
  currentOrganization: null,
  permissions: [] as Permission[],
};

/**
 * RBAC Store
 */
export const useRBACStore = create<RBACState>()(
  devtools(
    (set, get) => ({
      ...initialState,

      setCurrentRole: (role) => set({ currentRole: role }),

      setOrganizations: (organizations) => set({ organizations }),

      setCurrentOrganization: (organization) => set({ currentOrganization: organization }),

      addPermission: (permission) =>
        set((state) => ({
          permissions: [...new Set([...state.permissions, permission])],
        })),

      removePermission: (permission) =>
        set((state) => ({
          permissions: state.permissions.filter((p) => p !== permission),
        })),

      hasPermission: (permission) => {
        const { permissions, currentRole } = get();

        // Admin has all permissions
        if (currentRole === 'admin') {
          return true;
        }

        // Check explicit permissions
        return permissions.includes(permission);
      },

      canManageOrganization: () => {
        const { currentRole, hasPermission } = get();
        return currentRole === 'admin' || currentRole === 'owner' || hasPermission('organization:write');
      },

      canEditWorkflow: () => {
        const { currentRole, hasPermission } = get();
        return (
          currentRole === 'admin' ||
          currentRole === 'owner' ||
          currentRole === 'member' ||
          hasPermission('workflow:write')
        );
      },

      canDeleteWorkflow: () => {
        const { currentRole, hasPermission } = get();
        return currentRole === 'admin' || currentRole === 'owner' || hasPermission('workflow:delete');
      },

      canExecuteWorkflow: () => {
        const { currentRole, hasPermission } = get();
        return (
          currentRole === 'admin' ||
          currentRole === 'owner' ||
          currentRole === 'member' ||
          hasPermission('workflow:execute')
        );
      },

      reset: () => set(initialState),
    }),
    { name: 'rbac-store' }
  )
);

/**
 * Selector hooks for specific store slices
 */
export const useCurrentRole = () => useRBACStore((state) => state.currentRole);
export const useOrganizations = () => useRBACStore((state) => state.organizations);
export const useCurrentOrganization = () => useRBACStore((state) => state.currentOrganization);
export const usePermissions = () => useRBACStore((state) => state.permissions);
