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
