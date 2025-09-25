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
