// Gmail Trigger Node Output Schema
// Defines the complete data structure returned by Gmail trigger node

export interface GmailAttachment {
  cid?: string | null
  contentDisposition: string
  contentId?: string | null
  contentType: string
  filename: string
  size: number
  data?: string // Base64 encoded attachment data (if downloaded)
}

export interface GmailAddress {
  address: string
  name?: string
}

export interface GmailAddressValue {
  value: GmailAddress[]
  html: string
  text: string
}

export interface GmailHeaders {
  [key: string]: string
}

export interface GmailTriggerOutput {
  // Core email identifiers
  id: string
  threadId: string
  labelIds: string[]
  snippet: string

  // Email addresses
  from: GmailAddressValue
  to: GmailAddressValue
  cc?: GmailAddressValue
  bcc?: GmailAddressValue
  replyTo?: GmailAddressValue

  // Email content
  subject: string
  text: string
  html?: string
  textAsHtml?: string

  // Headers and metadata
  date: string
  receivedAt: string
  messageId: string
  inReplyTo?: string
  references?: string[]
  headers: GmailHeaders

  // Attachments
  attachments: GmailAttachment[]
  hasAttachments: boolean

  // Gmail specific
  historyId: string
  internalDate: string
  sizeEstimate: number

  // Processing metadata
  isUnread: boolean
  isImportant: boolean
  isStarred: boolean
  isDraft: boolean
  isSpam: boolean
  isTrash: boolean

  // Custom labels and categories
  customLabels: string[]
  category?: 'primary' | 'social' | 'promotions' | 'updates' | 'forums'

  // Rich content indicators
  hasImages: boolean
  hasLinks: boolean
  linkCount: number
  imageCount: number

