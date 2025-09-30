export interface RouteConfig {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
  middleware?: string[];
  auth?: boolean;
}

export class Router {
  private routes: Map<string, RouteConfig> = new Map();

  registerRoute(route: RouteConfig): void {
    const key = `${route.method}:${route.path}`;
    this.routes.set(key, route);
  }

  getRoute(method: string, path: string): RouteConfig | undefined {
    const key = `${method}:${path}`;
    return this.routes.get(key);
  }

  getAllRoutes(): RouteConfig[] {
    return Array.from(this.routes.values());
  }

  removeRoute(method: string, path: string): boolean {
    const key = `${method}:${path}`;
    return this.routes.delete(key);
  }
}

export const defaultRoutes: RouteConfig[] = [
  {
    path: '/health',
    method: 'GET',
    handler: 'healthCheck',
    auth: false,
  },
  {
    path: '/api/v1/*',
    method: 'GET',
    handler: 'apiHandler',
    middleware: ['cors', 'rateLimit'],
    auth: true,
  },
];

export function createRouter(): Router {
  const router = new Router();

  // Register default routes
  defaultRoutes.forEach((route) => {
    router.registerRoute(route);
  });

  return router;
}
