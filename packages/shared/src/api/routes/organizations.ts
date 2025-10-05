import { type Request, type Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body, param } from 'express-validator';
import { authRequired } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Rate limiting for organization operations
const orgRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // limit each user to 50 org requests per 15 minutes
  message: { error: 'Too many organization requests, please try again later.' },
});

/**
 * @swagger
 * /api/v1/organizations:
 *   get:
 *     summary: Get organizations
 *     description: Retrieve user's organizations
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Organizations retrieved successfully
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/', authRequired, orgRateLimit, async (_req: Request, res: Response) => {
  res.json({ message: 'Organization routes not implemented yet' });
});

/**
 * @swagger
 * /api/v1/organizations:
 *   post:
 *     summary: Create organization
 *     description: Create a new organization
 *     tags:
 *       - Organizations
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Organization created successfully
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
  orgRateLimit,
  [body('name').trim().notEmpty(), body('description').optional().trim()],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'Organization creation not implemented yet' });
  }
);

/**
 * @swagger
 * /api/v1/organizations/{id}:
 *   get:
 *     summary: Get organization by ID
 *     description: Retrieve a specific organization by its ID
 *     tags:
 *       - Organizations
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
 *         description: Organization retrieved successfully
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
  orgRateLimit,
  [param('id').isString().notEmpty()],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'Organization retrieval not implemented yet' });
  }
);

export { router as organizationRoutes };
