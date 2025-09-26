import { Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { param, query } from 'express-validator';
import { authRequired } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Rate limiting for node operations
const nodeRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // limit each user to 100 node requests per minute
  message: { error: 'Too many node requests, please try again later.' },
});

/**
 * @swagger
 * /api/v1/nodes:
 *   get:
 *     summary: Get available nodes
 *     description: Retrieve list of available workflow nodes
 *     tags:
 *       - Nodes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of available nodes
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/',
  authRequired,
  nodeRateLimit,
  [
    query('category').optional().isString(),
    query('search').optional().isString(),
  ],
  validateRequest,
  async (req, res) => {
    res.json({ message: 'Node routes not implemented yet' });
  }
);

/**
 * @swagger
 * /api/v1/nodes/{nodeType}:
 *   get:
 *     summary: Get node details
 *     description: Retrieve detailed information about a specific node type
 *     tags:
 *       - Nodes
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Node details
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get(
  '/:nodeType',
  authRequired,
  [param('nodeType').isString()],
  validateRequest,
  async (req, res) => {
    res.json({ message: 'Node routes not implemented yet' });
  }
);

export { router as nodeRoutes };