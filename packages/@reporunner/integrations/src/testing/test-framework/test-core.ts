import { EventEmitter } from 'node:events';
import type { Server } from 'node:http';
import express, { type Express, type Request, type Response } from 'express';
import type {
  BaseIntegration,
  IntegrationConfig,
  IntegrationContext,
} from '../core/base-integration';

export interface MockServerConfig {
  port?: number;
  host?: string;
  basePath?: string;
  responseDelay?: number;
  errorRate?: number;
  logRequests?: boolean;
}

export interface MockResponse {
  status: number;
  body: any;
  headers?: Record<string, string>;
  delay?: number;
}

export interface RequestLog {
  method: string;
  path: string;
  headers: Record<string, string>;
  body?: any;
  query?: Record<string, string>;
  timestamp: Date;
}

export class MockServer extends EventEmitter {
  private app: Express;
  private server?: Server;
  private config: MockServerConfig;
  private responses: Map<string, MockResponse> = new Map();
  private requestLogs: RequestLog[] = [];
  private isRunning: boolean = false;

  constructor(config: MockServerConfig = {}) {
    super();
    this.config = {
      port: config.port || 3333,
      host: config.host || 'localhost',
      basePath: config.basePath || '',
      responseDelay: config.responseDelay || 0,
      errorRate: config.errorRate || 0,
      logRequests: config.logRequests !== false,
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));

    // Request logging middleware
    if (this.config.logRequests) {
      this.app.use((req: Request, _res: Response, next) => {
        const log: RequestLog = {
          method: req.method,
          path: req.path,
          headers: req.headers as Record<string, string>,
          body: req.body,
          query: req.query as Record<string, string>,
          timestamp: new Date(),
        };

        this.requestLogs.push(log);
        this.emit('request:logged', log);

        next();
      });
    }

    // Error simulation middleware
    if (this.config.errorRate && this.config.errorRate > 0) {
      this.app.use((_req: Request, res: Response, next) => {
        if (Math.random() < this.config.errorRate!) {
          return res.status(500).json({ error: 'Simulated server error' });
        }
        next();
      });
    }

    // Response delay middleware
    if (this.config.responseDelay && this.config.responseDelay > 0) {
      this.app.use((_req: Request, _res: Response, next) => {
        setTimeout(next, this.config.responseDelay);
      });
    }
