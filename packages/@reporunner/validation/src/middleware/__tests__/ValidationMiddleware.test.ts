import { Request, Response, NextFunction } from 'express';
import { ValidationMiddleware } from '../ValidationMiddleware';
import { ValidationError } from '../errors/ValidationError';
import { ValidationContext } from '../context/ValidationContext';
import { RequireAuthRule, RequireRolesRule, RateLimitRule, RequestSizeRule, ContentTypeRule, MethodRule, CORSRule } from '../rules/CommonRules';

describe('ValidationMiddleware', () => {
  let req: Partial<Request>;
  let res: Partial<Response>;
  let next: jest.MockedFunction<NextFunction>;

  beforeEach(() => {
    req = {
      method: 'POST',
      path: '/test',
      headers: {
        'content-type': 'application/json'
      },
      query: {},
      body: {},
      params: {},
      cookies: {},
      ip: '127.0.0.1'
    };

    res = {
      setHeader: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      end: jest.fn()
    };

    next = jest.fn();
  });

  describe('Basic Validation', () => {
    it('should pass validation when schema is valid', async () => {
      const schema = {
        body: {
          name: {
            type: 'string',
            required: true,
            minLength: 2
          },
          age: {
            type: 'number',
            min: 0,
            max: 120
          }
        }
      };

      req.body = {
        name: 'John',
        age: 30
      };

      const middleware = new ValidationMiddleware(schema);
      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail validation when schema is invalid', async () => {
      const schema = {
        body: {
          name: {
            type: 'string',
            required: true,
            minLength: 2
          },
          age: {
            type: 'number',
            min: 0,
            max: 120
          }
        }
      };

      req.body = {
        name: 'J', // Too short
        age: -1 // Below min
      };

      const middleware = new ValidationMiddleware(schema);
      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details).toHaveLength(2);
    });
  });

  describe('Authentication Rules', () => {
    it('should pass when authenticated', async () => {
      (req as any).isAuthenticated = () => true;

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new RequireAuthRule());

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail when not authenticated', async () => {
      (req as any).isAuthenticated = () => false;

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new RequireAuthRule());

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].code).toBe('UNAUTHORIZED');
    });
  });

  describe('Role-Based Rules', () => {
    it('should pass when user has required role', async () => {
      (req as any).user = { roles: ['admin'] };

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new RequireRolesRule('admin'));

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail when user lacks required role', async () => {
      (req as any).user = { roles: ['user'] };

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new RequireRolesRule('admin'));

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].code).toBe('FORBIDDEN');
    });
  });

  describe('Rate Limiting', () => {
    it('should pass when under limit', async () => {
      const middleware = new ValidationMiddleware({});
      const rateLimit = new RateLimitRule(5, 1000); // 5 requests per second
      middleware.addRule(rateLimit);

      for (let i = 0; i < 5; i++) {
        await middleware.handle(req as Request, res as Response, next);
      }

      expect(next).toHaveBeenCalledTimes(5);
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail when over limit', async () => {
      const middleware = new ValidationMiddleware({});
      const rateLimit = new RateLimitRule(5, 1000); // 5 requests per second
      middleware.addRule(rateLimit);

      // Make 6 requests
      for (let i = 0; i < 6; i++) {
        await middleware.handle(req as Request, res as Response, next);
      }

      expect(next).toHaveBeenLastCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[5][0] as ValidationError;
      expect(error.details[0].code).toBe('RATE_LIMIT_EXCEEDED');
    });
  });

  describe('Request Size', () => {
    it('should pass for small requests', async () => {
      req.headers['content-length'] = '1000';

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new RequestSizeRule(5000)); // 5KB limit

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail for large requests', async () => {
      req.headers['content-length'] = '10000';

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new RequestSizeRule(5000)); // 5KB limit

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].code).toBe('REQUEST_TOO_LARGE');
    });
  });

  describe('Content Type', () => {
    it('should pass for allowed content types', async () => {
      req.headers['content-type'] = 'application/json';

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new ContentTypeRule(['application/json']));

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail for disallowed content types', async () => {
      req.headers['content-type'] = 'text/plain';

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new ContentTypeRule(['application/json']));

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].code).toBe('INVALID_CONTENT_TYPE');
    });
  });

  describe('HTTP Methods', () => {
    it('should pass for allowed methods', async () => {
      req.method = 'POST';

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new MethodRule(['POST', 'PUT']));

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should fail for disallowed methods', async () => {
      req.method = 'DELETE';

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new MethodRule(['POST', 'PUT']));

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].code).toBe('METHOD_NOT_ALLOWED');
    });
  });

  describe('CORS', () => {
    it('should pass for allowed origins', async () => {
      req.headers.origin = 'https://example.com';

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new CORSRule({
        origins: ['https://example.com']
      }));

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Origin',
        'https://example.com'
      );
    });

    it('should fail for disallowed origins', async () => {
      req.headers.origin = 'https://evil.com';

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new CORSRule({
        origins: ['https://example.com']
      }));

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].code).toBe('CORS_ORIGIN_NOT_ALLOWED');
    });

    it('should handle preflight requests', async () => {
      req.method = 'OPTIONS';
      req.headers.origin = 'https://example.com';

      const middleware = new ValidationMiddleware({});
      middleware.addRule(new CORSRule({
        origins: ['https://example.com'],
        methods: ['POST', 'PUT'],
        headers: ['Content-Type']
      }));

      await middleware.handle(req as Request, res as Response, next);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Methods',
        'POST, PUT'
      );
      expect(res.setHeader).toHaveBeenCalledWith(
        'Access-Control-Allow-Headers',
        'Content-Type'
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle multiple errors', async () => {
      const schema = {
        body: {
          name: {
            type: 'string',
            required: true,
            minLength: 2
          },
          age: {
            type: 'number',
            min: 0
          }
        }
      };

      req.body = {
        name: 'J',
        age: -1
      };

      const middleware = new ValidationMiddleware(schema, {
        abortEarly: false
      });

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details).toHaveLength(2);
    });

    it('should stop on first error when abortEarly is true', async () => {
      const schema = {
        body: {
          name: {
            type: 'string',
            required: true,
            minLength: 2
          },
          age: {
            type: 'number',
            min: 0
          }
        }
      };

      req.body = {
        name: 'J',
        age: -1
      };

      const middleware = new ValidationMiddleware(schema, {
        abortEarly: true
      });

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details).toHaveLength(1);
    });

    it('should handle custom error messages', async () => {
      const schema = {
        body: {
          name: {
            type: 'string',
            required: true,
            minLength: 2,
            message: 'Name is too short'
          }
        }
      };

      req.body = {
        name: 'J'
      };

      const middleware = new ValidationMiddleware(schema);
      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].message).toBe('Name is too short');
    });
  });

  describe('Custom Rules', () => {
    it('should handle custom validation rules', async () => {
      const customRule = {
        name: 'custom',
        validate: async (context: ValidationContext) => {
          const body = context.getBody();
          if (body.custom !== 'valid') {
            return {
              valid: false,
              errors: [{
                path: 'custom',
                message: 'Invalid custom value',
                code: 'CUSTOM_ERROR'
              }]
            };
          }
          return { valid: true, errors: [] };
        }
      };

      req.body = {
        custom: 'invalid'
      };

      const middleware = new ValidationMiddleware({});
      middleware.addRule(customRule);

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].code).toBe('CUSTOM_ERROR');
    });

    it('should handle async validation rules', async () => {
      const asyncRule = {
        name: 'async',
        validate: async (context: ValidationContext) => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return { valid: true, errors: [] };
        }
      };

      const middleware = new ValidationMiddleware({});
      middleware.addRule(asyncRule);

      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });
  });

  describe('Data Transformation', () => {
    it('should transform data according to schema', async () => {
      const schema = {
        body: {
          name: {
            type: 'string',
            transform: (value: string) => value.trim().toLowerCase()
          }
        }
      };

      req.body = {
        name: '  John Doe  '
      };

      const middleware = new ValidationMiddleware(schema);
      await middleware.handle(req as Request, res as Response, next);

      expect(req.body.name).toBe('john doe');
    });

    it('should apply sanitization', async () => {
      const schema = {
        body: {
          name: {
            type: 'string',
            sanitize: {
              trim: true,
              escape: true
            }
          }
        }
      };

      req.body = {
        name: '  <script>alert("xss")</script>  '
      };

      const middleware = new ValidationMiddleware(schema);
      await middleware.handle(req as Request, res as Response, next);

      expect(req.body.name).toBe('&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;');
    });
  });

  describe('Schema Features', () => {
    it('should handle nested objects', async () => {
      const schema = {
        body: {
          user: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
                required: true
              },
              address: {
                type: 'object',
                properties: {
                  street: {
                    type: 'string',
                    required: true
                  }
                }
              }
            }
          }
        }
      };

      req.body = {
        user: {
          name: 'John',
          address: {}
        }
      };

      const middleware = new ValidationMiddleware(schema);
      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].path).toBe('user.address.street');
    });

    it('should handle arrays', async () => {
      const schema = {
        body: {
          tags: {
            type: 'array',
            items: {
              type: 'string',
              minLength: 2
            }
          }
        }
      };

      req.body = {
        tags: ['ok', 'a']
      };

      const middleware = new ValidationMiddleware(schema);
      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalledWith(expect.any(ValidationError));
      const error = next.mock.calls[0][0] as ValidationError;
      expect(error.details[0].path).toBe('tags[1]');
    });

    it('should handle optional fields', async () => {
      const schema = {
        body: {
          name: {
            type: 'string',
            required: true
          },
          age: {
            type: 'number'
          }
        }
      };

      req.body = {
        name: 'John'
      };

      const middleware = new ValidationMiddleware(schema);
      await middleware.handle(req as Request, res as Response, next);

      expect(next).toHaveBeenCalled();
      expect(next).not.toHaveBeenCalledWith(expect.any(Error));
    });

    it('should handle default values', async () => {
      const schema = {
        body: {
          name: {
            type: 'string',
            required: true
          },
          age: {
            type: 'number',
            default: 18
          }
        }
      };

      req.body = {
        name: 'John'
      };

      const middleware = new ValidationMiddleware(schema);
      await middleware.handle(req as Request, res as Response, next);

      expect(req.body.age).toBe(18);
    });
  });
});