import { injectable } from 'inversify';
import { BaseMonitoringRepository } from '@reporunner/shared';

/**
 * Monitoring Repository
 * Extends shared base monitoring repository
 */

@injectable()
export class MonitoringRepository extends BaseMonitoringRepository<MonitoringRecord> {
  constructor() {
    super('monitoring');
  }

  // Service-specific methods can be added here
  async monitoringSpecificMethod(): Promise<any> {
    // Implementation specific to Monitoring
    return this.getServiceMetrics(this.serviceName);
  }
}

export interface MonitoringRecord {
  id: string;
  service: string;
  timestamp: Date;
  data: any;
  environment: string;
}
