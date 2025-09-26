name: 'advanced', displayName;
: 'Advanced Options',
        properties: gmailEnhancedProperties.filter((prop) =>
          ['simplify', 'downloadAttachments', 'maxResults', 'attachments'].includes(prop.name)
        ),
        collapsible: true,
        collapsed: true,
      },
    ],
  },

  // Enterprise execution settings
  continueOnFail: false,
  retryOnFail: true,
  maxTries: 3,
  waitBetweenTries: 1000,

  // UI categorization for node library
  codex:
{
  categories: [UNIFIED_CATEGORIES.COMMUNICATION, 'email'], subcategories;
  :
    [UNIFIED_CATEGORIES.COMMUNICATION]
  : ['email', 'messaging', 'notifications'],
  ,
}
,

  // Custom UI components for enhanced user experience
  // customBodyComponent: "GmailNodeBody", // Using custom UI that matches old frontend style
  // customPropertiesPanel: "GmailPropertiesPanel",

  // Enhanced visual styling for Gmail branding
  styling:
{
  backgroundColor: '#ffffff', borderColor;
  : '#ea4335',
    fontColor: '#1f2937',
}
,
}

/**
 * Registry-based node capability definition
 * Defines what this node can do in different contexts
 */
export const gmailNodeCapabilities = {
  id: 'gmail-enhanced',

  // Supported operational modes
  supportedModes: ['trigger', 'action', 'webhook', 'poll'] as const,

  // Resource types this node can work with
  resources: ['email', 'label', 'draft', 'thread'],

  // Operations supported per resource
  operations: {
    email: {
      trigger: ['messageReceived'],
      action: [
        'send',
        'reply',
        'forward',
        'get',
        'getAll',
        'delete',
        'markAsRead',
        'markAsUnread',
        'addLabels',
        'removeLabels',
      ],
    },
    label: {
      trigger: [],
      action: ['create', 'delete', 'get', 'getAll'],
    },
    draft: {
      trigger: [],
      action: ['create', 'get', 'delete', 'getAll', 'send'],
    },
    thread: {
      trigger: [],
      action: ['get', 'getAll', 'reply', 'delete', 'trash', 'untrash', 'addLabels', 'removeLabels'],
    },
  },

  // Feature flags for progressive rollout
  features: {
    smartModeDetection: true,
    contextAwareProperties: true,
    progressiveDisclosure: true,
    realTimeWebhooks: true,
    batchProcessing: true,
    attachmentHandling: true,
    templateSupport: true,
    analytics: true,
  },

  // Performance and scaling configuration
  scaling: {
    profile: 'enterprise',
    maxConcurrentExecutions: 100,
    rateLimiting: {
      requestsPerMinute: 250, // Gmail API limits
      burstLimit: 100,
