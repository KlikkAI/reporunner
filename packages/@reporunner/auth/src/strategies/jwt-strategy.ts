import jwt from 'jsonwebtoken';

export interface JWTStrategyOptions {
  secret: string;
  algorithms?: jwt.Algorithm[];
  issuer?: string;
  audience?: string;
}

export class JWTStrategy {
  private options: JWTStrategyOptions;

  constructor(options: JWTStrategyOptions) {
    this.options = options;
  }

  async verify(token: string): Promise<any> {
    try {
      return jwt.verify(token, this.options.secret, {
        algorithms: this.options.algorithms || ['HS256'],
        issuer: this.options.issuer,
        audience: this.options.audience,
      });
    } catch (error) {
      throw new Error('Invalid token');
    }
  }

  sign(payload: any, expiresIn?: string): string {
    return jwt.sign(payload, this.options.secret, {
      algorithm: (this.options.algorithms || ['HS256'])[0],
      issuer: this.options.issuer,
      audience: this.options.audience,
      expiresIn: expiresIn || '1h',
    });
  }

  decode(token: string): any {
    return jwt.decode(token);
  }
}