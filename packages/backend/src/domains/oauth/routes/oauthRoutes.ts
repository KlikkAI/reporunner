import express, { Router } from 'express';
import { body } from 'express-validator';
import { OAuthController } from '../controllers/OAuthController.js';
import { catchAsync } from '../../../middleware/errorHandlers.js';
import { authenticate } from '../../../middleware/auth.js';

const router: Router = express.Router();
const oauthController = new OAuthController();

/**
 * @route   POST /oauth/gmail/initiate
 * @desc    Initiate Gmail OAuth2 flow
 * @access  Private
 */
router.post(
  '/gmail/initiate',
  authenticate,
  [
    body('credentialName').notEmpty().withMessage('Credential name is required'),
  ],
  catchAsync(oauthController.initiateGmailOAuth)
);

/**
 * @route   POST /oauth/gmail/exchange-code
 * @desc    Exchange authorization code for tokens
 * @access  Private
 */
router.post(
  '/gmail/exchange-code',
  [
    body('code').notEmpty().withMessage('Authorization code is required'),
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('clientSecret').notEmpty().withMessage('Client Secret is required'),
    body('redirectUri').optional().isURL().withMessage('Invalid redirect URI'),
    body('state').optional().isString().withMessage('Invalid state parameter'),
  ],
  catchAsync(oauthController.exchangeCodeForTokens)
);

/**
 * @route   GET /oauth/gmail/callback
 * @desc    OAuth2 callback endpoint (handles Google redirect)
 * @access  Public
 */
router.get('/gmail/callback', catchAsync(oauthController.handleGmailCallback));

/**
 * @route   POST /oauth/gmail/refresh-token
 * @desc    Refresh Gmail access token
 * @access  Private
 */
router.post(
  '/gmail/refresh-token',
  [
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('clientSecret').notEmpty().withMessage('Client Secret is required'),
  ],
  catchAsync(oauthController.refreshGmailToken)
);

/**
 * @route   POST /oauth/gmail/test-connection
 * @desc    Test Gmail connection with credentials
 * @access  Private
 */
router.post(
  '/gmail/test-connection',
  [
    body('clientId').notEmpty().withMessage('Client ID is required'),
    body('clientSecret').notEmpty().withMessage('Client Secret is required'),
    body('refreshToken').notEmpty().withMessage('Refresh token is required'),
  ],
  catchAsync(oauthController.testGmailConnection)
);

export default router;