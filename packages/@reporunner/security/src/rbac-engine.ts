import { Logger } from '@reporunner/core';
import { z } from 'zod';

export interface Permission {
  id: string;
  name: string;
  resource: string;
  action: string;
  conditions?: Record<string, any>;
  description?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  inherits?: string[];
  isSystem?: boolean;
  organizationId?: string;
}

export interface User {
  id: string;
  email: string;
  roles: string[];
  organizationId?: string;
  attributes?: Record<string, any>;
}

export interface RBACContext {
  user: User;
  resource: string;
  action: string;
  resourceId?: string;
  organizationId?: string;
  attributes?: Record<string, any>;
}

export interface AccessDecision {
  allowed: boolean;
  reason: string;
  appliedRules: string[];
  conditions?: Record<string, any>;
}

const PermissionSchema = z.object({
  id: z.string(),
  name: z.string(),
  resource: z.string(),
  action: z.string(),
  conditions: z.record(z.any()).optional(),
  description: z.string().optional(),
});

const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  permissions: z.array(z.string()),
  inherits: z.array(z.string()).optional(),
  isSystem: z.boolean().optional(),
  organizationId: z.string().optional(),
});

export class RBACEngine {
  private logger: Logger;
  private permissions = new Map<string, Permission>();
  private roles = new Map<string, Role>();
  private userRoleCache = new Map<string, string[]>();
  private permissionCache = new Map<string, Set<string>>();

  constructor() {
    this.logger = new Logger('RBACEngine');
    this.initializeSystemRoles();
  }

  /**
   * Add permission to the system
   */
  addPermission(permission: Permission): void {
    try {
      const validatedPermission = PermissionSchema.parse(permission);
      this.permissions.set(permission.id, validatedPermission);
      this.clearCache();

      this.logger.debug('Permission added', { permissionId: permission.id });
    } catch (error) {
      this.logger.error('Failed to add permission', { error, permission });
      throw new Error('Invalid permission data');
    }
  }

  /**
   * Add role to the system
   */
  addRole(role: Role): void {
    try {
      const validatedRole = RoleSchema.parse(role);

      // Validate that all permissions exist
      for (const permissionId of role.permissions) {
        if (!this.permissions.has(permissionId)) {
          throw new Error(`Permission ${permissionId} does not exist`);
        }
      }

      // Validate inheritance chain
      if (role.inherits) {
        for (const inheritedRoleId of role.inherits) {
          if (!this.roles.has(inheritedRoleId)) {
            throw new Error(`Inherited role ${inheritedRoleId} does not exist`);
          }
        }
      }

      this.roles.set(role.id, validatedRole);
      this.clearCache();

      this.logger.debug('Role added', { roleId: role.id });
    } catch (error) {
      this.logger.error('Failed to add role', { error, role });
      throw error;
    }
  }

  /**
   * Check if user has permission for specific action
   */
  async checkPermission(context: RBACContext): Promise<AccessDecision> {
    try {
      const { user, resource, action, resourceId, organizationId } = context;

      // Get all user permissions (including inherited)
      const userPermissions = this.getUserPermissions(user.id);

      // Check for matching permissions
      const matchingPermissions = Array.from(userPermissions)
        .map((permId) => this.permissions.get(permId))
        .filter((perm) => perm && perm.resource === resource && perm.action === action);

      if (matchingPermissions.length === 0) {
        return {
          allowed: false,
          reason: `No permission found for ${action} on ${resource}`,
          appliedRules: [],
        };
      }

      // Evaluate conditions for each matching permission
      for (const permission of matchingPermissions) {
        if (!permission) {
          continue;
        }

        const conditionResult = await this.evaluateConditions(permission.conditions || {}, context);

        if (conditionResult.allowed) {
          return {
            allowed: true,
            reason: `Permission ${permission.name} granted`,
            appliedRules: [permission.id],
            conditions: conditionResult.conditions,
          };
        }
      }

      return {
        allowed: false,
        reason: 'Permission conditions not met',
        appliedRules: matchingPermissions.map((p) => p?.id),
      };
    } catch (error) {
      this.logger.error('Failed to check permission', { error, context });
      return {
        allowed: false,
        reason: 'Permission check failed',
        appliedRules: [],
      };
    }
  }

