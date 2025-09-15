/**
 * OAuth domain interfaces
 */

export interface IOAuthProvider {
  id: string;
  name: string;
  authUrl: string;
  tokenUrl: string;
  scopes: string[];
}

export interface IOAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date;
  tokenType: string;
  scope?: string;
}

export interface IOAuthInitiateRequest {
  provider: string;
  credentialName: string;
  redirectUri?: string;
}

export interface IOAuthCallbackRequest {
  code: string;
  state: string;
  credentialName: string;
}

export interface IGmailMessage {
  id: string;
  threadId: string;
  snippet: string;
  payload: {
    headers: Array<{ name: string; value: string }>;
    body?: {
      data?: string;
      size: number;
    };
    parts?: any[];
  };
  internalDate: string;
  labelIds: string[];
}

export interface IGmailSendRequest {
  to: string;
  subject: string;
  body: string;
  cc?: string;
  bcc?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    contentType: string;
  }>;
}