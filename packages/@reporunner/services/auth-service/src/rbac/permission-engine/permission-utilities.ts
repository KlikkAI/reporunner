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
  static canChangeRole(actor: IUser, targetUser: IUser, newRole: UserRole): boolean
{
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
static
getResourceAccess(
    user: IUser,
    resourceType: string
  )
:
{
  canView: boolean;
  canCreate: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canExecute: boolean;
}
{
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
