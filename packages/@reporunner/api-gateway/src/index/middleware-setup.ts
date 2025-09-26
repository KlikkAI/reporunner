import { logger } from '@reporunner/shared/utils/logger';
import compression from 'compression';
import cors from 'cors';
import express, { type Application, NextFunction, type Request, Response } from 'express';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import { createProxyMiddleware, Options } from 'http-proxy-middleware';
import { Redis } from 'ioredis';
import jwt from 'jsonwebtoken';
import RedisStore from 'rate-limit-redis';
import type { CircuitBreaker } from './circuit-breaker';
import { config } from './config';
import { HealthCheck } from './health-check';
import { LoadBalancer } from './load-balancer';
import { MetricsCollector } from './metrics';
import { AuthMiddleware } from './middleware/auth';
import { ErrorHandler } from './middleware/error-handler';
import { RequestLogger } from './middleware/request-logger';
import { ServiceRegistry } from './service-registry';

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
