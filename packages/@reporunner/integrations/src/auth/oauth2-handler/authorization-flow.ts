params.prompt = this.config.prompt;
}

// PKCE support
let codeVerifier: string | undefined;
let codeChallenge: string | undefined;

if (this.config.usePKCE) {
  codeVerifier = this.generateCodeVerifier();
  codeChallenge = await this.generateCodeChallenge(codeVerifier);
  params.code_challenge = codeChallenge;
  params.code_challenge_method = 'S256';
}

// Add parameters to URL
Object.entries(params).forEach(([key, value]) => {
  url.searchParams.append(key, value);
});

const authRequest: AuthorizationRequest = {
  authorizationUrl: url.toString(),
  state,
  codeVerifier,
  codeChallenge,
  nonce,
};

// Store pending authorization
this.pendingAuthorizations.set(state, authRequest);

// Clean up old pending authorizations after 10 minutes
setTimeout(
  () => {
    this.pendingAuthorizations.delete(state);
  },
  10 * 60 * 1000
);

this.emit('authorization:generated', {
  integrationName,
  userId,
  state,
});

return authRequest;
}

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForToken(
    code: string,
    state: string,
    integrationName: string,
    userId: string
  ): Promise<OAuth2Token>
{
    // Verify state
    const pendingAuth = this.pendingAuthorizations.get(state);
    if (!pendingAuth) {
      throw new Error('Invalid or expired state parameter');
    }

    try {
      const params: Record<string, string> = {
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      };

      // Add PKCE verifier if used
      if (this.config.usePKCE && pendingAuth.codeVerifier) {
        params.code_verifier = pendingAuth.codeVerifier;
      }

      // Make token request
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

      // Create token object
      const token: OAuth2Token = {
        accessToken: tokenData.access_token,
        refreshToken: tokenData.refresh_token,
        tokenType: tokenData.token_type || 'Bearer',
        expiresIn: tokenData.expires_in,
        expiresAt: tokenData.expires_in
          ? new Date(Date.now() + tokenData.expires_in * 1000)
          : undefined,
        scope: tokenData.scope,
        idToken: tokenData.id_token,
