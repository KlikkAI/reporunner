/**
 * Permission Service for Role-Based Access Control (RBAC)
 * Implements granular permissions for enterprise features
 */

export enum Permission {
  // User Management
  USER_READ = 'user:read',
  USER_CREATE = 'user:create',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  USER_INVITE = 'user:invite',
  USER_DEACTIVATE = 'user:deactivate',

  // Workflow Management
  WORKFLOW_READ = 'workflow:read',
  WORKFLOW_CREATE = 'workflow:create',
  WORKFLOW_UPDATE = 'workflow:update',
  WORKFLOW_DELETE = 'workflow:delete',
  WORKFLOW_EXECUTE = 'workflow:execute',
  WORKFLOW_SHARE = 'workflow:share',
  WORKFLOW_PUBLISH = 'workflow:publish',
  WORKFLOW_IMPORT = 'workflow:import',
  WORKFLOW_EXPORT = 'workflow:export',

  // Credential Management
  CREDENTIAL_READ = 'credential:read',
  CREDENTIAL_CREATE = 'credential:create',
  CREDENTIAL_UPDATE = 'credential:update',
  CREDENTIAL_DELETE = 'credential:delete',
  CREDENTIAL_SHARE = 'credential:share',

  // Integration Management
  INTEGRATION_READ = 'integration:read',
  INTEGRATION_INSTALL = 'integration:install',
  INTEGRATION_CONFIGURE = 'integration:configure',
  INTEGRATION_REMOVE = 'integration:remove',

  // Organization Management
  ORG_READ = 'org:read',
  ORG_UPDATE = 'org:update',
  ORG_SETTINGS = 'org:settings',
  ORG_BILLING = 'org:billing',
  ORG_DELETE = 'org:delete',

  // Audit and Analytics
  AUDIT_READ = 'audit:read',
  ANALYTICS_READ = 'analytics:read',
  LOGS_READ = 'logs:read',

  // API and Webhooks
  API_KEY_CREATE = 'api_key:create',
  API_KEY_READ = 'api_key:read',
  API_KEY_DELETE = 'api_key:delete',
  WEBHOOK_CREATE = 'webhook:create',
  WEBHOOK_READ = 'webhook:read',
  WEBHOOK_UPDATE = 'webhook:update',
  WEBHOOK_DELETE = 'webhook:delete',

  // Advanced Features
  AI_FEATURES = 'ai:features',
  COLLABORATION = 'collaboration:access',
  ADVANCED_DEBUGGING = 'debugging:advanced',
  PERFORMANCE_MONITORING = 'performance:monitoring',
}

export interface Role {
  name: string;
  description: string;
  permissions: Permission[];
  isSystemRole: boolean;
}

export class PermissionService {
  private static instance: PermissionService;

  private constructor() {}

  public static getInstance(): PermissionService {
    if (!PermissionService.instance) {
      PermissionService.instance = new PermissionService();
    }
    return PermissionService.instance;
  }

