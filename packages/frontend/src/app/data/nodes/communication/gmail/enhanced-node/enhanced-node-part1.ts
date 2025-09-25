/* eslint-disable @typescript-eslint/no-explicit-any */
// Gmail Unified Node - Registry Pattern Implementation
// Complete n8n feature parity with enterprise-grade registry architecture

import { UNIFIED_CATEGORIES } from '@/core/constants/categories';
import type { EnhancedIntegrationNodeType } from '@/core/types/dynamicProperties';
import {
  executeGmailCreateDraft,
  executeGmailSend,
  executeGmailTrigger,
  testGmailConnection,
} from './actions';
import { gmailCredentials } from './credentials';
import { gmailEnhancedProperties } from './enhanced-properties';

/**
 * Unified Gmail Node - Enterprise Registry Pattern
 *
 * Features:
 * - Smart mode detection (trigger vs action)
 * - Complete n8n feature parity (67+ properties)
 * - Context-aware property resolution
 * - Resource-based operations (email, label, draft, thread)
 * - Enterprise scalability and performance
 * - Progressive disclosure UI
 */
export const gmailEnhancedNode: EnhancedIntegrationNodeType = {
  id: 'gmail-enhanced',
  name: 'gmail-enhanced',
  displayName: 'Gmail',

  // Hybrid node type - can be trigger OR action based on context
  type: 'hybrid' as any, // Extended type for unified nodes

  description:
    'Unified Gmail integration with smart mode detection - automatically adapts for trigger or action use based on workflow context',
  version: [1, 2], // Support multiple versions for compatibility

  icon: 'https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg',

  // Dynamic input/output configuration based on detected mode
  inputs: [], // Will be dynamically resolved by registry
  outputs: [], // Will be dynamically resolved by registry

  // Enhanced configuration with complete n8n parity
  configuration: {
    // Complete property set with all n8n features
    properties: gmailEnhancedProperties,

    // Credential requirements
    credentials: gmailCredentials,

    // Polling configuration for trigger mode
    polling: {
      enabled: true,
      defaultInterval: 60000, // 1 minute
      minInterval: 30000, // 30 seconds
      maxInterval: 3600000, // 1 hour
    },

    // Webhook support for real-time triggers
    webhooks: [
      {
        name: 'gmail-webhook',
        httpMethod: 'POST',
        responseMode: 'onReceived',
        path: '/webhook/gmail/{{nodeId}}',
      },
    ],

    // Property groups for progressive disclosure
    groups: [
      {
        name: 'basic',
        displayName: 'Basic Configuration',
        properties: gmailEnhancedProperties.filter((prop) =>
          ['credential', 'resource', 'operation'].includes(prop.name)
        ),
        collapsible: false,
        collapsed: false,
      },
      {
        name: 'filters',
        displayName: 'Filters & Conditions',
        properties: gmailEnhancedProperties.filter((prop) =>
          ['event', 'pollTimes', 'filters'].includes(prop.name)
        ),
        collapsible: true,
        collapsed: false,
      },
      {
        name: 'content',
        displayName: 'Message Content',
        properties: gmailEnhancedProperties.filter((prop) =>
          ['sendTo', 'sendCc', 'sendBcc', 'subject', 'message', 'emailType'].includes(prop.name)
        ),
        collapsible: true,
        collapsed: false,
      },
      {