  // Processing timestamps
  triggeredAt: string
  processedAt?: string
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
        name: 'Sarah Johnson',
      },
    ],
    html: 'Sarah Johnson &lt;customer@example.com&gt;',
    text: 'Sarah Johnson <customer@example.com>',
  },

  to: {
    value: [
      {
        address: 'support@reporunner.com',
        name: 'RepoRunner Support',
      },
    ],
    html: 'RepoRunner Support &lt;support@reporunner.com&gt;',
    text: 'RepoRunner Support <support@reporunner.com>',
  },

  subject: 'Urgent: Damaged Package - Order #12345 - Need Return/Exchange',
  text: `Hi RepoRunner Support Team,

I hope this email finds you well. I'm writing to report an issue with my recent order #12345 that was delivered yesterday.

Problem Details:
- Order Number: #12345
- Delivery Date: January 3, 2025
- Issue: Package arrived with significant damage to the outer box and the product inside

The product appears to have been damaged during shipping. The box was crushed on one side and the item inside has visible scratches and dents. I've attached photos showing the damage for your reference.

What I Need:
I would like to either:
1. Return the damaged item for a full refund, OR  
2. Exchange it for a replacement in good condition

I've been a loyal customer for over 2 years and have always had great experiences with your service. I'm hoping we can resolve this quickly.

Please let me know what steps I need to take next. I'm available via email or phone (555-123-4567) if you need any additional information.

Thank you for your time and assistance.

Best regards,
Sarah Johnson
Customer ID: CUST-98765
Email: customer@example.com
Phone: (555) 123-4567`,

  html: `<div dir="ltr">
    <p>Hi RepoRunner Support Team,</p>
    
    <p>I hope this email finds you well. I'm writing to report an issue with my recent order <strong>#12345</strong> that was delivered yesterday.</p>
    
    <p><strong>Problem Details:</strong></p>
    <ul>
      <li>Order Number: #12345</li>
      <li>Delivery Date: January 3, 2025</li>
      <li>Issue: Package arrived with significant damage to the outer box and the product inside</li>
    </ul>
    
    <p>The product appears to have been damaged during shipping. The box was crushed on one side and the item inside has visible scratches and dents. I've attached photos showing the damage for your reference.</p>
    
    <p><strong>What I Need:</strong><br>
    I would like to either:</p>
    <ol>
      <li>Return the damaged item for a full refund, OR</li>
      <li>Exchange it for a replacement in good condition</li>
    </ol>
    
    <p>I've been a loyal customer for over 2 years and have always had great experiences with your service. I'm hoping we can resolve this quickly.</p>
    
    <p>Please let me know what steps I need to take next. I'm available via email or phone <a href="tel:5551234567">(555-123-4567)</a> if you need any additional information.</p>
    
    <p>Thank you for your time and assistance.</p>
    
    <p>Best regards,<br>
    Sarah Johnson<br>
    Customer ID: CUST-98765<br>
    Email: <a href="mailto:customer@example.com">customer@example.com</a><br>
    Phone: (555) 123-4567</p>
  </div>`,

  date: '2025-01-04T09:15:30.000Z',
  receivedAt: '2025-01-04T09:15:30.000Z',
  messageId: '<CACUhAm9F2KfQ1234567890@mail.gmail.com>',

  headers: {
    'Return-Path': '<customer@example.com>',
    Received: 'from mail-wr1-f43.google.com by mx.reporunner.com',
    'DKIM-Signature': 'v=1; a=rsa-sha256; c=relaxed/relaxed; d=example.com',
    'Message-ID': '<CACUhAm9F2KfQ1234567890@mail.gmail.com>',
    Date: 'Fri, 4 Jan 2025 09:15:30 +0000',
    From: 'Sarah Johnson <customer@example.com>',
    To: 'RepoRunner Support <support@reporunner.com>',
    Subject: 'Urgent: Damaged Package - Order #12345 - Need Return/Exchange',
    'Content-Type':
      'multipart/alternative; boundary="000000000000a1b2c3d4e5f6"',
  },

  attachments: [
    {
      contentDisposition: 'attachment',
      contentType: 'image/jpeg',
      filename: 'damaged_package_1.jpg',
      size: 2456789,
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    },
    {
      contentDisposition: 'attachment',
      contentType: 'image/jpeg',
      filename: 'damaged_product_2.jpg',
      size: 1834567,
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    },
  ],

  hasAttachments: true,
  historyId: '5394821',
  internalDate: '1735981730000',
  sizeEstimate: 8947,

  isUnread: true,
  isImportant: true,
  isStarred: false,
  isDraft: false,
  isSpam: false,
  isTrash: false,

  customLabels: ['Support Tickets', 'High Priority'],
  category: 'primary',

  hasImages: false,
  hasLinks: true,
  linkCount: 3,
  imageCount: 0,

  triggeredAt: '2025-01-04T09:16:00.000Z',
}

// Schema validation and type guards
export const isGmailTriggerOutput = (data: any): data is GmailTriggerOutput => {
  return (
    typeof data === 'object' &&
    data !== null &&
    typeof data.id === 'string' &&
    typeof data.threadId === 'string' &&
    typeof data.subject === 'string' &&
    typeof data.text === 'string' &&
    typeof data.from === 'object' &&
    Array.isArray(data.from.value) &&
    Array.isArray(data.attachments)
  )
}

// Helper functions for data transformation
export const extractEmailAddresses = (output: GmailTriggerOutput) => ({
  from: output.from.value.map(addr => addr.address),
  to: output.to.value.map(addr => addr.address),
  cc: output.cc?.value.map(addr => addr.address) || [],
  bcc: output.bcc?.value.map(addr => addr.address) || [],
})

export const getEmailMetadata = (output: GmailTriggerOutput) => ({
  messageId: output.id,
  threadId: output.threadId,
  subject: output.subject,
  date: output.date,
  isUnread: output.isUnread,
  hasAttachments: output.hasAttachments,
  attachmentCount: output.attachments.length,
  sizeEstimate: output.sizeEstimate,
  labelIds: output.labelIds,
  category: output.category,
})

export const getEmailContent = (output: GmailTriggerOutput) => ({
  subject: output.subject,
  text: output.text,
  html: output.html,
  snippet: output.snippet,
  hasImages: output.hasImages,
  hasLinks: output.hasLinks,
  linkCount: output.linkCount,
  wordCount: output.text.split(/\s+/).length,
  characterCount: output.text.length,
})
