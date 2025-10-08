/**
 * Advanced Role-Based Access Control (RBAC) System
 * Provides fine-grained permissions and custom role management
 * Phase D: Community & Growth - Advanced enterprise capabilities
 */

import { Logger } from '@reporunner/core';
import { z } from 'zod';

// Permission schema
export const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  resource: z.string(), // e.g., 'workflow', 'plugin', 'user', 'organization'
  action: z.string(), // e.g., 'create', 'read', 'update', 'delete', 'execute'
  conditions: z
    .array(
      z.object({
        field: z.string(),
        operator: z.enum([
          'equals',
          'not_equals',
          'contains',
          'not_contains',
          'in',
          'not_in',
          'greater_than',
          'less_than',
        ]),
        value: z.any(),
      })
    )
    .optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Permission = z.infer<typeof PermissionSchema>;

// Role schema
export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  type: z.enum(['system', 'custom', 'inherited']),
  organizationId: z.string().optional(),
  permissions: z.array(z.string()), // Permission IDs
  inheritsFrom: z.array(z.string()).optional(), // Parent role IDs
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  metadata: z.record(z.string(), z.unknown()).optional(),
});

export type Role = z.infer<typeof RoleSchema>;

// User role assignment schema
export const UserRoleAssignmentSchema = z.object({
  id: z.string(),
  userId: z.string(),
  roleId: z.string(),
  organizationId: z.string().optional(),
  scope: z
    .object({
      resources: z.array(z.string()).optional(), // Specific resource IDs
      conditions: z
        .array(
          z.object({
            field: z.string(),
            operator: z.string(),
            value: z.any(),
          })
        )
        .optional(),
    })
    .optional(),
  expiresAt: z.date().optional(),
  assignedAt: z.date(),
  assignedBy: z.string(),
  isActive: z.boolean().default(true),
});

export type UserRoleAssignment = z.infer<typeof UserRoleAssignmentSchema>;

// System permissions
export const SYSTEM_PERMISSIONS: Permission[] = [
  // Workflow permissions
  {
    id: 'workflow:create',
    name: 'Create Workflows',
    description: 'Create new workflows',
    resource: 'workflow',
    action: 'create',
  },
  {
    id: 'workflow:read',
    name: 'View Workflows',
    description: 'View workflow details and configurations',
    resource: 'workflow',
    action: 'read',
  },
  {
    id: 'workflow:update',
    name: 'Edit Workflows',
    description: 'Modify existing workflows',
    resource: 'workflow',
    action: 'update',
  },
  {
    id: 'workflow:delete',
    name: 'Delete Workflows',
    description: 'Delete workflows',
    resource: 'workflow',
    action: 'delete',
  },
  {
    id: 'workflow:execute',
    name: 'Execute Workflows',
    description: 'Trigger workflow executions',
    resource: 'workflow',
    action: 'execute',
  },
  {
    id: 'workflow:share',
    name: 'Share Workflows',
    description: 'Share workflows with other users',
    resource: 'workflow',
    action: 'share',
  },

  // Plugin permissions
  {
    id: 'plugin:install',
    name: 'Install Plugins',
    description: 'Install plugins from marketplace',
    resource: 'plugin',
    action: 'install',
  },
  {
    id: 'plugin:uninstall',
    name: 'Uninstall Plugins',
    description: 'Remove installed plugins',
    resource: 'plugin',
    action: 'uninstall',
  },
  {
    id: 'plugin:publish',
    name: 'Publish Plugins',
    description: 'Publish plugins to marketplace',
    resource: 'plugin',
    action: 'publish',
  },
  {
    id: 'plugin:manage',
    name: 'Manage Plugins',
    description: 'Configure and manage plugin settings',
    resource: 'plugin',
    action: 'manage',
  },

  // User management permissions
  {
    id: 'user:create',
    name: 'Create Users',
    description: 'Create new user accounts',
    resource: 'user',
    action: 'create',
  },
  {
    id: 'user:read',
    name: 'View Users',
    description: 'View user profiles and information',
    resource: 'user',
    action: 'read',
  },
  {
    id: 'user:update',
    name: 'Edit Users',
    description: 'Modify user accounts and profiles',
    resource: 'user',
    action: 'update',
  },
  {
    id: 'user:delete',
    name: 'Delete Users',
    description: 'Delete user accounts',
    resource: 'user',
    action: 'delete',
  },
  {
    id: 'user:impersonate',
    name: 'Impersonate Users',
    description: 'Act on behalf of other users',
    resource: 'user',
    action: 'impersonate',
  },

  // Organization permissions
  {
    id: 'organization:read',
    name: 'View Organization',
    description: 'View organization details and settings',
    resource: 'organization',
    action: 'read',
  },
  {
    id: 'organization:update',
    name: 'Manage Organization',
    description: 'Modify organization settings',
    resource: 'organization',
    action: 'update',
  },
  {
    id: 'organization:billing',
    name: 'Manage Billing',
    description: 'Access and manage billing information',
    resource: 'organization',
    action: 'billing',
  },

  // Role management permissions
  {
    id: 'role:create',
    name: 'Create Roles',
    description: 'Create custom roles',
    resource: 'role',
    action: 'create',
  },
  {
    id: 'role:read',
    name: 'View Roles',
    description: 'View role definitions and assignments',
    resource: 'role',
    action: 'read',
  },
  {
    id: 'role:update',
    name: 'Edit Roles',
    description: 'Modify role permissions and settings',
    resource: 'role',
    action: 'update',
  },
  {
    id: 'role:delete',
    name: 'Delete Roles',
    description: 'Delete custom roles',
    resource: 'role',
    action: 'delete',
  },
  {
    id: 'role:assign',
    name: 'Assign Roles',
    description: 'Assign roles to users',
    resource: 'role',
    action: 'assign',
  },

  // Analytics and audit permissions
  {
    id: 'analytics:read',
    name: 'View Analytics',
    description: 'Access analytics and reporting data',
    resource: 'analytics',
    action: 'read',
  },
  {
    id: 'audit:read',
    name: 'View Audit Logs',
    description: 'Access audit logs and compliance reports',
    resource: 'audit',
    action: 'read',
  },
  {
    id: 'audit:export',
    name: 'Export Audit Data',
    description: 'Export audit logs and compliance data',
    resource: 'audit',
    action: 'export',
  },
];

