import express, { Router } from 'express';
import { body, param, query } from 'express-validator';
import { CredentialController } from '../controllers/CredentialController.js';
import { catchAsync } from '../../../middleware/errorHandlers.js';
import { authenticate } from '../../../middleware/auth.js';

const router: Router = express.Router();
const credentialController = new CredentialController();

/**
 * @route   GET /credentials
 * @desc    Get all credentials for user
 * @access  Private
 */
router.get(
  '/',
  authenticate,
  catchAsync(credentialController.getCredentials)
);

/**
 * Debug route to see all credentials (temporarily for debugging)
 */
router.get(
  '/debug/all',
  catchAsync(credentialController.getAllCredentialsDebug)
);

/**
 * @route   POST /credentials
 * @desc    Create new credential
 * @access  Private
 */
router.post(
  '/',
  authenticate,
  [
    body('name').isString().trim().isLength({ min: 1, max: 100 }),
    body('type').isIn(['oauth2', 'api_key', 'basic_auth', 'bearer_token', 'custom', 'openaiApi', 'anthropicApi', 'googleAiApi', 'azureOpenAiApi', 'awsBedrockApi']),
    body('integration').isString().trim(),
    body('data').isObject(),
    body('expiresAt').optional().isISO8601(),
  ],
  catchAsync(credentialController.createCredential)
);

/**
 * @route   PUT /credentials/:id
 * @desc    Update credential
 * @access  Private
 */
router.put(
  '/:id',
  authenticate,
  [
    param('id').isMongoId(),
    body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
    body('data').optional().isObject(),
    body('expiresAt').optional().isISO8601(),
    body('isActive').optional().isBoolean(),
  ],
  catchAsync(credentialController.updateCredential)
);

/**
 * @route   DELETE /credentials/:id
 * @desc    Delete credential
 * @access  Private
 */
router.delete(
  '/:id',
  authenticate,
  [param('id').isString().isLength({ min: 1 })],
  catchAsync(credentialController.deleteCredential)
);

/**
 * @route   POST /credentials/:id/test
 * @desc    Test credential connection
 * @access  Private
 */
router.post(
  '/:id/test',
  authenticate,
  [param('id').isString().isLength({ min: 1 })],
  catchAsync(credentialController.testCredential)
);

/**
 * @route   POST /credentials/:id/test-gmail
 * @desc    Test Gmail node and fetch sample emails
 * @access  Private
 */
router.post(
  '/:id/test-gmail',
  authenticate,
  [
    param('id').isMongoId().withMessage('Invalid credential ID'),
    body('action').equals('fetchEmails').withMessage('Action must be fetchEmails'),
    body('filters').optional().custom((value) => {
      if (value === undefined || value === null) return true;
      if (typeof value === 'object' && !Array.isArray(value)) return true;
      throw new Error('Filters must be an object, not an array');
    })
  ],
  catchAsync(credentialController.testGmail)
);

export default router;