// Gmail Node - Action Logic
import type { PropertyFormState } from '@/types/dynamicProperties'
import { ApiClient } from '@/core/api/ApiClient'

/**
 * Execute Gmail trigger - check for new emails (Real API Implementation)
 */
export async function executeGmailTrigger(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any[]> {
  console.log('Executing Gmail trigger with parameters:', parameters)
  console.log('Using credentials:', credentials)

  try {
    // Create a temporary node ID for this test execution
    const testNodeId = 'gmail-trigger-test-' + Date.now()

    // Call backend API to get real Gmail data
    const response = await ApiClient.post(`/nodes/${testNodeId}/execute`, {
      workflow: {
        nodes: [{
          id: testNodeId,
          type: 'gmail-trigger',
          data: {
            credentials: typeof credentials === 'string' ? credentials : credentials?.id || credentials,
            ...parameters,
            enhancedNodeType: { id: 'gmail-trigger' },
            integrationData: { id: 'gmail' },
            label: 'Gmail Trigger (Test)'
          }
        }],
        edges: []
      }
    });

    const result = response.data;

    console.log('Full backend response:', result)

    // Extract the email data from the backend response structure:
    // result.data.result.data contains the actual Gmail emails
    const emailData = result.data?.result?.data || []

    console.log('Extracted Gmail emails:', emailData)
    console.log('Number of emails:', Array.isArray(emailData) ? emailData.length : 'not an array')

    // Return the real Gmail email data with all dynamic fields
    return Array.isArray(emailData) ? emailData : []

  } catch (error: any) {
    console.error('Gmail trigger API call failed:', error)

    // Fallback: Return a minimal error indication instead of mock data
    throw new Error(`Failed to fetch Gmail emails: ${error.message}. Please check your Gmail credentials and connection.`)
  }
}

/**
 * Execute Gmail send email action (Mock Implementation - Backend not yet implemented)
 */
export async function executeGmailSend(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Sending Gmail email with parameters:', parameters)
  console.log('Using credentials:', credentials)

  // TODO: Implement backend Gmail send support
  // Mock implementation for now
  const result = {
    id: 'sent-' + Date.now(),
    messageId: '<' + Date.now() + '@gmail.com>',
    to: parameters.to,
    subject: parameters.subject,
    status: 'sent',
    sentAt: new Date().toISOString()
  }

  return result
}

/**
 * Execute Gmail create draft action (MVP Implementation)
 * Based on createDraft tool from workflow.json
 */
export async function executeGmailCreateDraft(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Creating Gmail draft with parameters:', parameters)
  console.log('Using credentials:', credentials)

  // Extract parameters for draft creation
  const subject = parameters.subject as string || 'Customer Support Response'
  const message = parameters.message as string || parameters.body as string
  const threadId = parameters.threadId as string
  const sendTo = parameters.sendTo as string || parameters.to as string

  // MVP Mock implementation - replace with actual Gmail API calls
  const draft = {
    id: 'draft-' + Date.now(),
    messageId: '<draft-' + Date.now() + '@gmail.com>',
    threadId: threadId,
    to: sendTo,
    subject: subject,
    message: message,
    status: 'draft',
    createdAt: new Date().toISOString(),

    // Draft metadata
    draft: {
      id: 'draft-' + Date.now(),
      message: {
        id: 'msg-' + Date.now(),
        labelIds: ['DRAFT'],
        snippet: message.substring(0, 100) + '...',
        payload: {
          headers: [
            { name: 'To', value: sendTo },
            { name: 'Subject', value: subject },
            { name: 'In-Reply-To', value: threadId }
          ],
          body: {
            data: Buffer.from(message).toString('base64')
          }
        }
      }
    }
  }

  console.log('Draft created successfully:', draft.id)
  return draft
}

/**
 * Execute Gmail tool action (AI Tool Integration for MVP)
 * Handles createDraft tool calls from AI Agent - Enhanced for n8n compatibility
 */
export async function executeGmailTool(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Executing Gmail tool with parameters:', parameters)

  const resource = parameters.resource as string || 'draft'

  switch (resource) {
    case 'draft':
      return executeGmailCreateDraft(parameters, credentials)

    case 'send':
      return executeGmailSend(parameters, credentials)

    default:
      throw new Error(`Unsupported Gmail tool resource: ${resource}`)
  }
}

/**
 * AI Tool Interface for createDraft - Called by AI Agents
 * This function provides the interface that AI agents can call as a tool
 */
export async function createDraftTool(
  subject: string,
  message: string,
  threadId?: string,
  sendTo?: string
): Promise<any> {
  console.log('AI Tool: createDraft called with:', { subject, message, threadId, sendTo })

  // Extract parameters from AI agent call
  const parameters = {
    resource: 'draft',
    subject: subject,
    message: message,
    threadId: threadId,
    sendTo: sendTo,
    descriptionType: 'manual',
    toolDescription: 'Consume the Gmail API to createDraft response',
    options: {
      threadId: threadId,
      sendTo: sendTo
    }
  }

  // Mock credentials - in production, this would come from the workflow context
  const mockCredentials = {
    gmailOAuth2: {
      id: 'mock-gmail-cred',
      name: 'Gmail OAuth2 Account'
    }
  }

  return executeGmailCreateDraft(parameters, mockCredentials)
}

/**
 * Tool Definition for AI Agents - Used by workflow export
 */
export const gmailToolDefinition = {
  name: 'createDraft',
  description: 'Create a Gmail draft response for customer support',
  parameters: {
    type: 'object',
    properties: {
      subject: {
        type: 'string',
        description: 'Email subject line'
      },
      message: {
        type: 'string',
        description: 'Email message content'
      },
      threadId: {
        type: 'string',
        description: 'Gmail thread ID for reply threading'
      },
      sendTo: {
        type: 'string',
        description: 'Recipient email address'
      }
    },
    required: ['subject', 'message', 'sendTo']
  }
}

// =============================================================================
// NEW ACTION HANDLERS FROM N8N ANALYSIS
// =============================================================================

/**
 * Execute Gmail Archive operation
 */
export async function executeGmailArchive(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Executing Gmail archive with parameters:', parameters)
  
  const messageIds = Array.isArray(parameters.messageId) ? parameters.messageId : [parameters.messageId]
  
  // Call backend API to archive emails
  const response = await ApiClient.post('/gmail/archive', {
    messageIds,
    credentials: credentials?.id || credentials
  })
  
  return {
    success: true,
    archivedCount: messageIds.length,
    messageIds: messageIds,
    operation: 'archive'
  }
}

/**
 * Execute Gmail Star operation
 */
export async function executeGmailStar(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Executing Gmail star with parameters:', parameters)
  
  const messageIds = Array.isArray(parameters.messageId) ? parameters.messageId : [parameters.messageId]
  
  // Call backend API to star emails
  const response = await ApiClient.post('/gmail/star', {
    messageIds,
    credentials: credentials?.id || credentials
  })
  
  return {
    success: true,
    starredCount: messageIds.length,
    messageIds: messageIds,
    operation: 'star'
  }
}

/**
 * Execute Gmail Unstar operation
 */
export async function executeGmailUnstar(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Executing Gmail unstar with parameters:', parameters)
  
  const messageIds = Array.isArray(parameters.messageId) ? parameters.messageId : [parameters.messageId]
  
  // Call backend API to unstar emails
  const response = await ApiClient.post('/gmail/unstar', {
    messageIds,
    credentials: credentials?.id || credentials
  })
  
  return {
    success: true,
    unstarredCount: messageIds.length,
    messageIds: messageIds,
    operation: 'unstar'
  }
}

/**
 * Execute Gmail Unarchive operation
 */
export async function executeGmailUnarchive(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Executing Gmail unarchive with parameters:', parameters)
  
  const messageIds = Array.isArray(parameters.messageId) ? parameters.messageId : [parameters.messageId]
  
  // Call backend API to unarchive emails
  const response = await ApiClient.post('/gmail/unarchive', {
    messageIds,
    credentials: credentials?.id || credentials
  })
  
  return {
    success: true,
    unarchivedCount: messageIds.length,
    messageIds: messageIds,
    operation: 'unarchive'
  }
}

/**
 * Enhanced Gmail Send with new features from n8n analysis
 */
export async function executeGmailSendEnhanced(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Executing enhanced Gmail send with parameters:', parameters)
  
  // Extract enhanced parameters
  const {
    sendTo,
    subject,
    message,
    priority = 'normal',
    scheduledSendTime,
    emailTemplate,
    requestReadReceipt = false,
    includeSignature = true,
    attachments,
    replyTo,
    sendCc,
    sendBcc,
    category,
    encryptionLevel = 'standard',
    trackOpens = false,
    trackClicks = false,
    emailLanguage = 'auto',
    sendCondition,
    retryOptions = {}
  } = parameters
  
  // Process send condition if provided
  if (sendCondition) {
    try {
      // Evaluate send condition (would need safe evaluation in production)
      const shouldSend = eval(`(function() { ${sendCondition} })()`)
      if (!shouldSend) {
        return {
          success: false,
          message: 'Email not sent due to send condition',
          skipped: true
        }
      }
    } catch (error) {
      console.error('Send condition evaluation failed:', error)
      return {
        success: false,
        message: 'Send condition evaluation failed',
        error: error.message
      }
    }
  }
  
  // Build enhanced email payload
  const emailPayload = {
    to: sendTo,
    subject: subject,
    body: message,
    cc: sendCc,
    bcc: sendBcc,
    replyTo: replyTo,
    priority: priority,
    scheduledSendTime: scheduledSendTime,
    template: emailTemplate,
    readReceipt: requestReadReceipt,
    includeSignature: includeSignature,
    attachments: attachments,
    category: category,
    encryption: encryptionLevel,
    tracking: {
      opens: trackOpens,
      clicks: trackClicks
    },
    language: emailLanguage,
    credentials: credentials?.id || credentials
  }
  
  try {
    // Call backend API with enhanced features
    const response = await ApiClient.post('/gmail/send-enhanced', emailPayload)
    
    return {
      success: true,
      messageId: response.data.messageId,
      threadId: response.data.threadId,
      sentAt: response.data.sentAt,
      scheduled: !!scheduledSendTime,
      features: {
        priority,
        readReceipt: requestReadReceipt,
        tracking: { opens: trackOpens, clicks: trackClicks },
        encryption: encryptionLevel
      }
    }
  } catch (error) {
    // Handle retry logic if configured
    if (retryOptions.maxRetries > 0) {
      console.log(`Send failed, will retry ${retryOptions.maxRetries} times`)
      // Implement retry logic here
    }
    
    throw error
  }
}

/**
 * Execute AI Classification for emails
 */
export async function executeGmailClassification(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Executing Gmail AI classification with parameters:', parameters)
  
  const {
    enableAutoClassification,
    classificationCategories = [],
    messageData
  } = parameters
  
  if (!enableAutoClassification) {
    return { classified: false, message: 'Auto-classification disabled' }
  }
  
  // Call AI classification service
  const response = await ApiClient.post('/gmail/classify', {
    messageData,
    categories: classificationCategories,
    credentials: credentials?.id || credentials
  })
  
  return {
    success: true,
    classified: true,
    category: response.data.category,
    confidence: response.data.confidence,
    suggestedLabels: response.data.labels
  }
}

/**
 * Generate Smart Replies using AI
 */
export async function executeGmailSmartReplies(
  parameters: PropertyFormState,
  credentials: Record<string, any>
): Promise<any> {
  console.log('Executing Gmail smart replies generation with parameters:', parameters)
  
  const {
    generateSmartReplies,
    messageData,
    emailLanguage = 'auto'
  } = parameters
  
  if (!generateSmartReplies) {
    return { generated: false, message: 'Smart replies disabled' }
  }
  
  // Call AI reply generation service
  const response = await ApiClient.post('/gmail/smart-replies', {
    messageData,
    language: emailLanguage,
    credentials: credentials?.id || credentials
  })
  
  return {
    success: true,
    generated: true,
    replies: response.data.replies,
    language: emailLanguage
  }
}

/**
 * Test Gmail connection
 */
export async function testGmailConnection(
  credentials: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  console.log('Testing Gmail connection with credentials:', credentials)

  try {
    // Call backend API to test Gmail connection
    const response = await ApiClient.post('/gmail/test-connection', {
      credentials: credentials?.id || credentials
    })
    
    return {
      success: true,
      message: 'Successfully connected to Gmail'
    }
  } catch (error) {
    return {
      success: false,
      message: `Gmail connection failed: ${error.message}`
    }
  }
}