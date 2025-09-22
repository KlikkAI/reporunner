import { Execution } from '../../../models/Execution.js';

export class ExecutionRepository {
  /**
   * Delete many executions
   */
  async deleteMany(query: any): Promise<any> {
    return Execution.deleteMany(query);
  }

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

  /**
   * Count documents matching query
   */
  async countDocuments(query: any): Promise<number> {
    return Execution.countDocuments(query);
  }

  /**
   * Find one execution and populate
   */
  async findOneAndPopulate(query: any) {
    return Execution.findOne(query).populate('workflowId', 'name description');
  }

  /**
   * Find one execution
   */
  async findOne(query: any) {
    return Execution.findOne(query);
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
