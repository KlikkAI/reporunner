import { type Request, type Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body, param } from 'express-validator';
import { authRequired } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Rate limiting for webhook operations
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // limit each user to 200 webhook requests per minute
  message: { error: 'Too many webhook requests, please try again later.' },
});

/**
 * @swagger
 * /api/v1/webhooks:
 *   post:
 *     summary: Webhook endpoint
 *     description: Receive webhook from external services
 *     tags:
 *       - Webhooks
 *     responses:
 *       200:
 *         description: Webhook processed successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/',
  webhookRateLimit,
  [body('payload').optional(), body('signature').optional().isString()],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'Webhook received', timestamp: new Date().toISOString() });
  }
);

/**
 * @swagger
 * /api/v1/webhooks/{workflowId}:
 *   post:
 *     summary: Workflow-specific webhook
 *     description: Trigger a specific workflow via webhook
 *     tags:
 *       - Webhooks
 *     parameters:
 *       - in: path
 *         name: workflowId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Workflow triggered successfully
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:workflowId',
  webhookRateLimit,
  [param('workflowId').isString().notEmpty()],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'Workflow webhook not implemented yet' });
  }
);

/**
 * @swagger
 * /api/v1/webhooks/test:
 *   post:
 *     summary: Test webhook
 *     description: Test webhook endpoint for debugging
 *     tags:
 *       - Webhooks
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Test webhook successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/test',
  authRequired,
  webhookRateLimit,
  validateRequest,
  async (req: Request, res: Response) => {
    res.json({
      message: 'Test webhook successful',
      received: req.body,
      headers: req.headers,
      timestamp: new Date().toISOString(),
    });
  }
);

export { router as webhookRoutes };
