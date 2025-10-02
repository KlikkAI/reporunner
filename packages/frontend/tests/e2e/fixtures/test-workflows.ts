/**
 * Test Workflow Fixtures
 * Pre-defined workflow configurations for testing
 */

export const simpleWorkflow = {
  name: 'Test Simple Workflow',
  description: 'A simple workflow for E2E testing',
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 100, y: 100 },
      data: {
        label: 'Manual Trigger',
        type: 'manual-trigger',
      },
    },
    {
      id: 'action-1',
      type: 'action',
      position: { x: 300, y: 100 },
      data: {
        label: 'HTTP Request',
        type: 'http-request',
        config: {
          url: 'https://jsonplaceholder.typicode.com/todos/1',
          method: 'GET',
        },
      },
    },
  ],
  edges: [
    {
      id: 'trigger-1-action-1',
      source: 'trigger-1',
      target: 'action-1',
      type: 'default',
    },
  ],
};

export const conditionalWorkflow = {
  name: 'Test Conditional Workflow',
  description: 'Workflow with conditional branching',
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 100, y: 100 },
      data: {
        label: 'Manual Trigger',
        type: 'manual-trigger',
      },
    },
    {
      id: 'condition-1',
      type: 'condition',
      position: { x: 300, y: 100 },
      data: {
        label: 'Check Value',
        type: 'condition',
        config: {
          condition: '{{ $input.value > 10 }}',
        },
      },
    },
    {
      id: 'action-true',
      type: 'action',
      position: { x: 500, y: 50 },
      data: {
        label: 'Handle True',
        type: 'http-request',
      },
    },
    {
      id: 'action-false',
      type: 'action',
      position: { x: 500, y: 150 },
      data: {
        label: 'Handle False',
        type: 'http-request',
      },
    },
  ],
  edges: [
    {
      id: 'trigger-1-condition-1',
      source: 'trigger-1',
      target: 'condition-1',
      type: 'default',
    },
    {
      id: 'condition-1-action-true',
      source: 'condition-1',
      sourceHandle: 'true',
      target: 'action-true',
      type: 'default',
    },
    {
      id: 'condition-1-action-false',
      source: 'condition-1',
      sourceHandle: 'false',
      target: 'action-false',
      type: 'default',
    },
  ],
};

export const emailWorkflow = {
  name: 'Test Email Workflow',
  description: 'Workflow with email integration',
  nodes: [
    {
      id: 'trigger-1',
      type: 'trigger',
      position: { x: 100, y: 100 },
      data: {
        label: 'Manual Trigger',
        type: 'manual-trigger',
      },
    },
    {
      id: 'email-1',
      type: 'action',
      position: { x: 300, y: 100 },
      data: {
        label: 'Send Email',
        type: 'gmail-send',
        config: {
          to: 'test@example.com',
          subject: 'Test Email',
          body: 'This is a test email from Reporunner',
        },
      },
    },
  ],
  edges: [
    {
      id: 'trigger-1-email-1',
      source: 'trigger-1',
      target: 'email-1',
      type: 'default',
    },
  ],
};

export const testCredentials = {
  gmail: {
    name: 'Test Gmail Credentials',
    type: 'gmail',
    data: {
      clientId: process.env.TEST_GMAIL_CLIENT_ID || 'test-client-id',
      clientSecret: process.env.TEST_GMAIL_CLIENT_SECRET || 'test-client-secret',
      accessToken: process.env.TEST_GMAIL_ACCESS_TOKEN || 'test-access-token',
      refreshToken: process.env.TEST_GMAIL_REFRESH_TOKEN || 'test-refresh-token',
    },
  },
  http: {
    name: 'Test HTTP Auth',
    type: 'http-auth',
    data: {
      authType: 'bearer',
      token: 'test-bearer-token',
    },
  },
};