// System roles
export const SYSTEM_ROLES: Omit<Role, 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
  {
    id: 'super_admin',
    name: 'Super Administrator',
    description: 'Full system access with all permissions',
    type: 'system',
    permissions: SYSTEM_PERMISSIONS.map((p) => p.id),
    isActive: true,
  },
  {
    id: 'organization_admin',
    name: 'Organization Administrator',
    description: 'Full access within organization scope',
    type: 'system',
    permissions: [
      'workflow:create',
      'workflow:read',
      'workflow:update',
      'workflow:delete',
      'workflow:execute',
      'workflow:share',
      'plugin:install',
      'plugin:uninstall',
      'plugin:manage',
      'user:create',
      'user:read',
      'user:update',
      'user:delete',
      'organization:read',
      'organization:update',
      'organization:billing',
      'role:create',
      'role:read',
      'role:update',
      'role:delete',
      'role:assign',
      'analytics:read',
      'audit:read',
      'audit:export',
    ],
    isActive: true,
  },
  {
    id: 'workflow_admin',
    name: 'Workflow Administrator',
    description: 'Full workflow management capabilities',
    type: 'system',
    permissions: [
      'workflow:create',
      'workflow:read',
      'workflow:update',
      'workflow:delete',
      'workflow:execute',
      'workflow:share',
      'plugin:install',
      'plugin:uninstall',
      'plugin:manage',
      'analytics:read',
    ],
    isActive: true,
  },
  {
    id: 'developer',
    name: 'Developer',
    description: 'Development and workflow creation access',
    type: 'system',
    permissions: [
      'workflow:create',
      'workflow:read',
      'workflow:update',
      'workflow:execute',
      'workflow:share',
      'plugin:install',
      'plugin:publish',
      'plugin:manage',
      'analytics:read',
    ],
    isActive: true,
  },
  {
    id: 'analyst',
    name: 'Analyst',
    description: 'Read-only access with analytics capabilities',
    type: 'system',
    permissions: ['workflow:read', 'workflow:execute', 'analytics:read', 'audit:read'],
    isActive: true,
  },
  {
    id: 'viewer',
    name: 'Viewer',
    description: 'Read-only access to workflows and basic features',
    type: 'system',
    permissions: ['workflow:read', 'plugin:install'],
    isActive: true,
  },
];

export class AdvancedRBAC {
  private logger: Logger;
  private permissions = new Map<string, Permission>();
  private roles = new Map<string, Role>();
  private userRoleAssignments = new Map<string, UserRoleAssignment[]>();

  constructor() {
    this.logger = new Logger('AdvancedRBAC');
    this.initializeSystemPermissions();
    this.initializeSystemRoles();
  }

  /**
   * Initialize system permissions
   */
  private initializeSystemPermissions(): void {
    SYSTEM_PERMISSIONS.forEach((permission) => {
      this.permissions.set(permission.id, permission);
    });
    this.logger.info(`Initialized ${SYSTEM_PERMISSIONS.length} system permissions`);
  }

