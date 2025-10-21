import { AuthenticationError, AuthorizationError } from '@klikkflow/core';
import type { Request } from 'express';
import {
  type SecurityConfig,
  type SecurityContext,
  SecurityMiddleware,
} from '../base/SecurityMiddleware';
import { RoleService } from './services/RoleService';
import { SessionService } from './services/SessionService';
import { JWTTokenService } from './services/TokenService';

export interface AuthConfig extends SecurityConfig {
  /**
   * Authentication options
   */
  auth?: {
    /**
     * Token configuration
     */
    token?: {
      secret: string;
      expiresIn: string | number;
      refreshExpiresIn: string | number;
      algorithm?: string;
    };

    /**
     * Session configuration
     */
    session?: {
      store: 'memory' | 'redis';
      secret: string;
      ttl: number;
      redisConfig?: {
        host: string;
        port: number;
        password?: string;
      };
    };
  };

  /**
   * Authorization options
   */
  rbac?: {
    /**
     * Required roles for access
     */
    roles?: string[];

    /**
     * Required permissions for access
     */
    permissions?: string[];

    /**
     * Resource ownership check
     */
    requireOwnership?: boolean;

    /**
     * Custom authorization check
     */
    customCheck?: (req: Request) => Promise<boolean>;
  };
}

export class AuthMiddleware extends SecurityMiddleware {
  private tokenService: JWTTokenService;
  private sessionService: SessionService;
  private roleService: RoleService;
  protected declare config: AuthConfig;

  constructor(config: AuthConfig) {
    super(config);
    this.config = config;

    // Add default config if token is undefined
    const _tokenConfig = config.auth?.token || {
      secret: 'default-secret',
      expiresIn: '1h',
      refreshExpiresIn: '7d',
    };

    this.tokenService = new JWTTokenService();
    this.sessionService = new SessionService(config.auth?.session);
    this.roleService = new RoleService();
    // TODO: Pass _tokenConfig to JWTTokenService when constructor is implemented
  }

  protected async implementation({ req }: SecurityContext): Promise<void> {
    // First authenticate the user
    await this.authenticate(req);

    // Then check authorization if RBAC is configured
    if (this.config.rbac) {
      await this.authorize(req);
    }
  }

  private async authenticate(req: Request): Promise<void> {
    try {
      // Try token authentication first
      const token = this.extractToken(req);
      if (token) {
        const user = await this.tokenService.verifyAndDecode(token);
        req.user = {
          ...user,
          roles: user.roles || [],
          permissions: user.permissions || [],
        };
        return;
      }

      // Try session authentication
      const session = await this.sessionService.getSession(req);
      if (session?.user) {
        req.user = session.user;
        return;
      }

      throw new AuthenticationError('No valid authentication found');
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error;
      }
      throw new AuthenticationError(`Authentication failed: ${(error as Error).message}`);
    }
  }

  private async checkRoleAuthorization(user: Express.User, roles: string[]): Promise<void> {
    // Type assertion: Express.User should have id from authentication
    const hasRole = await this.roleService.checkRoles(user as Express.User & { id: string }, roles);
    if (!hasRole) {
      throw new AuthorizationError(`User lacks required roles. Required: ${roles.join(', ')}`);
    }
  }

  private async checkPermissionAuthorization(
    user: Express.User,
    permissions: string[]
  ): Promise<void> {
    // Type assertion: Express.User should have id from authentication
    const hasPermissions = await this.roleService.checkPermissions(
      user as Express.User & { id: string },
      permissions
    );
    if (!hasPermissions) {
      throw new AuthorizationError(
        `User lacks required permissions. Required: ${permissions.join(', ')}`
      );
    }
  }

  private async checkOwnershipAuthorization(user: Express.User, resourceId: string): Promise<void> {
    // Type assertion: Express.User should have id from authentication
    const isOwner = await this.roleService.checkResourceOwnership(
      user as Express.User & { id: string },
      resourceId
    );
    if (!isOwner) {
      throw new AuthorizationError('User does not own this resource');
    }
  }

  private async authorize(req: Request): Promise<void> {
    const { rbac } = this.config;

    if (!req.user) {
      throw new AuthorizationError('User not authenticated');
    }

    try {
      // Check roles if specified
      if (rbac?.roles?.length) {
        await this.checkRoleAuthorization(req.user, rbac.roles);
      }

      // Check permissions if specified
      if (rbac?.permissions?.length) {
        await this.checkPermissionAuthorization(req.user, rbac.permissions);
      }

      // Check resource ownership if required
      if (rbac?.requireOwnership) {
        await this.checkOwnershipAuthorization(req.user, req.params.id);
      }

      // Run custom authorization check if provided
      if (rbac?.customCheck) {
        const isAuthorized = await rbac.customCheck(req);
        if (!isAuthorized) {
          throw new AuthorizationError('Custom authorization check failed');
        }
      }
    } catch (error) {
      if (error instanceof AuthorizationError) {
        throw error;
      }
      throw new AuthorizationError(`Authorization failed: ${(error as Error).message}`);
    }
  }

  private extractToken(req: Request): string | null {
    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    // Check query parameter
    if (req.query.token) {
      return req.query.token as string;
    }

    // Check cookies
    if (req.cookies?.token) {
      return req.cookies.token;
    }

    return null;
  }
}
