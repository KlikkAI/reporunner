import { z } from 'zod';
import type {
  CreateCredentialRequest,
  Credential,
  CredentialConfig,
  CredentialFilter,
  CredentialStats,
  CredentialTestResult,
  OAuth2CallbackRequest,
  OAuth2InitRequest,
  OAuth2TokenResponse,
  PaginatedResponse,
  PaginationParams,
  UpdateCredentialRequest,
} from '../schemas';
import {
  ApiResponseSchema,
  CredentialListResponseSchema,
  CredentialResponseSchema,
  CredentialStatsResponseSchema,
  CredentialTestResponseSchema,
  OAuth2InitResponseSchema,
  OAuth2TokenSchema,
} from '../schemas';
import type { CredentialTypeApiResponse } from '../types/credentials';
import { ApiClientError, apiClient } from './ApiClient';

/**
 * Type-safe Credential API Service
 *
 * Handles all credential management operations with full type safety
 * Supports OAuth2 flows, API keys, database connections, and custom credentials
 */
export class CredentialApiService {
  // ==========================================
  // CREDENTIAL CRUD OPERATIONS
  // ==========================================

  /**
   * Get all credentials with optional filtering and pagination
   */
  async getCredentials(
    filter?: CredentialFilter & PaginationParams
  ): Promise<PaginatedResponse<Credential>> {
    try {
      const response = await apiClient.get('/credentials', CredentialListResponseSchema, {
        params: filter,
      });

      // Convert backend response to PaginatedResponse format
      return {
        items: response.credentials,
        total: response.credentials.length,
        limit: filter?.limit || 20,
        offset: filter?.offset || 0,
        hasMore: false, // Simple non-paginated response
      };
    } catch (error) {
      throw new ApiClientError('Failed to fetch credentials', 0, 'CREDENTIALS_FETCH_ERROR', error);
    }
  }

  /**
   * Get a specific credential by ID
   */
  async getCredential(credentialId: string): Promise<Credential> {
    try {
      return await apiClient.get(`/credentials/${credentialId}`, CredentialResponseSchema);
    } catch (error) {
      throw new ApiClientError(
        `Failed to fetch credential ${credentialId}`,
        0,
        'CREDENTIAL_FETCH_ERROR',
        error
      );
    }
  }

  /**
   * Create a new credential
   */
  async createCredential(credential: CreateCredentialRequest): Promise<Credential> {
    try {
      return await apiClient.post('/credentials', credential, CredentialResponseSchema);
    } catch (error) {
      throw new ApiClientError('Failed to create credential', 0, 'CREDENTIAL_CREATE_ERROR', error);
    }
  }

