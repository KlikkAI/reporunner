import {
  BaseIntegration,
  IntegrationCategory,
  type IntegrationCredentials,
  IntegrationType,
} from '@reporunner/plugin-framework';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import { z } from 'zod';

// Schemas for Gmail operations
const EmailSchema = z.object({
  to: z.array(z.string().email()),
  cc: z.array(z.string().email()).optional(),
  bcc: z.array(z.string().email()).optional(),
  subject: z.string(),
  body: z.string(),
  htmlBody: z.string().optional(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        content: z.string(), // base64
        contentType: z.string(),
      })
    )
    .optional(),
  replyTo: z.string().optional(),
  threadId: z.string().optional(),
});

const EmailFilterSchema = z.object({
  query: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
  subject: z.string().optional(),
  labelIds: z.array(z.string()).optional(),
  maxResults: z.number().min(1).max(500).default(50),
  pageToken: z.string().optional(),
  includeSpamTrash: z.boolean().default(false),
});

const LabelSchema = z.object({
  name: z.string(),
  labelListVisibility: z.enum(['labelShow', 'labelShowIfUnread', 'labelHide']).optional(),
  messageListVisibility: z.enum(['show', 'hide']).optional(),
  color: z
    .object({
      backgroundColor: z.string().optional(),
      textColor: z.string().optional(),
    })
    .optional(),
});

export class GmailIntegration extends BaseIntegration {
  private oauth2Client?: OAuth2Client;
  private gmail?: any;

  constructor() {
    super({
      name: 'gmail',
      displayName: 'Gmail',
      description: 'Connect to Gmail for email automation',
      version: '1.0.0',
      category: IntegrationCategory.COMMUNICATION,
      icon: 'gmail-icon-url',
      documentation: 'https://docs.reporunner.com/integrations/gmail',
      supportedTriggers: ['new_email', 'email_labeled', 'email_starred'],
      supportedActions: ['send_email', 'read_emails', 'manage_labels', 'create_draft'],
      rateLimit: {
        requests: 250,
        period: 1, // per second
      },
    });
  }

  protected initialize(): void {
    // Register triggers
    this.registerTrigger({
      name: 'new_email',
      displayName: 'New Email',
      description: 'Triggers when a new email is received',
      properties: z.object({
        labelIds: z.array(z.string()).optional(),
        from: z.string().optional(),
        subject: z.string().optional(),
      }),
      outputSchema: z.object({
        id: z.string(),
        threadId: z.string(),
        from: z.string(),
        to: z.array(z.string()),
        subject: z.string(),
        snippet: z.string(),
        body: z.string(),
        htmlBody: z.string().optional(),
        attachments: z.array(z.any()),
        labels: z.array(z.string()),
        receivedAt: z.string(),
      }),
    });

    // Register actions
    this.registerAction({
      name: 'send_email',
      displayName: 'Send Email',
      description: 'Send an email via Gmail',
      properties: z.object({}),
      inputSchema: EmailSchema,
      outputSchema: z.object({
        id: z.string(),
        threadId: z.string(),
        labelIds: z.array(z.string()),
      }),
    });

    this.registerAction({
      name: 'read_emails',
      displayName: 'Read Emails',
      description: 'Read emails from Gmail',
      properties: EmailFilterSchema,
      inputSchema: z.object({}),
      outputSchema: z.object({
        emails: z.array(
          z.object({
            id: z.string(),
            threadId: z.string(),
            from: z.string(),
            subject: z.string(),
            snippet: z.string(),
            receivedAt: z.string(),
          })
        ),
        nextPageToken: z.string().optional(),
      }),
    });

    this.registerAction({
      name: 'manage_labels',
      displayName: 'Manage Labels',
      description: 'Create, update, or delete Gmail labels',
      properties: z.object({
        operation: z.enum(['create', 'update', 'delete', 'list']),
      }),
      inputSchema: z.object({
        label: LabelSchema.optional(),
        labelId: z.string().optional(),
      }),
      outputSchema: z.object({
        success: z.boolean(),
        labels: z.array(z.any()).optional(),
        label: z.any().optional(),
      }),
    });
  }

  async authenticate(credentials: IntegrationCredentials): Promise<boolean> {
    try {
      if (credentials.type !== IntegrationType.OAUTH2) {
        throw new Error('Gmail requires OAuth2 authentication');
      }

      this.oauth2Client = new OAuth2Client(
        credentials.data.clientId,
        credentials.data.clientSecret,
        credentials.data.redirectUri
      );

      this.oauth2Client.setCredentials({
        access_token: credentials.data.accessToken,
        refresh_token: credentials.data.refreshToken,
        expiry_date: credentials.expiresAt?.getTime(),
      });

      this.gmail = google.gmail({ version: 'v1', auth: this.oauth2Client });

      return await this.testConnection();
    } catch (error) {
      this.handleError(error);
    }
  }

  async refreshAuth(): Promise<IntegrationCredentials> {
    if (!this.oauth2Client) {
      throw new Error('OAuth2 client not initialized');
    }

    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();

      return {
        type: IntegrationType.OAUTH2,
        data: {
          accessToken: credentials.access_token,
          refreshToken: credentials.refresh_token,
          clientId: this.oauth2Client._clientId,
          clientSecret: this.oauth2Client._clientSecret,
        },
        expiresAt: credentials.expiry_date ? new Date(credentials.expiry_date) : undefined,
      };
    } catch (error) {
      this.handleError(error);
    }
  }

  async testConnection(): Promise<boolean> {
    try {
      if (!this.gmail) {
        return false;
      }

      const profile = await this.gmail.users.getProfile({ userId: 'me' });
      this.log('info', 'Gmail connection successful', {
        email: profile.data.emailAddress,
      });
      return true;
    } catch (error) {
      this.log('error', 'Gmail connection failed', error);
      return false;
    }
  }

  getRequiredScopes(): string[] {
    return [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
    ];
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const oauth2Client = new OAuth2Client(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri
    );

    return oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: this.getRequiredScopes(),
      state: state,
      prompt: 'consent',
    });
  }

  async exchangeCodeForTokens(code: string, redirectUri: string): Promise<IntegrationCredentials> {
    const oauth2Client = new OAuth2Client(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri
    );

    const { tokens } = await oauth2Client.getToken(code);

    return {
      type: IntegrationType.OAUTH2,
      data: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        clientId: process.env.GMAIL_CLIENT_ID,
        clientSecret: process.env.GMAIL_CLIENT_SECRET,
        redirectUri,
      },
      expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
    };
  }
}

export default GmailIntegration;
