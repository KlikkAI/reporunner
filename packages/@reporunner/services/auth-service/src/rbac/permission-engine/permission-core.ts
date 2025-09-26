import { type IUser, PermissionType, UserRole } from '@reporunner/api-types';

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
