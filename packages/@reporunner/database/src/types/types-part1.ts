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
