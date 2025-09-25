import { z } from 'zod';
import {
  ApiResponseSchema,
  ExecutionStatusSchema,
  IdSchema,
  MetadataSchema,
  NodeParametersSchema,
  OptionalIdSchema,
  PaginatedResponseSchema,
  StatusSchema,
  TimestampSchema,
} from './BaseSchemas';

// Node schemas
export const WorkflowNodeSchema = z.object({
  id: IdSchema,
  type: z.string(),
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.object({
    label: z.string().optional(),
    parameters: NodeParametersSchema.optional(),
    credentials: z.string().optional(), // credential ID
    disabled: z.boolean().optional(),
    notes: z.string().optional(),
    // Enhanced node data
    integrationData: z
      .object({
        id: z.string(),
        version: z.string().optional(),
        displayName: z.string().optional(),
      })
      .optional(),
    enhancedNodeType: z.string().optional(),
  }),
  metadata: MetadataSchema.optional(),
});

// Edge/Connection schemas
export const WorkflowEdgeSchema = z.object({
  id: IdSchema,
  source: IdSchema,
  target: IdSchema,
  sourceHandle: z.string().optional(),
  targetHandle: z.string().optional(),
  type: z.string().optional(),
  data: z.record(z.string(), z.unknown()).optional(),
  label: z.string().optional(),
});

// Core workflow definition
export const WorkflowDefinitionSchema = z.object({
  id: OptionalIdSchema,
  name: z.string().min(1).max(255),
  description: z.string().max(1000).optional(),
  version: z.number().int().min(1).default(1),
  nodes: z.array(WorkflowNodeSchema).default([]), // Make optional with default
  edges: z.array(WorkflowEdgeSchema).default([]), // Make optional with default
  settings: z
    .object({
      timeout: z.number().int().min(1000).max(3600000).default(300000), // 5 minutes default
      retryPolicy: z
        .object({
          maxRetries: z.number().int().min(0).max(5).default(3),
          retryDelay: z.number().int().min(1000).max(60000).default(5000),
        })
        .optional(),
      errorHandling: z.enum(['stop', 'continue', 'retry']).default('stop'),
    })
    .optional(),
  tags: z.array(z.string()).default([]),
  isActive: z.boolean().default(true),
  createdAt: TimestampSchema.optional(),
  updatedAt: TimestampSchema.optional(),
  createdBy: z.string().optional(),
});

// Workflow with metadata (from API)
export const WorkflowSchema = WorkflowDefinitionSchema.and(
  z.object({
    id: IdSchema, // Required for saved workflows
    _id: IdSchema.optional(), // MongoDB ObjectId
    userId: IdSchema.optional(), // Owner of the workflow
    isPublic: z.boolean().optional(), // Whether workflow is public
    status: StatusSchema.optional(), // Made optional, computed from isActive
    successRate: z.number().min(0).max(100).optional(), // Success rate percentage
    lastExecution: z
      .object({
        id: IdSchema,
        status: ExecutionStatusSchema,
        startTime: TimestampSchema,
        endTime: TimestampSchema.optional(),
        duration: z.number().int().min(0).optional(),
      })
      .optional(),
    executionStats: z
      .object({
        totalExecutions: z.number().int().min(0),
