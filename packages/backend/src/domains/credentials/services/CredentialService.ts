import mongoose from 'mongoose';
import { AppError } from '../../../middleware/errorHandlers.js';
import { GmailService } from '../../oauth/services/GmailService.js';
import { CredentialRepository } from '../repositories/CredentialRepository.js';

export interface CreateCredentialData {
  name: string;
  type: string;
  integration: string;
  data: any;
  expiresAt?: string;
}

export interface UpdateCredentialData {
  name?: string;
  data?: any;
  expiresAt?: string;
  isActive?: boolean;
}

export class CredentialService {
  private credentialRepository: CredentialRepository;

  constructor() {
    this.credentialRepository = new CredentialRepository();
  }

  /**
   * Helper function to check if a string is a valid MongoDB ObjectId
   */
  private isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id);
  }

  /**
   * Get all credentials for user
   */
  async getCredentials(userId: string) {
    const credentials = await this.credentialRepository.findByUserId(userId);
    console.log(
      `Found ${credentials.length} credentials for user ${userId}:`,
      credentials.map((c) => ({
        id: c._id,
        name: c.name,
        integration: c.integration,
        isActive: c.isActive,
      }))
    );
    return credentials;
  }

  /**
   * Debug route to see all credentials
   */
  async getAllCredentialsDebug() {
    const allCredentials = await this.credentialRepository.findAllDebug();
    console.log('All credentials in database:', allCredentials);
    return allCredentials;
  }

  /**
   * Create new credential
   */
  async createCredential(userId: string, credentialData: CreateCredentialData) {
    const credential = await this.credentialRepository.create({
      ...credentialData,
      userId,
    });

    return credential;
  }

  /**
   * Update credential
   */
  async updateCredential(id: string, userId: string, updateData: UpdateCredentialData) {
    // Try to find credential - check if ID is valid ObjectId first
    let credential;
    if (this.isValidObjectId(id)) {
      credential = await this.credentialRepository.findByIdAndUserId(id, userId);
    }

    // No custom field to check - only MongoDB _id exists
    if (!credential) {
      if (!this.isValidObjectId(id)) {
        throw new AppError(
          `Invalid credential ID format: ${id}. This appears to be a temporary ID. Please refresh and try again.`,
          400
        );
      } else {
        throw new AppError('Credential not found', 404);
      }
    }

    const updatedCredential = await this.credentialRepository.updateById(id, updateData);
    return updatedCredential;
  }

  /**
   * Delete credential
   */
  async deleteCredential(id: string, userId: string) {
    // Try to delete - check if ID is valid ObjectId first
    let credential;
    if (this.isValidObjectId(id)) {
      credential = await this.credentialRepository.findOneAndDelete(id, userId);
    }

    // No custom field to check - only MongoDB _id exists
    if (!credential) {
      if (!this.isValidObjectId(id)) {
        throw new AppError(
          `Invalid credential ID format: ${id}. This appears to be a temporary ID. Please refresh and try again.`,
          400
        );
      } else {
        throw new AppError('Credential not found', 404);
      }
    }
  }

  /**
   * Test credential connection
   */
  async testCredential(id: string, userId: string) {
    // Try to find credential - check if ID is valid ObjectId first
    let credential;
    if (this.isValidObjectId(id)) {
      credential = await this.credentialRepository.findByIdAndUserIdWithData(id, userId);
    }

    // No custom field to check - only MongoDB _id exists
    if (!credential) {
      if (!this.isValidObjectId(id)) {
        throw new AppError(
          `Invalid credential ID format: ${id}. This appears to be a temporary ID. Please refresh and try again.`,
          400
        );
      } else {
        throw new AppError('Credential not found', 404);
      }
    }

    let testResult = {
      success: false,
      message: 'Connection test failed',
      details: {},
    };

    try {
      const decryptedData = credential.getDecryptedData();

      // Handle different credential types
      switch (credential.type) {
        case 'oauth2':
          if (credential.integration === 'gmail' || credential.integration === 'gmailOAuth2') {
            testResult = await this.testGmailOAuth2Credential(decryptedData);
          } else {
            testResult = {
              success: false,
              message: `OAuth2 testing not implemented for integration: ${credential.integration}`,
              details: {},
            };
          }
          break;

        case 'openaiApi':
          testResult = await this.testOpenAICredential(decryptedData);
          break;

        case 'anthropicApi':
          testResult = await this.testAnthropicCredential(decryptedData);
          break;

        case 'googleAiApi':
          testResult = await this.testGoogleAICredential(decryptedData);
          break;

        case 'azureOpenAiApi':
          testResult = await this.testAzureOpenAICredential(decryptedData);
          break;

        case 'awsBedrockApi':
          testResult = await this.testAWSBedrockCredential(decryptedData);
          break;

        default:
          testResult = {
            success: false,
            message: `Testing not implemented for credential type: ${credential.type}`,
            details: {},
          };
      }

      // Update credential with test result
      await this.credentialRepository.updateTestResult(id, testResult.success);
    } catch (error: any) {
      testResult = {
        success: false,
        message: error.message || 'Credential test failed',
        details: { error: error.toString() },
      };
    }

    return testResult;
  }

  /**
   * Test Gmail credential and fetch sample emails
   */
  async testGmailCredential(id: string, userId: string, filters: any = {}) {
    console.log('Test Gmail request:', { id, filters, userId });

    // Debug: Check what credentials exist
    console.log('Looking for credential with:', { id, userId, integration: 'gmailOAuth2' });

    const allCredentials = await this.credentialRepository.findAllDebug();
    console.log('All credentials in database:', allCredentials);

    const userCredentials = await this.credentialRepository.findByUserId(userId);
    console.log('User credentials:', userCredentials);

    // Find and verify credential - check if ID is valid ObjectId first
    let credential;
    if (this.isValidObjectId(id)) {
      credential = await this.credentialRepository.findGmailCredential(id, userId);
    }

    // No custom field to check - only MongoDB _id exists
    if (!credential) {
      // Try to find any credential with this ID regardless of other criteria
      const anyCredential = await this.credentialRepository.findById(id);
      console.log('Credential with this ID exists:', anyCredential);

      // If specific ID not found, try to find any active Gmail credential for this user
      credential = await this.credentialRepository.findActiveGmailCredential(userId);

      if (credential) {
        console.log(
          `Using alternative Gmail credential: ${credential._id} instead of requested ${id}`
        );
      } else {
        throw new AppError('No Gmail credentials found for this user', 404);
      }
    }

    try {
      // Decrypt credential data
      const decryptedData = credential.getDecryptedData();

      // Create Gmail service instance
      const gmailService = new GmailService({
        clientId: decryptedData.clientId,
        clientSecret: decryptedData.clientSecret,
        refreshToken: decryptedData.refreshToken,
      });

      // Build Gmail query from filters
      let query = '';
      if (filters.from) query += `from:${filters.from} `;
      if (filters.subject) query += `subject:${filters.subject} `;
      if (filters.isUnread) query += 'is:unread ';
      if (filters.hasAttachment) query += 'has:attachment ';
      if (filters.label) query += `label:${filters.label} `;

      // Date filters
      if (filters.after) query += `after:${filters.after} `;
      if (filters.before) query += `before:${filters.before} `;

      const maxResults = Math.min(filters.maxResults || 1, 50); // Default to 1 for latest email, limit to 50 max

      // Fetch emails
      const messages = await gmailService.listMessages(query.trim() || undefined, maxResults);

      // Update credential last used
      await this.credentialRepository.markAsUsed(credential._id);

      return {
        data: messages.map((msg) => ({
          id: msg.id,
          threadId: msg.threadId,
          from: msg.from,
          to: msg.to,
          subject: msg.subject,
          body: msg.body.substring(0, 500), // Truncate body for preview
          date: msg.date,
          isUnread: msg.isUnread,
          labels: msg.labels,
          hasAttachments: (msg.attachments?.length || 0) > 0,
        })),
        meta: {
          count: messages.length,
          query: query.trim() || 'all messages',
          credentialName: credential.name,
        },
      };
    } catch (error: any) {
      console.error('Gmail test error:', error);
      throw new AppError(`Failed to fetch Gmail messages: ${error.message}`, 500);
    }
  }

  /**
   * Test Gmail OAuth2 credential
   */
  private async testGmailOAuth2Credential(credentialData: any) {
    const { google } = await import('googleapis');
    const { clientId, clientSecret, refreshToken } = credentialData;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error('Missing required Gmail OAuth2 credentials');
    }

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    try {
      // Refresh the access token
      await oauth2Client.refreshAccessToken();

      // Test Gmail API access
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      // Test basic functionality by listing a few messages
      const messages = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 1,
      });

      return {
        success: true,
        message: 'Gmail connection successful',
        details: {
          emailAddress: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal,
          threadsTotal: profile.data.threadsTotal,
          canReadMessages: messages.data.messages ? messages.data.messages.length >= 0 : false,
        },
      };
    } catch (error: any) {
      console.error('Gmail credential test error:', error);
      return {
        success: false,
        message: `Gmail connection failed: ${error.message}`,
        details: {
          error: error.message,
          code: error.code,
        },
      };
    }
  }

  /**
   * Test OpenAI API credential
   */
  private async testOpenAICredential(credentialData: any) {
    const { apiKey, organizationId } = credentialData;

    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          ...(organizationId && { 'OpenAI-Organization': organizationId }),
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      const modelCount = data.data?.length || 0;

      return {
        success: true,
        message: 'OpenAI API connection successful',
        details: {
          modelCount,
          organizationId: organizationId || 'personal',
          hasGPT4: data.data?.some((model: any) => model.id.includes('gpt-4')) || false,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `OpenAI API connection failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Test Anthropic API credential
   */
  private async testAnthropicCredential(credentialData: any) {
    const { apiKey } = credentialData;

    if (!apiKey) {
      throw new Error('Anthropic API key is required');
    }

    try {
      // Test with a simple message
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test' }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Anthropic API connection successful',
        details: {
          model: data.model || 'claude-3-haiku-20240307',
          usage: data.usage || {},
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Anthropic API connection failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Test Google AI API credential
   */
  private async testGoogleAICredential(credentialData: any) {
    const { apiKey } = credentialData;

    if (!apiKey) {
      throw new Error('Google AI API key is required');
    }

    try {
      // First, list available models to use the correct one
      const modelsResponse = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`,
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      if (!modelsResponse.ok) {
        const errorData = await modelsResponse.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${modelsResponse.status}: ${modelsResponse.statusText}`
        );
      }

      const modelsData = await modelsResponse.json();
      const availableModels = modelsData.models || [];

      // Find a suitable model for generation (prefer gemini-1.5-flash or gemini-1.0-pro)
      const suitableModel = availableModels.find(
        (model: any) =>
          model.name.includes('gemini-1.5-flash') ||
          model.name.includes('gemini-1.0-pro') ||
          model.name.includes('gemini-pro')
      );

      if (!suitableModel) {
        return {
          success: true,
          message: 'Google AI API connection successful (model list accessible)',
          details: {
            availableModels: availableModels.map((m: any) => m.name).slice(0, 5),
            modelCount: availableModels.length,
          },
        };
      }

      // Test with a simple generation request using the found model
      const modelName = suitableModel.name.replace('models/', '');
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: 'Hello' }],
              },
            ],
            generationConfig: {
              maxOutputTokens: 5,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        success: true,
        message: 'Google AI API connection successful',
        details: {
          model: modelName,
          candidateCount: data.candidates?.length || 0,
          availableModels: availableModels.length,
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Google AI API connection failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Test Azure OpenAI API credential
   */
  private async testAzureOpenAICredential(credentialData: any) {
    const { apiKey, endpoint, apiVersion } = credentialData;

    if (!apiKey || !endpoint || !apiVersion) {
      throw new Error('Azure OpenAI API key, endpoint, and API version are required');
    }

    try {
      // Test by listing deployments
      const url = `${endpoint.replace(/\/$/, '')}/openai/deployments?api-version=${apiVersion}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'api-key': apiKey,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      const data = await response.json();
      const deploymentCount = data.data?.length || 0;

      return {
        success: true,
        message: 'Azure OpenAI API connection successful',
        details: {
          endpoint,
          apiVersion,
          deploymentCount,
          deployments: data.data?.map((d: any) => d.id) || [],
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Azure OpenAI API connection failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }

  /**
   * Test AWS Bedrock API credential
   */
  private async testAWSBedrockCredential(credentialData: any) {
    const { accessKeyId, secretAccessKey, region } = credentialData;

    if (!accessKeyId || !secretAccessKey || !region) {
      throw new Error('AWS Access Key ID, Secret Access Key, and Region are required');
    }

    try {
      // For now, we'll just validate the format and structure
      // In a production environment, you'd want to make an actual AWS SDK call
      // to test the credentials with Bedrock service

      if (!accessKeyId.startsWith('AKIA') && !accessKeyId.startsWith('ASIA')) {
        throw new Error('Invalid AWS Access Key ID format');
      }

      if (secretAccessKey.length !== 40) {
        throw new Error('Invalid AWS Secret Access Key format');
      }

      // Mock successful response for now
      // In production, use AWS SDK to test actual connectivity:
      // const { BedrockClient, ListFoundationModelsCommand } = require("@aws-sdk/client-bedrock");

      return {
        success: true,
        message: 'AWS Bedrock credentials format validated',
        details: {
          region,
          accessKeyId: accessKeyId.substring(0, 10) + '...',
          note: 'Credential format validated. Actual API testing requires AWS SDK integration.',
        },
      };
    } catch (error: any) {
      return {
        success: false,
        message: `AWS Bedrock credential validation failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }
}
