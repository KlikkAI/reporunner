import { z } from 'zod';

// Database configuration schemas
export const MongoDBConfigSchema = z.object({
  connectionString: z.string().url(),
  database: z.string(),
  options: z
    .object({
      maxPoolSize: z.number().default(10),
      serverSelectionTimeoutMS: z.number().default(5000),
      socketTimeoutMS: z.number().default(45000),
      family: z.number().default(4),
      keepAlive: z.boolean().default(true),
      keepAliveInitialDelay: z.number().default(120000),
    })
    .optional(),
});

export const PostgreSQLConfigSchema = z.object({
  connectionString: z.string(),
  pool: z
    .object({
      min: z.number().default(0),
      max: z.number().default(10),
      idleTimeoutMillis: z.number().default(30000),
      connectionTimeoutMillis: z.number().default(2000),
    })
    .optional(),
  ssl: z.boolean().default(false),
});

export const RedisConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  password: z.string().optional(),
  db: z.number().default(0),
  keyPrefix: z.string().default('reporunner:'),
  retryDelayOnFailover: z.number().default(100),
  maxRetriesPerRequest: z.number().default(3),
});

export const DatabaseConfigSchema = z.object({
  mongodb: MongoDBConfigSchema,
  postgresql: PostgreSQLConfigSchema,
  redis: RedisConfigSchema,
});

export type MongoDBConfig = z.infer<typeof MongoDBConfigSchema>;
export type PostgreSQLConfig = z.infer<typeof PostgreSQLConfigSchema>;
export type RedisConfig = z.infer<typeof RedisConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;

// Entity schemas for MongoDB
export const WorkflowDocumentSchema = z.object({
  _id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      name: z.string(),
      position: z.object({
        x: z.number(),
        y: z.number(),
      }),
      parameters: z.record(z.unknown()),
      credentials: z.string().optional(),
      disabled: z.boolean().default(false),
    })
  ),
  connections: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
    })
  ),
  settings: z.object({
    timezone: z.string().default('UTC'),
    timeout: z.number().default(300000),
    retryOnFail: z.boolean().default(false),
    maxRetries: z.number().default(3),
  }),
  active: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
  organizationId: z.string().optional(),
  tags: z.array(z.string()).default([]),
  version: z.number().default(1),
});

export const ExecutionDocumentSchema = z.object({
  _id: z.string(),
  workflowId: z.string(),
  status: z.enum(['pending', 'running', 'success', 'error', 'cancelled', 'waiting']),
  mode: z.enum(['manual', 'trigger', 'webhook', 'retry', 'cli']),
  startTime: z.date(),
  endTime: z.date().optional(),
  executionTime: z.number().optional(),
  nodeExecutions: z.record(
    z.object({
      nodeId: z.string(),
      status: z.enum(['pending', 'running', 'success', 'error', 'skipped', 'waiting']),
      startTime: z.date().optional(),
      endTime: z.date().optional(),
      inputData: z.array(
        z.object({
          json: z.record(z.unknown()),
          binary: z.record(z.unknown()).optional(),
        })
      ),
      outputData: z.array(
        z.object({
          json: z.record(z.unknown()),
          binary: z.record(z.unknown()).optional(),
        })
      ),
      error: z
        .object({
          message: z.string(),
          stack: z.string().optional(),
          timestamp: z.date(),
        })
        .optional(),
      retryCount: z.number().default(0),
    })
  ),
  data: z.object({
    startData: z.record(z.unknown()).optional(),
    resultData: z.record(z.unknown()).optional(),
  }),
  finished: z.boolean().default(false),
  workflowData: z.any(), // Snapshot of workflow at execution time
  createdBy: z.string().optional(),
  organizationId: z.string().optional(),
});

