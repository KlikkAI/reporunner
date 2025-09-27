# Reporunner Observability Stack

A comprehensive distributed tracing and observability solution for Reporunner using OpenTelemetry, Jaeger, Tempo, Loki, and various telemetry collectors. This stack provides end-to-end visibility into your Reporunner workflow automation platform.

## 🚀 Quick Start

```bash
# Clone or navigate to the observability directory
cd observability

# Start the complete observability stack
docker-compose up -d

# Access the observability interfaces
# Jaeger UI: http://localhost:16686
# Tempo: http://localhost:3200
# Grafana: http://localhost:3001
# Zipkin: http://localhost:9411
# Loki: http://localhost:3100
```

## 🔍 What's Included

### Distributed Tracing

| Service | Port | Description |
|---------|------|-------------|
| **Jaeger** | 16686 | Complete distributed tracing solution with UI |
| **Tempo** | 3200 | High-performance tracing backend by Grafana |
| **Zipkin** | 9411 | Alternative tracing system with web UI |
| **OpenTelemetry Collector** | 4317/4318 | Central telemetry data collection hub |

### Log Aggregation

| Service | Port | Description |
|---------|------|-------------|
| **Loki** | 3100 | Log aggregation system by Grafana |
| **Promtail** | 9080 | Log shipping agent for Loki |
| **Elasticsearch** | 9200 | Search and analytics engine for logs |
| **Kibana** | 5601 | Data visualization dashboard for Elasticsearch |

### Data Processing

| Service | Port | Description |
|---------|------|-------------|
| **Vector** | 8686 | High-performance log router and processor |
| **Fluent Bit** | 2020 | Lightweight log processor and forwarder |
| **MinIO** | 9000 | S3-compatible storage for Tempo |

### Visualization

| Service | Port | Description |
|---------|------|-------------|
| **Grafana** | 3001 | Observability dashboards and analytics |
| **SigNoz** | 3301 | Complete observability platform |

## 🎯 Key Features

### 📊 **End-to-End Tracing**
- **Request Tracing**: Complete request flows across microservices
- **Workflow Tracing**: Detailed workflow execution visibility
- **Database Tracing**: Query performance and connection monitoring
- **Integration Tracing**: Third-party API call monitoring
- **Custom Spans**: Business logic and workflow node execution

### 📝 **Comprehensive Logging**
- **Structured Logging**: JSON-formatted logs with metadata
- **Log Correlation**: Trace ID correlation across all logs
- **Multi-source Collection**: Application logs, system logs, container logs
- **Real-time Processing**: Live log streaming and analysis
- **Long-term Storage**: Efficient log storage and retention

### 📈 **Rich Metrics Integration**
- **RED Metrics**: Rate, Errors, Duration for all services
- **Business Metrics**: Workflow success rates, execution times
- **Infrastructure Metrics**: System and container performance
- **Custom Metrics**: Application-specific KPIs

### 🔗 **Unified Observability**
- **Traces to Logs**: Navigate from traces to related logs
- **Logs to Traces**: Jump from log entries to trace context
- **Metrics Correlation**: Connect metrics to traces and logs
- **Service Map**: Visual representation of service dependencies

## 🛠️ Setup and Configuration

### Prerequisites

- Docker and Docker Compose
- At least 8GB RAM and 20GB disk space
- Network access for pulling Docker images

### Initial Setup

1. **Start the observability stack:**
```bash
docker-compose up -d
```

2. **Initialize MinIO bucket for Tempo:**
```bash
# Create bucket for Tempo storage
docker-compose exec minio mc mb /data/tempo-traces
```

3. **Verify services are running:**
```bash
docker-compose ps
```

### Service Configuration

Each service has its own configuration file:

| Service | Configuration File |
|---------|-------------------|
| OpenTelemetry Collector | `otel-collector/otel-collector.yml` |
| Tempo | `tempo/tempo.yml` |
| Loki | `loki/loki.yml` |
| Promtail | `promtail/promtail.yml` |
| Vector | `vector/vector.toml` |
| Fluent Bit | `fluent-bit/fluent-bit.conf` |
| Grafana Datasources | `grafana/datasources/` |

## 📊 Instrumentation

