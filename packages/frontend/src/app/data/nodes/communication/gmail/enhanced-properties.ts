// Gmail Unified Properties - Complete n8n Feature Parity with Registry Pattern

import { NodeProperty } from "@/core/types/dynamicProperties";

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
    name: "credential",
    displayName: "Credential",
    type: "credentialsSelect",
    description: "Gmail OAuth2 credentials for accessing the API",
    required: true,
    credentialTypes: ["gmailOAuth2"],
    default: "",
    noDataExpression: true,
  },
  {
    name: "resource",
    displayName: "Resource",
    type: "select",
    description: "The Gmail resource to work with",
    required: true,
    default: "email",
    options: [
      {
        name: "Email",
        value: "email",
        description: "Work with email messages",
      },
      { name: "Label", value: "label", description: "Manage Gmail labels" },
      {
        name: "Draft",
        value: "draft",
        description: "Create and manage drafts",
      },
      {
        name: "Thread",
        value: "thread",
        description: "Work with email threads",
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
    name: "operation",
    displayName: "Operation",
    type: "select",
    description: "Operation to perform on emails",
    required: true,
    default: "messageReceived",
    displayOptions: {
      show: {
        resource: ["email"],
      },
    },
    options: [
      // Trigger operations
      {
        name: "Message Received",
        value: "messageReceived",
        description: "Trigger when new emails are received",
        action: "Trigger on new email",
      },

      // Action operations (n8n feature parity)
      {
        name: "Send",
        value: "send",
        description: "Send a new email",
        action: "Send an email",
      },
      {
        name: "Reply",
        value: "reply",
        description: "Reply to an email",
        action: "Reply to email",
      },
      {
        name: "Forward",
        value: "forward",
        description: "Forward an email",
        action: "Forward email",
      },
      {
        name: "Get",
        value: "get",
        description: "Get a specific email by ID",
        action: "Get an email",
      },
      {
        name: "Get All",
        value: "getAll",
        description: "Get multiple emails with filtering",
        action: "Get multiple emails",
      },
      {
        name: "Delete",
        value: "delete",
        description: "Delete an email permanently",
        action: "Delete an email",
      },
      {
        name: "Mark as Read",
        value: "markAsRead",
        description: "Mark emails as read",
        action: "Mark as read",
      },
      {
        name: "Mark as Unread",
        value: "markAsUnread",
        description: "Mark emails as unread",
        action: "Mark as unread",
      },
      {
        name: "Add Labels",
        value: "addLabels",
        description: "Add labels to emails",
        action: "Add labels",
      },
      {
        name: "Remove Labels",
        value: "removeLabels",
        description: "Remove labels from emails",
        action: "Remove labels",
      },

      // NEW: Thread operations from n8n analysis
      {
        name: "Archive",
        value: "archive",
        description: "Archive emails",
        action: "Archive emails",
      },
      {
        name: "Unarchive",
        value: "unarchive",
        description: "Unarchive emails",
        action: "Unarchive emails",
      },
      {
        name: "Star",
        value: "star",
        description: "Star emails",
        action: "Star emails",
      },
      {
        name: "Unstar",
        value: "unstar",
        description: "Unstar emails",
        action: "Unstar emails",
      },
    ],
    noDataExpression: true,
  },

  // Trigger-specific properties
  {
    name: "event",
    displayName: "Trigger Event",
    type: "select",
    description: "The specific event that triggers the workflow",
    default: "messageReceived",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived"],
      },
    },
    options: [
      { name: "Message Received", value: "messageReceived" },
      { name: "Message Sent", value: "messageSent" },
      { name: "Message Read", value: "messageRead" },
      { name: "Message Starred", value: "messageStarred" },
      { name: "Message Deleted", value: "messageDeleted" },
      { name: "New Thread", value: "newThread" },
      { name: "Label Added", value: "labelAdded" },
      { name: "Label Removed", value: "labelRemoved" },
    ],
  },

  // Polling configuration (enhanced from current implementation)
  {
    name: "pollTimes",
    displayName: "Polling Configuration",
    type: "collection",
    description: "Configure when and how often to check for emails",
    default: { mode: "everyMinute" },
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived"],
      },
    },
    values: [
      {
        name: "mode",
        displayName: "Polling Frequency",
        type: "select",
        description: "How often to check for new emails",
        required: true,
        default: "everyMinute",
        options: [
          { name: "Every Minute", value: "everyMinute" },
          { name: "Every 5 Minutes", value: "every5Minutes" },
          { name: "Every 15 Minutes", value: "every15Minutes" },
          { name: "Every Hour", value: "everyHour" },
          { name: "Every Day", value: "everyDay" },
          { name: "Every Week", value: "everyWeek" },
          { name: "Every Month", value: "everyMonth" },
          { name: "Custom Interval", value: "customInterval" },
          { name: "Custom Cron", value: "customCron" },
        ],
      },
      {
        name: "intervalMinutes",
        displayName: "Interval (Minutes)",
        type: "number",
        description: "Check every X minutes",
        min: 1,
        max: 1440,
        default: 5,
        displayOptions: {
          show: {
            mode: ["customInterval"],
          },
        },
      },
      {
        name: "cronExpression",
        displayName: "Cron Expression",
        type: "string",
        description: "Custom cron expression for advanced scheduling",
        placeholder: "0 9 * * MON",
        displayOptions: {
          show: {
            mode: ["customCron"],
          },
        },
      },
    ],
  },

  // Advanced filtering (enhanced from current)
  {
    name: "filters",
    displayName: "Email Filters",
    type: "collection",
    description:
      "Filter emails to process only those matching specific criteria",
    default: {},
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived", "getAll"],
      },
    },
    values: [
      {
        name: "includeSpamTrash",
        displayName: "Include Spam and Trash",
        type: "boolean",
        description: "Include emails from spam and trash folders",
        default: false,
      },
      {
        name: "labelNamesOrIds",
        displayName: "Labels",
        type: "multiOptions",
        description: "Filter by Gmail labels",
        typeOptions: {
          loadOptionsMethod: "getLabels",
        },
        default: ["INBOX"],
      },
      {
        name: "search",
        displayName: "Search Query",
        type: "string",
        description: "Gmail search query syntax",
        placeholder: 'has:attachment from:user@example.com subject:"urgent"',
      },
      {
        name: "readStatus",
        displayName: "Read Status",
        type: "select",
        default: "all",
        options: [
          { name: "All", value: "all" },
          { name: "Unread Only", value: "unread" },
          { name: "Read Only", value: "read" },
        ],
      },
      {
        name: "hasAttachment",
        displayName: "Has Attachment",
        type: "select",
        default: "any",
        options: [
          { name: "Any", value: "any" },
          { name: "With Attachments", value: "true" },
          { name: "Without Attachments", value: "false" },
        ],
      },
    ],
  },

  // Send email properties (enhanced)
  {
    name: "sendTo",
    displayName: "To",
    type: "string",
    description: "Recipient email addresses (comma-separated)",
    required: true,
    placeholder: "recipient@example.com, another@example.com",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send"],
      },
    },
  },
  {
    name: "sendCc",
    displayName: "CC",
    type: "string",
    description: "CC recipients",
    placeholder: "cc@example.com",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send"],
      },
    },
  },
  {
    name: "sendBcc",
    displayName: "BCC",
    type: "string",
    description: "BCC recipients",
    placeholder: "bcc@example.com",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send"],
      },
    },
  },
  {
    name: "subject",
    displayName: "Subject",
    type: "string",
    description: "Email subject line",
    required: true,
    placeholder: "Email Subject",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },
  {
    name: "message",
    displayName: "Message",
    type: "text",
    description: "Email message content",
    required: true,
    rows: 6,
    placeholder: "Email message content...",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },

  // =============================================================================
  // NEW: HIGH-PRIORITY FEATURES FROM N8N ANALYSIS
  // =============================================================================

  // Email Priority (High Priority - Basic user need)
  {
    name: "priority",
    displayName: "Priority",
    type: "select",
    description: "Email priority level",
    default: "normal",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
    options: [
      { name: "High", value: "high" },
      { name: "Normal", value: "normal" },
      { name: "Low", value: "low" },
    ],
  },

  // Scheduled Send Time (High Priority - Very requested feature)
  {
    name: "scheduledSendTime",
    displayName: "Send At",
    type: "dateTime",
    description:
      "Schedule email to be sent at specific time (leave empty to send immediately)",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },

  // Email Templates (High Priority - Major workflow improvement)
  {
    name: "emailTemplate",
    displayName: "Email Template",
    type: "select",
    description: "Select a predefined email template",
    default: "",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
    typeOptions: {
      loadOptionsMethod: "getEmailTemplates",
    },
  },

  // Read Receipt (Business communication need)
  {
    name: "requestReadReceipt",
    displayName: "Request Read Receipt",
    type: "boolean",
    description: "Request read receipt from recipients",
    default: false,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },

  // Include Signature
  {
    name: "includeSignature",
    displayName: "Include Signature",
    type: "boolean",
    description: "Include Gmail signature in sent emails",
    default: true,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },

  // Enhanced Attachment Options
  {
    name: "attachments",
    displayName: "Attachments",
    type: "collection",
    description: "Email attachments configuration",
    default: {},
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
    values: [
      {
        name: "attachmentsBinary",
        displayName: "Attachment Binary Properties",
        type: "string",
        description: "Comma-separated list of input binary property names",
        placeholder: "attachment_1,attachment_2",
      },
      {
        name: "dataPropertyAttachmentsPrefixName",
        displayName: "Attachment Prefix",
        type: "string",
        description: "Prefix for attachment binary properties",
        default: "attachment_",
      },
    ],
  },

  // Reply-to Address
  {
    name: "replyTo",
    displayName: "Reply To",
    type: "string",
    description: "Reply-to email address (if different from sender)",
    placeholder: "replyto@example.com",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },

  // Enhanced Date Filtering (High Priority - Improves usability significantly)
  {
    name: "dateRange",
    displayName: "Date Range",
    type: "select",
    description: "Quick date range presets for filtering",
    default: "",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived", "getAll"],
      },
    },
    options: [
      { name: "All Time", value: "" },
      { name: "Last 24 hours", value: "1d" },
      { name: "Last 7 days", value: "7d" },
      { name: "Last 30 days", value: "30d" },
      { name: "Last 90 days", value: "90d" },
      { name: "Custom Range", value: "custom" },
    ],
  },

  // Custom Date Range (when dateRange = 'custom')
  {
    name: "receivedAfter",
    displayName: "Received After",
    type: "dateTime",
    description: "Only include emails received after this date",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived", "getAll"],
        dateRange: ["custom"],
      },
    },
  },

  {
    name: "receivedBefore",
    displayName: "Received Before",
    type: "dateTime",
    description: "Only include emails received before this date",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived", "getAll"],
        dateRange: ["custom"],
      },
    },
  },

  // Message Size Filtering (High Priority - Common use case)
  {
    name: "sizeFilter",
    displayName: "Message Size",
    type: "select",
    description: "Filter by email size",
    default: "",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived", "getAll"],
      },
    },
    options: [
      { name: "Any Size", value: "" },
      { name: "Small (< 1MB)", value: "smaller:1M" },
      { name: "Medium (1-5MB)", value: "larger:1M smaller:5M" },
      { name: "Large (> 5MB)", value: "larger:5M" },
      { name: "Very Large (> 25MB)", value: "larger:25M" },
    ],
  },

  // Attachment Type Filtering (Medium Priority - Useful for specific workflows)
  {
    name: "attachmentType",
    displayName: "Attachment Type",
    type: "multiOptions",
    description: "Filter by attachment file types",
    default: [],
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived", "getAll"],
      },
    },
    options: [
      {
        name: "Images (jpg, png, gif)",
        value: "filename:(jpg OR png OR gif OR jpeg)",
      },
      {
        name: "Documents (pdf, doc, docx)",
        value: "filename:(pdf OR doc OR docx)",
      },
      {
        name: "Spreadsheets (xls, xlsx, csv)",
        value: "filename:(xls OR xlsx OR csv)",
      },
      { name: "Presentations (ppt, pptx)", value: "filename:(ppt OR pptx)" },
      { name: "Archives (zip, rar, 7z)", value: "filename:(zip OR rar OR 7z)" },
      { name: "Videos (mp4, avi, mov)", value: "filename:(mp4 OR avi OR mov)" },
      { name: "Audio (mp3, wav, m4a)", value: "filename:(mp3 OR wav OR m4a)" },
    ],
  },

  // =============================================================================
  // END OF HIGH-PRIORITY FEATURES
  // =============================================================================

  // Reply/Forward specific properties
  {
    name: "messageId",
    displayName: "Message ID",
    type: "string",
    description: "ID of the message to reply to or forward",
    required: true,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: [
          "reply",
          "forward",
          "get",
          "delete",
          "markAsRead",
          "markAsUnread",
        ],
      },
    },
  },

  // Label management properties
  {
    name: "labelsToAdd",
    displayName: "Labels to Add",
    type: "multiOptions",
    description: "Labels to add to the email",
    typeOptions: {
      loadOptionsMethod: "getLabels",
    },
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["addLabels"],
      },
    },
  },
  {
    name: "labelsToRemove",
    displayName: "Labels to Remove",
    type: "multiOptions",
    description: "Labels to remove from the email",
    typeOptions: {
      loadOptionsMethod: "getLabels",
    },
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["removeLabels"],
      },
    },
  },
];

