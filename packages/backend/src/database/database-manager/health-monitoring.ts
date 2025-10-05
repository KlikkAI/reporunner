// Health monitoring reusing patterns from core monitoring
export interface DatabaseHealthStatus {
  mongodb: {
    connected: boolean;
    latency?: number;
    error?: string;
  };
  postgresql: {
    connected: boolean;
    latency?: number;
    error?: string;
  };
  overall: 'healthy' | 'degraded' | 'unhealthy';
}

export interface HealthMonitor {
  checkHealth(): Promise<DatabaseHealthStatus>;
  startMonitoring(interval?: number): void;
  stopMonitoring(): void;
}

export class DatabaseHealthMonitor implements HealthMonitor {
  private monitoringInterval?: NodeJS.Timeout;

  async checkHealth(): Promise<DatabaseHealthStatus> {
    // Placeholder implementation - will be enhanced when needed
    return {
      mongodb: { connected: true },
      postgresql: { connected: true },
      overall: 'healthy',
    };
  }

  startMonitoring(interval: number = 30000): void {
    this.monitoringInterval = setInterval(async () => {
      await this.checkHealth();
    }, interval);
  }

  stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = undefined;
    }
  }
}
