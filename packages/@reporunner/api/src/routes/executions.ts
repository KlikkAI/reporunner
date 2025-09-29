import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { param, query } from 'express-validator';
import { authRequired } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Rate limiting for execution operations
const executionRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each user to 100 execution requests per minute
  message: { error: 'Too many execution requests, please try again later.' },
});

/**
 * @swagger
 * /api/v1/executions:
 *   get:
 *     summary: Get executions
 *     description: Retrieve workflow executions
 *     tags:
 *       - Executions
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Executions retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  authRequired,
  executionRateLimit,
  [
    query('workflowId').optional().isString(),
    query('status').optional().isString(),
    query('limit').optional().isInt({ min: 1, max: 100 }),
    query('offset').optional().isInt({ min: 0 }),
  ],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'Execution routes not implemented yet' });
  }
);

/**
 * @swagger
 * /api/v1/executions/{id}:
 *   get:
 *     summary: Get execution by ID
 *     description: Retrieve a specific execution by its ID
 *     tags:
 *       - Executions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Execution retrieved successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:id',
  authRequired,
  executionRateLimit,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'Execution retrieval not implemented yet' });
  }
);

/**
 * @swagger
 * /api/v1/executions/{id}/cancel:
 *   post:
 *     summary: Cancel execution
 *     description: Cancel a running execution
 *     tags:
 *       - Executions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Execution cancelled successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:id/cancel',
  authRequired,
  executionRateLimit,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'Execution cancellation not implemented yet' });
  }
);

export { router as executionRoutes };