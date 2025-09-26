import { injectable } from 'inversify';
import { BaseMonitoringRepository } from '@reporunner/shared';

/**
 * Logging Repository
 * Extends shared base monitoring repository
 */

@injectable()
export class LoggingRepository extends BaseMonitoringRepository<LoggingRecord> {
  constructor() {
    super('logging');
  }

  // Service-specific methods can be added here
  async loggingSpecificMethod(): Promise<any> {
    // Implementation specific to Logging
    return this.getServiceMetrics(this.serviceName);
  }
}

export interface LoggingRecord {
  id: string;
  service: string;
  timestamp: Date;
  data: any;
  environment: string;
}
