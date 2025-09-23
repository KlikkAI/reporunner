/**
 * Reporunner OpenTelemetry Instrumentation
 *
 * This module provides comprehensive observability instrumentation for Reporunner
 * Node.js applications including tracing, metrics, and logging.
 */

import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from '@opentelemetry/core';
import { JaegerExporter, JaegerPropagator } from '@opentelemetry/exporter-jaeger';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { IORedisInstrumentation } from '@opentelemetry/instrumentation-ioredis';
import { MongoDBInstrumentation } from '@opentelemetry/instrumentation-mongodb';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { WinstonInstrumentation } from '@opentelemetry/instrumentation-winston';
import { B3Propagator } from '@opentelemetry/propagator-b3';
import { dockerDetector } from '@opentelemetry/resource-detector-docker';
import { gcpDetector } from '@opentelemetry/resource-detector-gcp';
import { Resource } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

export interface InstrumentationConfig {
  serviceName: string;
  serviceVersion?: string;
  environment?: string;
  tracing?: {
    enabled?: boolean;
    jaeger?: {
      endpoint?: string;
    };
    otlp?: {
      endpoint?: string;
      headers?: Record<string, string>;
    };
    samplingRate?: number;
  };
  metrics?: {
    enabled?: boolean;
    prometheus?: {
      port?: number;
      endpoint?: string;
    };
    otlp?: {
      endpoint?: string;
      headers?: Record<string, string>;
    };
  };
  logging?: {
    enabled?: boolean;
    correlation?: boolean;
  };
  customInstrumentations?: any[];
}

export class ReporunnerInstrumentation {
  private sdk: NodeSDK | null = null;
  private config: InstrumentationConfig;

  constructor(config: InstrumentationConfig) {
    this.config = {
      serviceName: config.serviceName,
      serviceVersion: config.serviceVersion || '1.0.0',
      environment: config.environment || process.env.NODE_ENV || 'development',
      tracing: {
        enabled: true,
        jaeger: {
          endpoint: 'http://localhost:14268/api/traces',
        },
        otlp: {
          endpoint: 'http://localhost:4318/v1/traces',
        },
        samplingRate: 0.1,
        ...config.tracing,
      },
      metrics: {
        enabled: true,
        prometheus: {
          port: 9464,
          endpoint: '/metrics',
        },
        otlp: {
          endpoint: 'http://localhost:4318/v1/metrics',
        },
        ...config.metrics,
      },
      logging: {
        enabled: true,
        correlation: true,
        ...config.logging,
      },
      customInstrumentations: config.customInstrumentations || [],
    };
  }

