// User Role Enum
export enum UserRole {
  SUPER_ADMIN = 'super_admin',
  ADMIN = 'admin',
  EDITOR = 'editor',
  VIEWER = 'viewer',
  GUEST = 'guest'
}

// Permission Type Enum
export enum PermissionType {
  // System permissions
  SYSTEM_ADMIN = 'system:admin',

  // Organization permissions
  ORG_VIEW = 'org:view',
  ORG_EDIT = 'org:edit',
  ORG_BILLING = 'org:billing',

  // User permissions
  USER_VIEW = 'user:view',
  USER_CREATE = 'user:create',
  USER_EDIT = 'user:edit',
  USER_DELETE = 'user:delete',

  // Workflow permissions
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_EDIT = 'workflow:edit',
  WORKFLOW_DELETE = 'workflow:delete',
  WORKFLOW_EXECUTE = 'workflow:execute',
  WORKFLOW_VIEW = 'workflow:view',

  // Credential permissions
  CREDENTIAL_CREATE = 'credential:create',
  CREDENTIAL_EDIT = 'credential:edit',
  CREDENTIAL_DELETE = 'credential:delete',
  CREDENTIAL_VIEW = 'credential:view',

  // Execution permissions
  EXECUTION_VIEW = 'execution:view',
  EXECUTION_DELETE = 'execution:delete',
  EXECUTION_RETRY = 'execution:retry',
  EXECUTION_CANCEL = 'execution:cancel',

  // API permissions
  API_KEY_MANAGE = 'api:key:manage',

  // Audit permissions
  AUDIT_VIEW = 'audit:view'
}

// These execution/node status enums are defined in workflow.types