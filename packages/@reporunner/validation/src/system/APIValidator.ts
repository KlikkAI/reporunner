/**
 * API Endpoint Validation System
 * Implements automated API endpoint discovery and testing
 * Requirements: 1.2, 1.5
 */

import axios, { type AxiosRequestConfig } from 'axios';
import type { IAPIValidator } from '../interfaces/index.js';
import type { EndpointFailure, EndpointResults, ResponseTimeMetrics } from '../types/index.js';

export interface APIEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  expectedStatus: number;
  testData?: any;
  headers?: Record<string, string>;
}

export interface APIValidationConfig {
  baseUrl: string;
  timeout: number;
  retryAttempts: number;
  endpoints: APIEndpoint[];
  authToken?: string;
  headers?: Record<string, string>;
}

/**
 * API endpoint validation system with automated discovery and testing
 * Requirements: 1.2, 1.5
 */
export class APIValidator implements IAPIValidator {
  private config: APIValidationConfig;
  private responseTimes: number[] = [];

  constructor(config: APIValidationConfig) {
    this.config = config;
  }

  /**
   * Validate all configured API endpoints
   * Requirements: 1.2
   */
  async validateEndpoints(): Promise<EndpointResults> {
    const _startTime = Date.now();
    const failures: EndpointFailure[] = [];
    let validatedCount = 0;
    this.responseTimes = [];

    for (const endpoint of this.config.endpoints) {
      try {
        const result = await this.validateSingleEndpoint(endpoint);
        if (result.success) {
          validatedCount++;
        } else {
          failures.push(result.failure!);
        }
      } catch (error) {
        failures.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const responseTimeMetrics = this.calculateResponseTimeMetrics();

    return {
      totalEndpoints: this.config.endpoints.length,
      validatedEndpoints: validatedCount,
      failedEndpoints: failures,
      responseTimeMetrics,
      status: failures.length === 0 ? 'success' : 'failure',
    };
  }

  /**
   * Check response format validation
   * Requirements: 1.2
   */
  async checkResponseFormats(): Promise<EndpointResults> {
    const failures: EndpointFailure[] = [];
    let validatedCount = 0;
    this.responseTimes = [];

    for (const endpoint of this.config.endpoints) {
      try {
        const result = await this.validateResponseFormat(endpoint);
        if (result.success) {
          validatedCount++;
        } else {
          failures.push(result.failure!);
        }
      } catch (error) {
        failures.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const responseTimeMetrics = this.calculateResponseTimeMetrics();

    return {
      totalEndpoints: this.config.endpoints.length,
      validatedEndpoints: validatedCount,
      failedEndpoints: failures,
      responseTimeMetrics,
      status: failures.length === 0 ? 'success' : 'failure',
    };
  }

  /**
   * Test error handling for endpoints
   * Requirements: 1.2
   */
  async testErrorHandling(): Promise<EndpointResults> {
    const errorTestEndpoints: APIEndpoint[] = [
      { path: '/api/nonexistent', method: 'GET', expectedStatus: 404 },
      { path: '/api/health', method: 'POST', expectedStatus: 405 },
      { path: '/api/invalid', method: 'GET', expectedStatus: 400 },
    ];

    const failures: EndpointFailure[] = [];
    let validatedCount = 0;
    this.responseTimes = [];

    for (const endpoint of errorTestEndpoints) {
      try {
        const result = await this.validateErrorResponse(endpoint);
        if (result.success) {
          validatedCount++;
        } else {
          failures.push(result.failure!);
        }
      } catch (error) {
        failures.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const responseTimeMetrics = this.calculateResponseTimeMetrics();

    return {
      totalEndpoints: errorTestEndpoints.length,
      validatedEndpoints: validatedCount,
      failedEndpoints: failures,
      responseTimeMetrics,
      status: failures.length === 0 ? 'success' : 'failure',
    };
  }

  /**
   * Validate health check endpoints
   * Requirements: 1.5
   */
  async validateHealthChecks(): Promise<EndpointResults> {
    const healthEndpoints: APIEndpoint[] = [
      { path: '/api/health', method: 'GET', expectedStatus: 200 },
      { path: '/api/info', method: 'GET', expectedStatus: 200 },
    ];

    const failures: EndpointFailure[] = [];
    let validatedCount = 0;
    this.responseTimes = [];

    for (const endpoint of healthEndpoints) {
      try {
        const result = await this.validateHealthEndpoint(endpoint);
        if (result.success) {
          validatedCount++;
        } else {
          failures.push(result.failure!);
        }
      } catch (error) {
        failures.push({
          endpoint: endpoint.path,
          method: endpoint.method,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    const responseTimeMetrics = this.calculateResponseTimeMetrics();

    return {
      totalEndpoints: healthEndpoints.length,
      validatedEndpoints: validatedCount,
      failedEndpoints: failures,
      responseTimeMetrics,
      status: failures.length === 0 ? 'success' : 'failure',
    };
  }

  /**
   * Discover default API endpoints for validation
   */
  static discoverEndpoints(_baseUrl: string): APIEndpoint[] {
    return [
      { path: '/api/health', method: 'GET', expectedStatus: 200 },
      { path: '/api/info', method: 'GET', expectedStatus: 200 },
      { path: '/api/audit/events', method: 'GET', expectedStatus: 200 },
      { path: '/api/schedules', method: 'GET', expectedStatus: 200 },
      { path: '/api/workflows', method: 'GET', expectedStatus: 200 },
      { path: '/api/users', method: 'GET', expectedStatus: 200 },
      { path: '/api/auth/login', method: 'POST', expectedStatus: 200, testData: { email: 'test@example.com', password: 'password' } },
      { path: '/api/workflows', method: 'POST', expectedStatus: 201, testData: { name: 'Test Workflow', description: 'Test' } },
      { path: '/api/schedules', method: 'POST', expectedStatus: 201, testData: { name: 'Test Schedule', cron: '0 0 * * *' } },
      { path: '/api/audit/events', method: 'POST', expectedStatus: 201, testData: { event: 'test', data: {} } },
    ];
  }

  /**
   * Validate a single endpoint
   */
  private async validateSingleEndpoint(endpoint: APIEndpoint): Promise<{
    success: boolean;
    failure?: EndpointFailure;
    responseTime?: number;
  }> {
    const startTime = Date.now();

    try {
      const config = this.buildRequestConfig(endpoint);
      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      if (response.status === endpoint.expectedStatus) {
        return { success: true, responseTime };
      } else {
        return {
          success: false,
          failure: {
            endpoint: endpoint.path,
            method: endpoint.method,
            error: `Expected status ${endpoint.expectedStatus}, got ${response.status}`,
            statusCode: response.status,
            responseTime,
          },
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      if (axios.isAxiosError(error) && error.response) {
        return {
          success: false,
          failure: {
            endpoint: endpoint.path,
            method: endpoint.method,
            error: error.message,
            statusCode: error.response.status,
            responseTime,
          },
        };
      }

      return {
        success: false,
        failure: {
          endpoint: endpoint.path,
          method: endpoint.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime,
        },
      };
    }
  }

  /**
   * Validate response format
   */
  private async validateResponseFormat(endpoint: APIEndpoint): Promise<{
    success: boolean;
    failure?: EndpointFailure;
  }> {
    const startTime = Date.now();

    try {
      const config = this.buildRequestConfig(endpoint);
      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      // Check if response is valid JSON object
      if (typeof response.data !== 'object' || response.data === null) {
        return {
          success: false,
          failure: {
            endpoint: endpoint.path,
            method: endpoint.method,
            error: 'Response is not a valid JSON object',
            statusCode: response.status,
            responseTime,
          },
        };
      }

      // Check for standard success field
      if (response.status >= 200 && response.status < 300) {
        if (!('success' in response.data)) {
          return {
            success: false,
            failure: {
              endpoint: endpoint.path,
              method: endpoint.method,
              error: 'Response missing required "success" field',
              statusCode: response.status,
              responseTime,
            },
          };
        }
      }

      return { success: true };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      return {
        success: false,
        failure: {
          endpoint: endpoint.path,
          method: endpoint.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime,
        },
      };
    }
  }

  /**
   * Validate error response
   */
  private async validateErrorResponse(endpoint: APIEndpoint): Promise<{
    success: boolean;
    failure?: EndpointFailure;
  }> {
    const startTime = Date.now();

    try {
      const config = this.buildRequestConfig(endpoint);
      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      if (response.status === endpoint.expectedStatus) {
        return { success: true };
      } else {
        return {
          success: false,
          failure: {
            endpoint: endpoint.path,
            method: endpoint.method,
            error: `Expected error status ${endpoint.expectedStatus}, got ${response.status}`,
            statusCode: response.status,
            responseTime,
          },
        };
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === endpoint.expectedStatus) {
          return { success: true };
        } else {
          return {
            success: false,
            failure: {
              endpoint: endpoint.path,
              method: endpoint.method,
              error: `Expected error status ${endpoint.expectedStatus}, got ${error.response.status}`,
              statusCode: error.response.status,
              responseTime,
            },
          };
        }
      }

      return {
        success: false,
        failure: {
          endpoint: endpoint.path,
          method: endpoint.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime,
        },
      };
    }
  }

  /**
   * Validate health endpoint
   */
  private async validateHealthEndpoint(endpoint: APIEndpoint): Promise<{
    success: boolean;
    failure?: EndpointFailure;
  }> {
    const startTime = Date.now();

    try {
      const config = this.buildRequestConfig(endpoint);
      const response = await axios(config);
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      if (response.status !== endpoint.expectedStatus) {
        return {
          success: false,
          failure: {
            endpoint: endpoint.path,
            method: endpoint.method,
            error: `Expected status ${endpoint.expectedStatus}, got ${response.status}`,
            statusCode: response.status,
            responseTime,
          },
        };
      }

      // Check if health endpoint indicates healthy status
      if (endpoint.path.includes('health')) {
        if (response.data && typeof response.data === 'object') {
          if (response.data.success === false) {
            return {
              success: false,
              failure: {
                endpoint: endpoint.path,
                method: endpoint.method,
                error: 'Health endpoint indicates service is not healthy',
                statusCode: response.status,
                responseTime,
              },
            };
          }
        }
      }

      return { success: true };
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.responseTimes.push(responseTime);

      return {
        success: false,
        failure: {
          endpoint: endpoint.path,
          method: endpoint.method,
          error: error instanceof Error ? error.message : 'Unknown error',
          responseTime,
        },
      };
    }
  }

  /**
   * Build request configuration for axios
   */
  private buildRequestConfig(endpoint: APIEndpoint): AxiosRequestConfig {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...this.config.headers,
      ...endpoint.headers,
    };

    if (this.config.authToken) {
      headers.Authorization = `Bearer ${this.config.authToken}`;
    }

    const config: AxiosRequestConfig = {
      method: endpoint.method,
      url: `${this.config.baseUrl}${endpoint.path}`,
      headers,
      timeout: this.config.timeout,
      validateStatus: () => true, // Don't throw on any status code
    };

    if (endpoint.testData && (endpoint.method === 'POST' || endpoint.method === 'PUT' || endpoint.method === 'PATCH')) {
      config.data = endpoint.testData;
    }

    return config;
  }

  /**
   * Calculate response time metrics
   */
  private calculateResponseTimeMetrics(): ResponseTimeMetrics {
    if (this.responseTimes.length === 0) {
      return {
        average: 0,
        median: 0,
        p95: 0,
        p99: 0,
        slowestEndpoints: [],
      };
    }

    const sorted = [...this.responseTimes].sort((a, b) => a - b);
    const average = this.responseTimes.reduce((sum, time) => sum + time, 0) / this.responseTimes.length;
    const median = sorted[Math.floor(sorted.length / 2)];
    const p95 = sorted[Math.floor(sorted.length * 0.95)];
    const p99 = sorted[Math.floor(sorted.length * 0.99)];

    // Create slowest endpoints list (simplified for now)
    const slowestEndpoints = this.config.endpoints
      .map((endpoint, index) => ({
        endpoint: endpoint.path,
        method: endpoint.method,
        responseTime: this.responseTimes[index] || 0,
      }))
      .sort((a, b) => b.responseTime - a.responseTime)
      .slice(0, 3);

    return {
      average: Math.round(average),
      median: Math.round(median),
      p95: Math.round(p95),
      p99: Math.round(p99),
      slowestEndpoints,
    };
  }
}
