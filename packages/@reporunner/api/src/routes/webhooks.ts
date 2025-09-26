import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body, param } from 'express-validator';
import { authRequired } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Rate limiting for webhook operations
const webhookRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 200, // higher limit for webhooks as they're often triggered externally
  message: { error: 'Too many webhook requests, please try again later.' },
});

/**
 * @swagger
 * /api/v1/webhooks/{workflowId}:
 *   post:
 *     summary: Webhook endpoint
 *     description: Trigger workflow execution via webhook
 *     tags:
 *       - Webhooks
 *     parameters:
 *       - name: workflowId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       202:
 *         description: Workflow execution triggered
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/:workflowId',
  webhookRateLimit,
  [param('workflowId').isUUID()],
  validateRequest,
  async (req, res) => {
    res.json({ message: 'Webhook routes not implemented yet' });
  }
);

/**
 * @swagger
 * /api/v1/webhooks/{workflowId}:
 *   get:
 *     summary: Test webhook endpoint
 *     description: Test webhook endpoint for workflow
 *     tags:
 *       - Webhooks
 *     parameters:
 *       - name: workflowId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Webhook endpoint is working
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:workflowId',
  webhookRateLimit,
  [param('workflowId').isUUID()],
  validateRequest,
  async (req, res) => {
    res.json({
      message: 'Webhook endpoint is active',
      workflowId: req.params.workflowId,
      timestamp: new Date().toISOString()
    });
  }
);

export { router as webhookRoutes };