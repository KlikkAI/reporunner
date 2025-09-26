import type { NextFunction, Response } from 'express';
import type { AuthenticatedRequest } from './jwt-middleware';

export interface Permission {
  resource: string;
  action: string;
  scope?: 'own' | 'organization' | 'all';
}

export interface Role {
  id: string;
  name: string;
  permissions: Permission[];
}

export interface RBACConfig {
  roles: Role[];
  getUserRoles: (userId: string) => Promise<string[]>;
}

export function createRBACMiddleware(config: RBACConfig) {
  return function requirePermission(permission: Permission) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.userId) {
          return res.status(401).json({ error: 'Not authenticated' });
        }

        const userRoleIds = await config.getUserRoles(req.userId);
        const userRoles = config.roles.filter((role) => userRoleIds.includes(role.id));

        const hasPermission = userRoles.some((role) =>
          role.permissions.some(
            (perm) =>
              perm.resource === permission.resource &&
              perm.action === permission.action &&
              (!permission.scope || perm.scope === permission.scope || perm.scope === 'all')
          )
        );

        if (!hasPermission) {
          return res.status(403).json({
            error: 'Insufficient permissions',
            required: permission,
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({ error: 'Authorization error' });
      }
    };
  };
}

export function createRoleMiddleware(config: RBACConfig) {
  return function requireRole(...roleNames: string[]) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
      try {
        if (!req.userId) {
          return res.status(401).json({ error: 'Not authenticated' });
        }

        const userRoleIds = await config.getUserRoles(req.userId);
        const userRoles = config.roles.filter((role) => userRoleIds.includes(role.id));
        const hasRequiredRole = userRoles.some((role) => roleNames.includes(role.name));

        if (!hasRequiredRole) {
          return res.status(403).json({
            error: 'Insufficient role',
            required: roleNames,
          });
        }

        next();
      } catch (error) {
        return res.status(500).json({ error: 'Authorization error' });
      }
    };
  };
}
