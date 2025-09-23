import type { Request, Response } from 'express';
import { BaseController } from '../../../base/BaseController.js';
import { AppError } from '../../../middleware/errorHandlers.js';
import { logger } from '../../../utils/logger.js';
import { AuthService } from '../services/AuthService.js';

export class AuthController extends BaseController {
  private authService: AuthService;
  // Using winston logger directly

  constructor() {
    super();
    this.authService = new AuthService();
    // Using winston logger directly
  }

  /**
   * Register a new user
   */
  register = async (req: Request, res: Response) => {
    this.validateRequest(req);

    const { email, password, firstName, lastName } = req.body;
    const result = await this.authService.register({ email, password, firstName, lastName });

    logger.info(`User registered: ${result.user.id}`);
    this.sendCreated(res, result, 'User registered successfully');
  };

  /**
   * Login user
   */
  login = async (req: Request, res: Response) => {
    this.validateRequest(req);

    const { email, password } = req.body;
    const result = await this.authService.login(email, password);

    logger.info(`User logged in: ${result.user.id}`);
    this.sendSuccess(res, result, 'Login successful');
  };

  /**
   * Refresh access token
   */
  refreshToken = async (req: Request, res: Response) => {
    const { refreshToken } = req.body;
    const result = await this.authService.refreshToken(refreshToken);

    this.sendSuccess(res, result, 'Token refreshed successfully');
  };

  /**
   * Logout user
   */
  logout = async (_req: Request, res: Response) => {
    // Generate a simple session ID for the response
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    this.sendSuccess(
      res,
      {
        message: 'Logout successful',
        sessionId,
      },
      'Logout successful'
    );
  };

  /**
   * Get current user profile
   */
  getProfile = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const user = await this.authService.getUserProfile(userId);
    this.sendSuccess(res, { user });
  };

  /**
   * Update user profile
   */
  updateProfile = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError('Not authenticated', 401);
    }

    const { firstName, lastName, email } = req.body;
    const user = await this.authService.updateProfile(userId, { firstName, lastName, email });

    this.sendSuccess(res, { user }, 'Profile updated successfully');
  };

  /**
   * Change user password
   */
  changePassword = async (req: Request, res: Response) => {
    const userId = (req as any).user?.id;
    if (!userId) {
      throw new AppError('Not authenticated', 401);
    }

    const { currentPassword, newPassword } = req.body;
    await this.authService.changePassword(userId, currentPassword, newPassword);

    this.sendSuccess(res, null, 'Password changed successfully');
  };
}
