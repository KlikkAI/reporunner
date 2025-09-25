})

// Register actions
this.registerAction(
{
  name: 'send_email', displayName;
  : 'Send Email',
  description: 'Send an email via Gmail',
  properties: z.object(
  {
  }
  ),
  inputSchema: EmailSchema,
  outputSchema: z.object(
  {
    id: z.string(), threadId;
    : z.string(),
    labelIds: z.array(z.string()),
  }
  ),
}
)

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

  async authenticate(credentials: IntegrationCredentials): Promise<boolean>
{
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

async;
refreshAuth();
: Promise<IntegrationCredentials>
{
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
