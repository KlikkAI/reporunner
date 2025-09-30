import type { NextFunction, Request, Response } from 'express';
import { z } from 'zod';
import type { WorkflowDefinition, WorkflowService } from '../index';

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
        message: 'Workflow created successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
          message: 'Validation failed',
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
        search: validated.search,
      };

      const pagination = {
        page: validated.page,
        limit: validated.limit,
        sort: validated.sortBy
          ? ({
              [validated.sortBy]: validated.sortOrder === 'asc' ? 1 : -1,
            } as Record<string, 1 | -1>)
          : undefined,
      };

      const result = await this.workflowService.list(filters, pagination);

      res.json({
        success: true,
        data: result.workflows,
        pagination: {
          page: validated.page,
          limit: validated.limit,
          total: result.total,
          totalPages: Math.ceil(result.total / validated.limit),
        },
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
          message: 'Validation failed',
        });
      } else {
        next(error);
      }
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      const workflow = await this.workflowService.get(id);

      if (!workflow) {
        res.status(404).json({
          success: false,
          message: 'Workflow not found',
        });
        return;
      }

      // Check permissions
      const userId = (req as any).user?.id;
      if (!this.hasViewPermission(workflow, userId)) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      res.json({
        success: true,
        data: workflow,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = UpdateWorkflowSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const workflow = await this.workflowService.update(id, validated, userId);

      res.json({
        success: true,
        data: workflow,
        message: 'Workflow updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          errors: error.errors,
          message: 'Validation failed',
        });
      } else if ((error as any).message?.includes('not found')) {
        res.status(404).json({
          success: false,
          message: 'Workflow not found',
        });
      } else if ((error as any).message?.includes('permissions')) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      } else {
        next(error);
      }
    }
  }

  async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      const success = await this.workflowService.delete(id, userId);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Workflow not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Workflow deleted successfully',
      });
    } catch (error) {
      if ((error as any).message?.includes('permissions')) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
      } else {
        next(error);
      }
    }
  }

  async execute(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = ExecuteWorkflowSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const workflow = await this.workflowService.get(id);

      if (!workflow) {
        res.status(404).json({
          success: false,
          message: 'Workflow not found',
        });
        return;
      }

      if (!this.hasExecutePermission(workflow, userId)) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Emit execution request to execution service
      this.workflowService.emit('execution.requested', {
        workflowId: id,
        userId,
        input: validated.input,
        environment: validated.environment,
        async: validated.async,
      });

      if (validated.async) {
        res.json({
          success: true,
          message: 'Workflow execution started',
          executionId: `exec-${Date.now()}`, // Would be generated by execution service
        });
      } else {
        // For sync execution, would need to wait for completion
        res.json({
          success: true,
          message: 'Workflow execution completed',
          result: {}, // Would contain actual execution result
        });
      }
    } catch (error) {
      next(error);
    }
  }

  async getExecutions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20 } = req.query;

      // This would query the executions collection
      res.json({
        success: true,
        data: [],
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: 0,
          totalPages: 0,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async share(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const validated = ShareWorkflowSchema.parse(req.body);
      const userId = (req as any).user?.id;

      const workflow = await this.workflowService.get(id);

      if (!workflow) {
        res.status(404).json({
          success: false,
          message: 'Workflow not found',
        });
        return;
      }

      if (!this.hasSharePermission(workflow, userId)) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Update workflow permissions
      const updatedPermissions = {
        ...workflow.permissions,
        sharedWith: [...new Set([...workflow.permissions.sharedWith, ...validated.userIds])],
      };

      await this.workflowService.update(id, { permissions: updatedPermissions }, userId);

      res.json({
        success: true,
        message: 'Workflow shared successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async duplicate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const { name } = req.body;

      const workflow = await this.workflowService.get(id);

      if (!workflow) {
        res.status(404).json({
          success: false,
          message: 'Workflow not found',
        });
        return;
      }

      if (!this.hasViewPermission(workflow, userId)) {
        res.status(403).json({
          success: false,
          message: 'Access denied',
        });
        return;
      }

      // Create a copy
      const duplicated = await this.workflowService.create(
        {
          ...workflow,
          name: name || `${workflow.name} (Copy)`,
          id: undefined as any,
          version: undefined as any,
          createdAt: undefined as any,
          updatedAt: undefined as any,
        },
        userId
      );

      res.json({
        success: true,
        data: duplicated,
        message: 'Workflow duplicated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getVersions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;

      // This would query the workflow_history collection
      res.json({
        success: true,
        data: [],
        message: 'Workflow versions retrieved',
      });
    } catch (error) {
      next(error);
    }
  }

  async createVersion(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const { message } = req.body;
      const userId = (req as any).user?.id;

      const workflow = await this.workflowService.get(id);

      if (!workflow) {
        res.status(404).json({
          success: false,
          message: 'Workflow not found',
        });
        return;
      }

      // Create a new version
      const newVersion = this.incrementMajorVersion(workflow.version);
      await this.workflowService.update(id, { version: newVersion }, userId);

      res.json({
        success: true,
        data: { version: newVersion },
        message: 'New version created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getTemplates(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // This would query a templates collection
      const templates = [
        {
          id: 'email-automation',
          name: 'Email Automation',
          description: 'Automate email sending based on triggers',
          category: 'Marketing',
        },
        {
          id: 'data-sync',
          name: 'Data Synchronization',
          description: 'Sync data between multiple systems',
          category: 'Integration',
        },
        {
          id: 'ai-workflow',
          name: 'AI Processing Pipeline',
          description: 'Process data through AI models',
          category: 'AI/ML',
        },
      ];

      res.json({
        success: true,
        data: templates,
      });
    } catch (error) {
      next(error);
    }
  }

  async createFromTemplate(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { templateId } = req.params;
      const { name, organizationId } = req.body;
      const _userId = (req as any).user?.id;

      // This would fetch the template and create a new workflow
      res.json({
        success: true,
        message: 'Workflow created from template',
        data: { id: 'new-workflow-id' },
      });
    } catch (error) {
      next(error);
    }
  }

  // Helper methods
  private hasViewPermission(workflow: WorkflowDefinition, userId: string): boolean {
    return (
      workflow.permissions.public ||
      workflow.createdBy === userId ||
      workflow.permissions.sharedWith.includes(userId)
    );
  }

  private hasExecutePermission(workflow: WorkflowDefinition, userId: string): boolean {
    return (
      workflow.createdBy === userId ||
      workflow.permissions.roles[userId]?.includes('execute') ||
      workflow.permissions.roles[userId]?.includes('editor')
    );
  }

  private hasSharePermission(workflow: WorkflowDefinition, userId: string): boolean {
    return workflow.createdBy === userId || workflow.permissions.roles[userId]?.includes('admin');
  }

  private incrementMajorVersion(version: string): string {
    const parts = version.split('.');
    const major = Number.parseInt(parts[0], 10) + 1;
    return `${major}.0.0`;
  }
}
