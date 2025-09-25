import { EventEmitter } from 'node:events';
import PQueue from 'p-queue';
import { io } from '@/server';
import { Credential } from '../../../models/Credentials.js';
import { Execution, type IExecution, type INodeExecution } from '../../../models/Execution.js';
import type { IWorkflow, IWorkflowEdge, IWorkflowNode } from '../../../models/Workflow.js';
import { logger } from '../../../utils/logger.js';
import GmailService, { type SendEmailOptions } from '../../oauth/services/GmailService.js';

// import { IntegrationRegistry } from '@/integrations/IntegrationRegistry';

interface ExecutionContext {
  workflowId: string;
  executionId: string;
  userId: string;
  triggerData?: Record<string, any>;
  variables: Record<string, any>;
  credentials: Record<string, any>;
}

interface NodeExecutionResult {
  success: boolean;
  output?: Record<string, any>;
  error?: Error;
  duration: number;
}

export class WorkflowEngine extends EventEmitter {
  // private integrationRegistry: IntegrationRegistry;
  private executionQueue: PQueue;
  private activeExecutions: Map<string, boolean> = new Map();

  constructor() {
    super();

    // Simple in-memory queue for development (no Redis needed)
    this.executionQueue = new PQueue({
      concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5', 10),
      timeout: parseInt(process.env.MAX_WORKFLOW_EXECUTION_TIME || '300000', 10),
    });

    // this.integrationRegistry = new IntegrationRegistry();
  }

  async executeWorkflow(
    workflow: IWorkflow,
    triggerType: 'manual' | 'webhook' | 'schedule' | 'api',
    triggerData?: Record<string, any>,
    userId?: string
  ): Promise<string> {
    const executionId = await this.createExecution(workflow, triggerType, triggerData, userId);

    // Add to in-memory queue for processing (no Redis needed)
    this.executionQueue.add(async () => {
      try {
        await this.executeWorkflowInternal(workflow._id, executionId, triggerData);
        logger.info(`Workflow execution completed: ${executionId}`);
      } catch (error) {
        logger.error(`Workflow execution failed: ${executionId}`, error);
      } finally {
        this.activeExecutions.delete(executionId);
      }
    });

    this.activeExecutions.set(executionId, true);
    return executionId;
  }

  private async createExecution(
    workflow: IWorkflow,
    triggerType: 'manual' | 'webhook' | 'schedule' | 'api',
    triggerData?: Record<string, any>,
    userId?: string
  ): Promise<string> {
    const nodeExecutions: INodeExecution[] = workflow.nodes.map((node) => ({
      nodeId: node.id,
      nodeName: node.data.label,
      status: 'pending',
      retryAttempt: 0,
    }));

    const execution = new Execution({
      workflowId: workflow._id,
      userId: userId || workflow.userId,
      status: 'pending',
      triggerType,
      triggerData,
      nodeExecutions,
      totalNodes: workflow.nodes.length,
      metadata: {
        version: workflow.version,
        environment: process.env.NODE_ENV || 'development',
      },
    });

    await execution.save();
    return execution._id;
  }

  private async executeWorkflowInternal(
