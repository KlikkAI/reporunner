return PermissionEngine.checkOwnerPermission(permission);
}

return false;
}

  /**
   * Get all permissions for a role (including inherited)
   */
  static getRolePermissions(role: UserRole): PermissionType[]
{
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
private
static
checkOwnerPermission(permission: PermissionType)
: boolean
{
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
static
hasAllPermissions(user: IUser, permissions: PermissionType[])
: boolean
{
  return permissions.every((permission) => PermissionEngine.hasPermission({ user, permission }));
}

/**
 * Check multiple permissions (OR operation)
 */
static
hasAnyPermission(user: IUser, permissions: PermissionType[])
: boolean
{
  return permissions.some((permission) => PermissionEngine.hasPermission({ user, permission }));
}

/**
 * Filter resources based on user permissions
 */
static
filterResources<T extends { id: string; ownerId?: string; organizationId?: string }>(
    user: IUser,
    resources: T[],
    permission: PermissionType
  )
: T[]
{
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
static
getPermissionDiff(
    fromRole: UserRole,
    toRole: UserRole
  )
:
{
  added: PermissionType[];
  removed: PermissionType[];
}
{
    const fromPermissions = new Set(PermissionEngine.getRolePermissions(fromRole));
    const toPermissions = new Set(PermissionEngine.getRolePermissions(toRole));

    const added: PermissionType[] = [];
    const removed: PermissionType[] = [];

    toPermissions.forEach((p) => {
      if (!fromPermissions.has(p)) {
        added.push(p);
      }
    });
