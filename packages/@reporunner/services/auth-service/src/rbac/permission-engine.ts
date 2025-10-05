import { type IUser, PermissionType, UserRole } from '@reporunner/shared';

export interface PermissionCheck {
  user: IUser;
  permission: PermissionType;
  resource?: {
    type: string;
    id: string;
    ownerId?: string;
    organizationId?: string;
  };
}

export class PermissionEngine {
  // Role hierarchy - higher roles inherit permissions from lower roles
  private static readonly ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
    [UserRole.SUPER_ADMIN]: [UserRole.ADMIN, UserRole.EDITOR, UserRole.VIEWER, UserRole.GUEST],
    [UserRole.ADMIN]: [UserRole.EDITOR, UserRole.VIEWER, UserRole.GUEST],
    [UserRole.EDITOR]: [UserRole.VIEWER, UserRole.GUEST],
    [UserRole.VIEWER]: [UserRole.GUEST],
    [UserRole.GUEST]: [],
  };

  // Default permissions for each role
  private static readonly ROLE_PERMISSIONS: Record<UserRole, PermissionType[]> = {
    [UserRole.SUPER_ADMIN]: [
      PermissionType.SYSTEM_ADMIN,
      PermissionType.ORG_EDIT,
      PermissionType.ORG_BILLING,
      PermissionType.USER_CREATE,
      PermissionType.USER_EDIT,
      PermissionType.USER_DELETE,
      PermissionType.API_KEY_MANAGE,
      PermissionType.AUDIT_VIEW,
    ],
    [UserRole.ADMIN]: [
      PermissionType.WORKFLOW_CREATE,
      PermissionType.WORKFLOW_EDIT,
      PermissionType.WORKFLOW_DELETE,
      PermissionType.WORKFLOW_EXECUTE,
      PermissionType.CREDENTIAL_CREATE,
      PermissionType.CREDENTIAL_EDIT,
      PermissionType.CREDENTIAL_DELETE,
      PermissionType.EXECUTION_DELETE,
      PermissionType.EXECUTION_RETRY,
      PermissionType.EXECUTION_CANCEL,
      PermissionType.USER_VIEW,
      PermissionType.ORG_VIEW,
    ],
    [UserRole.EDITOR]: [
      PermissionType.WORKFLOW_VIEW,
      PermissionType.WORKFLOW_CREATE,
      PermissionType.WORKFLOW_EDIT,
      PermissionType.WORKFLOW_EXECUTE,
      PermissionType.EXECUTION_VIEW,
      PermissionType.EXECUTION_RETRY,
      PermissionType.CREDENTIAL_VIEW,
      PermissionType.CREDENTIAL_CREATE,
      PermissionType.CREDENTIAL_EDIT,
    ],
    [UserRole.VIEWER]: [
      PermissionType.WORKFLOW_VIEW,
      PermissionType.EXECUTION_VIEW,
      PermissionType.CREDENTIAL_VIEW,
      PermissionType.ORG_VIEW,
    ],
    [UserRole.GUEST]: [PermissionType.WORKFLOW_VIEW, PermissionType.EXECUTION_VIEW],
  };

  /**
   * Check if user has permission
   */
  static hasPermission(check: PermissionCheck): boolean {
    const { user, permission, resource } = check;

    // Super admins have all permissions
    if (user.role === UserRole.SUPER_ADMIN) {
      return true;
    }

    // Check organization match for resource-based permissions
    if (resource?.organizationId) {
      if (user.organizationId !== resource.organizationId) {
        return false;
      }
    }

    // Check if user has explicit permission
    if (user.permissions.includes(permission)) {
      return true;
    }

    // Check if user's role has the permission
    const rolePermissions = PermissionEngine.getRolePermissions(user.role);
    if (rolePermissions.includes(permission)) {
      return true;
    }

    // Check resource ownership for certain operations
    if (resource && resource.ownerId === user.id) {
      return PermissionEngine.checkOwnerPermission(permission);
    }

    return false;
  }

  /**
   * Get all permissions for a role (including inherited)
   */
  static getRolePermissions(role: UserRole): PermissionType[] {
    const permissions = new Set<PermissionType>();

    // Add direct role permissions
    const directPermissions = PermissionEngine.ROLE_PERMISSIONS[role] || [];
    directPermissions.forEach((p) => permissions.add(p));

    // Add inherited permissions from lower roles
    const inheritedRoles = PermissionEngine.ROLE_HIERARCHY[role] || [];
    inheritedRoles.forEach((inheritedRole) => {
      const inheritedPermissions = PermissionEngine.ROLE_PERMISSIONS[inheritedRole] || [];
      inheritedPermissions.forEach((p) => permissions.add(p));
    });

    return Array.from(permissions);
  }

  /**
   * Check if owner has implicit permission
   */
  private static checkOwnerPermission(permission: PermissionType): boolean {
    // Owners can edit and delete their own resources
    const ownerPermissions = [
      PermissionType.WORKFLOW_EDIT,
      PermissionType.WORKFLOW_DELETE,
      PermissionType.WORKFLOW_EXECUTE,
      PermissionType.CREDENTIAL_EDIT,
      PermissionType.CREDENTIAL_DELETE,
    ];

    return ownerPermissions.includes(permission);
  }

  /**
   * Check multiple permissions (AND operation)
   */
  static hasAllPermissions(user: IUser, permissions: PermissionType[]): boolean {
    return permissions.every((permission) => PermissionEngine.hasPermission({ user, permission }));
  }

  /**
   * Check multiple permissions (OR operation)
   */
  static hasAnyPermission(user: IUser, permissions: PermissionType[]): boolean {
    return permissions.some((permission) => PermissionEngine.hasPermission({ user, permission }));
  }

  /**
   * Filter resources based on user permissions
   */
  static filterResources<T extends { id: string; ownerId?: string; organizationId?: string }>(
    user: IUser,
    resources: T[],
    permission: PermissionType
  ): T[] {
    return resources.filter((resource) =>
      PermissionEngine.hasPermission({
        user,
        permission,
        resource: {
          type: 'resource',
          id: resource.id,
          ownerId: resource.ownerId,
          organizationId: resource.organizationId,
        },
      })
    );
  }

  /**
   * Get permission diff between roles
   */
  static getPermissionDiff(
    fromRole: UserRole,
    toRole: UserRole
  ): {
    added: PermissionType[];
    removed: PermissionType[];
  } {
    const fromPermissions = new Set(PermissionEngine.getRolePermissions(fromRole));
    const toPermissions = new Set(PermissionEngine.getRolePermissions(toRole));

    const added: PermissionType[] = [];
    const removed: PermissionType[] = [];

    toPermissions.forEach((p) => {
      if (!fromPermissions.has(p)) {
        added.push(p);
      }
    });

    fromPermissions.forEach((p) => {
      if (!toPermissions.has(p)) {
        removed.push(p);
      }
    });

    return { added, removed };
  }

  /**
   * Validate role change
   */
  static canChangeRole(actor: IUser, targetUser: IUser, newRole: UserRole): boolean {
    // Users can't change their own role
    if (actor.id === targetUser.id) {
      return false;
    }

    // Only super admins can create other super admins
    if (newRole === UserRole.SUPER_ADMIN) {
      return actor.role === UserRole.SUPER_ADMIN;
    }

    // Admins can manage roles below them
    if (actor.role === UserRole.ADMIN) {
      return newRole !== UserRole.SUPER_ADMIN && newRole !== UserRole.ADMIN;
    }

    // Super admins can change any role
    return actor.role === UserRole.SUPER_ADMIN;
  }

  /**
   * Get resource access level for user
   */
  static getResourceAccess(
    user: IUser,
    resourceType: string
  ): {
    canView: boolean;
    canCreate: boolean;
    canEdit: boolean;
    canDelete: boolean;
    canExecute: boolean;
  } {
    const accessMap: Record<string, PermissionType[]> = {
      workflow: [
        PermissionType.WORKFLOW_VIEW,
        PermissionType.WORKFLOW_CREATE,
        PermissionType.WORKFLOW_EDIT,
        PermissionType.WORKFLOW_DELETE,
        PermissionType.WORKFLOW_EXECUTE,
      ],
      credential: [
        PermissionType.CREDENTIAL_VIEW,
        PermissionType.CREDENTIAL_CREATE,
        PermissionType.CREDENTIAL_EDIT,
        PermissionType.CREDENTIAL_DELETE,
        PermissionType.WORKFLOW_EXECUTE, // Credentials are executed with workflows
      ],
      execution: [
        PermissionType.EXECUTION_VIEW,
        PermissionType.WORKFLOW_EXECUTE, // Creating new executions
        PermissionType.EXECUTION_RETRY,
        PermissionType.EXECUTION_DELETE,
        PermissionType.EXECUTION_CANCEL,
      ],
    };

    const permissions = accessMap[resourceType] || [];

    return {
      canView: PermissionEngine.hasPermission({ user, permission: permissions[0] }),
      canCreate: PermissionEngine.hasPermission({ user, permission: permissions[1] }),
      canEdit: PermissionEngine.hasPermission({ user, permission: permissions[2] }),
      canDelete: PermissionEngine.hasPermission({ user, permission: permissions[3] }),
      canExecute: PermissionEngine.hasPermission({ user, permission: permissions[4] }),
    };
  }
}

export default PermissionEngine;