// =============================================================================
// LABEL RESOURCE PROPERTIES
// =============================================================================

export const gmailLabelProperties: NodeProperty[] = [
  {
    name: "operation",
    displayName: "Operation",
    type: "select",
    description: "Operation to perform on labels",
    required: true,
    default: "getAll",
    displayOptions: {
      show: {
        resource: ["label"],
      },
    },
    options: [
      { name: "Create", value: "create", action: "Create a label" },
      { name: "Delete", value: "delete", action: "Delete a label" },
      { name: "Get", value: "get", action: "Get a label" },
      { name: "Get All", value: "getAll", action: "Get all labels" },
    ],
  },
  {
    name: "labelId",
    displayName: "Label ID",
    type: "string",
    description: "The ID of the label",
    required: true,
    displayOptions: {
      show: {
        resource: ["label"],
        operation: ["delete", "get"],
      },
    },
  },
  {
    name: "name",
    displayName: "Label Name",
    type: "string",
    description: "Name for the new label",
    required: true,
    displayOptions: {
      show: {
        resource: ["label"],
        operation: ["create"],
      },
    },
  },
];

// =============================================================================
// DRAFT RESOURCE PROPERTIES
// =============================================================================

export const gmailDraftProperties: NodeProperty[] = [
  {
    name: "operation",
    displayName: "Operation",
    type: "select",
    description: "Operation to perform on drafts",
    required: true,
    default: "create",
    displayOptions: {
      show: {
        resource: ["draft"],
      },
    },
    options: [
      { name: "Create", value: "create", action: "Create a draft" },
      { name: "Get", value: "get", action: "Get a draft" },
      { name: "Delete", value: "delete", action: "Delete a draft" },
      { name: "Get All", value: "getAll", action: "Get all drafts" },
      { name: "Send", value: "send", action: "Send a draft" },
    ],
  },
  {
    name: "draftId",
    displayName: "Draft ID",
    type: "string",
    description: "The ID of the draft",
    required: true,
    displayOptions: {
      show: {
        resource: ["draft"],
        operation: ["get", "delete", "send"],
      },
    },
  },
  // Draft composition properties (reuse email properties)
  {
    name: "draftTo",
    displayName: "To",
    type: "string",
    description: "Recipient email addresses",
    required: true,
    displayOptions: {
      show: {
        resource: ["draft"],
        operation: ["create"],
      },
    },
  },
  {
    name: "draftSubject",
    displayName: "Subject",
    type: "string",
    description: "Draft subject line",
    required: true,
    displayOptions: {
      show: {
        resource: ["draft"],
        operation: ["create"],
      },
    },
  },
  {
    name: "draftMessage",
    displayName: "Message",
    type: "text",
    description: "Draft message content",
    required: true,
    rows: 6,
    displayOptions: {
      show: {
        resource: ["draft"],
        operation: ["create"],
      },
    },
  },
];

