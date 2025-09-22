import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { z } from "zod";
import {
  BaseIntegration,
  IntegrationType,
  IntegrationCategory,
  IntegrationCredentials,
} from "@reporunner/plugin-framework";

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
      }),
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
  labelListVisibility: z
    .enum(["labelShow", "labelShowIfUnread", "labelHide"])
    .optional(),
  messageListVisibility: z.enum(["show", "hide"]).optional(),
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
      name: "gmail",
      displayName: "Gmail",
      description: "Connect to Gmail for email automation",
      version: "1.0.0",
      category: IntegrationCategory.COMMUNICATION,
      icon: "gmail-icon-url",
      documentation: "https://docs.reporunner.com/integrations/gmail",
      supportedTriggers: ["new_email", "email_labeled", "email_starred"],
      supportedActions: [
        "send_email",
        "read_emails",
        "manage_labels",
        "create_draft",
      ],
      rateLimit: {
        requests: 250,
        period: 1, // per second
      },
    });
  }

  protected initialize(): void {
    // Register triggers
    this.registerTrigger({
      name: "new_email",
      displayName: "New Email",
      description: "Triggers when a new email is received",
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
      name: "send_email",
      displayName: "Send Email",
      description: "Send an email via Gmail",
      properties: z.object({}),
      inputSchema: EmailSchema,
      outputSchema: z.object({
        id: z.string(),
        threadId: z.string(),
        labelIds: z.array(z.string()),
      }),
    });

    this.registerAction({
      name: "read_emails",
      displayName: "Read Emails",
      description: "Read emails from Gmail",
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
          }),
        ),
        nextPageToken: z.string().optional(),
      }),
    });

    this.registerAction({
      name: "manage_labels",
      displayName: "Manage Labels",
      description: "Create, update, or delete Gmail labels",
      properties: z.object({
        operation: z.enum(["create", "update", "delete", "list"]),
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
        throw new Error("Gmail requires OAuth2 authentication");
      }

      this.oauth2Client = new OAuth2Client(
        credentials.data.clientId,
        credentials.data.clientSecret,
        credentials.data.redirectUri,
      );

      this.oauth2Client.setCredentials({
        access_token: credentials.data.accessToken,
        refresh_token: credentials.data.refreshToken,
        expiry_date: credentials.expiresAt?.getTime(),
      });

      this.gmail = google.gmail({ version: "v1", auth: this.oauth2Client });

      return await this.testConnection();
    } catch (error) {
      this.handleError(error);
    }
  }

  async refreshAuth(): Promise<IntegrationCredentials> {
    if (!this.oauth2Client) {
      throw new Error("OAuth2 client not initialized");
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
        expiresAt: credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : undefined,
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

      const profile = await this.gmail.users.getProfile({ userId: "me" });
      this.log("info", "Gmail connection successful", {
        email: profile.data.emailAddress,
      });
      return true;
    } catch (error) {
      this.log("error", "Gmail connection failed", error);
      return false;
    }
  }

  getRequiredScopes(): string[] {
    return [
      "https://www.googleapis.com/auth/gmail.send",
      "https://www.googleapis.com/auth/gmail.readonly",
      "https://www.googleapis.com/auth/gmail.modify",
      "https://www.googleapis.com/auth/gmail.labels",
    ];
  }

  getAuthorizationUrl(redirectUri: string, state: string): string {
    const oauth2Client = new OAuth2Client(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri,
    );

    return oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: this.getRequiredScopes(),
      state: state,
      prompt: "consent",
    });
  }

  async exchangeCodeForTokens(
    code: string,
    redirectUri: string,
  ): Promise<IntegrationCredentials> {
    const oauth2Client = new OAuth2Client(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      redirectUri,
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

  // Action implementations
  private async action_send_email(
    input: z.infer<typeof EmailSchema>,
    properties: any,
  ): Promise<any> {
    if (!this.gmail) {
      throw new Error("Gmail not authenticated");
    }

    // Construct email
    const email = [
      `To: ${input.to.join(", ")}`,
      input.cc ? `Cc: ${input.cc.join(", ")}` : "",
      input.bcc ? `Bcc: ${input.bcc.join(", ")}` : "",
      `Subject: ${input.subject}`,
      `Content-Type: ${input.htmlBody ? "text/html" : "text/plain"}; charset=utf-8`,
      "",
      input.htmlBody || input.body,
    ]
      .filter(Boolean)
      .join("\n");

    const encodedEmail = Buffer.from(email)
      .toString("base64")
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=+$/, "");

    const result = await this.gmail.users.messages.send({
      userId: "me",
      requestBody: {
        raw: encodedEmail,
        threadId: input.threadId,
      },
    });

    return {
      id: result.data.id,
      threadId: result.data.threadId,
      labelIds: result.data.labelIds,
    };
  }

  private async action_read_emails(
    input: any,
    properties: z.infer<typeof EmailFilterSchema>,
  ): Promise<any> {
    if (!this.gmail) {
      throw new Error("Gmail not authenticated");
    }

    // Build query
    let query = properties.query || "";
    if (properties.from) query += ` from:${properties.from}`;
    if (properties.to) query += ` to:${properties.to}`;
    if (properties.subject) query += ` subject:${properties.subject}`;

    const response = await this.gmail.users.messages.list({
      userId: "me",
      q: query.trim(),
      labelIds: properties.labelIds,
      maxResults: properties.maxResults,
      pageToken: properties.pageToken,
      includeSpamTrash: properties.includeSpamTrash,
    });

    const emails = await Promise.all(
      (response.data.messages || []).map(async (msg: any) => {
        const detail = await this.gmail.users.messages.get({
          userId: "me",
          id: msg.id,
        });

        const headers = detail.data.payload.headers;
        const getHeader = (name: string) =>
          headers.find((h: any) => h.name === name)?.value || "";

        return {
          id: msg.id,
          threadId: msg.threadId,
          from: getHeader("From"),
          subject: getHeader("Subject"),
          snippet: detail.data.snippet,
          receivedAt: getHeader("Date"),
        };
      }),
    );

    return {
      emails,
      nextPageToken: response.data.nextPageToken,
    };
  }

  private async action_manage_labels(
    input: any,
    properties: any,
  ): Promise<any> {
    if (!this.gmail) {
      throw new Error("Gmail not authenticated");
    }

    switch (properties.operation) {
      case "create":
        const created = await this.gmail.users.labels.create({
          userId: "me",
          requestBody: input.label,
        });
        return { success: true, label: created.data };

      case "list":
        const list = await this.gmail.users.labels.list({ userId: "me" });
        return { success: true, labels: list.data.labels };

      case "delete":
        await this.gmail.users.labels.delete({
          userId: "me",
          id: input.labelId,
        });
        return { success: true };

      default:
        throw new Error(`Unknown operation: ${properties.operation}`);
    }
  }

  // Trigger implementations
  private async trigger_new_email(properties: any): Promise<any> {
    // This would typically be handled by webhooks or polling
    // For now, return a sample structure
    return {
      id: "sample-email-id",
      threadId: "sample-thread-id",
      from: "sender@example.com",
      to: ["recipient@example.com"],
      subject: "Sample Subject",
      snippet: "Email preview text...",
      body: "Full email body",
      attachments: [],
      labels: ["INBOX"],
      receivedAt: new Date().toISOString(),
    };
  }
}

export default GmailIntegration;
