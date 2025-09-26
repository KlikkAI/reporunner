import { Request, Response, NextFunction } from 'express';
import { SecurityHeadersMiddleware } from '../SecurityHeadersMiddleware';
import { CSPBuilder } from '../builders/CSPBuilder';
import { HSTSBuilder } from '../builders/HSTSBuilder';

describe('SecurityHeadersMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;
  let headers: Record<string, string>;

  beforeEach(() => {
    headers = {};
    req = {
      secure: true
    };
    res = {
      setHeader: jest.fn((name: string, value: string) => {
        headers[name] = value;
      }),
      removeHeader: jest.fn((name: string) => {
        delete headers[name];
      })
    };
    next = jest.fn();
  });

  describe('Default Configuration', () => {
    let middleware: SecurityHeadersMiddleware;

    beforeEach(() => {
      middleware = new SecurityHeadersMiddleware();
    });

    it('should apply default security headers', async () => {
      await middleware.handle(req as Request, res as Response, next);

      expect(headers).toMatchObject({
        'Content-Security-Policy': expect.any(String),
        'Strict-Transport-Security': expect.any(String),
        'X-Frame-Options': 'DENY',
        'X-Content-Type-Options': 'nosniff',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
      });

      expect(next).toHaveBeenCalled();
    });

    it('should remove dangerous headers', async () => {
      headers['X-Powered-By'] = 'Express';
      headers['Server'] = 'NodeJS';

      await middleware.handle(req as Request, res as Response, next);

      expect(headers['X-Powered-By']).toBeUndefined();
      expect(headers['Server']).toBeUndefined();
    });
  });

  describe('Content Security Policy', () => {
    it('should apply custom CSP directives', async () => {
      const middleware = new SecurityHeadersMiddleware({
        csp: {
          enabled: true,
          directives: {
            'default-src': ["'self'"],
            'script-src': ["'self'", "'unsafe-inline'"],
            'style-src': ["'self'", "'unsafe-inline'"],
          }
        }
      });

      await middleware.handle(req as Request, res as Response, next);

      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
      expect(headers['Content-Security-Policy']).toContain("script-src 'self' 'unsafe-inline'");
      expect(headers['Content-Security-Policy']).toContain("style-src 'self' 'unsafe-inline'");
    });

    it('should apply report-only mode', async () => {
      const middleware = new SecurityHeadersMiddleware({
        csp: {
          enabled: true,
          reportOnly: true,
          directives: {
            'default-src': ["'self'"]
          },
          reportUri: '/csp-report'
        }
      });

      await middleware.handle(req as Request, res as Response, next);

      expect(headers['Content-Security-Policy-Report-Only']).toBeDefined();
      expect(headers['Content-Security-Policy-Report-Only']).toContain('report-uri /csp-report');
      expect(headers['Content-Security-Policy']).toBeUndefined();
    });
  });

  describe('HTTP Strict Transport Security', () => {
    it('should apply HSTS header on secure connections', async () => {
      const middleware = new SecurityHeadersMiddleware({
        hsts: {
          enabled: true,
          maxAge: 31536000,
          includeSubDomains: true,
          preload: true
        }
      });

      await middleware.handle(req as Request, res as Response, next);

      expect(headers['Strict-Transport-Security'])
        .toBe('max-age=31536000; includeSubDomains; preload');
    });

    it('should not apply HSTS header on non-secure connections', async () => {
      const middleware = new SecurityHeadersMiddleware({
        hsts: {
          enabled: true
        }
      });

      req.secure = false;
      await middleware.handle(req as Request, res as Response, next);

      expect(headers['Strict-Transport-Security']).toBeUndefined();
    });
  });

  describe('Frame Protection', () => {
    it('should apply X-Frame-Options header with custom action', async () => {
      const middleware = new SecurityHeadersMiddleware({
        frameOptions: {
          enabled: true,
          action: 'SAMEORIGIN'
        }
      });

      await middleware.handle(req as Request, res as Response, next);

      expect(headers['X-Frame-Options']).toBe('SAMEORIGIN');
    });
  });

  describe('Error Handling', () => {
    it('should handle CSP builder errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const cspError = new Error('Invalid CSP directive');
      
      jest.spyOn(CSPBuilder.prototype, 'build')
        .mockImplementation(() => { throw cspError; });

      const middleware = new SecurityHeadersMiddleware({
        csp: {
          enabled: true,
          directives: {
            'default-src': ["'self'"]
          }
        }
      });

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });

    it('should handle HSTS builder errors', async () => {
      const errorSpy = jest.spyOn(console, 'error').mockImplementation();
      const hstsError = new Error('Invalid HSTS config');
      
      jest.spyOn(HSTSBuilder.prototype, 'build')
        .mockImplementation(() => { throw hstsError; });

      const middleware = new SecurityHeadersMiddleware({
        hsts: {
          enabled: true,
          maxAge: -1 // Invalid value
        }
      });

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(Error));
      expect(errorSpy).toHaveBeenCalled();

      errorSpy.mockRestore();
    });
  });

  describe('Dynamic Configuration', () => {
    it('should allow runtime header updates', async () => {
      const middleware = new SecurityHeadersMiddleware();
      const updatedCSP = CSPBuilder.withSecureDefaults()
        .addDirective('script-src', ["'self'", "'unsafe-inline'"]);

      middleware.updateCSP(updatedCSP);

      await middleware.handle(req as Request, res as Response, next);

      expect(headers['Content-Security-Policy'])
        .toContain("script-src 'self' 'unsafe-inline'");
    });

    it('should handle conditional headers based on request', async () => {
      const middleware = new SecurityHeadersMiddleware({
        csp: {
          enabled: true,
          directives: {
            'default-src': ["'self'"]
          }
        }
      });

      // Test API request
      req.path = '/api';
      await middleware.handle(req as Request, res as Response, next);
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");

      // Test static content request
      req.path = '/static';
      await middleware.handle(req as Request, res as Response, next);
      expect(headers['Content-Security-Policy']).toContain("default-src 'self'");
    });
  });
});