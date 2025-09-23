import type { Request, Response } from 'express';
import { BaseController } from '../../../base/BaseController.js';
import { CredentialService } from '../services/CredentialService.js';

export class CredentialController extends BaseController {
  private credentialService: CredentialService;

  constructor() {
    super();
    this.credentialService = new CredentialService();
  }

  /**
   * Get all credentials for user
   */
  getCredentials = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);

    const credentials = await this.credentialService.getCredentials(userId);

    this.sendSuccess(res, { credentials });
  };

  /**
   * Debug route to see all credentials
   */
  getAllCredentialsDebug = async (_req: Request, res: Response) => {
    const credentials = await this.credentialService.getAllCredentialsDebug();

    this.sendSuccess(res, { credentials });
  };

  /**
   * Create new credential
   */
  createCredential = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const { name, type, integration, data, expiresAt } = req.body;

    const credential = await this.credentialService.createCredential(userId, {
      name,
      type,
      integration,
      data,
      expiresAt,
    });

    this.sendCreated(res, { credential }, 'Credential created successfully');
  };

  /**
   * Update credential
   */
  updateCredential = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const { id } = req.params;
    const { name, data, expiresAt, isActive } = req.body;

    const credential = await this.credentialService.updateCredential(id, userId, {
      name,
      data,
      expiresAt,
      isActive,
    });

    this.sendSuccess(res, { credential }, 'Credential updated successfully');
  };

  /**
   * Delete credential
   */
  deleteCredential = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const { id } = req.params;

    await this.credentialService.deleteCredential(id, userId);

    this.sendSuccess(res, undefined, 'Credential deleted successfully');
  };

  /**
   * Test credential connection
   */
  testCredential = async (req: Request, res: Response) => {
    const userId = this.getUserId(req);
    const { id } = req.params;

    const testResult = await this.credentialService.testCredential(id, userId);

    this.sendSuccess(res, testResult);
  };

  /**
   * Test Gmail node and fetch sample emails
   */
  testGmail = async (req: Request, res: Response) => {
    this.validateRequest(req);

    const { id } = req.params;
    const { filters = {} } = req.body;
    const userId = this.getUserId(req);

    const result = await this.credentialService.testGmailCredential(id, userId, filters);

    this.sendSuccess(res, result);
  };
}