  /**
   * Check multiple permissions at once
   */
  async checkPermissions(contexts: RBACContext[]): Promise<Record<string, AccessDecision>> {
    const results: Record<string, AccessDecision> = {};

    for (const context of contexts) {
      const key = `${context.resource}:${context.action}:${context.resourceId || '*'}`;
      results[key] = await this.checkPermission(context);
    }

    return results;
  }

  /**
   * Get all permissions for a user
   */
  getUserPermissions(userId: string): Set<string> {
    if (this.permissionCache.has(userId)) {
      return this.permissionCache.get(userId)!;
    }

    const userRoles = this.userRoleCache.get(userId) || [];
    const permissions = new Set<string>();

    for (const roleId of userRoles) {
      const rolePermissions = this.getRolePermissions(roleId);
      rolePermissions.forEach((perm) => permissions.add(perm));
    }

    this.permissionCache.set(userId, permissions);
    return permissions;
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  getRolePermissions(roleId: string): Set<string> {
    const role = this.roles.get(roleId);
    if (!role) {
      return new Set();
    }

    const permissions = new Set(role.permissions);

    // Add inherited permissions
    if (role.inherits) {
      for (const inheritedRoleId of role.inherits) {
        const inheritedPermissions = this.getRolePermissions(inheritedRoleId);
        inheritedPermissions.forEach((perm) => permissions.add(perm));
      }
    }

    return permissions;
  }

  /**
   * Assign role to user
   */
  assignRole(userId: string, roleId: string): void {
    if (!this.roles.has(roleId)) {
      throw new Error(`Role ${roleId} does not exist`);
    }

    const userRoles = this.userRoleCache.get(userId) || [];
    if (!userRoles.includes(roleId)) {
      userRoles.push(roleId);
      this.userRoleCache.set(userId, userRoles);
      this.permissionCache.delete(userId); // Clear permission cache
    }

    this.logger.debug('Role assigned to user', { userId, roleId });
  }

  /**
   * Remove role from user
   */
  removeRole(userId: string, roleId: string): void {
    const userRoles = this.userRoleCache.get(userId) || [];
    const updatedRoles = userRoles.filter((id) => id !== roleId);

    this.userRoleCache.set(userId, updatedRoles);
    this.permissionCache.delete(userId); // Clear permission cache

    this.logger.debug('Role removed from user', { userId, roleId });
  }

  /**
   * Get user's effective roles (including inherited)
   */
  getUserRoles(userId: string): Role[] {
    const roleIds = this.userRoleCache.get(userId) || [];
    const roles: Role[] = [];

    for (const roleId of roleIds) {
      const role = this.roles.get(roleId);
      if (role) {
        roles.push(role);

        // Add inherited roles
        if (role.inherits) {
          for (const inheritedRoleId of role.inherits) {
            const inheritedRole = this.roles.get(inheritedRoleId);
            if (inheritedRole && !roles.find((r) => r.id === inheritedRole.id)) {
              roles.push(inheritedRole);
            }
          }
        }
      }
    }

    return roles;
  }

  /**
   * Create permission middleware for Express
   */
  createPermissionMiddleware(resource: string, action: string) {
    return async (req: any, res: any, next: any) => {
      try {
        const user = req.user;
        if (!user) {
          return res.status(401).json({ error: 'Authentication required' });
        }

        const context: RBACContext = {
          user,
          resource,
          action,
          resourceId: req.params.id,
          organizationId: user.organizationId,
          attributes: {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            method: req.method,
            path: req.path,
          },
        };

        const decision = await this.checkPermission(context);

        if (!decision.allowed) {
          this.logger.warn('Access denied', {
            userId: user.id,
            resource,
            action,
            reason: decision.reason,
          });

          return res.status(403).json({
            error: 'Access denied',
            reason: decision.reason,
          });
        }

        // Add permission context to request
        req.rbac = {
          decision,
          permissions: this.getUserPermissions(user.id),
        };

        next();
      } catch (error) {
        this.logger.error('Permission middleware error', { error });
        res.status(500).json({ error: 'Permission check failed' });
      }
    };
  }

  private async evaluateConditions(
    conditions: Record<string, any>,
    context: RBACContext
  ): Promise<{ allowed: boolean; conditions?: Record<string, any> }> {
    // If no conditions, allow access
    if (Object.keys(conditions).length === 0) {
      return { allowed: true };
    }

    const evaluatedConditions: Record<string, any> = {};

    // Organization-based access
    if (conditions.organizationId) {
      if (context.user.organizationId !== conditions.organizationId) {
        return { allowed: false };
      }
      evaluatedConditions.organizationId = conditions.organizationId;
    }

    // Resource ownership
    if (conditions.owner && context.resourceId) {
      // This would typically check against a database
      // For now, we'll assume the condition is met
      evaluatedConditions.owner = conditions.owner;
    }

    // Time-based access
    if (conditions.timeRange) {
      const now = new Date();
      const { start, end } = conditions.timeRange;

      if (start && now < new Date(start)) {
        return { allowed: false };
      }
      if (end && now > new Date(end)) {
        return { allowed: false };
      }

      evaluatedConditions.timeRange = conditions.timeRange;
    }

    // IP-based access
    if (conditions.allowedIPs && context.attributes?.ip) {
      const allowedIPs = Array.isArray(conditions.allowedIPs)
        ? conditions.allowedIPs
        : [conditions.allowedIPs];

      if (!allowedIPs.includes(context.attributes.ip)) {
        return { allowed: false };
      }

      evaluatedConditions.allowedIPs = conditions.allowedIPs;
    }

    // Custom attribute conditions
    if (conditions.attributes && context.user.attributes) {
      for (const [key, value] of Object.entries(conditions.attributes)) {
        if (context.user.attributes[key] !== value) {
          return { allowed: false };
        }
      }
      evaluatedConditions.attributes = conditions.attributes;
    }

    return { allowed: true, conditions: evaluatedConditions };
  }

  private initializeSystemRoles(): void {
    // System Admin Role
    this.addPermission({
      id: 'system:admin:all',
      name: 'System Administration',
      resource: '*',
      action: '*',
      description: 'Full system access',
    });

    this.addRole({
      id: 'system:admin',
      name: 'System Administrator',
      description: 'Full system access',
      permissions: ['system:admin:all'],
      isSystem: true,
    });

    // Organization Admin Role
    this.addPermission({
      id: 'org:admin:all',
      name: 'Organization Administration',
      resource: 'organization',
      action: '*',
      conditions: { organizationId: '${user.organizationId}' },
    });

    this.addRole({
      id: 'org:admin',
      name: 'Organization Administrator',
      description: 'Organization-level administration',
      permissions: ['org:admin:all'],
      isSystem: true,
    });

    // Workflow permissions
    const workflowPermissions = [
      { action: 'create', name: 'Create Workflows' },
      { action: 'read', name: 'View Workflows' },
      { action: 'update', name: 'Edit Workflows' },
      { action: 'delete', name: 'Delete Workflows' },
      { action: 'execute', name: 'Execute Workflows' },
    ];

    workflowPermissions.forEach(({ action, name }) => {
      this.addPermission({
        id: `workflow:${action}`,
        name,
        resource: 'workflow',
        action,
        conditions: { organizationId: '${user.organizationId}' },
      });
    });

    // Standard User Role
    this.addRole({
      id: 'user',
      name: 'Standard User',
      description: 'Standard workflow user',
      permissions: ['workflow:create', 'workflow:read', 'workflow:update', 'workflow:execute'],
      isSystem: true,
    });

    // Viewer Role
    this.addRole({
      id: 'viewer',
      name: 'Viewer',
      description: 'Read-only access',
      permissions: ['workflow:read'],
      isSystem: true,
    });

    this.logger.info('System roles initialized');
  }

  private clearCache(): void {
    this.permissionCache.clear();
  }

  /**
   * Export roles and permissions for backup/migration
   */
  exportConfiguration(): {
    permissions: Permission[];
    roles: Role[];
  } {
    return {
      permissions: Array.from(this.permissions.values()),
      roles: Array.from(this.roles.values()),
    };
  }

  /**
   * Import roles and permissions from backup/migration
   */
  importConfiguration(config: { permissions: Permission[]; roles: Role[] }): void {
    // Clear existing non-system data
    this.permissions.clear();
    this.roles.clear();
    this.clearCache();

    // Import permissions first
    config.permissions.forEach((permission) => {
      this.addPermission(permission);
    });

    // Import roles
    config.roles.forEach((role) => {
      this.addRole(role);
    });

    this.logger.info('RBAC configuration imported', {
      permissionCount: config.permissions.length,
      roleCount: config.roles.length,
    });
  }
}

export default RBACEngine;
