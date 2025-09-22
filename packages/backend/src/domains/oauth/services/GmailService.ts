import { google } from 'googleapis';
import { logger } from '../../../utils/logger.js';

export interface GmailCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}

export interface EmailMessage {
  id: string;
  threadId: string;
  messageId: string;
  from: string;
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  bodyHtml?: string;
  date: Date;
  labels: string[];
  attachments?: EmailAttachment[];
  isUnread: boolean;
  size: number;
  headers: any[];
  rawGmailResponse?: any;
}

export interface EmailAttachment {
  filename: string;
  mimeType: string;
  size: number;
  attachmentId: string;
  data?: Buffer;
}

export interface SendEmailOptions {
  to: string[];
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  isHtml?: boolean;
  attachments?: EmailAttachment[];
  replyToMessageId?: string;
}

export class GmailService {
  private oauth2Client: any;

  constructor(credentials: GmailCredentials) {
    this.oauth2Client = new google.auth.OAuth2(credentials.clientId, credentials.clientSecret);

    this.oauth2Client.setCredentials({
      refresh_token: credentials.refreshToken,
    });
  }

  /**
   * Get Gmail API instance
   */
  private getGmailAPI() {
    return google.gmail({ version: 'v1', auth: this.oauth2Client });
  }

  /**
   * Refresh access token if needed
   */
  private async ensureValidToken() {
    try {
      await this.oauth2Client.refreshAccessToken();
    } catch (error) {
      logger.error('Failed to refresh Gmail access token:', error);
      throw new Error('Gmail authentication failed. Please re-authenticate.');
    }
  }

  /**
   * Get user profile information
   */
  async getProfile() {
    await this.ensureValidToken();
    const gmail = this.getGmailAPI();

    try {
      const response = await gmail.users.getProfile({ userId: 'me' });
      return response.data;
    } catch (error: any) {
      logger.error('Failed to get Gmail profile:', error);
      throw new Error(`Failed to get profile: ${error.message}`);
    }
  }

  /**
   * List messages based on query
   */
  async listMessages(query?: string, maxResults: number = 10): Promise<EmailMessage[]> {
    await this.ensureValidToken();
    const gmail = this.getGmailAPI();

    try {
      const response = await gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults,
      });

      if (!response.data.messages) {
        return [];
      }

      // Get full message details for each message
      const messages = await Promise.all(
        response.data.messages.map(async (msg: any) => {
          const fullMessage = await gmail.users.messages.get({
            userId: 'me',
            id: msg.id,
            format: 'full',
          });
          return this.parseMessage(fullMessage.data);
        })
      );

