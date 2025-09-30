import { type Request, type Response, Router } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body } from 'express-validator';
import { authRequired } from '../middleware/auth';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Rate limiting for user operations
const userRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 50, // limit each user to 50 user requests per minute
  message: { error: 'Too many user requests, please try again later.' },
});

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     description: Retrieve the authenticated user's profile
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.get('/profile', authRequired, userRateLimit, async (_req: Request, res: Response) => {
  res.json({ message: 'User routes not implemented yet' });
});

/**
 * @swagger
 * /api/v1/users/profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's profile
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.put(
  '/profile',
  authRequired,
  userRateLimit,
  [body('name').optional().trim().notEmpty(), body('email').optional().isEmail().normalizeEmail()],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'User routes not implemented yet' });
  }
);

export { router as userRoutes };
