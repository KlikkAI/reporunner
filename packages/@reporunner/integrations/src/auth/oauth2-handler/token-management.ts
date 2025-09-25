raw: tokenData,
}

// Create and store session
const sessionId = this.generateSessionId();
const session: OAuth2Session = {
  id: sessionId,
  integrationName,
  userId,
  token,
  createdAt: new Date(),
  updatedAt: new Date(),
  state,
  codeVerifier: pendingAuth.codeVerifier,
  codeChallenge: pendingAuth.codeChallenge,
  nonce: pendingAuth.nonce,
};

this.sessions.set(sessionId, session);

// Clean up pending authorization
this.pendingAuthorizations.delete(state);

this.emit('token:obtained', {
  sessionId,
  integrationName,
  userId,
});

return token;
} catch (error: any)
{
  this.emit('token:error', {
    integrationName,
    userId,
    error: error.message,
  });

  throw new Error(`Failed to exchange code for token: ${error.message}`);
}
}

  /**
   * Refresh access token
   */
  async refreshAccessToken(sessionId: string): Promise<OAuth2Token>
{
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    if (!session.token.refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const params: Record<string, string> = {
        grant_type: 'refresh_token',
        refresh_token: session.token.refreshToken,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
      };

      const response = await this.httpClient.post(
        this.config.tokenUrl,
        new URLSearchParams(params),
        {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      );

      const tokenData = response.data;

      // Update token
      session.token = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token || session.token.refreshToken,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : undefined,
        scope: tokenData.scope || session.token.scope,
        idToken: tokenData.id_token,
        raw: tokenData,
      };

      session.updatedAt = new Date();

      this.emit('token:refreshed', {
        sessionId,
        integrationName: session.integrationName,
        userId: session.userId,
      });

      return session.token;
    } catch (error: any) {
      this.emit('token:refresh_error', {
        sessionId,
