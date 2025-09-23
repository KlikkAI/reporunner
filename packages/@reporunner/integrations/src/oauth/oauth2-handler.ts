import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope?: string[];
  state?: string;
  responseType?: 'code' | 'token';
  grantType?: 'authorization_code' | 'client_credentials' | 'refresh_token';
  accessType?: 'online' | 'offline';
  prompt?: 'none' | 'consent' | 'select_account';
  pkce?: boolean;
  customParams?: Record<string, string>;
}

export interface OAuth2Token {
  accessToken: string;
  refreshToken?: string;
  tokenType: string;
  expiresIn?: number;
  expiresAt?: Date;
  scope?: string;
  idToken?: string;
  raw?: any;
}

export interface OAuth2Error extends Error {
  code: string;
  description?: string;
  uri?: string;
}

export class OAuth2Handler extends EventEmitter {
  private config: OAuth2Config;
  private pendingStates: Map<
    string,
    {
      codeVerifier?: string;
      codeChallenge?: string;
      timestamp: number;
      metadata?: any;
    }
  > = new Map();

  constructor(config: OAuth2Config) {
    super();
    this.config = config;

    // Clean up old pending states every hour
    setInterval(() => this.cleanupPendingStates(), 3600000);
  }

  /**
   * Generate authorization URL
   */
  getAuthorizationUrl(metadata?: any): string {
    const state = this.config.state || this.generateState();
    const params = new URLSearchParams();

    // Basic OAuth2 parameters
    params.append('client_id', this.config.clientId);
    params.append('redirect_uri', this.config.redirectUri);
    params.append('response_type', this.config.responseType || 'code');
    params.append('state', state);

    // Optional scope
    if (this.config.scope && this.config.scope.length > 0) {
      params.append('scope', this.config.scope.join(' '));
    }

    // Optional access type (for offline access)
    if (this.config.accessType) {
      params.append('access_type', this.config.accessType);
    }

    // Optional prompt
    if (this.config.prompt) {
      params.append('prompt', this.config.prompt);
    }

    // PKCE support
    let codeVerifier: string | undefined;
    let codeChallenge: string | undefined;

    if (this.config.pkce) {
      codeVerifier = this.generateCodeVerifier();
      codeChallenge = this.generateCodeChallenge(codeVerifier);
      params.append('code_challenge', codeChallenge);
      params.append('code_challenge_method', 'S256');
    }

    // Custom parameters
    if (this.config.customParams) {
      Object.entries(this.config.customParams).forEach(([key, value]) => {
        params.append(key, value);
      });
    }

    // Store state for validation
    this.pendingStates.set(state, {
      codeVerifier,
      codeChallenge,
      timestamp: Date.now(),
      metadata,
    });

    const authUrl = `${this.config.authorizationUrl}?${params.toString()}`;

    this.emit('authorization:started', { state, authUrl, metadata });

    return authUrl;
  }

  /**
   * Handle OAuth2 callback
   */
  async handleCallback(params: {
    code?: string;
    state?: string;
    error?: string;
    error_description?: string;
    error_uri?: string;
  }): Promise<OAuth2Token> {
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
  async exchangeCodeForToken(code: string, codeVerifier?: string): Promise<OAuth2Token> {
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
  async refreshAccessToken(refreshToken: string): Promise<OAuth2Token> {
    const body = new URLSearchParams();
    body.append('grant_type', 'refresh_token');
    body.append('refresh_token', refreshToken);
    body.append('client_id', this.config.clientId);
    body.append('client_secret', this.config.clientSecret);

    const response = await this.makeTokenRequest(body);
    const token = this.parseTokenResponse(response);

    // Preserve refresh token if not returned in response
    if (!token.refreshToken && refreshToken) {
      token.refreshToken = refreshToken;
    }

    this.emit('token:refreshed', { token });

    return token;
  }

  /**
   * Get client credentials token (for service-to-service auth)
   */
  async getClientCredentialsToken(): Promise<OAuth2Token> {
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
  async revokeToken(
    token: string,
    tokenType: 'access_token' | 'refresh_token' = 'access_token'
  ): Promise<void> {
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
  private async makeTokenRequest(body: URLSearchParams): Promise<any> {
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
  private parseTokenResponse(response: any): OAuth2Token {
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
  private generateState(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code verifier
   */
  private generateCodeVerifier(): string {
    return crypto.randomBytes(32).toString('base64url');
  }

  /**
   * Generate PKCE code challenge
   */
  private generateCodeChallenge(verifier: string): string {
    return crypto.createHash('sha256').update(verifier).digest('base64url');
  }

  /**
   * Clean up old pending states
   */
  private cleanupPendingStates(): void {
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
  private createError(code: string, description: string): OAuth2Error {
    const error = new Error(description) as OAuth2Error;
    error.code = code;
    error.description = description;
    error.name = 'OAuth2Error';
    return error;
  }

  /**
   * Validate token
   */
  isTokenExpired(token: OAuth2Token): boolean {
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
  getAuthorizationHeader(token: OAuth2Token): string {
    return `${token.tokenType} ${token.accessToken}`;
  }
}

export default OAuth2Handler;
