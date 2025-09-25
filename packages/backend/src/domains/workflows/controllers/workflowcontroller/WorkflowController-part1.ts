import type { Request, Response } from 'express';
import { BaseController } from '../../../base/BaseController.js';
import { WorkflowService } from '../services/WorkflowService.js';

export class WorkflowController extends BaseController {
  private workflowService: WorkflowService;

  constructor() {
    super();
    this.workflowService = new WorkflowService();
  }

  /**
   * Get all workflows for user
   */
  getWorkflows = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const { page, limit } = this.getPaginationParams(req);
    const search = req.query.search as string;
    const tags = req.query.tags as string;
    const isActive = req.query.isActive;

    const result = await this.workflowService.getWorkflows(userId, {
      page,
      limit,
      search,
      tags,
      isActive,
    });

    this.sendSuccess(res, result);
  };

  /**
   * Get workflow by ID
   */
  getWorkflowById = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const { id } = req.params;

    const workflow = await this.workflowService.getWorkflowById(id, userId);

    this.sendSuccess(res, { workflow });
  };

  /**
   * Create new workflow
   */
  createWorkflow = async (req: Request, res: Response) => {
    this.validateRequest(req);
    const userId = this.getUserId(req);

    const workflowData = req.body;
    const workflow = await this.workflowService.createWorkflow(userId, workflowData);

    this.sendCreated(res, { workflow }, 'Workflow created successfully');
  };

  /**
   * Update workflow
   */
  updateWorkflow = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const workflow = await this.workflowService.updateWorkflow(id, userId, req.body);

    res.json({
      status: 'success',
      message: 'Workflow updated successfully',
      data: { workflow },
    });
  };

  /**
   * Delete workflow
   */
  deleteWorkflow = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    await this.workflowService.deleteWorkflow(id, userId);

    res.json({
      status: 'success',
      message: 'Workflow deleted successfully',
    });
  };

  /**
   * Duplicate workflow
   */
  duplicateWorkflow = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const workflow = await this.workflowService.duplicateWorkflow(id, userId);

    res.status(201).json({
      status: 'success',
