import express, { type Router } from 'express';
import { authenticate } from '../../../middleware/auth.js';
import { enhancedCatchAsync } from '../../../middleware/enhancedErrorHandlers.js';
import { AuthController } from '../controllers/AuthController.js';
import {
  changePasswordValidation,
  loginValidation,
  refreshTokenValidation,
  registerValidation,
  updateProfileValidation,
} from '../validators/authValidators.js';

const router: Router = express.Router();
const authController = new AuthController();

/**
 * @route   POST /auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', registerValidation, enhancedCatchAsync(authController.register));

/**
 * @route   POST /auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', loginValidation, enhancedCatchAsync(authController.login));

/**
 * @route   POST /auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', refreshTokenValidation, enhancedCatchAsync(authController.refreshToken));

/**
 * @route   POST /auth/logout
 * @desc    Logout user (optional - mainly for client-side token removal)
 * @access  Private
 */
router.post('/logout', enhancedCatchAsync(authController.logout));

/**
 * @route   GET /auth/me
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/me', authenticate, enhancedCatchAsync(authController.getProfile));

/**
 * @route   GET /auth/profile
 * @desc    Get current user profile (alternative endpoint)
 * @access  Private
 */
router.get('/profile', authenticate, enhancedCatchAsync(authController.getProfile));

/**
 * @route   PUT /auth/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put(
  '/profile',
  authenticate,
  updateProfileValidation,
  enhancedCatchAsync(authController.updateProfile)
);

/**
 * @route   PUT /auth/change-password
 * @desc    Change user password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  changePasswordValidation,
  enhancedCatchAsync(authController.changePassword)
);

export default router;
