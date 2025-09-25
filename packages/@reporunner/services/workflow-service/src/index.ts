import { MongoClient, Db, Collection } from 'mongodb';
import { Redis } from 'ioredis';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@reporunner/shared/logger';

export interface WorkflowDefinition {
  id: string;
  name: string;
  description?: string;
  version: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  settings: WorkflowSettings;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  organizationId: string;
  tags?: string[];
  status: 'draft' | 'active' | 'archived';
  permissions: WorkflowPermissions;
}

export interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: Record<string, any>;
  config?: NodeConfiguration;
}

export interface NodeConfiguration {
  retryPolicy?: {
    maxAttempts: number;
    backoffMultiplier: number;
    initialInterval: number;
  };
  timeout?: number;
  skipOnError?: boolean;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  sourceHandle?: string;
  targetHandle?: string;
  condition?: EdgeCondition;
}

export interface EdgeCondition {
  type: 'expression' | 'value' | 'status';
  expression?: string;
  value?: any;
  operator?: 'eq' | 'neq' | 'gt' | 'lt' | 'gte' | 'lte' | 'contains' | 'matches';
}

export interface WorkflowSettings {
  timeout: number;
  retries: number;
  errorHandling: 'stop' | 'continue' | 'rollback';
  scheduling?: SchedulingConfig;
  notifications?: NotificationConfig;
  monitoring?: MonitoringConfig;
}

export interface SchedulingConfig {
  type: 'cron' | 'interval' | 'webhook';
  cron?: string;
  interval?: number;
  webhook?: {
    url: string;
    secret?: string;
  };
}

export interface NotificationConfig {
  onSuccess?: string[];
  onFailure?: string[];
  channels: Array<'email' | 'slack' | 'webhook'>;
}

export interface MonitoringConfig {
  enableMetrics: boolean;
  enableTracing: boolean;
  alertThresholds?: {
    executionTime?: number;
    errorRate?: number;
  };
}

export interface WorkflowPermissions {
  public: boolean;
  sharedWith: string[];
  roles: Record<string, string[]>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  input: Record<string, any>;
  output?: Record<string, any>;
  error?: any;
  nodeExecutions: NodeExecution[];
  metadata: ExecutionMetadata;
}

export interface NodeExecution {
  nodeId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  startedAt?: Date;
  completedAt?: Date;
  input?: any;
  output?: any;
  error?: any;
  attempts: number;
}

export interface ExecutionMetadata {
  triggeredBy: string;
  triggerType: 'manual' | 'scheduled' | 'webhook' | 'api';
  environment: string;
  correlationId?: string;
}

export class WorkflowService extends EventEmitter {
  private db: Db;
  private workflows: Collection<WorkflowDefinition>;
  private executions: Collection<WorkflowExecution>;
  private cache: Redis;
  private readonly CACHE_TTL = 3600; // 1 hour

  constructor(
    private mongoClient: MongoClient,
    private redisClient: Redis
  ) {
    super();
    this.cache = redisClient;
    this.db = mongoClient.db('reporunner');
    this.workflows = this.db.collection<WorkflowDefinition>('workflows');
    this.executions = this.db.collection<WorkflowExecution>('workflow_executions');
    this.initializeIndexes();
  }

  private async initializeIndexes(): Promise<void> {
    try {
      // Create indexes for efficient queries
      await this.workflows.createIndex({ organizationId: 1, createdAt: -1 });
      await this.workflows.createIndex({ 'tags': 1 });
      await this.workflows.createIndex({ status: 1 });
      await this.workflows.createIndex({ createdBy: 1 });
      await this.workflows.createIndex({ name: 'text', description: 'text' });
      
      await this.executions.createIndex({ workflowId: 1, startedAt: -1 });
      await this.executions.createIndex({ status: 1 });
      await this.executions.createIndex({ 'metadata.correlationId': 1 });
      
      logger.info('Database indexes initialized');
    } catch (error) {
      logger.error('Failed to create indexes', error);
    }
  }

