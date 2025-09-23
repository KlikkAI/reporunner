import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { URL, URLSearchParams } from 'node:url';
import axios, { type AxiosInstance } from 'axios';

export interface OAuth2Config {
  clientId: string;
  clientSecret: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scopes: string[];
  usePKCE?: boolean;
  useStateParameter?: boolean;
  accessType?: 'online' | 'offline';
  prompt?: 'none' | 'consent' | 'select_account';
  additionalParams?: Record<string, string>;
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

export interface OAuth2Session {
  id: string;
  integrationName: string;
  userId: string;
  token: OAuth2Token;
  createdAt: Date;
  updatedAt: Date;
  state?: string;
  codeVerifier?: string;
  codeChallenge?: string;
  nonce?: string;
}

export interface AuthorizationRequest {
  authorizationUrl: string;
  state: string;
  codeVerifier?: string;
  codeChallenge?: string;
  nonce?: string;
}

export class OAuth2Handler extends EventEmitter {
  private config: OAuth2Config;
  private httpClient: AxiosInstance;
  private sessions: Map<string, OAuth2Session> = new Map();
  private pendingAuthorizations: Map<string, AuthorizationRequest> = new Map();

  constructor(config: OAuth2Config) {
    super();
    this.config = config;
    this.httpClient = axios.create({
      timeout: 30000,
      headers: {
        'User-Agent': 'Reporunner-OAuth2-Client/1.0',
      },
    });
  }

  /**
   * Generate authorization URL
   */
  async generateAuthorizationUrl(
    integrationName: string,
    userId: string,
    additionalScopes?: string[],
    additionalParams?: Record<string, string>
  ): Promise<AuthorizationRequest> {
    const url = new URL(this.config.authorizationUrl);
    const state = this.generateState();
    const nonce = this.generateNonce();

    // Build parameters
    const params: Record<string, string> = {
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: 'code',
      scope: [...this.config.scopes, ...(additionalScopes || [])].join(' '),
      state,
      nonce,
      ...this.config.additionalParams,
      ...additionalParams,
    };

    // Add offline access if configured
    if (this.config.accessType) {
      params.access_type = this.config.accessType;
    }

    // Add prompt if configured
    if (this.config.prompt) {
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
  ): Promise<OAuth2Token> {
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
        raw: tokenData,
      };

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
    } catch (error: any) {
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
  async refreshAccessToken(sessionId: string): Promise<OAuth2Token> {
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
        error: error.message,
      });

      throw new Error(`Failed to refresh token: ${error.message}`);
    }
  }

  /**
   * Revoke token
   */
  async revokeToken(sessionId: string, revokeUrl?: string): Promise<void> {
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
  async getValidAccessToken(sessionId: string): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error('Session not found');
    }

    // Check if token is expired or about to expire (5 minutes buffer)
    const now = new Date();
    const bufferTime = 5 * 60 * 1000; // 5 minutes

    if (
      session.token.expiresAt &&
      new Date(session.token.expiresAt.getTime() - bufferTime) <= now
    ) {
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
  async createAuthenticatedClient(sessionId: string): Promise<AxiosInstance> {
    const accessToken = await this.getValidAccessToken(sessionId);

    return axios.create({
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'Reporunner-OAuth2-Client/1.0',
      },
    });
  }

  /**
   * Get session
   */
  getSession(sessionId: string): OAuth2Session | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get sessions by user
   */
  getSessionsByUser(userId: string): OAuth2Session[] {
    return Array.from(this.sessions.values()).filter((session) => session.userId === userId);
  }

  /**
   * Get sessions by integration
   */
  getSessionsByIntegration(integrationName: string): OAuth2Session[] {
    return Array.from(this.sessions.values()).filter(
      (session) => session.integrationName === integrationName
    );
  }

  /**
   * Generate state parameter
   */
  private generateState(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate nonce
   */
  private generateNonce(): string {
    return crypto.randomBytes(16).toString('hex');
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
  private async generateCodeChallenge(verifier: string): Promise<string> {
    const hash = crypto.createHash('sha256');
    hash.update(verifier);
    return hash.digest('base64url');
  }

  /**
   * Generate session ID
   */
  private generateSessionId(): string {
    return `oauth2_session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  }

  /**
   * Clear all sessions
   */
  clearAllSessions(): void {
    this.sessions.clear();
    this.pendingAuthorizations.clear();
  }

  /**
   * Get statistics
   */
  getStatistics(): {
    totalSessions: number;
    pendingAuthorizations: number;
    sessionsByIntegration: Record<string, number>;
    sessionsByUser: Record<string, number>;
  } {
    const sessionsByIntegration: Record<string, number> = {};
    const sessionsByUser: Record<string, number> = {};

    this.sessions.forEach((session) => {
      sessionsByIntegration[session.integrationName] =
        (sessionsByIntegration[session.integrationName] || 0) + 1;
      sessionsByUser[session.userId] = (sessionsByUser[session.userId] || 0) + 1;
    });

    return {
      totalSessions: this.sessions.size,
      pendingAuthorizations: this.pendingAuthorizations.size,
      sessionsByIntegration,
      sessionsByUser,
    };
  }
}

export default OAuth2Handler;
