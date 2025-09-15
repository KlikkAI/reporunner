import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { OAuthService } from '../services/OAuthService.js';
import { AppError } from '../../../middleware/errorHandlers.js';

export class OAuthController {
  private oauthService: OAuthService;

  constructor() {
    this.oauthService = new OAuthService();
  }

  /**
   * Initiate Gmail OAuth2 flow
   */
  initiateGmailOAuth = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const userId = (req as any).user?.id || 'anonymous';
    const { credentialName, returnUrl } = req.body;

    const result = await this.oauthService.initiateGmailOAuth(userId, credentialName, returnUrl, req);

    res.json({
      status: 'success',
      data: result,
    });
  };

  /**
   * Exchange authorization code for tokens
   */
  exchangeCodeForTokens = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { code, clientId, clientSecret, redirectUri, state } = req.body;
    const result = await this.oauthService.exchangeCodeForTokens(code, clientId, clientSecret, redirectUri, req);

    res.json({
      status: 'success',
      data: result,
    });
  };

  /**
   * OAuth2 callback endpoint (handles Google redirect)
   */
  handleGmailCallback = async (req: Request, res: Response) => {
    const { code, state, error } = req.query;

    if (error) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const defaultReturnUrl = `${frontendUrl}/workflows`;
      return res.redirect(`${defaultReturnUrl}?credential=error&message=${encodeURIComponent(error as string)}`);
    }

    if (!code || !state) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const defaultReturnUrl = `${frontendUrl}/workflows`;
      return res.redirect(`${defaultReturnUrl}?credential=error&message=Missing authorization code or state`);
    }

    try {
      const redirectUrl = await this.oauthService.handleGmailCallback(code as string, state as string, req);
      res.redirect(redirectUrl);
    } catch (error: any) {
      console.error('OAuth callback error:', error);
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const defaultReturnUrl = `${frontendUrl}/workflows`;
      const urlObj = new URL(defaultReturnUrl);
      urlObj.searchParams.set('credential', 'error');
      urlObj.searchParams.set('message', error.message || 'Failed to complete OAuth flow');
      res.redirect(urlObj.toString());
    }
  };

  /**
   * Refresh Gmail access token
   */
  refreshGmailToken = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { refreshToken, clientId, clientSecret } = req.body;
    const result = await this.oauthService.refreshGmailToken(refreshToken, clientId, clientSecret);

    res.json({
      status: 'success',
      data: result,
    });
  };

  /**
   * Test Gmail connection with credentials
   */
  testGmailConnection = async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation failed', 400);
    }

    const { clientId, clientSecret, refreshToken } = req.body;
    const result = await this.oauthService.testGmailConnection(clientId, clientSecret, refreshToken);

    res.json({
      status: result.connected ? 'success' : 'error',
      data: result,
    });
  };
}