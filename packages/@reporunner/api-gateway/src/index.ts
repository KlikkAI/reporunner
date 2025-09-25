import express, { Application, Request, Response, NextFunction } from 'express';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import { logger } from '@reporunner/shared/utils/logger';
import { ServiceRegistry } from './service-registry';
import { CircuitBreaker } from './circuit-breaker';
import { LoadBalancer } from './load-balancer';
import { RequestLogger } from './middleware/request-logger';
import { AuthMiddleware } from './middleware/auth';
import { ErrorHandler } from './middleware/error-handler';
import { HealthCheck } from './health-check';
import { MetricsCollector } from './metrics';
import { config } from './config';

interface ServiceConfig {
  name: string;
  path: string;
  target?: string;
  instances?: string[];
  healthCheck?: string;
  timeout?: number;
  retries?: number;
  circuitBreaker?: {
    threshold: number;
    timeout: number;
    resetTimeout: number;
  };
  rateLimit?: {
    windowMs: number;
    max: number;
  };
  auth?: boolean;
  cors?: boolean;
  cache?: {
    ttl: number;
    key?: (req: Request) => string;
  };
}

export class APIGateway {
  private app: Application;
  private serviceRegistry: ServiceRegistry;
  private loadBalancer: LoadBalancer;
  private circuitBreakers: Map<string, CircuitBreaker>;
  private metricsCollector: MetricsCollector;
  private redisClient: Redis;
  private services: Map<string, ServiceConfig>;