      return messages;
    } catch (error: any) {
      logger.error('Failed to list Gmail messages:', error);
      throw new Error(`Failed to list messages: ${error.message}`);
    }
  }

  /**
   * Get a specific message by ID
   */
  async getMessage(messageId: string): Promise<EmailMessage> {
    await this.ensureValidToken();
    const gmail = this.getGmailAPI();

    try {
      const response = await gmail.users.messages.get({
        userId: 'me',
        id: messageId,
        format: 'full',
      });

      return this.parseMessage(response.data);
    } catch (error: any) {
      logger.error('Failed to get Gmail message:', error);
      throw new Error(`Failed to get message: ${error.message}`);
    }
  }

  /**
   * Send an email
   */
  async sendEmail(options: SendEmailOptions): Promise<{ messageId: string; threadId: string }> {
    await this.ensureValidToken();
    const gmail = this.getGmailAPI();

    try {
      const message = this.createEmailMessage(options);

      const response = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: message,
        },
      });

      logger.info(`Email sent successfully: ${response.data.id}`);

      return {
        messageId: response.data.id!,
        threadId: response.data.threadId!,
      };
    } catch (error: any) {
      logger.error('Failed to send Gmail message:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Mark messages as read
   */
  async markAsRead(messageIds: string[]): Promise<void> {
    await this.ensureValidToken();
    const gmail = this.getGmailAPI();

    try {
      await Promise.all(
        messageIds.map((id) =>
          gmail.users.messages.modify({
            userId: 'me',
            id,
            requestBody: {
              removeLabelIds: ['UNREAD'],
            },
          })
        )
      );
    } catch (error: any) {
      logger.error('Failed to mark messages as read:', error);
      throw new Error(`Failed to mark as read: ${error.message}`);
    }
  }

  /**
   * Parse Gmail API message format to our EmailMessage format
   */
  private parseMessage(messageData: any): EmailMessage {
    const headers = messageData.payload.headers || [];
    const getHeader = (name: string) =>
      headers.find((h: any) => h.name.toLowerCase() === name.toLowerCase())?.value || '';

    // Extract body using the proper extraction method
    const bodyResult = { text: '', html: '' };
    this.extractBody(messageData.payload, bodyResult);

    const body = bodyResult.text || bodyResult.html || '';
    const bodyHtml = bodyResult.html || bodyResult.text || '';

    // Extract attachments
    const attachments: EmailAttachment[] = [];
    this.extractAttachments(messageData.payload, attachments);

    return {
      id: messageData.id,
      threadId: messageData.threadId,
      messageId: getHeader('Message-ID'),
      from: getHeader('From'),
      to: getHeader('To')
        .split(',')
        .map((email: string) => email.trim())
        .filter(Boolean),
      cc: getHeader('Cc')
        .split(',')
        .map((email: string) => email.trim())
        .filter(Boolean),
      subject: getHeader('Subject'),
      body,
      bodyHtml,
      // Add aliases for common field name variations
      htmlBody: bodyHtml || body, // Transform node expects htmlBody
      sender: getHeader('From'),
      senderName: getHeader('From').split('<')[0].trim() || getHeader('From'),
      threadid: messageData.threadId,
      date: new Date(parseInt(messageData.internalDate)),
      labels: messageData.labelIds || [],
      attachments,
      isUnread: messageData.labelIds?.includes('UNREAD') || false,
      size: messageData.sizeEstimate,
      headers: messageData.payload.headers || [],
      rawGmailResponse: messageData,
    } as any; // Use 'any' to allow additional fields
  }

  /**
   * Extract body from message payload
   */
  private extractBody(payload: any, result: { text: string; html: string }) {
    if (payload.body && payload.body.data) {
      const data = Buffer.from(payload.body.data, 'base64').toString('utf-8');
      if (payload.mimeType === 'text/plain') {
        result.text = data;
      } else if (payload.mimeType === 'text/html') {
        result.html = data;
      }
    }

    if (payload.parts) {
      payload.parts.forEach((part: any) => this.extractBody(part, result));
    }
  }

  /**
   * Extract attachments from message payload
   */
  private extractAttachments(payload: any, attachments: EmailAttachment[]) {
    if (payload.filename && payload.body?.attachmentId) {
      attachments.push({
        filename: payload.filename,
        mimeType: payload.mimeType,
        size: payload.body.size,
        attachmentId: payload.body.attachmentId,
      });
    }

    if (payload.parts) {
      payload.parts.forEach((part: any) => this.extractAttachments(part, attachments));
    }
  }

  /**
   * Create RFC 2822 formatted email message
   */
  private createEmailMessage(options: SendEmailOptions): string {
    const boundary = `boundary_${Math.random().toString(36).substring(2)}`;

    let message = [
      `To: ${options.to.join(', ')}`,
      options.cc?.length ? `Cc: ${options.cc.join(', ')}` : '',
      options.bcc?.length ? `Bcc: ${options.bcc.join(', ')}` : '',
      `Subject: ${options.subject}`,
      options.replyToMessageId ? `In-Reply-To: ${options.replyToMessageId}` : '',
      'MIME-Version: 1.0',
      `Content-Type: multipart/mixed; boundary="${boundary}"`,
      '',
      `--${boundary}`,
      `Content-Type: ${options.isHtml ? 'text/html' : 'text/plain'}; charset=utf-8`,
      '',
      options.body,
      '',
    ]
      .filter(Boolean)
      .join('\n');

    // Add attachments if any
    if (options.attachments?.length) {
      options.attachments.forEach((attachment) => {
        message += [
          `--${boundary}`,
          `Content-Type: ${attachment.mimeType}`,
          `Content-Disposition: attachment; filename="${attachment.filename}"`,
          'Content-Transfer-Encoding: base64',
          '',
          attachment.data?.toString('base64') || '',
          '',
        ].join('\n');
      });
    }

    message += `--${boundary}--`;

    // Convert to base64url
    return Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  }
}

export default GmailService;
