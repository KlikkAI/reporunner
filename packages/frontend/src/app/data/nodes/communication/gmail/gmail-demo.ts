// Gmail Enterprise Node Demo - Registry Pattern Showcase

import { nodeRegistry } from '@/core';
import { gmailEnhanced } from './index';

/**
 * Demonstration of the Enterprise Gmail Node with Registry Pattern
 *
 * This file showcases the advanced capabilities:
 * - Smart mode detection
 * - Context-aware property resolution
 * - Enterprise-grade features
 * - Performance monitoring
 */

export async function demoGmailEnterpriseNode() {
  // Trigger context (workflow start, no inputs)
  const triggerContext = {
    nodeId: 'gmail-unified-1',
    workflowId: 'workflow-123',
    isWorkflowStart: true,
    hasInputConnections: false,
    position: { x: 100, y: 100 },
    formState: { resource: 'email' },
  };

  const _triggerMode = nodeRegistry.detectNodeMode('gmail-enhanced', triggerContext);

  // Action context (has input connections)
  const actionContext = {
    nodeId: 'gmail-enhanced-2',
    workflowId: 'workflow-123',
    isWorkflowStart: false,
    hasInputConnections: true,
    position: { x: 300, y: 100 },
    formState: { resource: 'email', operation: 'send' },
  };

  const _actionMode = nodeRegistry.detectNodeMode('gmail-enhanced', actionContext);
  try {
    const _triggerProperties = await nodeRegistry.resolveNodeProperties(
      'gmail-enhanced',
      triggerContext
    );

    const _actionProperties = await nodeRegistry.resolveNodeProperties(
      'gmail-enhanced',
      actionContext
    );
  } catch (_error) {}

  // Simulate node execution
  const startTime = Date.now();
  await new Promise((resolve) => setTimeout(resolve, 10)); // Simulate execution
  const executionTime = Date.now() - startTime;

  nodeRegistry.recordNodeExecution('gmail-enhanced', executionTime, true);

  const metrics = nodeRegistry.getNodeMetrics('gmail-enhanced');
  if (metrics) {
  }
  try {
    const enhancedNode = await nodeRegistry.getEnhancedNodeType('gmail-enhanced', triggerContext);
    if (enhancedNode) {
    }
  } catch (_error) {}
  const mockCredentials = {
    gmailOAuth2: {
      id: 'mock-gmail-cred',
      name: 'Mock Gmail Account',
    },
  };

  try {
    const _connectionTest = await gmailEnhanced.test(mockCredentials);
  } catch (_error) {}
}

/**
 * Workflow Context Examples for Testing
 */
export const contextExamples = {
  // Email trigger at workflow start
  emailTrigger: {
    nodeId: 'gmail-enhanced-trigger',
    workflowId: 'email-automation',
    isWorkflowStart: true,
    hasInputConnections: false,
    position: { x: 50, y: 100 },
    formState: {
      resource: 'email',
      operation: 'messageReceived',
      event: 'messageReceived',
    },
  },

  // Email send action
  emailSend: {
    nodeId: 'gmail-enhanced-send',
    workflowId: 'email-automation',
    isWorkflowStart: false,
    hasInputConnections: true,
    position: { x: 400, y: 100 },
    formState: {
      resource: 'email',
      operation: 'send',
      sendTo: 'user@example.com',
      subject: 'Test Email',
    },
  },

  // Label management action
  labelAction: {
    nodeId: 'gmail-enhanced-label',
    workflowId: 'label-management',
    isWorkflowStart: false,
    hasInputConnections: true,
    position: { x: 200, y: 150 },
    formState: {
      resource: 'label',
      operation: 'create',
      name: 'Important',
    },
  },

  // Draft creation action
  draftAction: {
    nodeId: 'gmail-enhanced-draft',
    workflowId: 'draft-workflow',
    isWorkflowStart: false,
    hasInputConnections: true,
    position: { x: 300, y: 200 },
    formState: {
      resource: 'draft',
      operation: 'create',
      draftTo: 'recipient@example.com',
      draftSubject: 'Draft Email',
    },
  },
};

// Auto-run demo when imported in development
if (process.env.NODE_ENV === 'development') {
  // Run demo after a short delay to ensure initialization is complete
  setTimeout(() => {
    demoGmailEnterpriseNode().catch(console.error);
  }, 1000);
}
