export interface BasicAuthOptions {
  realm?: string;
  validateCredentials: (username: string, password: string) => Promise<any>;
}

export class BasicAuthStrategy {
  private options: BasicAuthOptions;

  constructor(options: BasicAuthOptions) {
    this.options = {
      realm: options.realm || 'Protected',
      validateCredentials: options.validateCredentials,
    };
  }

  async authenticate(request: any): Promise<any> {
    const credentials = this.extractCredentials(request);

    if (!credentials) {
      throw new Error('No credentials provided');
    }

    const result = await this.options.validateCredentials(
      credentials.username,
      credentials.password
    );

    if (!result) {
      throw new Error('Invalid credentials');
    }

    return result;
  }

  private extractCredentials(request: any): { username: string; password: string } | null {
    const authHeader = request.headers?.authorization;

    if (!authHeader || !authHeader.startsWith('Basic ')) {
      return null;
    }

    const base64Credentials = authHeader.substring(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf-8');
    const [username, password] = credentials.split(':');

    if (!username || !password) {
      return null;
    }

    return { username, password };
  }

  getChallenge(): string {
    return `Basic realm="${this.options.realm}"`;
  }
}
