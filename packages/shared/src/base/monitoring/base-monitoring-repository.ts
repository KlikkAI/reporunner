import { injectable } from 'inversify';
import { BaseRepository } from '../base-repository';

/**
 * Base monitoring repository pattern
 * Consolidates duplicate repository implementations
 */

@injectable()
export abstract class BaseMonitoringRepository<T> extends BaseRepository<T> {
  protected serviceName: string;

  constructor(serviceName: string) {
    super();
    this.serviceName = serviceName;
  }

  async createRecord(data: Partial<T>): Promise<T> {
    const enrichedData = {
      ...data,
      service: this.serviceName,
      timestamp: new Date(),
      environment: process.env.NODE_ENV || 'development'
    };

    return this.create(enrichedData as T);
  }

  async findByService(service: string): Promise<T[]> {
    return this.find({ service } as Partial<T>);
  }

  async findByTimeRange(start: Date, end: Date): Promise<T[]> {
    return this.find({
      timestamp: {
        $gte: start,
        $lte: end
      }
    } as any);
  }

  async getServiceMetrics(service: string): Promise<any> {
    // Base implementation for service metrics
    const records = await this.findByService(service);
    return {
      total: records.length,
      service,
      lastUpdated: new Date()
    };
  }

  async cleanup(retentionDays: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    const deleted = await this.deleteMany({
      timestamp: { $lt: cutoffDate }
    } as any);

    return deleted;
  }
}

export interface IBaseMonitoringRepository<T> {
  createRecord(data: Partial<T>): Promise<T>;
  findByService(service: string): Promise<T[]>;
  findByTimeRange(start: Date, end: Date): Promise<T[]>;
  getServiceMetrics(service: string): Promise<any>;
  cleanup(retentionDays?: number): Promise<number>;
}
