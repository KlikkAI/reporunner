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
