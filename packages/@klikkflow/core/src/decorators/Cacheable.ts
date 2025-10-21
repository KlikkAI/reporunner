/**
 * Cacheable decorator for caching method results
 */
export function Cacheable(ttl: number = 300) {
  return (_target: any, propertyKey: string, descriptor: PropertyDescriptor) => {
    const originalMethod = descriptor.value;
    const cache = new Map<string, { value: any; expiry: number }>();

    descriptor.value = function (...args: any[]) {
      const key = `${propertyKey}_${JSON.stringify(args)}`;
      const now = Date.now();
      const cached = cache.get(key);

      if (cached && cached.expiry > now) {
        return cached.value;
      }

      const result = originalMethod.apply(this, args);

      if (result instanceof Promise) {
        return result.then((value: any) => {
          cache.set(key, { value, expiry: now + ttl * 1000 });
          return value;
        });
      } else {
        cache.set(key, { value: result, expiry: now + ttl * 1000 });
        return result;
      }
    };

    return descriptor;
  };
}
