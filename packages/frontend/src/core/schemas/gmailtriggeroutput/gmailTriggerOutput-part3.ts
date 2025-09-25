contentType: 'image/jpeg', filename;
: 'damaged_package_1.jpg',
      size: 2456789,
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
    },
{
  contentDisposition: 'attachment', contentType;
  : 'image/jpeg',
      filename: 'damaged_product_2.jpg',
      size: 1834567,
      data: 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
}
,
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
  );
};

// Helper functions for data transformation
export const extractEmailAddresses = (output: GmailTriggerOutput) => ({
  from: output.from.value.map((addr) => addr.address),
  to: output.to.value.map((addr) => addr.address),
  cc: output.cc?.value.map((addr) => addr.address) || [],
  bcc: output.bcc?.value.map((addr) => addr.address) || [],
});

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
});

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
});