  async create(
    workflow: Omit<WorkflowDefinition, 'id' | 'version' | 'createdAt' | 'updatedAt'>,
    userId: string
  ): Promise<WorkflowDefinition> {
    const newWorkflow: WorkflowDefinition = {
      ...workflow,
      id: uuidv4(),
      version: '1.0.0',
      createdAt: new Date(),
      updatedAt: new Date(),
      createdBy: userId,
      status: workflow.status || 'draft'
    };

    try {
      // Validate workflow structure
      this.validateWorkflow(newWorkflow);
      
      // Save to database
      await this.workflows.insertOne(newWorkflow);
      
      // Cache the workflow
      await this.cacheWorkflow(newWorkflow);
      
      // Emit event for other services
      this.emit('workflow.created', {
        workflowId: newWorkflow.id,
        userId,
        organizationId: newWorkflow.organizationId
      });
      
      logger.info(`Workflow created: ${newWorkflow.id}`);
      return newWorkflow;
    } catch (error) {
      logger.error('Failed to create workflow', error);
      throw error;
    }
  }

  async get(id: string): Promise<WorkflowDefinition | null> {
    try {
      // Check cache first
      const cached = await this.getCachedWorkflow(id);
      if (cached) return cached;
      
      // Fetch from database
      const workflow = await this.workflows.findOne({ id });
      
      if (workflow) {
        // Cache for future requests
        await this.cacheWorkflow(workflow);
      }
      
      return workflow;
    } catch (error) {
      logger.error(`Failed to get workflow ${id}`, error);
      throw error;
    }
  }

  async update(
    id: string,
    updates: Partial<WorkflowDefinition>,
    userId: string
  ): Promise<WorkflowDefinition> {
    try {
      const existing = await this.get(id);
      if (!existing) {
        throw new Error(`Workflow ${id} not found`);
      }
      
      // Check permissions
      if (!this.hasEditPermission(existing, userId)) {
        throw new Error('Insufficient permissions to edit workflow');
      }
      
      const updated: WorkflowDefinition = {
        ...existing,
        ...updates,
        id, // Preserve original ID
        version: this.incrementVersion(existing.version),
        updatedAt: new Date()
      };
      
      // Validate updated workflow
      this.validateWorkflow(updated);
      
      // Save version history
      await this.saveVersionHistory(existing);
      
      // Update in database
      await this.workflows.replaceOne({ id }, updated);
      
      // Invalidate cache
      await this.invalidateCache(id);
      
      // Emit update event
      this.emit('workflow.updated', {
        workflowId: id,
        userId,
        changes: updates
      });
      
      logger.info(`Workflow updated: ${id}`);
      return updated;
    } catch (error) {
      logger.error(`Failed to update workflow ${id}`, error);
      throw error;
    }
  }

  async delete(id: string, userId: string): Promise<boolean> {
    try {
      const workflow = await this.get(id);
      if (!workflow) {
        return false;
      }
      
      // Check permissions
      if (!this.hasDeletePermission(workflow, userId)) {
        throw new Error('Insufficient permissions to delete workflow');
      }
      
      // Soft delete by updating status
      await this.workflows.updateOne(
        { id },
        { 
          $set: { 
            status: 'archived',
            archivedAt: new Date(),
            archivedBy: userId
          }
        }
      );
      
      // Invalidate cache
      await this.invalidateCache(id);
      
      // Cancel any scheduled executions
      await this.cancelScheduledExecutions(id);
      
      // Emit deletion event
      this.emit('workflow.deleted', {
        workflowId: id,
        userId
      });
      
      logger.info(`Workflow deleted: ${id}`);
      return true;
    } catch (error) {
      logger.error(`Failed to delete workflow ${id}`, error);
      throw error;
    }
  }

  async list(
    filters: {
      organizationId?: string;
      userId?: string;
      status?: string;
      tags?: string[];
      search?: string;
    },
    pagination: {
      page: number;
      limit: number;
      sort?: Record<string, 1 | -1>;
    }
  ): Promise<{ workflows: WorkflowDefinition[]; total: number }> {
    try {
      const query: any = {};
      
      if (filters.organizationId) {
        query.organizationId = filters.organizationId;
      }
      
      if (filters.userId) {
        query.$or = [
          { createdBy: filters.userId },
          { 'permissions.sharedWith': filters.userId }
        ];
      }
      
      if (filters.status) {
        query.status = filters.status;
      }
      
      if (filters.tags && filters.tags.length > 0) {
        query.tags = { $in: filters.tags };
      }
      
      if (filters.search) {
        query.$text = { $search: filters.search };
      }
      
      const skip = (pagination.page - 1) * pagination.limit;
      const sort = pagination.sort || { createdAt: -1 };
      
      const [workflows, total] = await Promise.all([
        this.workflows
          .find(query)
          .sort(sort)
          .skip(skip)
          .limit(pagination.limit)
          .toArray(),
        this.workflows.countDocuments(query)
      ]);
      
      return { workflows, total };
    } catch (error) {
      logger.error('Failed to list workflows', error);
      throw error;
    }
  }