export const UserDocumentSchema = z.object({
  _id: z.string(),
  email: z.string().email(),
  username: z.string(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  avatar: z.string().url().optional(),
  password: z.string(), // Hashed
  isActive: z.boolean().default(true),
  emailVerified: z.boolean().default(false),
  twoFactorEnabled: z.boolean().default(false),
  twoFactorSecret: z.string().optional(),
  lastLoginAt: z.date().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
  organizationId: z.string().optional(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  preferences: z.record(z.unknown()).default({}),
  metadata: z.record(z.unknown()).optional(),
});

export const OrganizationDocumentSchema = z.object({
  _id: z.string(),
  name: z.string(),
  slug: z.string(),
  domain: z.string().optional(),
  logo: z.string().url().optional(),
  plan: z.enum(['free', 'pro', 'enterprise']),
  settings: z.record(z.unknown()).default({}),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
  ownerId: z.string(),
  memberCount: z.number().default(1),
  limits: z.object({
    workflows: z.number().default(10),
    executions: z.number().default(1000),
    storage: z.number().default(1073741824), // 1GB in bytes
  }),
});

export const CredentialDocumentSchema = z.object({
  _id: z.string(),
  name: z.string(),
  type: z.string(),
  data: z.record(z.unknown()), // Encrypted credential data
  userId: z.string(),
  organizationId: z.string().optional(),
  isShared: z.boolean().default(false),
  sharedWith: z.array(z.string()).default([]),
  createdAt: z.date(),
  updatedAt: z.date(),
  lastUsed: z.date().optional(),
  isActive: z.boolean().default(true),
});

// Entity types for MongoDB
export type WorkflowDocument = z.infer<typeof WorkflowDocumentSchema>;
export type ExecutionDocument = z.infer<typeof ExecutionDocumentSchema>;
export type UserDocument = z.infer<typeof UserDocumentSchema>;
export type OrganizationDocument = z.infer<typeof OrganizationDocumentSchema>;
export type CredentialDocument = z.infer<typeof CredentialDocumentSchema>;

// PostgreSQL table schemas for AI features
export const EmbeddingTableSchema = z.object({
  id: z.string().uuid(),
  content: z.string(),
  embedding: z.array(z.number()), // Vector
  metadata: z.record(z.unknown()),
  source: z.string(),
  sourceId: z.string(),
  organizationId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const KnowledgeBaseTableSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string().optional(),
  organizationId: z.string(),
  isPublic: z.boolean().default(false),
  settings: z.record(z.unknown()).default({}),
  createdAt: z.date(),
  updatedAt: z.date(),
  createdBy: z.string(),
});

export const ConversationTableSchema = z.object({
  id: z.string().uuid(),
  sessionId: z.string(),
  userId: z.string(),
  organizationId: z.string().optional(),
  messages: z.array(
    z.object({
      role: z.enum(['system', 'user', 'assistant']),
      content: z.string(),
      timestamp: z.date(),
      metadata: z.record(z.unknown()).optional(),
    })
  ),
  summary: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const AnalyticsEventTableSchema = z.object({
  id: z.string().uuid(),
  event: z.string(),
  userId: z.string().optional(),
  organizationId: z.string().optional(),
  workflowId: z.string().optional(),
  executionId: z.string().optional(),
  properties: z.record(z.unknown()).default({}),
  timestamp: z.date(),
  ipAddress: z.string().optional(),
  userAgent: z.string().optional(),
});

// PostgreSQL types
export type EmbeddingTable = z.infer<typeof EmbeddingTableSchema>;
export type KnowledgeBaseTable = z.infer<typeof KnowledgeBaseTableSchema>;
export type ConversationTable = z.infer<typeof ConversationTableSchema>;
export type AnalyticsEventTable = z.infer<typeof AnalyticsEventTableSchema>;

// Query interfaces
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: Record<string, 1 | -1>;
  projection?: Record<string, 1 | 0>;
}

export interface VectorSearchOptions {
  vector: number[];
  limit?: number;
  threshold?: number;
  filter?: Record<string, unknown>;
  includeMetadata?: boolean;
}

export interface VectorSearchResult {
  id: string;
  content: string;
  metadata: Record<string, unknown>;
  score: number;
  distance: number;
}

// Repository interfaces
export interface IRepository<T> {
  create(entity: Omit<T, '_id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  findById(id: string): Promise<T | null>;
  findOne(filter: Partial<T>): Promise<T | null>;
  findMany(filter: Partial<T>, options?: QueryOptions): Promise<T[]>;
  update(id: string, updates: Partial<T>): Promise<T | null>;
  delete(id: string): Promise<boolean>;
  count(filter?: Partial<T>): Promise<number>;
}

export interface IVectorRepository {
  upsert(
    id: string,
    content: string,
    embedding: number[],
    metadata?: Record<string, unknown>
  ): Promise<void>;
  search(options: VectorSearchOptions): Promise<VectorSearchResult[]>;
  delete(id: string): Promise<boolean>;
  deleteByFilter(filter: Record<string, unknown>): Promise<number>;
}