### Node.js Applications

```javascript
// Install the instrumentation package
pnpm add @reporunner/instrumentation-nodejs

// Initialize in your application entry point
const { ReporunnerInstrumentation } = require('@reporunner/instrumentation-nodejs');

const instrumentation = new ReporunnerInstrumentation({
  serviceName: 'reporunner-backend',
  tracing: {
    enabled: true,
    otlp: {
      endpoint: 'http://localhost:4318/v1/traces'
    }
  },
  metrics: {
    enabled: true,
    prometheus: {
      port: 9464
    }
  }
});

// Start instrumentation before importing other modules
instrumentation.start();

// Your application code...
const express = require('express');
const app = express();

// Add tracing middleware
const { reporunnerTracingMiddleware } = require('@reporunner/instrumentation-nodejs');
app.use(reporunnerTracingMiddleware());

// Add workflow-specific tracing
const { WorkflowTracing } = require('@reporunner/instrumentation-nodejs');

async function executeWorkflow(workflowId, inputData) {
  const span = WorkflowTracing.startWorkflowExecution(workflowId, executionId);

  try {
    // Your workflow execution logic
    const result = await processWorkflow(workflowId, inputData);

    span.setStatus({ code: SpanStatusCode.OK });
    return result;
  } catch (error) {
    span.setStatus({
      code: SpanStatusCode.ERROR,
      message: error.message
    });
    throw error;
  } finally {
    span.end();
  }
}
```

### Python Applications

```python
# Install the instrumentation package
pip install reporunner-instrumentation

# Initialize in your application
from reporunner_instrumentation import auto_instrument, WorkflowTracing

# Auto-instrument with default configuration
instrumentor = auto_instrument('reporunner-backend')

# Or use custom configuration
from reporunner_instrumentation import InstrumentationConfig, TracingConfig

config = InstrumentationConfig(
    service_name='reporunner-backend',
    tracing=TracingConfig(
        enabled=True,
        otlp_endpoint='http://localhost:4318/v1/traces'
    )
)

instrumentor = init_instrumentation(config)

# Add workflow-specific tracing
async def execute_workflow(workflow_id: str, input_data: dict):
    with WorkflowTracing.start_workflow_execution(workflow_id, execution_id) as span:
        try:
            # Your workflow execution logic
            result = await process_workflow(workflow_id, input_data)
            return result
        except Exception as e:
            span.set_status(Status(StatusCode.ERROR, str(e)))
            raise
```

### Environment Variables

Configure instrumentation through environment variables:

```bash
# Service identification
SERVICE_NAME=reporunner-backend
SERVICE_VERSION=1.0.0
ENVIRONMENT=production

# Tracing configuration
TRACING_ENABLED=true
OTEL_EXPORTER_OTLP_TRACES_ENDPOINT=http://localhost:4318/v1/traces
OTEL_EXPORTER_OTLP_HEADERS=api-key=your-api-key
TRACING_SAMPLING_RATE=0.1

# Metrics configuration
METRICS_ENABLED=true
PROMETHEUS_PORT=9464
OTEL_EXPORTER_OTLP_METRICS_ENDPOINT=http://localhost:4318/v1/metrics

# Logging configuration
LOGGING_ENABLED=true
LOG_CORRELATION=true
```

## 📊 Dashboards and Visualization

### Jaeger UI Features
- **Service Map**: Visual representation of service dependencies
- **Trace Search**: Find traces by service, operation, tags, duration
- **Trace Analysis**: Detailed span-by-span analysis
- **Performance Insights**: Service performance and bottleneck identification

### Grafana Dashboards
- **Distributed Tracing Overview**: High-level tracing metrics and trends
- **Service Performance**: RED metrics for each service
- **Workflow Analytics**: Business-specific workflow insights
- **Error Analysis**: Error rate trends and error trace correlation

### Custom Dashboards

Access pre-built dashboards at `http://localhost:3001`:

1. **Reporunner Tracing Overview**
   - Service dependency map
   - Request rate and error rate
   - P95/P99 latency trends
   - Top slowest operations

2. **Workflow Execution Analysis**
   - Workflow success/failure rates
   - Execution duration trends
   - Node-level performance
   - Integration call analysis

