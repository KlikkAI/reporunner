import { EventEmitter } from 'node:events';
import type { z } from 'zod';

export enum IntegrationType {
  OAUTH2 = 'oauth2',
  API_KEY = 'api_key',
  BASIC_AUTH = 'basic_auth',
  CUSTOM = 'custom',
}

export enum IntegrationCategory {
  COMMUNICATION = 'communication',
  PRODUCTIVITY = 'productivity',
  DEVELOPMENT = 'development',
  DATABASE = 'database',
  AI = 'ai',
  ANALYTICS = 'analytics',
  PAYMENT = 'payment',
  STORAGE = 'storage',
  MARKETING = 'marketing',
}

export interface IntegrationMetadata {
  name: string;
  displayName: string;
  description: string;
  version: string;
  category: IntegrationCategory;
  icon?: string;
  documentation?: string;
  supportedTriggers?: string[];
  supportedActions?: string[];
  rateLimit?: {
    requests: number;
    period: number; // in seconds
  };
}

export interface IntegrationCredentials {
  type: IntegrationType;
  data: Record<string, any>;
  expiresAt?: Date;
  refreshToken?: string;
  metadata?: Record<string, any>;
}

export interface IntegrationContext {
  credentials: IntegrationCredentials;
  workflowId: string;
  executionId: string;
  userId: string;
  organizationId: string;
  logger?: any;
}

export interface TriggerConfig {
  name: string;
  displayName: string;
  description: string;
  properties: z.ZodObject<any>;
  outputSchema: z.ZodObject<any>;
}

export interface ActionConfig {
  name: string;
  displayName: string;
  description: string;
  properties: z.ZodObject<any>;
  inputSchema: z.ZodObject<any>;
  outputSchema: z.ZodObject<any>;
}

export abstract class BaseIntegration extends EventEmitter {
  protected metadata: IntegrationMetadata;
  protected context?: IntegrationContext;
  protected triggers: Map<string, TriggerConfig> = new Map();
  protected actions: Map<string, ActionConfig> = new Map();
  protected rateLimiter?: any;

  constructor(metadata: IntegrationMetadata) {
    super();
    this.metadata = metadata;
    this.initialize();
  }

  /**
   * Initialize integration - register triggers and actions
   */
  protected abstract initialize(): void;

  /**
   * Authenticate with the service
   */
  abstract authenticate(credentials: IntegrationCredentials): Promise<boolean>;

  /**
   * Refresh authentication if needed
   */
  abstract refreshAuth?(): Promise<IntegrationCredentials>;
