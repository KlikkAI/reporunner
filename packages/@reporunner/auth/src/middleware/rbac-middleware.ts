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
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.userId) {
          res.status(401).json({ error: 'Not authenticated' });
          return;
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
          res.status(403).json({
            error: 'Insufficient permissions',
            required: permission,
          });
          return;
        }

        next();
      } catch (_error) {
        res.status(500).json({ error: 'Authorization error' });
      }
    };
  };
}

export function createRoleMiddleware(config: RBACConfig) {
  return function requireRole(...roleNames: string[]) {
    return async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
      try {
        if (!req.userId) {
          res.status(401).json({ error: 'Not authenticated' });
          return;
        }

        const userRoleIds = await config.getUserRoles(req.userId);
        const userRoles = config.roles.filter((role) => userRoleIds.includes(role.id));
        const hasRequiredRole = userRoles.some((role) => roleNames.includes(role.name));

        if (!hasRequiredRole) {
          res.status(403).json({
            error: 'Insufficient role',
            required: roleNames,
          });
          return;
        }

        next();
      } catch (_error) {
        res.status(500).json({ error: 'Authorization error' });
      }
    };
  };
}