  /**
   * Initialize and start the OpenTelemetry instrumentation
   */
  public async start(): Promise<void> {
    // Create resource with service information
    const resource = new Resource({
      [SemanticResourceAttributes.SERVICE_NAME]: this.config.serviceName,
      [SemanticResourceAttributes.SERVICE_VERSION]: this.config.serviceVersion!,
      [SemanticResourceAttributes.DEPLOYMENT_ENVIRONMENT]: this.config.environment!,
      [SemanticResourceAttributes.SERVICE_NAMESPACE]: 'reporunner',
      'reporunner.component': this.getComponentType(),
    });

    // Detect additional resource attributes
    const detectedResource = await Resource.default()
      .merge(resource)
      .merge(await dockerDetector.detect())
      .merge(await gcpDetector.detect());

    // Configure instrumentations
    const instrumentations = [
      getNodeAutoInstrumentations({
        '@opentelemetry/instrumentation-fs': {
          enabled: false, // Disable noisy fs instrumentation
        },
        '@opentelemetry/instrumentation-dns': {
          enabled: false, // Disable noisy dns instrumentation
        },
      }),
      new ExpressInstrumentation({
        requestHook: (span, info) => {
          span.setAttributes({
            'reporunner.request.route': info.route,
            'reporunner.request.method': info.req.method,
            'reporunner.request.user_agent': info.req.headers['user-agent'],
          });
        },
      }),
      new HttpInstrumentation({
        requestHook: (span, request) => {
          span.setAttributes({
            'reporunner.http.request.size': request.headers['content-length'] || 0,
          });
        },
        responseHook: (span, response) => {
          span.setAttributes({
            'reporunner.http.response.size': response.headers['content-length'] || 0,
          });
        },
      }),
      new MongoDBInstrumentation({
        enhancedDatabaseReporting: true,
      }),
      new RedisInstrumentation(),
      new IORedisInstrumentation(),
      new WinstonInstrumentation(),
      ...this.config.customInstrumentations,
    ];

    // Configure trace exporters
    const traceExporters = [];
    if (this.config.tracing?.enabled) {
      if (this.config.tracing.jaeger?.endpoint) {
        traceExporters.push(
          new JaegerExporter({
            endpoint: this.config.tracing.jaeger.endpoint,
          })
        );
      }
      if (this.config.tracing.otlp?.endpoint) {
        traceExporters.push(
          new OTLPTraceExporter({
            url: this.config.tracing.otlp.endpoint,
            headers: this.config.tracing.otlp.headers,
          })
        );
      }
    }

    // Configure metric exporters
    const metricReaders = [];
    if (this.config.metrics?.enabled) {
      if (this.config.metrics.prometheus) {
        metricReaders.push(
          new PrometheusExporter({
            port: this.config.metrics.prometheus.port,
            endpoint: this.config.metrics.prometheus.endpoint,
          })
        );
      }
      if (this.config.metrics.otlp?.endpoint) {
        metricReaders.push(
          new OTLPMetricExporter({
            url: this.config.metrics.otlp.endpoint,
            headers: this.config.metrics.otlp.headers,
          })
        );
      }
    }

    // Configure propagators
    const propagator = new CompositePropagator({
      propagators: [
        new W3CTraceContextPropagator(),
        new W3CBaggagePropagator(),
        new B3Propagator(),
        new JaegerPropagator(),
      ],
    });

    // Create SDK
    this.sdk = new NodeSDK({
      resource: detectedResource,
      instrumentations,
      traceExporter: traceExporters.length > 0 ? traceExporters[0] : undefined,
      metricReader: metricReaders.length > 0 ? metricReaders[0] : undefined,
      textMapPropagator: propagator,
    });

    // Start the SDK
    this.sdk.start();
  }

  /**
   * Stop the instrumentation
   */
  public async stop(): Promise<void> {
    if (this.sdk) {
      await this.sdk.shutdown();
    }
  }

  /**
   * Get component type based on service name
   */
  private getComponentType(): string {
    const serviceName = this.config.serviceName.toLowerCase();

    if (serviceName.includes('backend') || serviceName.includes('api')) {
      return 'backend';
    } else if (serviceName.includes('frontend') || serviceName.includes('ui')) {
      return 'frontend';
    } else if (serviceName.includes('worker') || serviceName.includes('queue')) {
      return 'worker';
    } else if (serviceName.includes('database') || serviceName.includes('db')) {
      return 'database';
    } else {
      return 'service';
    }
  }
}

/**
 * Create custom workflow-specific spans
 */
export class WorkflowTracing {
  private static tracer = require('@opentelemetry/api').trace.getTracer('reporunner-workflow');

  static startWorkflowExecution(workflowId: string, executionId: string) {
    return WorkflowTracing.tracer.startSpan('workflow.execution', {
      attributes: {
        'reporunner.workflow.id': workflowId,
        'reporunner.execution.id': executionId,
        'reporunner.operation': 'workflow_execution',
      },
    });
  }

  static startNodeExecution(nodeId: string, nodeType: string, executionId: string) {
    return WorkflowTracing.tracer.startSpan('workflow.node.execution', {
      attributes: {
        'reporunner.node.id': nodeId,
        'reporunner.node.type': nodeType,
        'reporunner.execution.id': executionId,
        'reporunner.operation': 'node_execution',
      },
    });
  }

