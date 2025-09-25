import express, { type Router } from 'express';
import { body, param, query } from 'express-validator';
import { authenticate } from '../../../middleware/auth.js';
import { catchAsync } from '../../../middleware/errorHandlers.js';
import { WorkflowController } from '../controllers/WorkflowController.js';

const router: Router = express.Router();
const workflowController = new WorkflowController();

/**
 * @route   GET /workflows
 * @desc    Get all workflows for user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  [
    query('page').optional().isInt({ min: 1 }).toInt(),
    query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
    query('search').optional().trim(),
    query('tags').optional(),
    query('isActive').optional().isBoolean().toBoolean(),
  ],
  catchAsync(workflowController.getWorkflows)
);

/**
 * @route   GET /workflows/:id
 * @desc    Get workflow by ID
 * @access  Private
 */
router.get(
  '/:id',
  authenticate,
  [param('id').isMongoId()],
  catchAsync(workflowController.getWorkflowById)
);

/**
 * @route   POST /workflows
 * @desc    Create new workflow
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('nodes').isArray(),
    body('edges').isArray(),
    body('tags').optional().isArray(),
    body('isPublic').optional().isBoolean(),
    body('settings').optional().isObject(),
  ],
  catchAsync(workflowController.createWorkflow)
);

/**
 * @route   PUT /workflows/:id
 * @desc    Update workflow
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isMongoId(),
    body('name').optional().trim().isLength({ min: 1, max: 100 }),
    body('description').optional().trim().isLength({ max: 500 }),
    body('nodes').optional().isArray(),
    body('edges').optional().isArray(),
    body('tags').optional().isArray(),
    body('isPublic').optional().isBoolean(),
    body('isActive').optional().isBoolean(),
    body('settings').optional().isObject(),
  ],
  catchAsync(workflowController.updateWorkflow)
);

/**
 * @route   DELETE /workflows/:id
 * @desc    Delete workflow
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  [param('id').isMongoId()],
  catchAsync(workflowController.deleteWorkflow)
);

/**
 * @route   POST /workflows/:id/duplicate
 * @desc    Duplicate workflow
 * @access  Private
 */
router.post(
  '/:id/duplicate',
