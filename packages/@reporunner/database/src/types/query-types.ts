import { z } from 'zod';

// Query types reusing patterns from core repository types
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sort?: Record<string, 1 | -1>;
  filter?: Record<string, any>;
}

export interface PaginationOptions {
  page: number;
  limit: number;
  sort?: string;
  order?: 'asc' | 'desc';
}

export interface QueryResult<T> {
  data: T[];
  total: number;
  page?: number;
  limit?: number;
  hasMore?: boolean;
}

// MongoDB document schemas
export const WorkflowDocumentSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  isActive: z.boolean().default(true),
  ownerId: z.string(),
  organizationId: z.string().optional(),
  version: z.number().default(1),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const ExecutionDocumentSchema = z.object({
  _id: z.string().optional(),
  workflowId: z.string(),
  status: z.enum(['pending', 'running', 'success', 'error', 'cancelled']),
  startTime: z.date(),
  endTime: z.date().optional(),
  executionTime: z.number().optional(),
  nodeExecutions: z.record(z.any()).optional(),
  context: z.record(z.any()).optional(),
  error: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const UserDocumentSchema = z.object({
  _id: z.string().optional(),
  email: z.string().email(),
  username: z.string(),
  passwordHash: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),
  organizationId: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const OrganizationDocumentSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  domain: z.string().optional(),
  isActive: z.boolean().default(true),
  settings: z.record(z.any()).optional(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const CredentialDocumentSchema = z.object({
  _id: z.string().optional(),
  name: z.string(),
  type: z.string(),
  data: z.record(z.any()),
  ownerId: z.string(),
  organizationId: z.string().optional(),
  isActive: z.boolean().default(true),
  createdAt: z.date(),
  updatedAt: z.date(),
});

// TypeScript types from schemas
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
  metadata: z.record(z.any()).optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export const KnowledgeBaseSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  content: z.string(),
  tags: z.array(z.string()).optional(),
  embedding_id: z.string().uuid().optional(),
  created_at: z.date(),
  updated_at: z.date(),
});

export type EmbeddingTable = z.infer<typeof EmbeddingTableSchema>;
export type KnowledgeBase = z.infer<typeof KnowledgeBaseSchema>;