  static startIntegrationCall(integration: string, operation: string) {
    return WorkflowTracing.tracer.startSpan('integration.call', {
      attributes: {
        'reporunner.integration.name': integration,
        'reporunner.integration.operation': operation,
        'reporunner.operation': 'integration_call',
      },
    });
  }

  static recordWorkflowMetrics(workflowId: string, status: string, duration: number) {
    const meter = require('@opentelemetry/api').metrics.getMeter('reporunner-workflow');

    const executionCounter = meter.createCounter('reporunner_workflow_executions_total', {
      description: 'Total number of workflow executions',
    });

    const executionDuration = meter.createHistogram(
      'reporunner_workflow_execution_duration_seconds',
      {
        description: 'Workflow execution duration in seconds',
      }
    );

    executionCounter.add(1, {
      workflow_id: workflowId,
      status: status,
    });

    executionDuration.record(duration, {
      workflow_id: workflowId,
      status: status,
    });
  }
}

/**
 * Express middleware for enhanced tracing
 */
export function reporunnerTracingMiddleware(
  options: { includeHeaders?: boolean; includeBody?: boolean; excludePaths?: string[] } = {}
) {
  const {
    includeHeaders = false,
    includeBody = false,
    excludePaths = ['/health', '/metrics'],
  } = options;

  return (req: any, res: any, next: any) => {
    // Skip excluded paths
    if (excludePaths.some((path) => req.path.startsWith(path))) {
      return next();
    }

    const span = require('@opentelemetry/api').trace.getActiveSpan();

    if (span) {
      // Add custom attributes
      span.setAttributes({
        'reporunner.request.id': req.headers['x-request-id'] || generateRequestId(),
        'reporunner.request.ip': req.ip,
        'reporunner.request.path': req.path,
        'reporunner.request.query': JSON.stringify(req.query),
      });

      if (includeHeaders) {
        span.setAttribute('reporunner.request.headers', JSON.stringify(req.headers));
      }

      if (includeBody && req.body) {
        span.setAttribute('reporunner.request.body', JSON.stringify(req.body));
      }

      // Add response attributes
      const originalSend = res.send;
      res.send = function (body: any) {
        span.setAttributes({
          'reporunner.response.status': res.statusCode,
          'reporunner.response.size': Buffer.byteLength(body || ''),
        });

        if (res.statusCode >= 400) {
          span.setStatus({
            code: require('@opentelemetry/api').SpanStatusCode.ERROR,
            message: `HTTP ${res.statusCode}`,
          });
        }

        return originalSend.call(this, body);
      };
    }

    next();
  };
}

/**
 * Utility functions
 */
function generateRequestId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

/**
 * Environment-based configuration helper
 */
export function getDefaultConfig(serviceName: string): InstrumentationConfig {
  return {
    serviceName,
    serviceVersion: process.env.SERVICE_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    tracing: {
      enabled: process.env.TRACING_ENABLED !== 'false',
      jaeger: {
        endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
      },
      otlp: {
        endpoint:
          process.env.OTEL_EXPORTER_OTLP_TRACES_ENDPOINT || 'http://localhost:4318/v1/traces',
        headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
          ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
          : undefined,
      },
      samplingRate: parseFloat(process.env.TRACING_SAMPLING_RATE || '0.1'),
    },
    metrics: {
      enabled: process.env.METRICS_ENABLED !== 'false',
      prometheus: {
        port: parseInt(process.env.PROMETHEUS_PORT || '9464', 10),
        endpoint: process.env.PROMETHEUS_ENDPOINT || '/metrics',
      },
      otlp: {
        endpoint:
          process.env.OTEL_EXPORTER_OTLP_METRICS_ENDPOINT || 'http://localhost:4318/v1/metrics',
        headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
          ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
          : undefined,
      },
    },
    logging: {
      enabled: process.env.LOGGING_ENABLED !== 'false',
      correlation: process.env.LOG_CORRELATION !== 'false',
    },
  };
}

// Export types
export * from '@opentelemetry/api';
export type { InstrumentationConfig };

// Default export
export default ReporunnerInstrumentation;
