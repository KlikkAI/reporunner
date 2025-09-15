import { Request, Response } from 'express';
import { WorkflowService } from '../services/WorkflowService.js';
import { BaseController } from '../../../base/BaseController.js';

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
      message: 'Workflow duplicated successfully',
      data: { workflow },
    });
  };

  /**
   * Execute workflow
   */
  executeWorkflow = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const { triggerData } = req.body;

    const executionId = await this.workflowService.executeWorkflow(id, userId, triggerData);

    res.json({
      status: 'success',
      message: 'Workflow execution started',
      data: { executionId },
    });
  };

  /**
   * Test workflow (dry run)
   */
  testWorkflow = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const validation = await this.workflowService.testWorkflow(id, userId);

    res.json({
      status: 'success',
      data: { validation },
    });
  };

  /**
   * Get workflow statistics
   */
  getWorkflowStatistics = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    const statistics = await this.workflowService.getWorkflowStatistics(id, userId, days);

    res.json({
      status: 'success',
      data: { statistics },
    });
  };

  /**
   * Get all executions
   */
  getExecutions = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { workflowId, status } = req.query;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;

    const result = await this.workflowService.getExecutions(userId, {
      workflowId: workflowId as string,
      status: status as string,
      page,
      limit,
    });

    res.json({
      status: 'success',
      data: result,
    });
  };

  /**
   * Get execution by ID
   */
  getExecutionById = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    const execution = await this.workflowService.getExecutionById(id, userId);

    res.json({
      status: 'success',
      data: execution,
    });
  };

  /**
   * Stop execution
   */
  stopExecution = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    const { id } = req.params;

    await this.workflowService.stopExecution(id, userId);

    res.json({
      status: 'success',
      message: 'Execution stopped successfully',
    });
  };

  /**
   * Get execution statistics
   */
  getExecutionStatistics = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const { workflowId } = req.query;

    const stats = await this.workflowService.getExecutionStatistics(userId, workflowId as string);

    this.sendSuccess(res, stats);
  };

  /**
   * Test workflow (dry run) from body
   */
  testWorkflowFromBody = async (req: Request, res: Response) => {
    const { workflow } = req.body;
    const validation = await this.workflowService.testWorkflowData(workflow);

    res.json({
      status: 'success',
      data: validation,
    });
  };
}