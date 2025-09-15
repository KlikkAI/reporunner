import express, { Router } from 'express';
import { body, param } from 'express-validator';
import { NodeExecutionController } from '../controllers/NodeExecutionController.js';
import { catchAsync } from '../../../middleware/errorHandlers.js';
import { authenticate } from '../../../middleware/auth.js';

const router: Router = express.Router();
const nodeExecutionController = new NodeExecutionController();

/**
 * @route   POST /nodes/:nodeId/execute
 * @desc    Execute a specific node and its dependency chain
 * @access  Private
 */
router.post(
  '/:nodeId/execute',
  authenticate,
  [
    param('nodeId').isString(),
    body('workflow').isObject(),
  ],
  catchAsync(nodeExecutionController.executeNode)
);

export default router;