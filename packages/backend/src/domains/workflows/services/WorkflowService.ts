import { AppError } from '../../../middleware/errorHandlers';
import { ExecutionRepository } from '../../executions/repositories/ExecutionRepository';
import { WorkflowRepository } from '../repositories/WorkflowRepository';
import { WorkflowEngine } from './WorkFlowEngine';

export interface WorkflowFilters {
  page: number;
  limit: number;
  search?: string;
  tags?: string;
  isActive?: any;
}

export interface ExecutionFilters {
  workflowId?: string;
  status?: string;
  page: number;
  limit: number;
}

export interface CreateWorkflowData {
  name: string;
  description?: string;
  nodes: any[];
  edges: any[];
  tags?: string[];
  isPublic?: boolean;
  settings?: {
    errorHandling?: string;
    timeout?: number;
    concurrent?: boolean;
    retryPolicy?: {
      maxRetries?: number;
      retryDelay?: number;
    };
  };
}

export class WorkflowService {
  private workflowRepository: WorkflowRepository;
  private executionRepository: ExecutionRepository;
  private workflowEngine: WorkflowEngine;

  constructor() {
    this.workflowRepository = new WorkflowRepository();
    this.executionRepository = new ExecutionRepository();
    this.workflowEngine = new WorkflowEngine();
  }

  /**
   * Get all workflows for user
   */
  async getWorkflows(userId: string, filters: WorkflowFilters) {
    const skip = (filters.page - 1) * filters.limit;

    // Build query
    const query: any = { userId };

    if (filters.search) {
      query.$or = [
        { name: { $regex: filters.search, $options: 'i' } },
        { description: { $regex: filters.search, $options: 'i' } },
      ];
    }

    if (filters.tags) {
      const tagArray = filters.tags.split(',').map((tag) => tag.trim());
      query.tags = { $in: tagArray };
    }

    if (filters.isActive !== undefined) {
      query.isActive = filters.isActive;
    }

    const [workflows, total] = await Promise.all([
      this.workflowRepository.findWithPagination(query, skip, filters.limit),
      this.workflowRepository.countDocuments(query),
    ]);

    return {
      workflows,
      pagination: {
        total,
        page: filters.page,
        limit: filters.limit,
        pages: Math.ceil(total / filters.limit),
      },
    };
  }

  /**
   * Get workflow by ID
   */
  async getWorkflowById(id: string, userId: string) {
    const workflow = await this.workflowRepository.findOne({
      _id: id,
      $or: [{ userId }, { isPublic: true }],
    });

    if (!workflow) {
      throw new AppError('Workflow not found', 404);
    }

    return workflow;
  }

  /**
   * Create new workflow
   */
  async createWorkflow(userId: string, workflowData: CreateWorkflowData) {
    // Transform frontend payload to match backend schema
    const transformedData = {
      ...workflowData,
      userId,
      // Ensure arrays are properly initialized
      nodes: workflowData.nodes || [],
      edges: workflowData.edges || [],
      // Transform settings structure from frontend to backend
      settings: workflowData.settings
        ? {
            errorHandling: workflowData.settings.errorHandling || 'stop',
            timeout: workflowData.settings.timeout || 300000,
            retryAttempts: workflowData.settings.retryPolicy?.maxRetries || 3,
            concurrent: workflowData.settings.concurrent || false,
          }
        : undefined,
    };

    const workflow = await this.workflowRepository.create(transformedData);

    return workflow;
  }

  /**
   * Update workflow
   */
  async updateWorkflow(id: string, userId: string, updateData: Partial<CreateWorkflowData>) {
    const workflow = await this.workflowRepository.findOne({ _id: id, userId });
    if (!workflow) {
      throw new AppError('Workflow not found', 404);
    }

    // Update fields
    const allowedFields = [
      'name',
      'description',
      'nodes',
      'edges',
      'tags',
      'isPublic',
      'isActive',
      'settings',
    ];

    const updatedWorkflow = await this.workflowRepository.updateById(id, updateData, allowedFields);
    return updatedWorkflow;
  }

  /**
   * Delete workflow
   */
  async deleteWorkflow(id: string, userId: string) {
    const workflow = await this.workflowRepository.findOneAndDelete({ _id: id, userId });
    if (!workflow) {
      throw new AppError('Workflow not found', 404);
    }

    // Also delete associated executions
    await this.executionRepository.deleteMany({ workflowId: id });
  }

  /**
   * Duplicate workflow
   */
  async duplicateWorkflow(id: string, userId: string) {
    const originalWorkflow = await this.workflowRepository.findOne({
      _id: id,
      $or: [{ userId }, { isPublic: true }],
    });

    if (!originalWorkflow) {
      throw new AppError('Workflow not found', 404);
    }

    const duplicatedWorkflow = await this.workflowRepository.create({
      name: `${originalWorkflow.name} (Copy)`,
      description: originalWorkflow.description,
      userId,
      nodes: originalWorkflow.nodes,
      edges: originalWorkflow.edges,
      tags: originalWorkflow.tags,
      settings: originalWorkflow.settings,
      isPublic: false,
      isActive: false,
    });

    return duplicatedWorkflow;
  }

