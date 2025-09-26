import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import axios from 'axios';
import type { ZodSchema, z } from 'zod';
import type { ApiError, ApiResponse, PaginatedResponse, PaginationParams } from '../schemas';
import { configService } from '../services/ConfigService';
import { logger } from '../services/LoggingService';

// API Client error types
export class ApiClientError extends Error {
  public status?: number;
  public code?: string;
  public details?: unknown;

  constructor(message: string, status?: number, code?: string, details?: unknown) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends ApiClientError {
  public validationErrors: z.ZodError;

  constructor(message: string, validationErrors: z.ZodError) {
    super(message, 400, 'VALIDATION_ERROR', validationErrors.issues);
    this.name = 'ValidationError';
    this.validationErrors = validationErrors;
  }
}

// Request/Response interceptor types
interface RequestContext {
  startTime: number;
  endpoint: string;
  method: string;
}

/**
 * Type-safe API Client with Zod validation
 *
 * Features:
 * - Runtime response validation with Zod schemas
 * - Centralized error handling with structured logging
 * - Automatic authentication token management
 * - Request/response interceptors with performance tracking
 * - Type-safe method signatures
 * - Comprehensive error reporting
 */
export class ApiClient {
  private client: AxiosInstance;
  private readonly config = configService.getConfig();

  constructor() {
    this.client = this.createAxiosInstance();
    this.setupInterceptors();
  }

  /**
   * Create and configure Axios instance
   */
  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.api.baseUrl,
      timeout: this.config.api.timeout,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        // Add authentication token
        const token = localStorage.getItem(this.config.auth.tokenKey);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request context for tracking
        const context: RequestContext = {
          startTime: Date.now(),
          endpoint: config.url || 'unknown',
          method: config.method?.toUpperCase() || 'GET',
        };
        (config as any).metadata = { context };

        // Debug logging in development
        if (this.config.features.enableDebug) {
          logger.debug('API Request', {
            method: context.method,
            endpoint: context.endpoint,
