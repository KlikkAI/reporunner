} catch (error)
{
  this.handleError(error);
}
}

  async testConnection(): Promise<boolean>
{
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

getRequiredScopes();
: string[]
{
  return [
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/gmail.modify',
      'https://www.googleapis.com/auth/gmail.labels',
    ];
}

getAuthorizationUrl(redirectUri: string, state: string)
: string
{
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

async;
exchangeCodeForTokens(code: string, redirectUri: string)
: Promise<IntegrationCredentials>
{
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
