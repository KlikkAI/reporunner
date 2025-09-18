/**
 * Role-Based Access Control (RBAC) Service
 * Provides comprehensive permission management for enterprise workflows
 */

export interface Permission {
  id: string;
  name: string;
  description: string;
  resource: string; // e.g., 'workflow', 'credential', 'organization'
  action: string; // e.g., 'create', 'read', 'update', 'delete', 'execute'
  scope?: "own" | "team" | "organization" | "global";
}

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystem: boolean; // System roles cannot be deleted
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRole {
  userId: string;
  roleId: string;
  organizationId?: string;
  teamId?: string;
  assignedBy: string;
  assignedAt: Date;
  expiresAt?: Date;
}

export interface Team {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  members: string[]; // User IDs
  permissions: Permission[];
  createdBy: string;
  createdAt: Date;
}

export interface Organization {
  id: string;
  name: string;
  description?: string;
  domain?: string;
  settings: OrganizationSettings;
  ownerId: string;
  members: OrganizationMember[];
  teams: Team[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationMember {
  userId: string;
  role: "owner" | "admin" | "member" | "viewer";
  joinedAt: Date;
  invitedBy?: string;
  permissions?: Permission[];
}

export interface OrganizationSettings {
  allowPublicWorkflows: boolean;
  requireApprovalForExecution: boolean;
  maxWorkflowsPerUser: number;
  maxExecutionsPerMonth: number;
  enableAuditLogging: boolean;
  enableSSOIntegration: boolean;
  allowedDomains?: string[];
  passwordPolicy: PasswordPolicy;
  sessionTimeout: number; // minutes
}

export interface PasswordPolicy {
  minLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSymbols: boolean;
  preventReuse: number; // Number of previous passwords to check
  maxAge: number; // Days before password expires
}

// Predefined system roles
export const SYSTEM_ROLES: Role[] = [
  {
    id: "system_admin",
    name: "System Administrator",
    description: "Full system access with all permissions",
    isSystem: true,
    permissions: [
      {
        id: "admin_all",
        name: "Administrator Access",
        description: "Full system access",
        resource: "*",
        action: "*",
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "organization_owner",
    name: "Organization Owner",
    description: "Full access within organization",
    isSystem: true,
    permissions: [
      {
        id: "org_manage",
        name: "Manage Organization",
        description: "Manage organization settings",
        resource: "organization",
        action: "*",
        scope: "organization",
      },
      {
        id: "workflow_all",
        name: "Manage All Workflows",
        description: "Full workflow access",
        resource: "workflow",
        action: "*",
        scope: "organization",
      },
      {
        id: "user_manage",
        name: "Manage Users",
        description: "Invite and manage users",
        resource: "user",
        action: "*",
        scope: "organization",
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "workflow_admin",
    name: "Workflow Administrator",
    description: "Manage workflows and executions",
    isSystem: true,
    permissions: [
      {
        id: "workflow_create",
        name: "Create Workflows",
        description: "Create new workflows",
        resource: "workflow",
        action: "create",
        scope: "organization",
      },
      {
        id: "workflow_edit",
        name: "Edit Workflows",
        description: "Edit all workflows",
        resource: "workflow",
        action: "update",
        scope: "organization",
      },
      {
        id: "workflow_execute",
        name: "Execute Workflows",
        description: "Execute all workflows",
        resource: "workflow",
        action: "execute",
        scope: "organization",
      },
      {
        id: "execution_view",
        name: "View Executions",
        description: "View execution history",
        resource: "execution",
        action: "read",
        scope: "organization",
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "workflow_editor",
    name: "Workflow Editor",
    description: "Create and edit own workflows",
    isSystem: true,
    permissions: [
      {
        id: "workflow_create_own",
        name: "Create Own Workflows",
        description: "Create new workflows",
        resource: "workflow",
        action: "create",
        scope: "own",
      },
      {
        id: "workflow_edit_own",
        name: "Edit Own Workflows",
        description: "Edit own workflows",
        resource: "workflow",
        action: "update",
        scope: "own",
      },
      {
        id: "workflow_execute_own",
        name: "Execute Own Workflows",
        description: "Execute own workflows",
        resource: "workflow",
        action: "execute",
        scope: "own",
      },
      {
        id: "credential_manage_own",
        name: "Manage Own Credentials",
        description: "Manage personal credentials",
        resource: "credential",
        action: "*",
        scope: "own",
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "workflow_viewer",
    name: "Workflow Viewer",
    description: "View workflows and executions only",
    isSystem: true,
    permissions: [
      {
        id: "workflow_view",
        name: "View Workflows",
        description: "View shared workflows",
        resource: "workflow",
        action: "read",
        scope: "team",
      },
      {
        id: "execution_view_own",
        name: "View Own Executions",
        description: "View own execution history",
        resource: "execution",
        action: "read",
        scope: "own",
      },
    ],
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

export class RBACService {
  private userRoles: Map<string, UserRole[]> = new Map();
  private roles: Map<string, Role> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private teams: Map<string, Team> = new Map();

  constructor() {
    // Initialize with system roles
    SYSTEM_ROLES.forEach((role) => {
      this.roles.set(role.id, role);
    });
  }

  // Permission checking methods
  hasPermission(
    userId: string,
    resource: string,
    action: string,
    resourceId?: string,
    organizationId?: string,
  ): boolean {
    const userRoles = this.getUserRoles(userId, organizationId);

    for (const userRole of userRoles) {
      const role = this.roles.get(userRole.roleId);
      if (!role) continue;

      // Check if role is expired
      if (userRole.expiresAt && new Date() > userRole.expiresAt) continue;

      for (const permission of role.permissions) {
        if (
          this.matchesPermission(
            permission,
            resource,
            action,
            userId,
            resourceId,
            organizationId,
          )
        ) {
          return true;
        }
      }
    }

    // Check team permissions
    const userTeams = this.getUserTeams(userId, organizationId);
    for (const team of userTeams) {
      for (const permission of team.permissions) {
        if (
          this.matchesPermission(
            permission,
            resource,
            action,
            userId,
            resourceId,
            organizationId,
          )
        ) {
          return true;
        }
      }
    }

    return false;
  }

  private matchesPermission(
    permission: Permission,
    resource: string,
    action: string,
    userId: string,
    resourceId?: string,
    organizationId?: string,
  ): boolean {
    // Check resource match
    if (permission.resource !== "*" && permission.resource !== resource) {
      return false;
    }

    // Check action match
    if (permission.action !== "*" && permission.action !== action) {
      return false;
    }

    // Check scope
    if (permission.scope) {
      switch (permission.scope) {
        case "own":
          // User can only access their own resources
          return this.isOwnResource();
        case "team":
          // User can access team resources
          return this.isTeamResource();
        case "organization":
          // User can access organization resources
          return this.isOrganizationResource();
        case "global":
          // Global access
          return true;
      }
    }

    return true;
  }

  private isOwnResource(
  ): boolean {
    // Implementation would check if the resource belongs to the user
    // For now, we'll assume it's checking against resource ownership
    return true; // Simplified for demo
  }

  private isTeamResource(
  ): boolean {
    // Check if user has access to resource through team membership
    // Implementation simplified for demo purposes
    return true; // Simplified for demo
  }

  private isOrganizationResource(
    organizationId?: string,
  ): boolean {
    // Check if user is member of organization
    if (!organizationId) return false;
    const org = this.organizations.get(organizationId);
    return org?.members.some((member) => member.userId === userId) || false;
  }

  // Role management methods
  assignRole(
    userId: string,
    roleId: string,
    organizationId?: string,
    assignedBy?: string,
  ): void {
    const currentRoles = this.userRoles.get(userId) || [];

    // Check if user already has this role
    const existingRole = currentRoles.find(
      (ur) => ur.roleId === roleId && ur.organizationId === organizationId,
    );

    if (existingRole) {
      throw new Error("User already has this role");
    }

    const userRole: UserRole = {
      userId,
      roleId,
      organizationId,
      assignedBy: assignedBy || "system",
      assignedAt: new Date(),
    };

    currentRoles.push(userRole);
    this.userRoles.set(userId, currentRoles);
  }

  removeRole(userId: string, roleId: string, organizationId?: string): void {
    const currentRoles = this.userRoles.get(userId) || [];
    const filteredRoles = currentRoles.filter(
      (ur) => !(ur.roleId === roleId && ur.organizationId === organizationId),
    );
    this.userRoles.set(userId, filteredRoles);
  }

  getUserRoles(userId: string, organizationId?: string): UserRole[] {
    const allRoles = this.userRoles.get(userId) || [];

    if (organizationId) {
      return allRoles.filter(
        (role) =>
          role.organizationId === organizationId || !role.organizationId,
      );
    }

    return allRoles;
  }

  getUserPermissions(userId: string, organizationId?: string): Permission[] {
    const userRoles = this.getUserRoles(userId, organizationId);
    const permissions: Permission[] = [];

    for (const userRole of userRoles) {
      const role = this.roles.get(userRole.roleId);
      if (role) {
        permissions.push(...role.permissions);
      }
    }

    // Add team permissions
    const userTeams = this.getUserTeams(userId, organizationId);
    for (const team of userTeams) {
      permissions.push(...team.permissions);
    }

    // Remove duplicates
    return permissions.filter(
      (permission, index, array) =>
        index === array.findIndex((p) => p.id === permission.id),
    );
  }

  // Organization management
  createOrganization(
    org: Omit<Organization, "id" | "createdAt" | "updatedAt">,
  ): Organization {
    const organization: Organization = {
      ...org,
      id: this.generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.organizations.set(organization.id, organization);

    // Assign owner role to creator
    this.assignRole(org.ownerId, "organization_owner", organization.id);

    return organization;
  }

  addOrganizationMember(
    organizationId: string,
    userId: string,
    role: OrganizationMember["role"],
    invitedBy: string,
  ): void {
    const org = this.organizations.get(organizationId);
    if (!org) throw new Error("Organization not found");

    const member: OrganizationMember = {
      userId,
      role,
      joinedAt: new Date(),
      invitedBy,
    };

    org.members.push(member);
    this.organizations.set(organizationId, org);

    // Assign appropriate system role based on organization role
    const systemRoleMap: Record<OrganizationMember["role"], string> = {
      owner: "organization_owner",
      admin: "workflow_admin",
      member: "workflow_editor",
      viewer: "workflow_viewer",
    };

    this.assignRole(userId, systemRoleMap[role], organizationId, invitedBy);
  }

  // Team management
  createTeam(team: Omit<Team, "id" | "createdAt">): Team {
    const newTeam: Team = {
      ...team,
      id: this.generateId(),
      createdAt: new Date(),
    };

    this.teams.set(newTeam.id, newTeam);
    return newTeam;
  }

  addTeamMember(teamId: string, userId: string): void {
    const team = this.teams.get(teamId);
    if (!team) throw new Error("Team not found");

    if (!team.members.includes(userId)) {
      team.members.push(userId);
      this.teams.set(teamId, team);
    }
  }

  getUserTeams(userId: string, organizationId?: string): Team[] {
    const allTeams = Array.from(this.teams.values());

    return allTeams.filter(
      (team) =>
        team.members.includes(userId) &&
        (!organizationId || team.organizationId === organizationId),
    );
  }

  // Utility methods
  createCustomRole(
    name: string,
    description: string,
    permissions: Permission[],
    organizationId?: string,
  ): Role {
    const role: Role = {
      id: this.generateId(),
      name,
      description,
      permissions,
      isSystem: false,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    this.roles.set(role.id, role);
    return role;
  }

  updateRole(roleId: string, updates: Partial<Role>): Role {
    const role = this.roles.get(roleId);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("Cannot modify system roles");

    const updatedRole = {
      ...role,
      ...updates,
      updatedAt: new Date(),
    };

    this.roles.set(roleId, updatedRole);
    return updatedRole;
  }

  deleteRole(roleId: string): void {
    const role = this.roles.get(roleId);
    if (!role) throw new Error("Role not found");
    if (role.isSystem) throw new Error("Cannot delete system roles");

    // Remove role from all users
    for (const [userId, userRoles] of this.userRoles.entries()) {
      const filteredRoles = userRoles.filter((ur) => ur.roleId !== roleId);
      this.userRoles.set(userId, filteredRoles);
    }

    this.roles.delete(roleId);
  }

  getAllRoles(organizationId?: string): Role[] {
    const allRoles = Array.from(this.roles.values());

    if (organizationId) {
      return allRoles.filter(
        (role) => role.isSystem || role.organizationId === organizationId,
      );
    }

    return allRoles;
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance
export const rbacService = new RBACService();