  constructor() {
    this.app = express();
    this.serviceRegistry = new ServiceRegistry(config.consul);
    this.loadBalancer = new LoadBalancer();
    this.circuitBreakers = new Map();
    this.metricsCollector = new MetricsCollector();
    this.redisClient = new Redis(config.redis);
    this.services = new Map();

    this.setupMiddleware();
    this.registerServices();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  private setupMiddleware(): void {
    // Security
    this.app.use(
      helmet({
        contentSecurityPolicy: {
          directives: {
            defaultSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            scriptSrc: ["'self'"],
            imgSrc: ["'self'", 'data:', 'https:'],
          },
        },
      })
    );

    // CORS
    this.app.use(
      cors({
        origin: config.cors.allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
      })
    );

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(RequestLogger.log());

    // Metrics collection
    this.app.use(this.metricsCollector.middleware());

    // Global rate limiting
    const globalLimiter = rateLimit({
      store: new RedisStore({
        client: this.redisClient,
        prefix: 'global_limit:',
      }),
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 1000, // limit each IP to 1000 requests per windowMs
      message: 'Too many requests from this IP',
      standardHeaders: true,
      legacyHeaders: false,
    });
    this.app.use(globalLimiter);
  }

  private registerServices(): void {
    // Register microservices
    const services: ServiceConfig[] = [
      {
        name: 'tenant-service',
        path: '/api/v1/tenants',
        healthCheck: '/health',
        timeout: 30000,
        retries: 3,
        auth: true,
        circuitBreaker: {
          threshold: 5,
          timeout: 60000,
          resetTimeout: 30000,
        },
        rateLimit: {
          windowMs: 60000,
          max: 100,
        },
      },
      {
        name: 'workflow-service',
        path: '/api/v1/workflows',
        healthCheck: '/health',
        timeout: 30000,
        retries: 3,
        auth: true,
        cache: {
          ttl: 300,
          key: (req) => `workflow:${req.params.id || 'list'}`,
        },
      },
      {
        name: 'execution-service',
        path: '/api/v1/executions',
        healthCheck: '/health',
        timeout: 120000, // Longer timeout for executions
        retries: 1,
        auth: true,
      },
      {
        name: 'notification-service',
        path: '/api/v1/notifications',
        healthCheck: '/health',
        timeout: 10000,
        retries: 3,
        auth: true,
      },
      {
        name: 'analytics-service',
        path: '/api/v1/analytics',
        healthCheck: '/health',
        timeout: 60000,
        retries: 2,
        auth: true,
        cache: {
          ttl: 600,
          key: (req) => `analytics:${req.query.metric || 'default'}`,
        },
      },
      {
        name: 'audit-service',
        path: '/api/v1/audit',
        healthCheck: '/health',
        timeout: 30000,
        retries: 2,
        auth: true,
      },
    ];

    services.forEach((service) => {
      this.services.set(service.name, service);
      this.setupServiceProxy(service);
    });
  }

  private setupServiceProxy(service: ServiceConfig): void {
    // Create circuit breaker for service
    if (service.circuitBreaker) {
      this.circuitBreakers.set(
        service.name,
        new CircuitBreaker(service.name, service.circuitBreaker)
      );
    }

    // Create rate limiter for service
    let serviceLimiter: any;
    if (service.rateLimit) {
      serviceLimiter = rateLimit({
        store: new RedisStore({
          client: this.redisClient,
          prefix: `${service.name}_limit:`,
        }),
        windowMs: service.rateLimit.windowMs,
        max: service.rateLimit.max,
        message: `Too many requests to ${service.name}`,
        keyGenerator: (req) => {
          // Rate limit per user or IP
          return req.user?.id || req.ip;
        },
      });
    }

    // Create proxy middleware
    const proxyMiddleware = async (req: Request, res: Response, next: NextFunction) => {
      try {
        // Get service instances from registry
        const instances = await this.serviceRegistry.getServiceInstances(service.name);

        if (!instances || instances.length === 0) {
          throw new Error(`No healthy instances found for ${service.name}`);
        }

        // Select instance using load balancer
        const instance = this.loadBalancer.selectInstance(service.name, instances);

        // Check circuit breaker
        const circuitBreaker = this.circuitBreakers.get(service.name);
        if (circuitBreaker && !circuitBreaker.canRequest()) {
          throw new Error(`Circuit breaker open for ${service.name}`);
        }

        // Check cache
        if (service.cache && req.method === 'GET') {
          const cacheKey = service.cache.key ? service.cache.key(req) : req.originalUrl;
          const cached = await this.redisClient.get(cacheKey);

          if (cached) {
            logger.debug(`Cache hit for ${cacheKey}`);
            res.setHeader('X-Cache', 'HIT');
            return res.json(JSON.parse(cached));
          }
        }

        // Create proxy options
        const proxyOptions: Options = {
          target: `http://${instance.address}:${instance.port}`,
          changeOrigin: true,
          timeout: service.timeout || 30000,
          proxyTimeout: service.timeout || 30000,
          onProxyReq: (proxyReq, req: any) => {
            // Add tracing headers
            proxyReq.setHeader('X-Request-ID', req.id || 'unknown');
            proxyReq.setHeader('X-Forwarded-For', req.ip);
            proxyReq.setHeader('X-Forwarded-Host', req.hostname);
            proxyReq.setHeader('X-Service-Name', service.name);

            // Forward user context
            if (req.user) {
              proxyReq.setHeader('X-User-ID', req.user.id);
              proxyReq.setHeader('X-Tenant-ID', req.user.tenantId);
            }
          },
          onProxyRes: async (proxyRes, req: any, res: any) => {
            // Record metrics
            this.metricsCollector.recordRequest(service.name, proxyRes.statusCode);

            // Update circuit breaker
            if (circuitBreaker) {
              if (proxyRes.statusCode >= 500) {
                circuitBreaker.recordFailure();
              } else {
                circuitBreaker.recordSuccess();
              }
            }

            // Cache successful GET responses
            if (service.cache && req.method === 'GET' && proxyRes.statusCode === 200) {
              const cacheKey = service.cache.key ? service.cache.key(req) : req.originalUrl;

              let body = '';
              proxyRes.on('data', (chunk) => {
                body += chunk;
              });

              proxyRes.on('end', async () => {
                try {
                  await this.redisClient.setex(cacheKey, service.cache!.ttl, body);
                  logger.debug(`Cached response for ${cacheKey}`);
                } catch (error) {
                  logger.error('Failed to cache response', error);
                }
              });
            }

            // Add response headers
            res.setHeader('X-Service-Name', service.name);
            res.setHeader('X-Response-Time', Date.now() - req.startTime);
            res.setHeader('X-Cache', 'MISS');
          },
          onError: (err, req, res: any) => {
            logger.error(`Proxy error for ${service.name}`, err);

            // Update circuit breaker
            if (circuitBreaker) {
              circuitBreaker.recordFailure();
            }

            // Retry logic
            if (service.retries && req.retryCount < service.retries) {
              req.retryCount = (req.retryCount || 0) + 1;
              logger.info(`Retrying request to ${service.name} (attempt ${req.retryCount})`);
              return proxyMiddleware(req, res, next);
            }

            res.status(503).json({
              error: 'Service Unavailable',
              message: `Failed to reach ${service.name}`,
              service: service.name,
            });
          },
        };

        // Create and use proxy
        const proxy = createProxyMiddleware(proxyOptions);
        proxy(req, res, next);
      } catch (error) {
        logger.error(`Failed to proxy request to ${service.name}`, error);
        next(error);
      }
    };

    // Setup route with middleware
    const middlewares: any[] = [];

    // Add auth middleware if required
    if (service.auth) {
      middlewares.push(AuthMiddleware.authenticate());
    }

    // Add rate limiter if configured
    if (serviceLimiter) {
      middlewares.push(serviceLimiter);
    }

    // Add proxy middleware
    middlewares.push(proxyMiddleware);

    // Register route
    this.app.use(service.path, ...middlewares);

    logger.info(`Registered service: ${service.name} at ${service.path}`);
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/health', async (req: Request, res: Response) => {
      const health = await this.checkHealth();
      const statusCode = health.status === 'healthy' ? 200 : 503;
      res.status(statusCode).json(health);
    });