// =============================================================================
// THREAD RESOURCE PROPERTIES
// =============================================================================

export const gmailThreadProperties: NodeProperty[] = [
  {
    name: "operation",
    displayName: "Operation",
    type: "select",
    description: "Operation to perform on threads",
    required: true,
    default: "get",
    displayOptions: {
      show: {
        resource: ["thread"],
      },
    },
    options: [
      { name: "Get", value: "get", action: "Get a thread" },
      { name: "Get All", value: "getAll", action: "Get all threads" },
      { name: "Reply", value: "reply", action: "Reply to thread" },
      { name: "Delete", value: "delete", action: "Delete thread" },
      { name: "Trash", value: "trash", action: "Move thread to trash" },
      { name: "Untrash", value: "untrash", action: "Remove thread from trash" },
      {
        name: "Add Labels",
        value: "addLabels",
        action: "Add labels to thread",
      },
      {
        name: "Remove Labels",
        value: "removeLabels",
        action: "Remove labels from thread",
      },
    ],
  },
  {
    name: "threadId",
    displayName: "Thread ID",
    type: "string",
    description: "The ID of the thread",
    required: true,
    displayOptions: {
      show: {
        resource: ["thread"],
        operation: [
          "get",
          "reply",
          "delete",
          "trash",
          "untrash",
          "addLabels",
          "removeLabels",
        ],
      },
    },
  },
];