  /**
   * Predefined system roles with their permissions
   */
  public getSystemRoles(): Record<string, Role> {
    return {
      super_admin: {
        name: 'Super Admin',
        description: 'Full system access with all permissions',
        permissions: Object.values(Permission),
        isSystemRole: true,
      },
      admin: {
        name: 'Admin',
        description: 'Full organization access with user management',
        permissions: [
          // User Management
          Permission.USER_READ,
          Permission.USER_CREATE,
          Permission.USER_UPDATE,
          Permission.USER_INVITE,
          Permission.USER_DEACTIVATE,

          // Workflow Management
          Permission.WORKFLOW_READ,
          Permission.WORKFLOW_CREATE,
          Permission.WORKFLOW_UPDATE,
          Permission.WORKFLOW_DELETE,
          Permission.WORKFLOW_EXECUTE,
          Permission.WORKFLOW_SHARE,
          Permission.WORKFLOW_PUBLISH,
          Permission.WORKFLOW_IMPORT,
          Permission.WORKFLOW_EXPORT,

          // Credential Management
          Permission.CREDENTIAL_READ,
          Permission.CREDENTIAL_CREATE,
          Permission.CREDENTIAL_UPDATE,
          Permission.CREDENTIAL_DELETE,
          Permission.CREDENTIAL_SHARE,

          // Integration Management
          Permission.INTEGRATION_READ,
          Permission.INTEGRATION_INSTALL,
          Permission.INTEGRATION_CONFIGURE,
          Permission.INTEGRATION_REMOVE,

          // Organization Management
          Permission.ORG_READ,
          Permission.ORG_UPDATE,
          Permission.ORG_SETTINGS,
          Permission.ORG_BILLING,

          // Audit and Analytics
          Permission.AUDIT_READ,
          Permission.ANALYTICS_READ,
          Permission.LOGS_READ,

          // API and Webhooks
          Permission.API_KEY_CREATE,
          Permission.API_KEY_READ,
          Permission.API_KEY_DELETE,
          Permission.WEBHOOK_CREATE,
          Permission.WEBHOOK_READ,
          Permission.WEBHOOK_UPDATE,
          Permission.WEBHOOK_DELETE,

          // Advanced Features
          Permission.AI_FEATURES,
          Permission.COLLABORATION,
          Permission.ADVANCED_DEBUGGING,
          Permission.PERFORMANCE_MONITORING,
        ],
        isSystemRole: true,
      },
      member: {
        name: 'Member',
        description: 'Standard user with workflow creation and execution',
        permissions: [
          // Workflow Management
          Permission.WORKFLOW_READ,
          Permission.WORKFLOW_CREATE,
          Permission.WORKFLOW_UPDATE,
          Permission.WORKFLOW_DELETE,
          Permission.WORKFLOW_EXECUTE,
          Permission.WORKFLOW_SHARE,
          Permission.WORKFLOW_IMPORT,
          Permission.WORKFLOW_EXPORT,

          // Credential Management
          Permission.CREDENTIAL_READ,
          Permission.CREDENTIAL_CREATE,
          Permission.CREDENTIAL_UPDATE,
          Permission.CREDENTIAL_DELETE,

          // Integration Management
          Permission.INTEGRATION_READ,

          // Basic API access
          Permission.API_KEY_CREATE,
          Permission.API_KEY_READ,
          Permission.API_KEY_DELETE,

          // Basic features
          Permission.AI_FEATURES,
          Permission.COLLABORATION,
        ],
        isSystemRole: true,
      },
      viewer: {
        name: 'Viewer',
        description: 'Read-only access to workflows and dashboards',
        permissions: [
          Permission.WORKFLOW_READ,
          Permission.CREDENTIAL_READ,
          Permission.INTEGRATION_READ,
          Permission.ANALYTICS_READ,
        ],
        isSystemRole: true,
      },
    };
  }

  /**
   * Get permissions for a specific role
   */
  public getRolePermissions(role: string): Permission[] {
    const systemRoles = this.getSystemRoles();
    return systemRoles[role]?.permissions || [];
  }

  /**
   * Check if a role has a specific permission
   */
  public roleHasPermission(role: string, permission: Permission): boolean {
    const permissions = this.getRolePermissions(role);
    return permissions.includes(permission);
  }

  /**
   * Get all available permissions
   */
  public getAllPermissions(): Permission[] {
    return Object.values(Permission);
  }

  /**
   * Get permissions grouped by category
   */
  public getPermissionsByCategory(): Record<string, Permission[]> {
    const permissions = this.getAllPermissions();
    const categories: Record<string, Permission[]> = {};

    permissions.forEach((permission) => {
      const category = permission.split(':')[0];
      if (!categories[category]) {
        categories[category] = [];
      }
      categories[category].push(permission);
    });

    return categories;
  }

  /**
   * Validate if a permission exists
   */
  public isValidPermission(permission: string): boolean {
    return Object.values(Permission).includes(permission as Permission);
  }

  /**
   * Get minimum required permissions for basic functionality
   */
  public getMinimumPermissions(): Permission[] {
    return [
      Permission.WORKFLOW_READ,
      Permission.WORKFLOW_CREATE,
      Permission.WORKFLOW_EXECUTE,
      Permission.CREDENTIAL_READ,
      Permission.CREDENTIAL_CREATE,
      Permission.INTEGRATION_READ,
    ];
  }

  /**
   * Check if user has permission for resource ownership
   */
  public canAccessResource(
    userRole: string,
    userPermissions: string[],
    requiredPermission: Permission,
    isOwner: boolean = false
  ): boolean {
    // Super admin has access to everything
    if (userRole === 'super_admin') {
      return true;
    }

    // Check if user has the specific permission
    if (userPermissions.includes(requiredPermission)) {
      return true;
    }

    // For certain operations, resource owners should have access
    const ownerPermissions = [
      Permission.WORKFLOW_READ,
      Permission.WORKFLOW_UPDATE,
      Permission.WORKFLOW_DELETE,
      Permission.CREDENTIAL_READ,
      Permission.CREDENTIAL_UPDATE,
      Permission.CREDENTIAL_DELETE,
    ];

    if (isOwner && ownerPermissions.includes(requiredPermission)) {
      return true;
    }

    return false;
  }

  /**
   * Get effective permissions for a user (role + custom permissions)
   */
  public getEffectivePermissions(role: string, customPermissions: string[] = []): Permission[] {
    const rolePermissions = this.getRolePermissions(role);
    const validCustomPermissions = customPermissions.filter((p) =>
      this.isValidPermission(p)
    ) as Permission[];

    // Combine and deduplicate permissions
    const allPermissions = [...rolePermissions, ...validCustomPermissions];
    return [...new Set(allPermissions)];
  }
}
