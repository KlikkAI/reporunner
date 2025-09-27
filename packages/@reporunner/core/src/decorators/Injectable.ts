import 'reflect-metadata';

/**
 * Injectable decorator for dependency injection
 */
export function Injectable(target: any) {
  // Mark the class as injectable
  Reflect.defineMetadata('injectable', true, target);
  return target;
}

/**
 * Check if a class is injectable
 */
export function isInjectable(target: any): boolean {
  return Reflect.getMetadata('injectable', target) === true;
}
