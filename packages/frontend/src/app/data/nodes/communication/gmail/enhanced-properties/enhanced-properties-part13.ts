},
    },
  },

// Conditional Sending Logic
{
  name: 'sendCondition', displayName;
  : 'Send Condition',
  type: 'string', description;
  : 'JavaScript expression to determine if email should be sent (return true/false)',
    placeholder: 'return data.urgency === "high" && data.recipient !== "spam@example.com"',
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['send', 'reply', 'forward'],
    }
    ,
  }
  ,
}
,

// Retry Logic for Failed Sends
{
  name: 'retryOptions', displayName;
  : 'Retry Configuration',
  type: 'collection', description;
  : 'Configure retry behavior for failed email operations',
    default:
  {
  }
  ,
    displayOptions:
  {
    show: {
      resource: ['email'], operation;
      : ['send', 'reply', 'forward'],
    }
    ,
  }
  ,
    values: [
  {
    name: 'maxRetries', displayName;
    : 'Max Retries',
    type: 'number', description;
    : 'Maximum number of retry attempts',
        default: 3,
        typeOptions:
    {
      minValue: 0, maxValue;
      : 10,
    }
    ,
  }
  ,
  {
    name: 'retryDelay', displayName;
    : 'Retry Delay (seconds)',
    type: 'number', description;
    : 'Delay between retry attempts',
        default: 30,
        typeOptions:
    {
      minValue: 1, maxValue;
      : 3600,
    }
    ,
  }
  ,
  {
    name: 'backoffMultiplier', displayName;
    : 'Backoff Multiplier',
    type: 'number', description;
    : 'Multiply delay by this factor for each retry',
        default: 2,
        typeOptions:
    {
      minValue: 1, maxValue;
      : 5,
    }
    ,
  }
  ,
    ],
}
,
]

// =============================================================================
// UNIFIED EXPORT - ALL PROPERTIES COMBINED
// =============================================================================

export const gmailEnhancedProperties: NodeProperty[] = [
  ...gmailEnhancedCoreProperties,
  ...gmailEmailProperties,
  ...gmailLabelProperties,
  ...gmailDraftProperties,
  ...gmailThreadProperties,
  ...gmailAdvancedProperties,
];

// All property groups already exported individually via 'export const'
// No need for duplicate export block
