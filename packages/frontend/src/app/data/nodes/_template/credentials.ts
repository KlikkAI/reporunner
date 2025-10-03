/**
 * {INTEGRATION_NAME} Credentials Definition
 */

import type { CredentialDefinition } from '@/core/types';
import { z } from 'zod';

export const {INTEGRATION_NAME}Credentials: CredentialDefinition = {
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
  test: async (credentials) => {
    try {
      // Implement connection test
      // const response = await fetch('{API_ENDPOINT}/test', {
      //   headers: { 'Authorization': `Bearer ${credentials.apiKey}` }
      // });
      // return response.ok;
      return true;
    } catch (error) {
      return false;
    }
  },
};
