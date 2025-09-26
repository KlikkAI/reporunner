import { injectable } from 'inversify';
import { BaseMonitoringRepository } from '@reporunner/shared';

/**
 * Debugging Repository
 * Extends shared base monitoring repository
 */

@injectable()
export class DebuggingRepository extends BaseMonitoringRepository<DebuggingRecord> {
  constructor() {
    super('debugging');
  }

  // Service-specific methods can be added here
  async debuggingSpecificMethod(): Promise<any> {
    // Implementation specific to Debugging
    return this.getServiceMetrics(this.serviceName);
  }
}

export interface DebuggingRecord {
  id: string;
  service: string;
  timestamp: Date;
  data: any;
  environment: string;
}
