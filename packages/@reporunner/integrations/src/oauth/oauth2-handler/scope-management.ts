if (response.scope) {
  token.scope = response.scope;
}

if (response.id_token) {
  token.idToken = response.id_token;
}

return token;
}

  /**
   * Generate random state
   */
  private generateState(): string
{
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code verifier
 */
private
generateCodeVerifier();
: string
{
  return crypto.randomBytes(32).toString('base64url');
}

/**
 * Generate PKCE code challenge
 */
private
generateCodeChallenge(verifier: string)
: string
{
  return crypto.createHash('sha256').update(verifier).digest('base64url');
}

/**
 * Clean up old pending states
 */
private
cleanupPendingStates();
: void
{
  const now = Date.now();
  const timeout = 600000; // 10 minutes

  for (const [state, data] of this.pendingStates) {
    if (now - data.timestamp > timeout) {
      this.pendingStates.delete(state);
    }
  }
}

/**
 * Create OAuth2 error
 */
private
createError(code: string, description: string)
: OAuth2Error
{
  const error = new Error(description) as OAuth2Error;
  error.code = code;
  error.description = description;
  error.name = 'OAuth2Error';
  return error;
}

/**
 * Validate token
 */
isTokenExpired(token: OAuth2Token)
: boolean
{
  if (!token.expiresAt) {
    return false;
  }

  // Add 60 second buffer to account for clock skew
  const bufferMs = 60000;
  return Date.now() > token.expiresAt.getTime() - bufferMs;
}

/**
 * Get authorization header value
 */
getAuthorizationHeader(token: OAuth2Token)
: string
{
  return `${token.tokenType} ${token.accessToken}`;
}
}

export default OAuth2Handler;
