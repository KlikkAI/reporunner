error: error.message,
})

throw new Error(`Failed to refresh token: ${error.message}`);
}
  }

  /**
   * Revoke token
   */
  async revokeToken(sessionId: string, revokeUrl?: string): Promise<void>
{
  const session = this.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  if (revokeUrl) {
    try {
      await this.httpClient.post(
        revokeUrl,
        new URLSearchParams({
          token: session.token.accessToken,
          token_type_hint: 'access_token',
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
        }),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      // Also revoke refresh token if available
      if (session.token.refreshToken) {
        await this.httpClient.post(
          revokeUrl,
          new URLSearchParams({
            token: session.token.refreshToken,
            token_type_hint: 'refresh_token',
            client_id: this.config.clientId,
            client_secret: this.config.clientSecret,
          }),
          {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
            },
          }
        );
      }
    } catch (_error: any) {}
  }

  // Remove session
  this.sessions.delete(sessionId);

  this.emit('token:revoked', {
    sessionId,
    integrationName: session.integrationName,
    userId: session.userId,
  });
}

/**
 * Get valid access token (auto-refresh if needed)
 */
async;
getValidAccessToken(sessionId: string)
: Promise<string>
{
  const session = this.sessions.get(sessionId);
  if (!session) {
    throw new Error('Session not found');
  }

  // Check if token is expired or about to expire (5 minutes buffer)
  const now = new Date();
  const bufferTime = 5 * 60 * 1000; // 5 minutes

  if (session.token.expiresAt && new Date(session.token.expiresAt.getTime() - bufferTime) <= now) {
    // Token is expired or about to expire, refresh it
    if (session.token.refreshToken) {
      const newToken = await this.refreshAccessToken(sessionId);
      return newToken.accessToken;
    } else {
      throw new Error('Token expired and no refresh token available');
    }
  }

  return session.token.accessToken;
}

/**
 * Create authenticated HTTP client
 */
async;
createAuthenticatedClient(sessionId: string)
: Promise<AxiosInstance>
{
    const accessToken = await this.getValidAccessToken(sessionId);

    return axios.create({
      headers: {
