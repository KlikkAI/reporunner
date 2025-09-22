import crypto from 'crypto';
import type { Request } from 'express';
import { google } from 'googleapis';
import { AppError } from '../../../middleware/errorHandlers.js';
import { CredentialRepository } from '../../credentials/repositories/CredentialRepository.js';

// In-memory state store (in production, use Redis)
const oauthStates = new Map<
  string,
  {
    userId: string;
    credentialName: string;
    clientId: string;
    clientSecret: string;
    returnUrl?: string;
    createdAt: Date;
  }
>();

export class OAuthService {
  private credentialRepository: CredentialRepository;

  constructor() {
    this.credentialRepository = new CredentialRepository();
  }

  /**
   * Initiate Gmail OAuth2 flow
   */
  async initiateGmailOAuth(
    userId: string,
    credentialName: string,
    returnUrl: string | undefined,
    req: Request
  ) {
    // Use your app's OAuth credentials (from environment variables)
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

    if (!clientId || !clientSecret) {
      throw new AppError('Gmail OAuth not configured. Please contact administrator.', 500);
    }

    // Use HTTPS in production, detect protocol properly
    const protocol =
      process.env.OAUTH_PROTOCOL ||
      (process.env.NODE_ENV === 'production' ? 'https' : req.protocol);
    const redirectUri = `${protocol}://${req.get('host')}/oauth/gmail/callback`;

    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

    // Generate secure random state for CSRF protection
    const state = crypto.randomBytes(32).toString('hex');

    // Store state and associated data
    oauthStates.set(state, {
      userId,
      credentialName,
      clientId,
      clientSecret,
      returnUrl,
      createdAt: new Date(),
    });

    // Clean up old states (older than 10 minutes)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    for (const [key, value] of oauthStates.entries()) {
      if (value.createdAt < tenMinutesAgo) {
        oauthStates.delete(key);
      }
    }

