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
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          styleSrc: ["'self'", "'unsafe-inline'"],
          scriptSrc: ["'self'"],
          imgSrc: ["'self'", 'data:', 'https:'],
        },
      },
    }));

    // CORS
    this.app.use(cors({
      origin: config.cors.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Request-ID'],
    }));

    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging
    this.app.use(RequestLogger.log());
