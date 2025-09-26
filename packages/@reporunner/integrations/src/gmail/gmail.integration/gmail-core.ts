import {
  BaseIntegration,
  IntegrationCategory,
  type IntegrationCredentials,
  IntegrationType,
} from '@reporunner/plugin-framework';
import type { OAuth2Client } from 'google-auth-library';
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