3. **Log Analysis**
   - Log volume trends
   - Error log analysis
   - Trace-log correlation
   - Application insights

## 🔧 Operations

### Management Commands

```bash
# Start observability stack
docker-compose up -d

# Stop observability stack
docker-compose down

# View logs
docker-compose logs -f [service_name]

# Scale services
docker-compose up -d --scale promtail=3

# Clean up data
docker-compose down -v
```

### Data Retention

Configure data retention for long-term storage:

```yaml
# Tempo retention (tempo.yml)
compactor:
  compaction:
    block_retention: 24h

# Loki retention (loki.yml)
limits_config:
  retention_period: 168h  # 7 days

# Elasticsearch retention
curl -X PUT "localhost:9200/_ilm/policy/reporunner-logs" -H 'Content-Type: application/json' -d'
{
  "policy": {
    "phases": {
      "delete": {
        "min_age": "7d"
      }
    }
  }
}'
```

## 🔍 Troubleshooting

### Common Issues

#### Traces Not Appearing
```bash
# Check OTEL collector status
curl http://localhost:13133

# Verify application is sending traces
curl http://your-app:port/metrics | grep otel

# Check collector logs
docker-compose logs otel-collector
```

#### High Memory Usage
```bash
# Reduce Tempo storage
# Edit tempo.yml:
# storage:
#   trace:
#     pool:
#       max_workers: 50

# Reduce batch sizes in OTEL collector
# Edit otel-collector.yml:
# processors:
#   batch:
#     send_batch_size: 512
```

#### Missing Logs
```bash
# Check Promtail configuration
docker-compose exec promtail cat /etc/promtail/config.yml

# Verify log file permissions
docker-compose exec promtail ls -la /var/log/

# Check Loki ingestion
curl http://localhost:3100/ready
```

### Performance Optimization

#### OTEL Collector Optimization
```yaml
# Reduce resource usage
processors:
  memory_limiter:
    limit_mib: 256

  batch:
    timeout: 5s
    send_batch_size: 512

# Use probabilistic sampling
processors:
  probabilistic_sampler:
    sampling_percentage: 10
```

#### Tempo Optimization
```yaml
# Optimize for high throughput
ingester:
  max_block_duration: 30m

distributor:
  log_received_traces: false
```

## 🔐 Security Considerations

### Network Security
- All services run in isolated Docker network
- No external access by default
- Use reverse proxy for external access

### Data Protection
- Encrypt telemetry data in transit
- Secure OTEL collector endpoints
- Regular backup of configuration

### Access Control
- Configure authentication for Grafana
- Secure Jaeger UI access
- Implement RBAC for dashboards

## 🔗 Integration Points

### Monitoring Integration
Connect to your existing monitoring stack:

```yaml
# Send metrics to Prometheus
exporters:
  prometheus:
    endpoint: "prometheus:9090/api/v1/write"

# Forward traces to external systems
exporters:
  otlp/external:
    endpoint: "https://your-external-system:4317"
```

### Alert Integration
Route observability alerts through AlertManager:

```yaml
# Configure Grafana alerts
alerting:
  enabled: true
  notification_policies:
    - receiver: 'alertmanager'
      routes:
        - match:
            alertname: 'HighTraceErrorRate'
```

## 📚 Best Practices

### Instrumentation Best Practices

1. **Selective Instrumentation**
   - Instrument critical paths only
   - Use sampling to reduce overhead
   - Exclude health check endpoints

2. **Span Naming**
   - Use descriptive span names
   - Include operation context
   - Follow OpenTelemetry conventions

3. **Attribute Management**
   - Add business-relevant attributes
   - Avoid sensitive information
   - Use consistent attribute names

### Performance Considerations

1. **Sampling Strategy**
   - Use head-based sampling for development
   - Implement tail-based sampling for production
   - Sample errors at 100%

2. **Resource Management**
   - Monitor collector resource usage
   - Configure appropriate batching
   - Set memory limits

3. **Storage Optimization**
   - Configure appropriate retention
   - Use compression for long-term storage
   - Regular cleanup of old data

## 📄 License

This observability configuration is part of the Reporunner project and follows the same licensing terms.