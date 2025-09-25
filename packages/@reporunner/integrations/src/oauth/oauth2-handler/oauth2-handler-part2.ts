}

    // Store state for validation
    this.pendingStates.set(state,
{
  codeVerifier, codeChallenge, timestamp;
  : Date.now(),
      metadata,
}
)

const authUrl = `${this.config.authorizationUrl}?${params.toString()}`;

this.emit('authorization:started', { state, authUrl, metadata });

return authUrl;
}

  /**
   * Handle OAuth2 callback
   */
  async handleCallback(params:
{
  code?: string;
  state?: string;
  error?: string;
  error_description?: string;
  error_uri?: string;
}
): Promise<OAuth2Token>
{
  // Check for errors
  if (params.error) {
    const error = this.createError(
      params.error,
      params.error_description || 'OAuth2 authorization failed'
    );
    error.uri = params.error_uri;
    throw error;
  }

  // Validate state
  if (!params.state || !this.pendingStates.has(params.state)) {
    throw this.createError('invalid_state', 'Invalid or expired state parameter');
  }

  const stateData = this.pendingStates.get(params.state)!;
  this.pendingStates.delete(params.state);

  // Check if state is expired (10 minutes)
  if (Date.now() - stateData.timestamp > 600000) {
    throw this.createError('state_expired', 'Authorization state has expired');
  }

  // Validate code
  if (!params.code) {
    throw this.createError('missing_code', 'Authorization code is missing');
  }

  // Exchange code for token
  const token = await this.exchangeCodeForToken(params.code, stateData.codeVerifier);

  this.emit('authorization:completed', {
    token,
    metadata: stateData.metadata,
  });

  return token;
}

/**
 * Exchange authorization code for access token
 */
async;
exchangeCodeForToken(code: string, codeVerifier?: string)
: Promise<OAuth2Token>
{
  const body = new URLSearchParams();
  body.append('grant_type', 'authorization_code');
  body.append('code', code);
  body.append('client_id', this.config.clientId);
  body.append('client_secret', this.config.clientSecret);
  body.append('redirect_uri', this.config.redirectUri);

  // Add PKCE code verifier if used
  if (codeVerifier) {
    body.append('code_verifier', codeVerifier);
  }

  const response = await this.makeTokenRequest(body);
  return this.parseTokenResponse(response);
}

/**
 * Refresh access token using refresh token
 */
async;
refreshAccessToken(refreshToken: string)
: Promise<OAuth2Token>
{
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', refreshToken);
    body.append('client_id', this.config.clientId);
    body.append('client_secret', this.config.clientSecret);

    const response = await this.makeTokenRequest(body);
    const token = this.parseTokenResponse(response);

// Preserve refresh token if not returned in response