    // Metrics endpoint
    this.app.get('/metrics', (req: Request, res: Response) => {
      res.json(this.metricsCollector.getMetrics());
    });

    // Service discovery endpoint
    this.app.get('/services', async (req: Request, res: Response) => {
      const services = await this.serviceRegistry.getAllServices();
      res.json(services);
    });

    // Circuit breaker status
    this.app.get('/circuit-breakers', (req: Request, res: Response) => {
      const status: any = {};
      this.circuitBreakers.forEach((cb, name) => {
        status[name] = cb.getStatus();
      });
      res.json(status);
    });
  }

  private setupErrorHandling(): void {
    this.app.use(ErrorHandler.handle());
  }

  private async checkHealth(): Promise<any> {
    const health: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {},
    };

    for (const [name, service] of this.services) {
      try {
        const instances = await this.serviceRegistry.getServiceInstances(name);
        const healthyInstances = instances.filter((i) => i.status === 'healthy');

        health.services[name] = {
          healthy: healthyInstances.length,
          total: instances.length,
          status: healthyInstances.length > 0 ? 'up' : 'down',
        };

        if (healthyInstances.length === 0) {
          health.status = 'degraded';
        }
      } catch (error) {
        health.services[name] = {
          status: 'unknown',
          error: error.message,
        };
        health.status = 'degraded';
      }
    }

    return health;
  }

  async start(port: number = 3000): Promise<void> {
    // Initialize service registry
    await this.serviceRegistry.connect();

    // Start health check monitoring
    setInterval(async () => {
      await this.monitorServices();
    }, 30000); // Check every 30 seconds

    // Start server
    this.app.listen(port, () => {
      logger.info(`API Gateway listening on port ${port}`);
    });
  }

  private async monitorServices(): Promise<void> {
    for (const [name, service] of this.services) {
      try {
        const instances = await this.serviceRegistry.getServiceInstances(name);
        logger.debug(`Service ${name}: ${instances.length} instances`);
      } catch (error) {
        logger.error(`Failed to monitor service ${name}`, error);
      }
    }
  }
}

// Start the API Gateway
if (require.main === module) {
  const gateway = new APIGateway();
  const port = parseInt(process.env.GATEWAY_PORT || '3000');

  gateway.start(port).catch((error) => {
    logger.error('Failed to start API Gateway', error);
    process.exit(1);
  });
}

export default APIGateway;