  private validateWorkflow(workflow: WorkflowDefinition): void {
    // Validate workflow has at least one node
    if (!workflow.nodes || workflow.nodes.length === 0) {
      throw new Error('Workflow must have at least one node');
    }
    
    // Validate node IDs are unique
    const nodeIds = new Set(workflow.nodes.map(n => n.id));
    if (nodeIds.size !== workflow.nodes.length) {
      throw new Error('Duplicate node IDs found');
    }
    
    // Validate edges reference existing nodes
    for (const edge of workflow.edges) {
      if (!nodeIds.has(edge.source) || !nodeIds.has(edge.target)) {
        throw new Error(`Edge references non-existent node: ${edge.id}`);
      }
    }
    
    // Detect cycles
    if (this.hasCycles(workflow)) {
      throw new Error('Workflow contains cycles');
    }
  }

  private hasCycles(workflow: WorkflowDefinition): boolean {
    const adjacencyList = new Map<string, string[]>();
    
    // Build adjacency list
    for (const node of workflow.nodes) {
      adjacencyList.set(node.id, []);
    }
    
    for (const edge of workflow.edges) {
      adjacencyList.get(edge.source)?.push(edge.target);
    }
    
    // DFS to detect cycles
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    
    const hasCycleDFS = (nodeId: string): boolean => {
      visited.add(nodeId);
      recursionStack.add(nodeId);
      
      const neighbors = adjacencyList.get(nodeId) || [];
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          if (hasCycleDFS(neighbor)) return true;
        } else if (recursionStack.has(neighbor)) {
          return true;
        }
      }
      
      recursionStack.delete(nodeId);
      return false;
    };
    
    for (const nodeId of adjacencyList.keys()) {
      if (!visited.has(nodeId)) {
        if (hasCycleDFS(nodeId)) return true;
      }
    }
    
    return false;
  }

  private hasEditPermission(workflow: WorkflowDefinition, userId: string): boolean {
    return (
      workflow.createdBy === userId ||
      workflow.permissions.sharedWith.includes(userId) ||
      (workflow.permissions.roles[userId]?.includes('editor'))
    );
  }

  private hasDeletePermission(workflow: WorkflowDefinition, userId: string): boolean {
    return (
      workflow.createdBy === userId ||
      (workflow.permissions.roles[userId]?.includes('admin'))
    );
  }

  private incrementVersion(version: string): string {
    const parts = version.split('.');
    const patch = parseInt(parts[2]) + 1;
    return `${parts[0]}.${parts[1]}.${patch}`;
  }

  private async saveVersionHistory(workflow: WorkflowDefinition): Promise<void> {
    const history = this.db.collection('workflow_history');
    await history.insertOne({
      ...workflow,
      archivedAt: new Date(),
      _id: undefined
    });
  }

  private async cacheWorkflow(workflow: WorkflowDefinition): Promise<void> {
    const key = `workflow:${workflow.id}`;
    await this.cache.setex(
      key,
      this.CACHE_TTL,
      JSON.stringify(workflow)
    );
  }

  private async getCachedWorkflow(id: string): Promise<WorkflowDefinition | null> {
    const key = `workflow:${id}`;
    const cached = await this.cache.get(key);
    return cached ? JSON.parse(cached) : null;
  }

  private async invalidateCache(id: string): Promise<void> {
    const key = `workflow:${id}`;
    await this.cache.del(key);
  }

  private async cancelScheduledExecutions(workflowId: string): Promise<void> {
    // Implementation would depend on the scheduling service
    this.emit('workflow.schedules.cancel', { workflowId });
  }

  // Execution handling methods
  async handleExecutionCompleted(event: any): Promise<void> {
    logger.info('Handling execution completed event', event);
    // Update workflow statistics, send notifications, etc.
  }

  async handleExecutionFailed(event: any): Promise<void> {
    logger.error('Handling execution failed event', event);
    // Trigger retry logic, send alerts, etc.
  }

  async handleUserDeleted(event: any): Promise<void> {
    logger.info('Handling user deleted event', event);
    // Transfer ownership or archive workflows
  }
}

export * from './validation';
export * from './versioning';
