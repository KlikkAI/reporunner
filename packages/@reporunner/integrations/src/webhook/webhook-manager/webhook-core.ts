import crypto from 'node:crypto';
import { EventEmitter } from 'node:events';
import { type NextFunction, type Request, type Response, Router } from 'express';

export interface WebhookConfig {
  path: string;
  secret?: string;
  headers?: Record<string, string>;
  validateSignature?: boolean;
  signatureHeader?: string;
  signatureAlgorithm?: 'sha1' | 'sha256' | 'sha512';
  maxPayloadSize?: number;
  timeout?: number;
  retryOnError?: boolean;
  maxRetries?: number;
}

export interface WebhookRegistration {
  id: string;
  integrationName: string;
  config: WebhookConfig;
  handler: WebhookHandler;
  createdAt: Date;
  lastTriggered?: Date;
  triggerCount: number;
  status: 'active' | 'paused' | 'error';
  error?: string;
}

export interface WebhookEvent {
  id: string;
  webhookId: string;
  headers: Record<string, string>;
  body: any;
  query: Record<string, string>;
  timestamp: Date;
  signature?: string;
  verified: boolean;
  processed: boolean;
  error?: string;
}

export type WebhookHandler = (event: WebhookEvent) => Promise<any>;

export class WebhookManager extends EventEmitter {
  private webhooks: Map<string, WebhookRegistration> = new Map();
  private router: Router;
  private eventQueue: WebhookEvent[] = [];
  private processing: boolean = false;
  private maxQueueSize: number = 1000;

  constructor() {
    super();
    this.router = Router();
    this.setupMiddleware();
    this.startEventProcessor();
  }

  /**
   * Setup Express middleware
   */
  private setupMiddleware(): void {
    // Raw body parser for signature verification
    this.router.use((req: Request, _res: Response, next: NextFunction) => {
      const chunks: Buffer[] = [];

      req.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      req.on('end', () => {
        (req as any).rawBody = Buffer.concat(chunks);
        next();
      });
    });
  }

  /**
   * Register a webhook
   */
  registerWebhook(integrationName: string, config: WebhookConfig, handler: WebhookHandler): string {
    const id = this.generateWebhookId();

    const registration: WebhookRegistration = {
      id,
      integrationName,
      config,
      handler,
      createdAt: new Date(),
      triggerCount: 0,
      status: 'active',
    };

    this.webhooks.set(id, registration);

    // Setup route
    this.setupWebhookRoute(registration);

    this.emit('webhook:registered', { id, integrationName, path: config.path });
