import type { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { AppError } from '../../../middleware/errorHandlers';
import { NodeExecutionService } from '../services/NodeExecutionService';

export class NodeExecutionController {
  private nodeExecutionService: NodeExecutionService;

  constructor() {
    this.nodeExecutionService = new NodeExecutionService();
  }

  /**
   * Execute a specific node and its dependency chain
   */
  executeNode = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const userId = (req as any).user?.id;
    const { nodeId } = req.params;
    const { workflow } = req.body;

    try {
      const result = await this.nodeExecutionService.executeNodeChain(nodeId, workflow, userId);

      res.json({
        status: 'success',
        data: result,
      });
    } catch (error: any) {
      console.error('Node execution error:', error);
      res.status(400).json({
        status: 'error',
        message: error.message || 'Failed to execute node',
        nodeId,
      });
    }
  };
}
