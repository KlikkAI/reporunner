/**
 * Zod schemas for API validation
 */

import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

extendZodWithOpenApi(z);

// User schema
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1),
  role: z.enum(['admin', 'user', 'viewer']),
  organizationId: z.string().uuid().optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Organization schema
export const OrganizationSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1),
  settings: z.record(z.string(), z.any()).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Workflow schema
export const WorkflowSchema = z.object({
  id: z.string(),
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  variables: z.record(z.string(), z.any()).optional(),
  settings: z.record(z.string(), z.any()).optional(),
  status: z.enum(['active', 'inactive', 'draft']).default('draft'),
  version: z.number().min(1).default(1),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

// Execution schema
export const ExecutionSchema = z.object({
  id: z.string(),
  workflowId: z.string(),
  status: z.enum(['pending', 'running', 'completed', 'failed', 'cancelled']),
  startTime: z.string().datetime(),
  endTime: z.string().datetime().optional(),
  progress: z
    .object({
      completedNodes: z.number().min(0),
      totalNodes: z.number().min(0),
      currentNode: z.string().optional(),
    })
    .optional(),
  results: z.record(z.string(), z.any()).optional(),
  error: z.string().optional(),
  metrics: z
    .object({
      duration: z.number().min(0),
      nodesExecuted: z.number().min(0),
      errorsCount: z.number().min(0),
    })
    .optional(),
});

// Common response schemas
export const SuccessResponseSchema = z.object({
  success: z.literal(true),
  data: z.any().optional(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

export const ErrorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  message: z.string().optional(),
  timestamp: z.string().datetime(),
});

// Pagination schema
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  total: z.number().min(0),
  pages: z.number().min(0),
});

// Request schemas for validation
export const CreateWorkflowRequestSchema = WorkflowSchema.omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const UpdateWorkflowRequestSchema = WorkflowSchema.partial().omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const ExecuteWorkflowRequestSchema = z.object({
  input: z.record(z.string(), z.any()).optional(),
  variables: z.record(z.string(), z.any()).optional(),
});

// Export types
export type User = z.infer<typeof UserSchema>;
export type Organization = z.infer<typeof OrganizationSchema>;
export type Workflow = z.infer<typeof WorkflowSchema>;
export type Execution = z.infer<typeof ExecutionSchema>;
export type SuccessResponse = z.infer<typeof SuccessResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type CreateWorkflowRequest = z.infer<typeof CreateWorkflowRequestSchema>;
export type UpdateWorkflowRequest = z.infer<typeof UpdateWorkflowRequestSchema>;
export type ExecuteWorkflowRequest = z.infer<typeof ExecuteWorkflowRequestSchema>;
