import { BaseRepository } from '@klikkflow/core';
import type { Db } from 'mongodb';
import { Execution } from '../../../models/Execution';

export class ExecutionRepository extends BaseRepository<any> {
  constructor(db?: Db) {
    // @ts-expect-error - Allow optional db for now until proper DI is implemented
    super(db, 'executions', {
      enableTimestamps: true,
      enableSoftDelete: false,
      cacheTTL: 300,
    });
  }

  // Delegate methods to Mongoose model for backward compatibility
  override async findOne(query: any) {
    return Execution.findOne(query);
  }

  override async deleteMany(query: any): Promise<number> {
    const result = await Execution.deleteMany(query);
    return result.deletedCount || 0;
  }

  async countDocuments(query: any) {
    return Execution.countDocuments(query);
  }
  // deleteMany is now provided by BaseRepository

  /**
   * Get execution statistics
   */
  async getStatistics(workflowId: string, days: number) {
    // This is a placeholder - the actual implementation would use the Execution model's static method
    // assuming it exists like in the original workflow routes
    return (Execution as any).getStatistics(workflowId, days);
  }

  /**
   * Find executions with pagination and populate
   */
  async findWithPaginationAndPopulate(query: any, skip: number, limit: number) {
    return Execution.find(query)
      .sort({ startTime: -1 })
      .skip(skip)
      .limit(limit)
      .populate('workflowId', 'name description');
  }

  // count and findOne are now provided by BaseRepository

  /**
   * Find one execution and populate (business-specific method)
   */
  async findOneAndPopulate(query: any) {
    const execution = await this.findOne(query);
    if (!execution) {
      return null;
    }

    // Custom population logic would go here
    return execution;
  }

  /**
   * Get execution statistics with aggregation
   */
  async getExecutionStatistics(query: any) {
    return Execution.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalExecutions: { $sum: 1 },
          successfulExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'success'] }, 1, 0] },
          },
          failedExecutions: {
            $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] },
          },
          averageDuration: { $avg: '$duration' },
        },
      },
    ]);
  }
}