  /**
   * Initialize system roles
   */
  private initializeSystemRoles(): void {
    const now = new Date();
    SYSTEM_ROLES.forEach((roleData) => {
      const role: Role = {
        ...roleData,
        createdAt: now,
        updatedAt: now,
        createdBy: 'system',
      };
      this.roles.set(role.id, role);
    });
    this.logger.info(`Initialized ${SYSTEM_ROLES.length} system roles`);
  }

  /**
   * Create custom permission
   */
  async createPermission(permission: Omit<Permission, 'id'>): Promise<{
    success: boolean;
    permission?: Permission;
    error?: string;
  }> {
    try {
      const id = `custom:${permission.resource}:${permission.action}:${Date.now()}`;
      const newPermission: Permission = {
        ...permission,
        id,
      };

      const validated = PermissionSchema.parse(newPermission);
      this.permissions.set(validated.id, validated);

      this.logger.info(`Custom permission created: ${validated.id}`);
      return { success: true, permission: validated };
    } catch (error) {
      this.logger.error('Failed to create permission:', error);
      return { success: false, error: 'Invalid permission data' };
    }
  }

  /**
   * Create custom role
   */
  async createRole(
    roleData: Omit<Role, 'id' | 'createdAt' | 'updatedAt'>,
    createdBy: string
  ): Promise<{
    success: boolean;
    role?: Role;
    error?: string;
  }> {
    try {
      const id = `custom:${roleData.name.toLowerCase().replace(/\s+/g, '_')}:${Date.now()}`;
      const now = new Date();

      const role: Role = {
        ...roleData,
        id,
        type: 'custom',
        createdAt: now,
        updatedAt: now,
        createdBy,
      };

      // Validate permissions exist
      for (const permissionId of role.permissions) {
        if (!this.permissions.has(permissionId)) {
          return { success: false, error: `Permission not found: ${permissionId}` };
        }
      }

      const validated = RoleSchema.parse(role);
      this.roles.set(validated.id, validated);

      this.logger.info(`Custom role created: ${validated.id} by ${createdBy}`);
      return { success: true, role: validated };
    } catch (error) {
      this.logger.error('Failed to create role:', error);
      return { success: false, error: 'Invalid role data' };
    }
  }

  /**
   * Assign role to user
   */
  async assignRole(assignment: Omit<UserRoleAssignment, 'id' | 'assignedAt'>): Promise<{
    success: boolean;
    assignment?: UserRoleAssignment;
    error?: string;
  }> {
    try {
      // Validate role exists
      if (!this.roles.has(assignment.roleId)) {
        return { success: false, error: 'Role not found' };
      }

      const id = `${assignment.userId}:${assignment.roleId}:${Date.now()}`;
      const roleAssignment: UserRoleAssignment = {
        ...assignment,
        id,
        assignedAt: new Date(),
      };

      const validated = UserRoleAssignmentSchema.parse(roleAssignment);

      // Add to user's role assignments
      const userAssignments = this.userRoleAssignments.get(assignment.userId) || [];
      userAssignments.push(validated);
      this.userRoleAssignments.set(assignment.userId, userAssignments);

      this.logger.info(`Role ${assignment.roleId} assigned to user ${assignment.userId}`);
      return { success: true, assignment: validated };
    } catch (error) {
      this.logger.error('Failed to assign role:', error);
      return { success: false, error: 'Invalid assignment data' };
    }
  }

  /**
   * Check if user has permission
   */
  async hasPermission(
    userId: string,
    permissionId: string,
    context?: {
      organizationId?: string;
      resourceId?: string;
      resourceData?: Record<string, unknown>;
    }
  ): Promise<boolean> {
    try {
      const userAssignments = this.userRoleAssignments.get(userId) || [];
      const activeAssignments = userAssignments.filter(
        (assignment) =>
          assignment.isActive &&
          (!assignment.expiresAt || assignment.expiresAt > new Date()) &&
          (!context?.organizationId || assignment.organizationId === context.organizationId)
      );

      for (const assignment of activeAssignments) {
        const role = this.roles.get(assignment.roleId);
        if (!role?.isActive) {
          continue;
        }

        // Check direct permissions
        if (role.permissions.includes(permissionId)) {
          // Check scope conditions if any
          if (assignment.scope?.conditions) {
            const conditionsMet = this.evaluateConditions(
              assignment.scope.conditions,
              context?.resourceData || {}
            );
            if (!conditionsMet) {
              continue;
            }
          }

          // Check resource scope if any
          if (assignment.scope?.resources && context?.resourceId) {
            if (!assignment.scope.resources.includes(context.resourceId)) {
              continue;
            }
          }

          return true;
        }

        // Check inherited permissions
        if (role.inheritsFrom) {
          for (const parentRoleId of role.inheritsFrom) {
            const parentRole = this.roles.get(parentRoleId);
            if (parentRole?.isActive && parentRole.permissions.includes(permissionId)) {
              return true;
            }
          }
        }
      }

      return false;
    } catch (error) {
      this.logger.error('Permission check failed:', error);
      return false;
    }
  }

