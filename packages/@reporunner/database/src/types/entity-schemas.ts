import { z } from 'zod';

// Entity schemas reusing patterns from core types
export const BaseEntitySchema = z.object({
  _id: z.string().optional(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export const WorkflowExecutionSchema = BaseEntitySchema.extend({
  workflowId: z.string(),
  status: z.enum(['pending', 'running', 'success', 'error', 'cancelled']),
  startTime: z.date(),
  endTime: z.date().optional(),
  executionTime: z.number().optional(),
  nodeExecutions: z
    .record(
      z.object({
        nodeId: z.string(),
        status: z.enum(['pending', 'running', 'success', 'error', 'skipped', 'waiting']),
        startTime: z.date().optional(),
        endTime: z.date().optional(),
        data: z.any().optional(),
        error: z.string().optional(),
      })
    )
    .optional(),
  context: z.record(z.any()).optional(),
  error: z.string().optional(),
});

export const UserEntitySchema = BaseEntitySchema.extend({
  email: z.string().email(),
  username: z.string(),
  passwordHash: z.string(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  isActive: z.boolean().default(true),
  lastLoginAt: z.date().optional(),
  organizationId: z.string().optional(),
});

export const WorkflowEntitySchema = BaseEntitySchema.extend({
  name: z.string(),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  isActive: z.boolean().default(true),
  ownerId: z.string(),
  organizationId: z.string().optional(),
  version: z.number().default(1),
});

export type BaseEntity = z.infer<typeof BaseEntitySchema>;
export type WorkflowExecution = z.infer<typeof WorkflowExecutionSchema>;
export type UserEntity = z.infer<typeof UserEntitySchema>;
export type WorkflowEntity = z.infer<typeof WorkflowEntitySchema>;
