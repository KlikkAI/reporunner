export interface MiddlewareConfig {
  name: string;
  enabled: boolean;
  options?: Record<string, any>;
}

export interface RequestContext {
  userId?: string;
  roles?: string[];
  permissions?: string[];
  ip: string;
  userAgent: string;
}

export type MiddlewareHandler = (ctx: RequestContext, next: () => Promise<void>) => Promise<void>;

export class MiddlewareManager {
  private middlewares = new Map<string, MiddlewareHandler>();

  register(name: string, handler: MiddlewareHandler): void {
    this.middlewares.set(name, handler);
  }

  get(name: string): MiddlewareHandler | undefined {
    return this.middlewares.get(name);
  }

  async execute(_names: string[], _ctx: RequestContext): Promise<void> {
    // TODO: Implement middleware execution chain
  }
}
