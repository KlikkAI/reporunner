export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl: string;
  scope: string[];
}

export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresIn?: number;
  tokenType: string;
}

export interface OAuthUserInfo {
  id: string;
  email: string;
  name?: string;
  picture?: string;
  [key: string]: any;
}

export abstract class OAuthProvider {
  protected config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  abstract getName(): string;

  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scope.join(' '),
      response_type: 'code',
      state,
    });

    return `${this.config.authorizationUrl}?${params}`;
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const response = await fetch(this.config.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        redirect_uri: this.config.redirectUri,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to exchange code for tokens');
    }

    const data = await response.json();
    
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresIn: data.expires_in,
      tokenType: data.token_type,
    };
  }

  async getUserInfo(accessToken: string): Promise<OAuthUserInfo> {
    const response = await fetch(this.config.userInfoUrl, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch user info');
    }

    return response.json();
  }

  abstract mapUserInfo(userInfo: any): OAuthUserInfo;
}

export class GoogleOAuthProvider extends OAuthProvider {
  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    super({
      clientId,
      clientSecret,
      redirectUri,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      userInfoUrl: 'https://www.googleapis.com/oauth2/v2/userinfo',
      scope: ['openid', 'email', 'profile'],
    });
  }

  getName(): string {
    return 'google';
  }

  mapUserInfo(userInfo: any): OAuthUserInfo {
    return {
      id: userInfo.id,
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.picture,
    };
  }
}

export class GitHubOAuthProvider extends OAuthProvider {
  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    super({
      clientId,
      clientSecret,
      redirectUri,
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      userInfoUrl: 'https://api.github.com/user',
      scope: ['user:email'],
    });
  }

  getName(): string {
    return 'github';
  }

  mapUserInfo(userInfo: any): OAuthUserInfo {
    return {
      id: userInfo.id.toString(),
      email: userInfo.email,
      name: userInfo.name,
      picture: userInfo.avatar_url,
      username: userInfo.login,
    };
  }
}