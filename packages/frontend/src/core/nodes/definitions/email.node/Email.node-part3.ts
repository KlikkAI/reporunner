},
        },
        description: 'Maximum number of emails to fetch',
      },
{
  displayName: 'Mark as Read', name;
  : 'markAsRead',
  type: 'boolean',
  default: false,
        displayOptions:
      operation: ['read'],
    ,
  ,
        description: 'Mark fetched emails as read',
}
,
    ],
    categories: ['Communication'],
  }

async
execute(this: any)
: Promise<INodeExecutionData[][]>
{
  const operation = this.getNodeParameter('operation', 'send') as string;
  const results: INodeExecutionData[] = [];

  switch (operation) {
    case 'send': {
      const to = this.getNodeParameter('to', '') as string;
      const cc = this.getNodeParameter('cc', '') as string;
      const bcc = this.getNodeParameter('bcc', '') as string;
      const subject = this.getNodeParameter('subject', '') as string;
      const message = this.getNodeParameter('message', '') as string;
      const messageType = this.getNodeParameter('messageType', 'text') as string;

      // Mock email sending - in real implementation would use SMTP
      results.push({
        json: {
          operation: 'send',
          status: 'sent',
          messageId: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          to: to
            .split(',')
            .map((email) => email.trim())
            .filter((email) => email),
          cc: cc
            ? cc
                .split(',')
                .map((email) => email.trim())
                .filter((email) => email)
            : [],
          bcc: bcc
            ? bcc
                .split(',')
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

    case 'read': {
      const mailbox = this.getNodeParameter('mailbox', 'INBOX') as string;
      const readMode = this.getNodeParameter('readMode', 'unread') as string;
      const limit = this.getNodeParameter('limit', 10) as number;
      const markAsRead = this.getNodeParameter('markAsRead', false) as boolean;

      // Mock email reading - in real implementation would use IMAP
      const mockEmails = Math.min(limit, 5); // Generate up to 5 mock emails

      for (let i = 0; i < mockEmails; i++) {
        results.push({
          json: {
            operation: 'read',
            mailbox,
            readMode,
            messageId: `msg_${Date.now()}_${i}`,
            from: `sender${i + 1}@example.com`,
            to: 'recipient@example.com',
            subject: `Mock Email ${i + 1} - ${readMode}`,
            date: new Date(Date.now() - i * 3600000).toISOString(), // Hourly intervals
            isRead: readMode === 'all' ? Math.random() > 0.5 : false,
            hasAttachments: Math.random() > 0.7,
            bodyPreview: `This is a mock email body preview for email ${i + 1}...`,
            flags: readMode === 'unread' ? ['\\Recent'] : ['\\Seen'],
            markedAsRead: markAsRead && readMode === 'unread',
          },
        });
      }
      break;
    }
  }

  return [results];
}
}
