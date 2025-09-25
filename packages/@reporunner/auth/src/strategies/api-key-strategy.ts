import * as crypto from 'node:crypto';

export interface APIKeyOptions {
  headerName?: string;
  queryParam?: string;
  validateKey: (apiKey: string) => Promise<any>;
}

export class APIKeyStrategy {
  private options: APIKeyOptions;

  constructor(options: APIKeyOptions) {
    this.options = {
      headerName: options.headerName || 'X-API-Key',
      queryParam: options.queryParam || 'apiKey',
      validateKey: options.validateKey,
    };
  }

  async authenticate(request: any): Promise<any> {
    const apiKey = this.extractAPIKey(request);
    
    if (!apiKey) {
      throw new Error('API key not provided');
    }

    const result = await this.options.validateKey(apiKey);
    
    if (!result) {
      throw new Error('Invalid API key');
    }

    return result;
  }

  private extractAPIKey(request: any): string | null {
    // Check header
    if (request.headers && request.headers[this.options.headerName!.toLowerCase()]) {
      return request.headers[this.options.headerName!.toLowerCase()];
    }

    // Check query parameter
    if (request.query && request.query[this.options.queryParam!]) {
      return request.query[this.options.queryParam!];
    }

    return null;
  }

  static generateAPIKey(prefix?: string): string {
    const key = crypto.randomBytes(32).toString('base64url');
    return prefix ? `${prefix}_${key}` : key;
  }

  static hashAPIKey(apiKey: string): string {
    return crypto.createHash('sha256').update(apiKey).digest('hex');
  }
}