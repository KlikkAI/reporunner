// Gmail Trigger Node Output Schema
// Defines the complete data structure returned by Gmail trigger node

export interface GmailAttachment {
  cid?: string | null;
  contentDisposition: string;
  contentId?: string | null;
  contentType: string;
  filename: string;
  size: number;
  data?: string; // Base64 encoded attachment data (if downloaded)
}

export interface GmailAddress {
  address: string;
  name?: string;
}

export interface GmailAddressValue {
  value: GmailAddress[];
  html: string;
  text: string;
}

export interface GmailHeaders {
  [key: string]: string;
}

export interface GmailTriggerOutput {
  // Core email identifiers
  id: string;
  threadId: string;
  labelIds: string[];
  snippet: string;

  // Email addresses
  from: GmailAddressValue;
  to: GmailAddressValue;
  cc?: GmailAddressValue;
  bcc?: GmailAddressValue;
  replyTo?: GmailAddressValue;

  // Email content
  subject: string;
  text: string;
  html?: string;
  textAsHtml?: string;

  // Headers and metadata
  date: string;
  receivedAt: string;
  messageId: string;
  inReplyTo?: string;
  references?: string[];
  headers: GmailHeaders;

  // Attachments
  attachments: GmailAttachment[];
  hasAttachments: boolean;

  // Gmail specific
  historyId: string;
  internalDate: string;
  sizeEstimate: number;

  // Processing metadata
  isUnread: boolean;
  isImportant: boolean;
  isStarred: boolean;
  isDraft: boolean;
  isSpam: boolean;
  isTrash: boolean;

  // Custom labels and categories
  customLabels: string[];
  category?: 'primary' | 'social' | 'promotions' | 'updates' | 'forums';

  // Rich content indicators
  hasImages: boolean;
  hasLinks: boolean;
  linkCount: number;
  imageCount: number;

  // Processing timestamps
  triggeredAt: string;
  processedAt?: string;
}

// Sample data for development and testing
export const sampleGmailTriggerOutput: GmailTriggerOutput = {
  id: '18c8f2e9a1b4d6e7',
  threadId: '18c8f2e9a1b4d6e7',
  labelIds: ['INBOX', 'IMPORTANT', 'CATEGORY_PRIMARY'],
  snippet:
    "Hi, I'm having trouble with my recent order #12345. The package arrived damaged and I need help with a return or replacement. Could someone please assist me with this issue? Thanks!",

  from: {
    value: [
      {
        address: 'customer@example.com',
