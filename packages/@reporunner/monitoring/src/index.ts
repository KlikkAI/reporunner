export interface MonitoringConfig {
  enabled: boolean;
  metrics: {
    port: number;
    endpoint: string;
  };
  alerts: {
    enabled: boolean;
    rules: string[];
  };
}

export interface MetricsCollector {
  collect(): Promise<Record<string, number>>;
  register(name: string, collector: () => number): void;
}

export class MonitoringService {
  // @ts-ignore: Config will be used in future implementation
  constructor(private config: MonitoringConfig) {}

  async start(): Promise<void> {
    // TODO: Implement monitoring service startup
  }

  async stop(): Promise<void> {
    // TODO: Implement monitoring service shutdown
  }
}

export * from './metrics';
export * from './alerts';
