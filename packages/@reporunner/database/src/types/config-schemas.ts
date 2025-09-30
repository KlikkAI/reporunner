import { z } from 'zod';

// Database configuration schemas reusing patterns from core packages
export const MongoDBConfigSchema = z.object({
  uri: z.string(),
  database: z.string(),
  options: z
    .object({
      maxPoolSize: z.number().optional(),
      minPoolSize: z.number().optional(),
      connectTimeoutMS: z.number().optional(),
      serverSelectionTimeoutMS: z.number().optional(),
    })
    .optional(),
});

export const PostgreSQLConfigSchema = z.object({
  host: z.string(),
  port: z.number(),
  database: z.string(),
  username: z.string(),
  password: z.string(),
  ssl: z.boolean().optional(),
  pool: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      idle: z.number().optional(),
    })
    .optional(),
});

export const DatabaseConfigSchema = z.object({
  mongodb: MongoDBConfigSchema.optional(),
  postgresql: PostgreSQLConfigSchema.optional(),
  default: z.enum(['mongodb', 'postgresql']).optional(),
});

export type MongoDBConfig = z.infer<typeof MongoDBConfigSchema>;
export type PostgreSQLConfig = z.infer<typeof PostgreSQLConfigSchema>;
export type DatabaseConfig = z.infer<typeof DatabaseConfigSchema>;
