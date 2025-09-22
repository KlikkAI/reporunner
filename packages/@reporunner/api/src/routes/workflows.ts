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
 *               $ref: '#/components/schemas/Workflow'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:workflowId',
  authRequired,
  [param('workflowId').isUUID()],
  validateRequest,
  workflowController.getWorkflow
);

/**
 * @swagger
 * /api/v1/workflows:
 *   post:
 *     summary: Create workflow
 *     description: Create a new workflow
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - nodes
 *               - connections
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *                 description: Workflow name
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *                 description: Workflow description
 *               nodes:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/WorkflowNode'
 *               connections:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/WorkflowConnection'
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               settings:
 *                 type: object
 *                 properties:
 *                   timezone:
 *                     type: string
 *                   timeout:
 *                     type: integer
 *                   retryOnFail:
 *                     type: boolean
 *     responses:
 *       201:
 *         description: Workflow created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workflow'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/',
  authRequired,
  workflowRateLimit,
  [
    body('name').trim().notEmpty().isLength({ min: 1, max: 255 }),
    body('description').optional().isLength({ max: 1000 }),
    body('nodes').isArray({ min: 1 }),
    body('connections').isArray(),
    body('tags').optional().isArray(),
    body('settings').optional().isObject(),
  ],
  validateRequest,
  workflowController.createWorkflow
);

/**
 * @swagger
 * /api/v1/workflows/{workflowId}:
 *   put:
 *     summary: Update workflow
 *     description: Update an existing workflow
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 maxLength: 1000
 *               nodes:
 *                 type: array
 *               connections:
 *                 type: array
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *               settings:
 *                 type: object
 *     responses:
 *       200:
 *         description: Workflow updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Workflow'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  '/:workflowId',
  authRequired,
  workflowRateLimit,
  [
    param('workflowId').isUUID(),
    body('name').optional().trim().notEmpty().isLength({ min: 1, max: 255 }),
    body('description').optional().isLength({ max: 1000 }),
    body('nodes').optional().isArray(),
    body('connections').optional().isArray(),
    body('tags').optional().isArray(),
    body('settings').optional().isObject(),
  ],
  validateRequest,
  workflowController.updateWorkflow
);

/**
 * @swagger
 * /api/v1/workflows/{workflowId}:
 *   delete:
 *     summary: Delete workflow
 *     description: Delete a workflow and all its executions
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     responses:
 *       204:
 *         description: Workflow deleted successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.delete(
  '/:workflowId',
  authRequired,
  [param('workflowId').isUUID()],
  validateRequest,
  workflowController.deleteWorkflow
);

/**
 * @swagger
 * /api/v1/workflows/{workflowId}/execute:
 *   post:
 *     summary: Execute workflow
 *     description: Manually execute a workflow
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               inputData:
 *                 type: object
 *                 description: Input data for the workflow
 *               mode:
 *                 type: string
 *                 enum: ['manual', 'test']
 *                 default: 'manual'
 *     responses:
 *       202:
 *         description: Workflow execution started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 executionId:
 *                   type: string
 *                   format: uuid
 *                 status:
 *                   type: string
 *                   enum: ['pending', 'running']
 *                 message:
 *                   type: string
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:workflowId/execute',
  authRequired,
  workflowRateLimit,
  [
    param('workflowId').isUUID(),
    body('inputData').optional().isObject(),
    body('mode').optional().isIn(['manual', 'test']),
  ],
  validateRequest,
  workflowController.executeWorkflow
);

/**
 * @swagger
 * /api/v1/workflows/{workflowId}/activate:
 *   post:
 *     summary: Activate workflow
 *     description: Activate a workflow to enable triggers
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     responses:
 *       200:
 *         description: Workflow activated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:workflowId/activate',
  authRequired,
  [param('workflowId').isUUID()],
  validateRequest,
  workflowController.activateWorkflow
);

/**
 * @swagger
 * /api/v1/workflows/{workflowId}/deactivate:
 *   post:
 *     summary: Deactivate workflow
 *     description: Deactivate a workflow to disable triggers
 *     tags:
 *       - Workflows
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - $ref: '#/components/parameters/WorkflowId'
 *     responses:
 *       200:
 *         description: Workflow deactivated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:workflowId/deactivate',
  authRequired,
  [param('workflowId').isUUID()],
  validateRequest,
  workflowController.deactivateWorkflow
);

export { router as workflowRoutes };
