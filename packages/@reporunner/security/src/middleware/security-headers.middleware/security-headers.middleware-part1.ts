import cors, { type CorsOptions } from 'cors';
import type { NextFunction, Request, Response } from 'express';

export interface SecurityHeadersConfig {
  cors?: CorsConfig;
  csp?: CSPConfig;
  additionalHeaders?: Record<string, string>;
}

export interface CorsConfig {
  enabled?: boolean;
  origins?: string[] | '*';
  credentials?: boolean;
  methods?: string[];
  allowedHeaders?: string[];
  exposedHeaders?: string[];
  maxAge?: number;
  preflightContinue?: boolean;
  optionsSuccessStatus?: number;
  dynamicOrigin?: (origin: string, callback: (err: Error | null, allow?: boolean) => void) => void;
}

export interface CSPConfig {
  enabled?: boolean;
  directives?: CSPDirectives;
  reportOnly?: boolean;
  reportUri?: string;
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

export interface CSPDirectives {
  defaultSrc?: string[];
  scriptSrc?: string[];
  styleSrc?: string[];
  imgSrc?: string[];
  connectSrc?: string[];
  fontSrc?: string[];
  objectSrc?: string[];
  mediaSrc?: string[];
  frameSrc?: string[];
  frameAncestors?: string[];
  formAction?: string[];
  baseUri?: string[];
  workerSrc?: string[];
  manifestSrc?: string[];
  prefetchSrc?: string[];
  navigateTo?: string[];
  reportUri?: string[];
  reportTo?: string[];
  requireSriFor?: string[];
  requireTrustedTypesFor?: string[];
  sandbox?: string[];
  trustedTypes?: string[];
  upgradeInsecureRequests?: boolean;
  blockAllMixedContent?: boolean;
}

/**
 * Default CSP directives for maximum security
 */
const DEFAULT_CSP_DIRECTIVES: CSPDirectives = {
  defaultSrc: ["'self'"],
  scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"], // May need adjustment based on app
  styleSrc: ["'self'", "'unsafe-inline'"],
  imgSrc: ["'self'", 'data:', 'https:'],
  connectSrc: ["'self'"],
  fontSrc: ["'self'"],
  objectSrc: ["'none'"],
  mediaSrc: ["'self'"],
  frameSrc: ["'none'"],
  frameAncestors: ["'none'"],
  formAction: ["'self'"],
  baseUri: ["'self'"],
  workerSrc: ["'self'"],
  manifestSrc: ["'self'"],
};

/**
 * Create CORS middleware with security best practices
 */
export function createCorsMiddleware(config: CorsConfig = {}): any {
  const {
    enabled = true,
    origins = ['http://localhost:3000'],
    credentials = true,
    methods = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders = ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key'],
    exposedHeaders = ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
    maxAge = 86400, // 24 hours
    preflightContinue = false,
    optionsSuccessStatus = 204,
    dynamicOrigin,
  } = config;

  if (!enabled) {
    return (_req: Request, _res: Response, next: NextFunction) => next();
  }

  const corsOptions: CorsOptions = {