  /**
   * Execute workflow
   */
  async executeWorkflow(id: string, userId: string, triggerData?: any) {
    const workflow = await this.workflowRepository.findOne({ _id: id, userId, isActive: true });
    if (!workflow) {
      throw new AppError('Workflow not found or inactive', 404);
    }

    const executionId = await this.workflowEngine.executeWorkflow(
      workflow,
      'manual',
      triggerData,
      userId
    );

    return executionId;
  }

  /**
   * Test workflow (dry run)
   */
  async testWorkflow(id: string, userId: string) {
    const workflow = await this.workflowRepository.findOne({ _id: id, userId });
    if (!workflow) {
      throw new AppError('Workflow not found', 404);
    }

    return this.validateWorkflowStructure(workflow);
  }

  /**
   * Test workflow from data
   */
  async testWorkflowData(workflow: any) {
    return this.validateWorkflowStructure(workflow);
  }

  /**
   * Validate workflow structure
   */
  private validateWorkflowStructure(workflow: any) {
    const validation = {
      isValid: true,
      errors: [] as string[],
      warnings: [] as string[],
    };

    // Check for nodes
    if (!workflow.nodes || workflow.nodes.length === 0) {
      validation.isValid = false;
      validation.errors.push('Workflow must have at least one node');
    }

    // Check for start nodes
    const startNodes = workflow.nodes.filter(
      (node: any) => !workflow.edges.some((edge: any) => edge.target === node.id)
    );

    if (startNodes.length === 0) {
      validation.isValid = false;
      validation.errors.push('Workflow must have at least one start node');
    }

    // Check for disconnected nodes
    const connectedNodes = new Set();
    workflow.edges.forEach((edge: any) => {
      connectedNodes.add(edge.source);
      connectedNodes.add(edge.target);
    });

    const disconnectedNodes = workflow.nodes.filter(
      (node: any) => !connectedNodes.has(node.id) && startNodes.length > 0
    );

    if (disconnectedNodes.length > 0) {
      validation.warnings.push(`${disconnectedNodes.length} disconnected nodes found`);
    }

    return validation;
  }

  /**
   * Get workflow statistics
   */
  async getWorkflowStatistics(id: string, userId: string, days: number) {
    const workflow = await this.workflowRepository.findOne({
      _id: id,
      $or: [{ userId }, { isPublic: true }],
    });

    if (!workflow) {
      throw new AppError('Workflow not found', 404);
    }

    const stats = await this.executionRepository.getStatistics(id, days);

    return {
      ...stats,
      successRate:
        stats.totalExecutions > 0
          ? Math.round((stats.successfulExecutions / stats.totalExecutions) * 100)
          : 0,
      averageDurationMinutes: stats.averageDuration
        ? Math.round((stats.averageDuration / 60000) * 100) / 100
        : 0,
    };
  }

  /**
   * Get all executions
   */
  async getExecutions(userId: string, filters: ExecutionFilters) {
    const skip = (filters.page - 1) * filters.limit;

    const query: any = { userId };
    if (filters.workflowId) query.workflowId = filters.workflowId;
    if (filters.status) query.status = filters.status;

    const [executions, total] = await Promise.all([
      this.executionRepository.findWithPaginationAndPopulate(query, skip, filters.limit),
      this.executionRepository.countDocuments(query),
    ]);

    return {
      executions,
      total,
      hasMore: skip + executions.length < total,
    };
  }

  /**
   * Get execution by ID
   */
  async getExecutionById(id: string, userId: string) {
    const execution = await this.executionRepository.findOneAndPopulate({ _id: id, userId });

    if (!execution) {
      throw new AppError('Execution not found', 404);
    }

    return execution;
  }

  /**
   * Stop execution
   */
  async stopExecution(id: string, userId: string) {
    const execution = await this.executionRepository.findOne({ _id: id, userId });
    if (!execution) {
      throw new AppError('Execution not found', 404);
    }

    if (execution.status !== 'pending' && execution.status !== 'running') {
      throw new AppError('Cannot stop execution that is not running', 400);
    }

    await this.workflowEngine.stopExecution(id);
  }

  /**
   * Get execution statistics
   */
  async getExecutionStatistics(userId: string, workflowId?: string) {
    const query: any = { userId };
    if (workflowId) query.workflowId = workflowId;

    const stats = await this.executionRepository.getExecutionStatistics(query);
    return (
      stats[0] || {
        totalExecutions: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        averageDuration: 0,
      }
    );
  }
}