  /**
   * Update an existing credential
   */
  async updateCredential(
    credentialId: string,
    updates: Omit<UpdateCredentialRequest, 'id'>
  ): Promise<Credential> {
    try {
      return await apiClient.put(`/credentials/${credentialId}`, updates, CredentialResponseSchema);
    } catch (error) {
      throw new ApiClientError(
        `Failed to update credential ${credentialId}`,
        0,
        'CREDENTIAL_UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Delete a credential
   */
  async deleteCredential(credentialId: string): Promise<{ message: string }> {
    try {
      return await apiClient.delete(
        `/credentials/${credentialId}`,
        ApiResponseSchema(z.object({ message: z.string() }))
      );
    } catch (error) {
      throw new ApiClientError(
        `Failed to delete credential ${credentialId}`,
        0,
        'CREDENTIAL_DELETE_ERROR',
        error
      );
    }
  }

  // ==========================================
  // CREDENTIAL TESTING & VALIDATION
  // ==========================================

  /**
   * Test a credential connection
   */
  async testCredential(
    credentialId: string,
    testType: 'connection' | 'auth' | 'permissions' = 'connection',
    additionalParams?: Record<string, unknown>
  ): Promise<CredentialTestResult> {
    try {
      return await apiClient.post(
        `/credentials/${credentialId}/test`,
        {
          testType,
          additionalParams: additionalParams || {},
        },
        CredentialTestResponseSchema
      );
    } catch (error) {
      throw new ApiClientError(
        `Failed to test credential ${credentialId}`,
        0,
        'CREDENTIAL_TEST_ERROR',
        error
      );
    }
  }

  /**
   * Test credential configuration before saving (preview)
   */
  async testCredentialConfig(config: CredentialConfig): Promise<CredentialTestResult> {
    try {
      return await apiClient.post('/credentials/test-config', config, CredentialTestResponseSchema);
    } catch (error) {
      throw new ApiClientError(
        'Failed to test credential configuration',
        0,
        'CREDENTIAL_CONFIG_TEST_ERROR',
        error
      );
    }
  }

  /**
   * Refresh OAuth2 credential tokens
   */
  async refreshCredential(credentialId: string): Promise<Credential> {
    try {
      return await apiClient.post(
        `/credentials/${credentialId}/refresh`,
        {},
        CredentialResponseSchema
      );
    } catch (error) {
      throw new ApiClientError(
        `Failed to refresh credential ${credentialId}`,
        0,
        'CREDENTIAL_REFRESH_ERROR',
        error
      );
    }
  }

  // ==========================================
  // OAUTH2 FLOW OPERATIONS
  // ==========================================

  /**
   * Initiate OAuth2 authorization flow
   */
  async initiateOAuth2(request: OAuth2InitRequest): Promise<{
    authorizationUrl: string;
    state: string;
  }> {
    try {
      return await apiClient.post('/credentials/oauth2/init', request, OAuth2InitResponseSchema);
    } catch (error) {
      throw new ApiClientError('Failed to initiate OAuth2 flow', 0, 'OAUTH2_INIT_ERROR', error);
    }
  }

  /**
   * Handle OAuth2 callback and exchange code for tokens
   */
  async handleOAuth2Callback(request: OAuth2CallbackRequest): Promise<OAuth2TokenResponse> {
    try {
      return await apiClient.post('/credentials/oauth2/callback', request, OAuth2TokenSchema);
    } catch (error) {
      throw new ApiClientError(
        'Failed to handle OAuth2 callback',
        0,
        'OAUTH2_CALLBACK_ERROR',
        error
      );
    }
  }

  /**
   * Revoke OAuth2 tokens (disconnect)
   */
  async revokeOAuth2(credentialId: string): Promise<{ message: string }> {
    try {
      return await apiClient.post(
        `/credentials/${credentialId}/revoke`,
        {},
        ApiResponseSchema(z.object({ message: z.string() }))
      );
    } catch (error) {
      throw new ApiClientError(
        `Failed to revoke OAuth2 tokens for credential ${credentialId}`,
        0,
        'OAUTH2_REVOKE_ERROR',
        error
      );
    }
  }

  /**
   * Initiate Gmail OAuth flow - returns auth URL to redirect user to
   * Uses app's shared OAuth credentials - no user setup required
   */
  async initiateGmailOAuth(
    credentialName: string,
    returnUrl?: string
  ): Promise<{
    authUrl: string;
    state: string;
  }> {
    try {
      const response = await apiClient.post(
        '/oauth/gmail/initiate',
        {
          credentialName,
          returnUrl: returnUrl || window.location.href,
        },
        ApiResponseSchema(
          z.object({
            authUrl: z.string(),
            state: z.string(),
          })
        )
      );
      return response;
    } catch (error) {
      throw new ApiClientError(
        'Failed to initiate Gmail OAuth:',
        0,
        'GMAIL_OAUTH_INIT_ERROR',
        error
      );
    }
  }

  /**
   * Start OAuth flow by redirecting to auth URL
   * This method initiates the OAuth flow and redirects the user's browser
   * No technical setup required - just provide a name for the credential
   */
  async startGmailOAuthFlow(credentialName: string, returnUrl?: string): Promise<void> {
    const { authUrl } = await this.initiateGmailOAuth(credentialName, returnUrl);

    // Redirect user to Google OAuth consent page
    window.location.href = authUrl;
  }

  /**
   * Test Gmail node by fetching sample data
   */
  async testGmailNode(
    credentialId: string,
    filters: any = {}
  ): Promise<{
    success: boolean;
    data?: any[];
    message: string;
  }> {
    try {
      return await apiClient.post(
        `/credentials/${credentialId}/test-gmail`,
        {
          action: 'fetchEmails',
          filters,
        },
        ApiResponseSchema(
          z.object({
            success: z.boolean(),
            data: z.array(z.any()).optional(),
            message: z.string(),
          })
        )
      );
    } catch (error) {
      throw new ApiClientError('Failed to test Gmail node:', 0, 'GMAIL_NODE_TEST_ERROR', error);
    }
  }

  /**
   * Revoke Gmail access and delete credential
   */
  async revokeGmailAccess(credentialId: string): Promise<{ success: boolean; message: string }> {
    try {
      return await apiClient.post(
        `/credentials/${credentialId}/revoke`,
        {},
        ApiResponseSchema(
          z.object({
            success: z.boolean(),
            message: z.string(),
          })
        )
      );
    } catch (error) {
      throw new ApiClientError(
        'Failed to revoke Gmail access:',
        0,
        'GMAIL_REVOKE_ACCESS_ERROR',
        error
      );
    }
  }

  // ==========================================
  // CREDENTIAL TYPES & METADATA
  // ==========================================

  /**
   * Get available credential types with their configurations
   */
  async getCredentialTypes(): Promise<CredentialTypeApiResponse[]> {
    try {
      return await apiClient.get(
        '/credentials/types',
        ApiResponseSchema(
          z.array(
            z.object({
              type: z.string(),
              name: z.string(),
              description: z.string(),
              category: z.string(),
              fields: z.array(
                z.object({
                  name: z.string(),
                  type: z.string(),
                  required: z.boolean(),
                  description: z.string(),
                  placeholder: z.string().optional(),
                  validation: z.record(z.string(), z.unknown()).optional(),
                })
              ),
              supportsOAuth2: z.boolean(),
              supportsTest: z.boolean(),
              integrations: z.array(z.string()),
            })
          )
        )
      );
    } catch (error) {
      throw new ApiClientError(
        'Failed to fetch credential types',
        0,
        'CREDENTIAL_TYPES_ERROR',
        error
      );
    }
  }

  /**
   * Validate credential configuration
   */
  validateCredentialConfig(
    type: string,
    config: Record<string, any>
  ): {
    isValid: boolean;
    errors: { field: string; message: string }[];
  } {
    const errors: { field: string; message: string }[] = [];

    switch (type) {
      case 'gmailOAuth2':
        if (!config.clientId) {
          errors.push({ field: 'clientId', message: 'Client ID is required' });
        }
        if (!config.clientSecret) {
          errors.push({
            field: 'clientSecret',
            message: 'Client Secret is required',
          });
        }
        break;

      case 'ollamaApi':
        if (!config.endpoint) {
          errors.push({
            field: 'endpoint',
            message: 'Endpoint URL is required',
          });
        }
        if (config.endpoint && !this.isValidUrl(config.endpoint)) {
          errors.push({ field: 'endpoint', message: 'Invalid endpoint URL' });
        }
        break;

      case 'postgres':
        if (!config.host) {
          errors.push({ field: 'host', message: 'Host is required' });
        }
        if (!config.port) {
          errors.push({ field: 'port', message: 'Port is required' });
        }
        if (!config.database) {
          errors.push({
            field: 'database',
            message: 'Database name is required',
          });
        }
        if (!config.username) {
          errors.push({ field: 'username', message: 'Username is required' });
        }
        if (!config.password) {
          errors.push({ field: 'password', message: 'Password is required' });
        }
        break;

      case 'openai':
      case 'anthropic':
        if (!config.apiKey) {
          errors.push({ field: 'apiKey', message: 'API Key is required' });
        }
        break;
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Helper to validate URLs
   */
  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get credential statistics
   */
  async getCredentialStats(): Promise<CredentialStats> {
    try {
      return await apiClient.get('/credentials/stats', CredentialStatsResponseSchema);
    } catch (error) {
      throw new ApiClientError(
        'Failed to fetch credential statistics',
        0,
        'CREDENTIAL_STATS_ERROR',
        error
      );
    }
  }

  // ==========================================
  // CREDENTIAL USAGE & MONITORING
  // ==========================================

  /**
   * Get credential usage logs
   */
  async getCredentialUsage(
    credentialId: string,
    params?: { startDate?: string; endDate?: string; limit?: number }
  ): Promise<
    Array<{
      id: string;
      usedAt: string;
      workflowId?: string | undefined;
      nodeId?: string | undefined;
      action: string;
      success: boolean;
      details?: unknown;
    }>
  > {
    try {
      return await apiClient.get(
        `/credentials/${credentialId}/usage`,
        ApiResponseSchema(
          z.array(
            z.object({
              id: z.string(),
              usedAt: z.string(),
              workflowId: z.string().optional(),
              nodeId: z.string().optional(),
              action: z.string(),
              success: z.boolean(),
              details: z.unknown().optional(),
            })
          )
        ),
        { params }
      );
    } catch (error) {
      throw new ApiClientError(
        `Failed to fetch usage logs for credential ${credentialId}`,
        0,
        'CREDENTIAL_USAGE_ERROR',
        error
      );
    }
  }

  /**
   * Check credential health (batch test multiple credentials)
   */
  async checkCredentialHealth(credentialIds?: string[]): Promise<
    Array<{
      credentialId: string;
      name: string;
      type: string;
      isHealthy: boolean;
      lastChecked: string;
      issues?: string[] | undefined;
    }>
  > {
    try {
      return await apiClient.post(
        '/credentials/health-check',
        { credentialIds },
        ApiResponseSchema(
          z.array(
            z.object({
              credentialId: z.string(),
              name: z.string(),
              type: z.string(),
              isHealthy: z.boolean(),
              lastChecked: z.string(),
              issues: z.array(z.string()).optional(),
            })
          )
        )
      );
    } catch (error) {
      throw new ApiClientError(
        'Failed to check credential health',
        0,
        'CREDENTIAL_HEALTH_ERROR',
        error
      );
    }
  }

  // ==========================================
  // BULK OPERATIONS
  // ==========================================

  /**
   * Bulk update credentials
   */
  async bulkUpdateCredentials(
    updates: Array<{
      id: string;
      updates: Partial<Credential>;
    }>
  ): Promise<Array<Credential>> {
    try {
      return await apiClient.post(
        '/credentials/bulk-update',
        { updates },
        ApiResponseSchema(z.array(z.any())) // Use any for now to avoid circular refs
      );
    } catch (error) {
      throw new ApiClientError(
        'Failed to bulk update credentials',
        0,
        'CREDENTIAL_BULK_UPDATE_ERROR',
        error
      );
    }
  }

  /**
   * Bulk delete credentials
   */
  async bulkDeleteCredentials(credentialIds: string[]): Promise<{
    deleted: number;
    failed: Array<{ id: string; error: string }>;
  }> {
    try {
      return await apiClient.post(
        '/credentials/bulk-delete',
        { credentialIds },
        ApiResponseSchema(
          z.object({
            deleted: z.number(),
            failed: z.array(
              z.object({
                id: z.string(),
                error: z.string(),
              })
            ),
          })
        )
      );
    } catch (error) {
      throw new ApiClientError(
        'Failed to bulk delete credentials',
        0,
        'CREDENTIAL_BULK_DELETE_ERROR',
        error
      );
    }
  }
}

// Export singleton instance
export const credentialApiService = new CredentialApiService();
