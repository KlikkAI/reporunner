import { Router, Request, Response } from 'express';
import { rateLimit } from 'express-rate-limit';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation';

const router = Router();

// Rate limiting for auth operations
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // limit each IP to 10 auth requests per 15 minutes
  message: { error: 'Too many authentication requests, please try again later.' },
});

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: User login
 *     description: Authenticate user and return JWT token
 *     tags:
 *       - Authentication
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/login',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'Auth routes not implemented yet' });
  }
);

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: User registration
 *     description: Register a new user account
 *     tags:
 *       - Authentication
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */
router.post(
  '/register',
  authRateLimit,
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
    body('name').trim().notEmpty(),
  ],
  validateRequest,
  async (_req: Request, res: Response) => {
    res.json({ message: 'Auth routes not implemented yet' });
  }
);

export { router as authRoutes };