  /**
   * Get user permissions
   */
  async getUserPermissions(userId: string, organizationId?: string): Promise<Permission[]> {
    const userAssignments = this.userRoleAssignments.get(userId) || [];
    const activeAssignments = userAssignments.filter(
      (assignment) =>
        assignment.isActive &&
        (!assignment.expiresAt || assignment.expiresAt > new Date()) &&
        (!organizationId || assignment.organizationId === organizationId)
    );

    const permissionIds = new Set<string>();

    for (const assignment of activeAssignments) {
      const role = this.roles.get(assignment.roleId);
      if (!role?.isActive) {
        continue;
      }

      // Add direct permissions
      for (const permissionId of role.permissions) {
        permissionIds.add(permissionId);
      }

      // Add inherited permissions
      if (role.inheritsFrom) {
        for (const parentRoleId of role.inheritsFrom) {
          const parentRole = this.roles.get(parentRoleId);
          if (parentRole?.isActive) {
            for (const permissionId of parentRole.permissions) {
              permissionIds.add(permissionId);
            }
          }
        }
      }
    }

    return Array.from(permissionIds)
      .map((id) => this.permissions.get(id))
      .filter((permission): permission is Permission => permission !== undefined);
  }

  /**
   * Get user roles
   */
  async getUserRoles(userId: string, organizationId?: string): Promise<Role[]> {
    const userAssignments = this.userRoleAssignments.get(userId) || [];
    const activeAssignments = userAssignments.filter(
      (assignment) =>
        assignment.isActive &&
        (!assignment.expiresAt || assignment.expiresAt > new Date()) &&
        (!organizationId || assignment.organizationId === organizationId)
    );

    return activeAssignments
      .map((assignment) => this.roles.get(assignment.roleId))
      .filter((role): role is Role => role !== undefined && role.isActive);
  }

  /**
   * Revoke role from user
   */
  async revokeRole(
    userId: string,
    roleId: string,
    organizationId?: string
  ): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const userAssignments = this.userRoleAssignments.get(userId) || [];
      const updatedAssignments = userAssignments.map((assignment) => {
        if (
          assignment.roleId === roleId &&
          (!organizationId || assignment.organizationId === organizationId)
        ) {
          return { ...assignment, isActive: false };
        }
        return assignment;
      });

      this.userRoleAssignments.set(userId, updatedAssignments);
      this.logger.info(`Role ${roleId} revoked from user ${userId}`);

      return { success: true };
    } catch (error) {
      this.logger.error('Failed to revoke role:', error);
      return { success: false, error: 'Failed to revoke role' };
    }
  }

  /**
   * Get all roles
   */
  async getAllRoles(organizationId?: string): Promise<Role[]> {
    return Array.from(this.roles.values()).filter(
      (role) =>
        role.isActive &&
        (!(organizationId && role.organizationId) || role.organizationId === organizationId)
    );
  }

  /**
   * Get all permissions
   */
  async getAllPermissions(): Promise<Permission[]> {
    return Array.from(this.permissions.values());
  }

  /**
   * Evaluate conditions
   */
  private evaluateConditions(
    conditions: Array<{ field: string; operator: string; value: unknown }>,
    resourceData: Record<string, unknown>
  ): boolean {
    return conditions.every((condition) => {
      const fieldValue = resourceData[condition.field];

      switch (condition.operator) {
        case 'equals':
          return fieldValue === condition.value;
        case 'not_equals':
          return fieldValue !== condition.value;
        case 'contains':
          return String(fieldValue).includes(String(condition.value));
        case 'not_contains':
          return !String(fieldValue).includes(String(condition.value));
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(fieldValue);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(fieldValue);
        case 'greater_than':
          return Number(fieldValue) > Number(condition.value);
        case 'less_than':
          return Number(fieldValue) < Number(condition.value);
        default:
          return false;
      }
    });
  }

  /**
   * Get role hierarchy
   */
  async getRoleHierarchy(roleId: string): Promise<{
    role: Role;
    parents: Role[];
    children: Role[];
  } | null> {
    const role = this.roles.get(roleId);
    if (!role) {
      return null;
    }

    const parents = role.inheritsFrom
      ? role.inheritsFrom.map((id) => this.roles.get(id)).filter((r): r is Role => r !== undefined)
      : [];

    const children = Array.from(this.roles.values()).filter((r) =>
      r.inheritsFrom?.includes(roleId)
    );

    return { role, parents, children };
  }
}