    const authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
        'https://www.googleapis.com/auth/gmail.compose',
        'https://www.googleapis.com/auth/gmail.modify',
      ],
      state,
      prompt: 'consent', // Always show consent screen to get refresh token
    });

    return {
      authUrl,
      state,
    };
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(
    code: string,
    clientId: string,
    clientSecret: string,
    redirectUri: string | undefined,
    req: Request
  ) {
    // Use HTTPS in production, detect protocol properly
    const protocol =
      process.env.OAUTH_PROTOCOL ||
      (process.env.NODE_ENV === 'production' ? 'https' : req.protocol);
    const defaultRedirectUri = `${protocol}://${req.get('host')}/oauth/gmail/callback`;

    const oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri || defaultRedirectUri
    );

    try {
      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.refresh_token) {
        throw new AppError('No refresh token received. Please revoke access and try again.', 400);
      }

      // Get user info to verify the connection
      oauth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      return {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiryDate: tokens.expiry_date,
        tokenType: tokens.token_type,
        scope: tokens.scope,
        userInfo: {
          emailAddress: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal,
          threadsTotal: profile.data.threadsTotal,
        },
      };
    } catch (error: any) {
      console.error('OAuth token exchange error:', error);
      throw new AppError(error.message || 'Failed to exchange authorization code for tokens', 400);
    }
  }

  /**
   * Handle Gmail OAuth2 callback
   */
  async handleGmailCallback(code: string, state: string, req: Request): Promise<string> {
    // Verify state parameter (CSRF protection)
    const stateData = oauthStates.get(state);
    if (!stateData) {
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      const defaultReturnUrl = `${frontendUrl}/workflows`;
      const urlObj = new URL(defaultReturnUrl);
      urlObj.searchParams.set('credential', 'error');
      urlObj.searchParams.set('message', 'Invalid or expired state parameter');
      return urlObj.toString();
    }

    // Extract data from state
    const { userId, credentialName, clientId, clientSecret, returnUrl } = stateData;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
    const defaultReturnUrl = `${frontendUrl}/workflows`;

    try {
      // Use HTTPS in production, detect protocol properly
      const protocol =
        process.env.OAUTH_PROTOCOL ||
        (process.env.NODE_ENV === 'production' ? 'https' : req.protocol);
      const redirectUri = `${protocol}://${req.get('host')}/oauth/gmail/callback`;

      const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);

      // Exchange authorization code for tokens
      const { tokens } = await oauth2Client.getToken(code);

      if (!tokens.refresh_token) {
        throw new Error('No refresh token received. Please revoke access and try again.');
      }

      // Get user profile to verify connection
      oauth2Client.setCredentials(tokens);
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      // Create and save credential
      const credential = await this.credentialRepository.create({
        name: credentialName,
        type: 'oauth2',
        userId: userId,
        integration: 'gmailOAuth2',
        data: {
          clientId,
          clientSecret,
          refreshToken: tokens.refresh_token,
          accessToken: tokens.access_token,
          expiryDate: tokens.expiry_date,
          tokenType: tokens.token_type,
          scope: tokens.scope,
        },
        expiresAt: tokens.expiry_date ? new Date(tokens.expiry_date) : undefined,
        isValid: true,
        lastTestedAt: new Date(),
        metadata: {
          emailAddress: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal,
          threadsTotal: profile.data.threadsTotal,
        },
      });

      // Clean up state
      oauthStates.delete(state);

      // Redirect to frontend with success - use the stored returnUrl or fallback to workflows
      const finalReturnUrl = returnUrl || defaultReturnUrl;

      // Parse URL to add query parameters correctly
      const urlObj = new URL(finalReturnUrl);
      urlObj.searchParams.set('credential', 'success');
      urlObj.searchParams.set('id', credential._id.toString());
      urlObj.searchParams.set('name', credentialName);

      return urlObj.toString();
    } catch (error: any) {
      console.error('OAuth callback error:', error);

      // Clean up state on error
      oauthStates.delete(state);

      const finalReturnUrl = returnUrl || defaultReturnUrl;

      // Parse URL to add query parameters correctly
      const urlObj = new URL(finalReturnUrl);
      urlObj.searchParams.set('credential', 'error');
      urlObj.searchParams.set('message', error.message || 'Failed to complete OAuth flow');

      return urlObj.toString();
    }
  }

  /**
   * Refresh Gmail access token
   */
  async refreshGmailToken(refreshToken: string, clientId: string, clientSecret: string) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    try {
      const { credentials } = await oauth2Client.refreshAccessToken();

      return {
        accessToken: credentials.access_token,
        expiryDate: credentials.expiry_date,
        tokenType: credentials.token_type,
        scope: credentials.scope,
      };
    } catch (error: any) {
      console.error('Token refresh error:', error);
      throw new AppError(error.message || 'Failed to refresh access token', 400);
    }
  }

  /**
   * Test Gmail connection with credentials
   */
  async testGmailConnection(clientId: string, clientSecret: string, refreshToken: string) {
    const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);

    oauth2Client.setCredentials({
      refresh_token: refreshToken,
    });

    try {
      // Refresh the access token
      await oauth2Client.refreshAccessToken();

      // Test Gmail API access
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });

      // Test basic functionality by listing a few messages
      const messages = await gmail.users.messages.list({
        userId: 'me',
        maxResults: 1,
      });

      return {
        connected: true,
        userInfo: {
          emailAddress: profile.data.emailAddress,
          messagesTotal: profile.data.messagesTotal,
          threadsTotal: profile.data.threadsTotal,
        },
        testResults: {
          canReadMessages: messages.data.messages ? messages.data.messages.length >= 0 : false,
          messageCount: messages.data.resultSizeEstimate || 0,
        },
      };
    } catch (error: any) {
      console.error('Gmail connection test error:', error);

      return {
        connected: false,
        error: error.message || 'Connection test failed',
      };
    }
  }
}
