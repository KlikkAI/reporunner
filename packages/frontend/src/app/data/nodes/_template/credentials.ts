/**
 * Template Integration Credentials Definition
 * Template: Replace TemplateIntegration with your integration name
 */

import { z } from 'zod';

type CredentialDefinition = {
  name: string;
  displayName: string;
  documentationUrl?: string;
  properties: any[];
  schema: z.ZodObject<any>;
  test: (credentials: any) => Promise<boolean>;
};

// Template: Replace TemplateIntegration with your integration name
export const TemplateIntegrationCredentials: CredentialDefinition = {
  name: '{integration-id}',
  displayName: '{INTEGRATION_NAME}',
  documentationUrl: 'https://docs.{integration-id}.com/api',

  properties: [
    {
      displayName: 'API Key',
      name: 'apiKey',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: true,
      description: 'Your {INTEGRATION_NAME} API key',
    },
    {
      displayName: 'API Secret',
      name: 'apiSecret',
      type: 'string',
      typeOptions: {
        password: true,
      },
      default: '',
      required: false,
      description: 'Your {INTEGRATION_NAME} API secret (if applicable)',
    },
  ],

  // Validation schema
  schema: z.object({
    apiKey: z.string().min(1, 'API Key is required'),
    apiSecret: z.string().optional(),
  }),

  // Test connection
  test: async (_credentials) => {
    try {
      // Implement connection test
      // const response = await fetch('{API_ENDPOINT}/test', {
      //   headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      // });
      // return response.ok;
      return true;
    } catch (_error) {
      return false;
    }
  },
};
