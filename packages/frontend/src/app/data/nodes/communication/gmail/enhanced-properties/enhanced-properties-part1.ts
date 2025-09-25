// Gmail Unified Properties - Complete n8n Feature Parity with Registry Pattern

import type { NodeProperty } from '@/core/types/dynamicProperties';

/**
 * Complete Gmail properties supporting all n8n features:
 * - 67+ properties with dynamic resolution
 * - Context-aware property filtering
 * - Progressive disclosure UI
 * - Resource-based operations (email, label, draft, thread)
 * - Smart mode detection integration
 */

// =============================================================================
// CORE UNIFIED PROPERTIES
// =============================================================================

export const gmailEnhancedCoreProperties: NodeProperty[] = [
  {
    name: 'credential',
    displayName: 'Credential',
    type: 'credentialsSelect',
    description: 'Gmail OAuth2 credentials for accessing the API',
    required: true,
    credentialTypes: ['gmailOAuth2'],
    default: '',
    noDataExpression: true,
  },
  {
    name: 'resource',
    displayName: 'Resource',
    type: 'select',
    description: 'The Gmail resource to work with',
    required: true,
    default: 'email',
    options: [
      {
        name: 'Email',
        value: 'email',
        description: 'Work with email messages',
      },
      { name: 'Label', value: 'label', description: 'Manage Gmail labels' },
      {
        name: 'Draft',
        value: 'draft',
        description: 'Create and manage drafts',
      },
      {
        name: 'Thread',
        value: 'thread',
        description: 'Work with email threads',
      },
    ],
    noDataExpression: true,
  },
];

// =============================================================================
// EMAIL RESOURCE PROPERTIES (TRIGGER + ACTION MODES)
// =============================================================================

export const gmailEmailProperties: NodeProperty[] = [
  // Mode-aware operation selection
  {
    name: 'operation',
    displayName: 'Operation',
    type: 'select',
    description: 'Operation to perform on emails',
    required: true,
    default: 'messageReceived',
    displayOptions: {
      show: {
        resource: ['email'],
      },
    },
    options: [
      // Trigger operations
      {
        name: 'Message Received',
        value: 'messageReceived',
        description: 'Trigger when new emails are received',
        action: 'Trigger on new email',
      },

      // Action operations (n8n feature parity)
      {
        name: 'Send',
        value: 'send',
        description: 'Send a new email',
        action: 'Send an email',
      },
      {
        name: 'Reply',
        value: 'reply',
        description: 'Reply to an email',
        action: 'Reply to email',
      },
      {
        name: 'Forward',
        value: 'forward',
