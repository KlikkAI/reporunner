import { Workflow } from '../../../models/Workflow.js';

export class WorkflowRepository {
  /**
   * Find workflows with pagination
   */
  async findWithPagination(query: any, skip: number, limit: number) {
    return Workflow.find(query)
      .select('-nodes -edges') // Exclude large fields for list view
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Count documents matching query
   */
  async countDocuments(query: any): Promise<number> {
    return Workflow.countDocuments(query);
  }

  /**
   * Find one workflow
   */
  async findOne(query: any) {
    return Workflow.findOne(query);
  }

  /**
   * Create a new workflow
   */
  async create(workflowData: any) {
    const workflow = new Workflow(workflowData);
    return workflow.save();
  }

  /**
   * Update workflow by ID
   */
  async updateById(id: string, updateData: any, allowedFields?: string[]) {
    const workflow = await Workflow.findById(id);
    if (!workflow) {
      throw new Error('Workflow not found');
    }

    // Update fields
    if (allowedFields) {
      allowedFields.forEach((field) => {
        if (updateData[field] !== undefined) {
          (workflow as any)[field] = updateData[field];
        }
      });
    } else {
      Object.assign(workflow, updateData);
    }

    return workflow.save();
  }

  /**
   * Find one and delete
   */
  async findOneAndDelete(query: any) {
    return Workflow.findOneAndDelete(query);
  }
}
