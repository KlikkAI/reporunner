if (!token.refreshToken && refreshToken) {
  token.refreshToken = refreshToken;
}

this.emit('token:refreshed', { token });

return token;
}

  /**
   * Get client credentials token (for service-to-service auth)
   */
  async getClientCredentialsToken(): Promise<OAuth2Token>
{
  const body = new URLSearchParams();
  body.append('grant_type', 'client_credentials');
  body.append('client_id', this.config.clientId);
  body.append('client_secret', this.config.clientSecret);

  if (this.config.scope && this.config.scope.length > 0) {
    body.append('scope', this.config.scope.join(' '));
  }

  const response = await this.makeTokenRequest(body);
  return this.parseTokenResponse(response);
}

/**
 * Revoke token
 */
async;
revokeToken(
    token: string,
    tokenType: 'access_token' | 'refresh_token' = 'access_token'
  )
: Promise<void>
{
  // Not all OAuth2 providers support token revocation
  const revokeUrl = `${this.config.tokenUrl.replace('/token', '/revoke')}`;

  const body = new URLSearchParams();
  body.append('token', token);
  body.append('token_type_hint', tokenType);
  body.append('client_id', this.config.clientId);
  body.append('client_secret', this.config.clientSecret);

  try {
    await fetch(revokeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    this.emit('token:revoked', { token, tokenType });
  } catch (_error) {}
}

/**
 * Make token request
 */
private
async;
makeTokenRequest(body: URLSearchParams)
: Promise<any>
{
  const response = await fetch(this.config.tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  });

  const responseData = await response.json();

  if (!response.ok || responseData.error) {
    const error = this.createError(
      responseData.error || 'token_request_failed',
      responseData.error_description || `Token request failed with status ${response.status}`
    );
    error.uri = responseData.error_uri;
    throw error;
  }

  return responseData;
}

/**
 * Parse token response
 */
private
parseTokenResponse(response: any)
: OAuth2Token
{
    const token: OAuth2Token = {
      accessToken: response.access_token,
      tokenType: response.token_type || 'Bearer',
      raw: response,
    };

    if (response.refresh_token) {
      token.refreshToken = response.refresh_token;
    }

    if (response.expires_in) {
      token.expiresIn = response.expires_in;
      token.expiresAt = new Date(Date.now() + response.expires_in * 1000);
    }
