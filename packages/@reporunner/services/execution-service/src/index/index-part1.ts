import { MongoClient, Db, Collection } from 'mongodb';
import { Redis } from 'ioredis';
import { Queue, Worker, Job } from 'bullmq';
import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { logger } from '@reporunner/shared/logger';
import { DistributedEventBus } from '@reporunner/platform/event-bus';

export interface ExecutionConfig {
  maxConcurrentExecutions: number;
  executionTimeout: number;
  retryAttempts: number;
  queueSize: number;
  redis: {
    host: string;
    port: number;
    password?: string;
    db?: number;
  };
  mongodb: {
    uri: string;
    database: string;
  };
}

export interface WorkflowDefinition {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  settings: WorkflowSettings;
  organizationId: string;
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
  parallelism?: number;
  priority?: 'low' | 'normal' | 'high' | 'critical';
}

export interface ExecutionRequest {
  workflowId: string;
  triggeredBy: string;
  triggerType: 'manual' | 'scheduled' | 'webhook' | 'api';
  inputData?: Record<string, any>;
  environment?: string;
  correlationId?: string;
  metadata?: Record<string, any>;
  options?: {
    timeout?: number;
    retries?: number;
    priority?: 'low' | 'normal' | 'high' | 'critical';
    async?: boolean;
  };
}

export interface ExecutionResult {
  id: string;
  workflowId: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled' | 'timeout';
  startedAt: Date;
  completedAt?: Date;
  duration?: number;
  triggeredBy: string;
