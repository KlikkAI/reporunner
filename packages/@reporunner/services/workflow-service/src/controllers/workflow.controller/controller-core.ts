import { logger } from '@reporunner/shared/logger';
import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import { WorkflowDefinition, type WorkflowService } from '../index';

// Validation schemas
const CreateWorkflowSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().optional(),
  nodes: z
    .array(
      z.object({
        id: z.string(),
        type: z.string(),
        position: z.object({ x: z.number(), y: z.number() }),
        data: z.record(z.any()),
      })
    )
    .min(1),
  edges: z.array(
    z.object({
      id: z.string(),
      source: z.string(),
      target: z.string(),
      sourceHandle: z.string().optional(),
      targetHandle: z.string().optional(),
    })
  ),
  settings: z.object({
    timeout: z.number().default(30000),
    retries: z.number().default(3),
    errorHandling: z.enum(['stop', 'continue', 'rollback']).default('stop'),
  }),
  organizationId: z.string(),
  tags: z.array(z.string()).optional(),
  permissions: z.object({
    public: z.boolean().default(false),
    sharedWith: z.array(z.string()).default([]),
    roles: z.record(z.array(z.string())).default({}),
  }),
});

const UpdateWorkflowSchema = CreateWorkflowSchema.partial();

const ListWorkflowsSchema = z.object({
  organizationId: z.string().optional(),
  userId: z.string().optional(),
  status: z.enum(['draft', 'active', 'archived']).optional(),
  tags: z.array(z.string()).optional(),
  search: z.string().optional(),
  page: z.coerce.number().default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

const ExecuteWorkflowSchema = z.object({
  input: z.record(z.any()).default({}),
  environment: z.string().default('production'),
  async: z.boolean().default(true),
});

const ShareWorkflowSchema = z.object({
  userIds: z.array(z.string()),
  permissions: z.array(z.enum(['view', 'edit', 'execute'])).default(['view']),
});

export class WorkflowController {
  constructor(private workflowService: WorkflowService) {}

  async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = CreateWorkflowSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const workflow = await this.workflowService.create(validated, userId);

      res.status(201).json({
        success: true,
        data: workflow,
        message: 'Workflow created successfully'
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
          message: 'Validation failed'
        });
      } else {
        next(error);
      }
    }
  }

  async list(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const validated = ListWorkflowsSchema.parse(req.query);
      
      const filters = {
        organizationId: validated.organizationId,
        userId: validated.userId || (req as any).user?.id,
        status: validated.status,
        tags: validated.tags,
        search: validated.search
      };
