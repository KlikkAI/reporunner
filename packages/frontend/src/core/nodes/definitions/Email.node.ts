/* eslint-disable @typescript-eslint/no-explicit-any */
import type {
  INodeType,
  INodeTypeDescription,
  INodeExecutionData,
} from "../types";

export class EmailNode implements INodeType {
  description: INodeTypeDescription = {
    displayName: "Email",
    name: "email",
    icon: "📧",
    group: ["communication"],
    version: 1,
    description: "Send and receive emails via SMTP/IMAP",
    defaults: {
      name: "Email",
      color: "#ea4335",
    },
    inputs: ["main"],
    outputs: ["main"],
    credentials: [
      {
        name: "smtp",
        required: false,
        displayOptions: {
          show: {
            operation: ["send"],
          },
        },
      },
      {
        name: "imap",
        required: false,
        displayOptions: {
          show: {
            operation: ["read"],
          },
        },
      },
    ],
    properties: [
      {
        displayName: "Operation",
        name: "operation",
        type: "options",
        default: "send",
        required: true,
        options: [
          {
            name: "Send Email",
            value: "send",
            description: "Send an email message",
          },
          {
            name: "Read Emails",
            value: "read",
            description: "Read emails from inbox",
          },
        ],
        description: "Email operation to perform",
      },
      {
        displayName: "To",
        name: "to",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            operation: ["send"],
          },
        },
        description: "Recipient email address(es), comma-separated",
        placeholder: "user@example.com, another@example.com",
      },
      {
        displayName: "CC",
        name: "cc",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            operation: ["send"],
          },
        },
        description: "Carbon copy recipients, comma-separated",
        placeholder: "cc@example.com",
      },
      {
        displayName: "BCC",
        name: "bcc",
        type: "string",
        default: "",
        displayOptions: {
          show: {
            operation: ["send"],
          },
        },
        description: "Blind carbon copy recipients, comma-separated",
        placeholder: "bcc@example.com",
      },
      {
        displayName: "Subject",
        name: "subject",
        type: "string",
        default: "",
        required: true,
        displayOptions: {
          show: {
            operation: ["send"],
          },
        },
        description: "Email subject line",
        placeholder: "Your email subject here",
      },
      {
        displayName: "Message Type",
        name: "messageType",
        type: "options",
        default: "text",
        displayOptions: {
          show: {
            operation: ["send"],
          },
        },
        options: [
          {
            name: "Plain Text",
            value: "text",
          },
          {
            name: "HTML",
            value: "html",
          },
        ],
        description: "Format of the email message",
      },
      {
        displayName: "Message",
        name: "message",
        type: "text",
        default: "",
        required: true,
        displayOptions: {
          show: {
            operation: ["send"],
          },
        },
        description: "Email message content",
        placeholder: "Your email message here...",
      },
      {
        displayName: "Mailbox",
        name: "mailbox",
        type: "string",
        default: "INBOX",
        displayOptions: {
          show: {
            operation: ["read"],
          },
        },
        description: "Mailbox to read from",
        placeholder: "INBOX, Sent, Draft",
      },
      {
        displayName: "Read Mode",
        name: "readMode",
        type: "options",
        default: "unread",
        displayOptions: {
          show: {
            operation: ["read"],
          },
        },
        options: [
          {
            name: "Unread Only",
            value: "unread",
            description: "Only fetch unread emails",
          },
          {
            name: "All Emails",
            value: "all",
            description: "Fetch all emails",
          },
          {
            name: "Recent",
            value: "recent",
            description: "Fetch recent emails",
          },
        ],
        description: "Which emails to read",
      },
      {
        displayName: "Limit",
        name: "limit",
        type: "number",
        default: 10,
        min: 1,
        max: 100,
        displayOptions: {
          show: {
            operation: ["read"],
          },
        },
        description: "Maximum number of emails to fetch",
      },
      {
        displayName: "Mark as Read",
        name: "markAsRead",
        type: "boolean",
        default: false,
        displayOptions: {
          show: {
            operation: ["read"],
          },
        },
        description: "Mark fetched emails as read",
      },
    ],
    categories: ["Communication"],
  };

  async execute(this: any): Promise<INodeExecutionData[][]> {
    const operation = this.getNodeParameter("operation", "send") as string;
    const results: INodeExecutionData[] = [];

    switch (operation) {
      case "send": {
        const to = this.getNodeParameter("to", "") as string;
        const cc = this.getNodeParameter("cc", "") as string;
        const bcc = this.getNodeParameter("bcc", "") as string;
        const subject = this.getNodeParameter("subject", "") as string;
        const message = this.getNodeParameter("message", "") as string;
        const messageType = this.getNodeParameter(
          "messageType",
          "text",
        ) as string;

        // Mock email sending - in real implementation would use SMTP
        results.push({
          json: {
            operation: "send",
            status: "sent",
            messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            to: to
              .split(",")
              .map((email) => email.trim())
              .filter((email) => email),
            cc: cc
              ? cc
                  .split(",")
                  .map((email) => email.trim())
                  .filter((email) => email)
              : [],
            bcc: bcc
              ? bcc
                  .split(",")
                  .map((email) => email.trim())
                  .filter((email) => email)
              : [],
            subject,
            messageType,
            messageLength: message.length,
            timestamp: new Date().toISOString(),
          },
        });
        break;
      }

      case "read": {
        const mailbox = this.getNodeParameter("mailbox", "INBOX") as string;
        const readMode = this.getNodeParameter("readMode", "unread") as string;
        const limit = this.getNodeParameter("limit", 10) as number;
        const markAsRead = this.getNodeParameter(
          "markAsRead",
          false,
        ) as boolean;

        // Mock email reading - in real implementation would use IMAP
        const mockEmails = Math.min(limit, 5); // Generate up to 5 mock emails

        for (let i = 0; i < mockEmails; i++) {
          results.push({
            json: {
              operation: "read",
              mailbox,
              readMode,
              messageId: `msg_${Date.now()}_${i}`,
              from: `sender${i + 1}@example.com`,
              to: "recipient@example.com",
              subject: `Mock Email ${i + 1} - ${readMode}`,
              date: new Date(Date.now() - i * 3600000).toISOString(), // Hourly intervals
              isRead: readMode === "all" ? Math.random() > 0.5 : false,
              hasAttachments: Math.random() > 0.7,
              bodyPreview: `This is a mock email body preview for email ${i + 1}...`,
              flags: readMode === "unread" ? ["\\Recent"] : ["\\Seen"],
              markedAsRead: markAsRead && readMode === "unread",
            },
          });
        }
        break;
      }
    }

    return [results];
  }
}
