import { AuthenticationError, AuthorizationError } from '../utils/errors';

// Role-based authorization decorator
export function authorize(roles: string[]) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const user = (this as any).currentUser || args[0]?.user;
      
      if (!user) {
        throw new AuthenticationError('No authenticated user found');
      }

      if (!user.roles?.some((role: string) => roles.includes(role))) {
        throw new AuthorizationError(
          `User lacks required roles for ${methodName}. Required: ${roles.join(', ')}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Permission-based authorization decorator
export function requirePermission(permission: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const user = (this as any).currentUser || args[0]?.user;
      
      if (!user) {
        throw new AuthenticationError('No authenticated user found');
      }

      if (!user.permissions?.includes(permission)) {
        throw new AuthorizationError(
          `User lacks required permission: ${permission} for ${methodName}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Resource ownership check decorator
export function requireOwnership(resourceIdPath: string = 'id') {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const user = (this as any).currentUser || args[0]?.user;
      
      if (!user) {
        throw new AuthenticationError('No authenticated user found');
      }

      // Extract resource ID from args using the path
      const paths = resourceIdPath.split('.');
      let resourceId = args[0];
      for (const path of paths) {
        resourceId = resourceId[path];
      }

      if (!resourceId) {
        throw new AuthorizationError(
          `Could not find resource ID at path: ${resourceIdPath}`
        );
      }

      // Check ownership - implementation will vary based on your data model
      const isOwner = await (this as any).checkResourceOwnership?.(resourceId, user.id);
      
      if (!isOwner) {
        throw new AuthorizationError(
          `User does not own resource ${resourceId}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Resource access control decorator
export function checkAccess(resource: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const user = (this as any).currentUser || args[0]?.user;
      
      if (!user) {
        throw new AuthenticationError('No authenticated user found');
      }

      // Extract action from method name or args
      const action = args[0]?.action || methodName;

      // Check if user has access to perform action on resource
      const hasAccess = await (this as any).checkResourceAccess?.(resource, action, user.id);
      
      if (!hasAccess) {
        throw new AuthorizationError(
          `User does not have permission to ${action} ${resource}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

// Organization/team scope check decorator
export function requireScope(scope: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const methodName = propertyKey;

    descriptor.value = async function (...args: any[]) {
      const user = (this as any).currentUser || args[0]?.user;
      
      if (!user) {
        throw new AuthenticationError('No authenticated user found');
      }

      const hasScope = await (this as any).checkUserScope?.(user.id, scope);
      
      if (!hasScope) {
        throw new AuthorizationError(
          `User does not have required scope: ${scope}`
        );
      }

      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}