// =============================================================================
// ADVANCED OPTIONS & ADDITIONAL FEATURES
// =============================================================================

export const gmailAdvancedProperties: NodeProperty[] = [
  // Output format options
  {
    name: "simplify",
    displayName: "Simplify Response",
    type: "boolean",
    description: "Return simplified output with only essential fields",
    default: true,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived", "get", "getAll"],
      },
    },
  },

  // Attachment handling
  {
    name: "downloadAttachments",
    displayName: "Download Attachments",
    type: "boolean",
    description: "Automatically download email attachments",
    default: false,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived", "get", "getAll"],
      },
    },
  },
  {
    name: "attachmentPrefix",
    displayName: "Attachment Prefix",
    type: "string",
    description: "Prefix for downloaded attachment filenames",
    placeholder: "gmail_",
    displayOptions: {
      show: {
        downloadAttachments: [true],
      },
    },
  },

  // Batch processing options
  {
    name: "maxResults",
    displayName: "Max Results",
    type: "number",
    description: "Maximum number of items to return",
    default: 100,
    min: 1,
    max: 500,
    displayOptions: {
      show: {
        operation: ["getAll", "messageReceived"],
      },
    },
  },

  // Email format options
  {
    name: "emailType",
    displayName: "Email Format",
    type: "select",
    description: "Format of the email content",
    default: "text",
    options: [
      { name: "Text", value: "text" },
      { name: "HTML", value: "html" },
      { name: "Both", value: "both" },
    ],
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },

  // Advanced attachment options
  {
    name: "attachments",
    displayName: "Attachments",
    type: "fixedCollection",
    description: "Files to attach to the email",
    typeOptions: {
      multipleValues: true,
      multipleValueButtonText: "Add Attachment",
    },
    displayOptions: {
      show: {
        resource: ["email", "draft"],
        operation: ["send", "reply", "forward", "create"],
      },
    },
    values: [
      {
        name: "type",
        displayName: "Type",
        type: "select",
        required: true,
        default: "binary",
        options: [
          { name: "Binary Data", value: "binary" },
          { name: "File Path", value: "path" },
          { name: "URL", value: "url" },
        ],
      },
      {
        name: "fileName",
        displayName: "File Name",
        type: "string",
        required: true,
        placeholder: "document.pdf",
      },
    ],
  },

  // =============================================================================
  // ADVANCED AI & ENTERPRISE FEATURES (FROM N8N ANALYSIS)
  // =============================================================================

  // AI-Powered Classification (Lower Priority - Cutting edge feature)
  {
    name: "enableAutoClassification",
    displayName: "Enable Auto-Classification",
    type: "boolean",
    description: "Use AI to automatically classify and label incoming emails",
    default: false,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived", "getAll"],
      },
    },
  },
  {
    name: "classificationCategories",
    displayName: "Classification Categories",
    type: "multiOptions",
    description: "Categories for automatic email classification",
    default: [],
    displayOptions: {
      show: {
        enableAutoClassification: [true],
      },
    },
    options: [
      { name: "Invoice/Billing", value: "invoice" },
      { name: "Support Request", value: "support" },
      { name: "Marketing", value: "marketing" },
      { name: "Personal", value: "personal" },
      { name: "Urgent", value: "urgent" },
      { name: "Newsletter", value: "newsletter" },
      { name: "Meeting Request", value: "meeting" },
      { name: "Document Request", value: "documents" },
    ],
  },

  // Smart Reply Generation
  {
    name: "generateSmartReplies",
    displayName: "Generate Smart Replies",
    type: "boolean",
    description: "Generate AI-powered reply suggestions",
    default: false,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["get", "messageReceived"],
      },
    },
  },

  // Email Language Detection
  {
    name: "emailLanguage",
    displayName: "Email Language",
    type: "select",
    description: "Language for email processing and templates",
    default: "auto",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
    options: [
      { name: "Auto-Detect", value: "auto" },
      { name: "English", value: "en" },
      { name: "Spanish", value: "es" },
      { name: "French", value: "fr" },
      { name: "German", value: "de" },
      { name: "Italian", value: "it" },
      { name: "Portuguese", value: "pt" },
      { name: "Chinese", value: "zh" },
      { name: "Japanese", value: "ja" },
    ],
  },

  // Gmail Categories (Gmail Tabs)
  {
    name: "category",
    displayName: "Gmail Category",
    type: "select",
    description: "Gmail category/tab for the email",
    default: "",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
    options: [
      { name: "Default", value: "" },
      { name: "Primary", value: "CATEGORY_PERSONAL" },
      { name: "Social", value: "CATEGORY_SOCIAL" },
      { name: "Promotions", value: "CATEGORY_PROMOTIONS" },
      { name: "Updates", value: "CATEGORY_UPDATES" },
      { name: "Forums", value: "CATEGORY_FORUMS" },
    ],
  },

  // Enhanced Security Options
  {
    name: "encryptionLevel",
    displayName: "Encryption Level",
    type: "select",
    description: "Email encryption level",
    default: "standard",
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
    options: [
      { name: "Standard TLS", value: "standard" },
      { name: "Enhanced TLS", value: "enhanced" },
      { name: "S/MIME (if configured)", value: "smime" },
    ],
  },

  // Email Analytics & Tracking
  {
    name: "trackOpens",
    displayName: "Track Email Opens",
    type: "boolean",
    description: "Track when emails are opened (requires third-party service)",
    default: false,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },
  {
    name: "trackClicks",
    displayName: "Track Link Clicks",
    type: "boolean",
    description:
      "Track clicks on links in emails (requires third-party service)",
    default: false,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },

  // Auto-Reply & Vacation Response
  {
    name: "autoReplyMessage",
    displayName: "Auto Reply Message",
    type: "text",
    description: "Automatic reply message for incoming emails",
    rows: 3,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["messageReceived"],
      },
    },
  },
  {
    name: "autoReplyStartTime",
    displayName: "Auto Reply Start Date",
    type: "dateTime",
    description: "Start date for automatic replies",
    displayOptions: {
      show: {
        autoReplyMessage: [""],
      },
      hide: {
        autoReplyMessage: [""],
      },
    },
  },
  {
    name: "autoReplyEndTime",
    displayName: "Auto Reply End Date",
    type: "dateTime",
    description: "End date for automatic replies",
    displayOptions: {
      show: {
        autoReplyMessage: [""],
      },
      hide: {
        autoReplyMessage: [""],
      },
    },
  },

  // Delivery & Read Confirmation
  {
    name: "requestDeliveryConfirmation",
    displayName: "Request Delivery Confirmation",
    type: "boolean",
    description: "Request delivery confirmation from email server",
    default: false,
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },

  // Conditional Sending Logic
  {
    name: "sendCondition",
    displayName: "Send Condition",
    type: "string",
    description:
      "JavaScript expression to determine if email should be sent (return true/false)",
    placeholder:
      'return data.urgency === "high" && data.recipient !== "spam@example.com"',
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
  },

  // Retry Logic for Failed Sends
  {
    name: "retryOptions",
    displayName: "Retry Configuration",
    type: "collection",
    description: "Configure retry behavior for failed email operations",
    default: {},
    displayOptions: {
      show: {
        resource: ["email"],
        operation: ["send", "reply", "forward"],
      },
    },
    values: [
      {
        name: "maxRetries",
        displayName: "Max Retries",
        type: "number",
        description: "Maximum number of retry attempts",
        default: 3,
        typeOptions: {
          minValue: 0,
          maxValue: 10,
        },
      },
      {
        name: "retryDelay",
        displayName: "Retry Delay (seconds)",
        type: "number",
        description: "Delay between retry attempts",
        default: 30,
        typeOptions: {
          minValue: 1,
          maxValue: 3600,
        },
      },
      {
        name: "backoffMultiplier",
        displayName: "Backoff Multiplier",
        type: "number",
        description: "Multiply delay by this factor for each retry",
        default: 2,
        typeOptions: {
          minValue: 1,
          maxValue: 5,
        },
      },
    ],
  },
];

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
