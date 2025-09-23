export interface GatewayConfig {
  port: number;
  host: string;
  cors: {
    enabled: boolean;
    origins: string[];
  };
  rateLimit: {
    enabled: boolean;
    windowMs: number;
    max: number;
  };
  authentication: {
    jwt: {
      secret: string;
      expiresIn: string;
    };
  };
}

export interface Route {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  handler: string;
  middleware?: string[];
  auth?: boolean;
}

export class APIGateway {
  // @ts-ignore: Config will be used in future implementation
  constructor(private config: GatewayConfig) {}

  async start(): Promise<void> {
    // TODO: Implement gateway startup
  }

  async stop(): Promise<void> {
    // TODO: Implement gateway shutdown
  }

  registerRoute(_route: Route): void {
    // TODO: Implement route registration
  }
}

export * from './middleware';
export * from './routing';
