import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body, param, query } from 'express-validator';
import { WorkflowController } from '../controllers/workflow-controller';
import { authRequired } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();
const workflowController = new WorkflowController();

// Rate limiting for workflow operations
const workflowRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each user to 100 requests per minute
  message: { error: 'Too many workflow requests, please try again later.' },
});

/**
 * @swagger
 * /api/v1/workflows:
 *   get:
 *     summary: Get workflows
 *     description: Retrieve a paginated list of workflows for the authenticated user
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/PaginationPage'
 *       - $ref: '#/components/parameters/PaginationLimit'
 *       - name: active
 *         in: query
 *         description: Filter by active status
 *         required: false
 *         schema:
 *           type: boolean
 *       - name: tags
 *         in: query
 *         description: Filter by tags (comma-separated)
 *         required: false
 *         schema:
 *           type: string
 *       - name: search
 *         in: query
 *         description: Search workflows by name or description
 *         required: false
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of workflows
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/PaginatedResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Workflow'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  authRequired,
  workflowRateLimit,
  [
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('active').optional().isBoolean(),
    query('tags').optional().isString(),
    query('search').optional().isString(),
  ],
  validateRequest,
  workflowController.getWorkflows
);

/**
 * @swagger
 * /api/v1/workflows/{workflowId}:
 *   get:
 *     summary: Get workflow by ID
 *     description: Retrieve a specific workflow by its ID
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     responses:
 *       200:
 *         description: Workflow details
 *         content:
 *           application/json:
 *             schema:
