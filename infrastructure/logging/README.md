# ELK Stack Configuration for Reporunner

This directory contains the complete ELK (Elasticsearch, Logstash, Kibana) stack configuration for centralized logging and monitoring of the Reporunner workflow automation platform.

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Applications  │───▶│    Logstash     │───▶│  Elasticsearch  │
│  (Reporunner)   │    │   (Processing)  │    │    (Storage)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
┌─────────────────┐    ┌─────────────────┐             │
│    ElastAlert   │◀───│     Kibana      │◀────────────┘
│   (Alerting)    │    │ (Visualization) │
└─────────────────┘    └─────────────────┘
```

## 📁 Directory Structure

```
logging/
├── docker-compose.yml          # Main orchestration file
├── elasticsearch/
│   ├── elasticsearch.yml       # Elasticsearch configuration
│   └── data/                  # Data persistence directory
├── logstash/
│   ├── logstash.yml           # Logstash main configuration
│   └── pipeline/
│       └── reporunner.conf    # Log processing pipeline
├── kibana/
│   └── kibana.yml             # Kibana configuration
├── filebeat/
│   └── filebeat.yml           # Log shipping configuration
├── elastalert/
│   ├── elastalert.yaml        # ElastAlert main config
│   ├── smtp_auth.yaml         # Email authentication
│   └── rules/
│       └── reporunner-alerts.yaml  # Alerting rules
└── scripts/
    └── setup-elk.sh           # Automated setup script
```

## 🚀 Quick Start

### Prerequisites
- Docker and Docker Compose installed
- At least 4GB RAM available for the stack
- Ports 9200, 5601, 5044, 9600 available

### Setup
1. **Run the setup script:**
   ```bash
   cd reporunner/logging
   ./scripts/setup-elk.sh
   ```

2. **Manual startup (alternative):**
   ```bash
   docker-compose up -d
   ```

3. **Verify services:**
   ```bash
   # Check Elasticsearch
   curl http://localhost:9200/_cluster/health

   # Check Kibana
   curl http://localhost:5601/api/status
   ```

## 🔧 Configuration Details

### Elasticsearch
- **Cluster:** Single-node development setup
- **Memory:** 1GB heap size (configurable via ES_JAVA_OPTS)
- **Storage:** Persistent volume at `./elasticsearch/data`
- **Network:** Available on port 9200

### Logstash
- **Input:** Beats input on port 5044
- **Processing:** Custom pipeline for Reporunner logs
- **Output:** Elasticsearch with index pattern `reporunner-YYYY.MM.dd`
- **Features:** JSON parsing, trace correlation, field extraction

### Kibana
- **Dashboard:** Pre-configured for Reporunner logs
- **Index Pattern:** `reporunner-*` with `@timestamp` field
- **Network:** Available on port 5601
- **Features:** Log exploration, visualization, alerting

### Filebeat
- **Purpose:** Log file shipping from application servers
- **Inputs:** File system monitoring for log files
- **Output:** Logstash for processing
- **Modules:** System, Docker, Nginx

### ElastAlert
- **Alerting:** Real-time monitoring and notifications
- **Rules:** Comprehensive alert definitions for:
  - High error rates (>5% in 5 minutes)
  - Failed workflow executions
  - Database connection errors
  - HTTP 5xx error spikes
  - Security incidents
  - Performance issues
- **Notifications:** Email, Slack, webhook support

## 📊 Log Formats and Fields

### Standard Log Structure
```json
{
  "@timestamp": "2024-01-15T10:30:00.000Z",
  "level": "info|warn|error",
  "message": "Human-readable message",
  "service_name": "reporunner-backend|frontend|worker",
  "trace_id": "unique-trace-identifier",
  "span_id": "span-identifier",
  "user_id": "user-identifier",
  "workflow_id": "workflow-identifier",
  "execution_id": "execution-identifier",
  "response_time": 150,
  "status_code": 200,
  "metadata": {
    "node_id": "node-identifier",
    "integration": "gmail|slack|openai"
  }
}
```

### Application Integration

#### Backend (Node.js)
```javascript
import winston from 'winston';
import { format } from 'logform';

const logger = winston.createLogger({
  format: format.combine(
    format.timestamp(),
    format.json(),
    format.printf(info => JSON.stringify({
      '@timestamp': info.timestamp,
      level: info.level,
      message: info.message,
      service_name: 'reporunner-backend',
      trace_id: info.traceId,
      ...info.metadata
    }))
  ),
  transports: [
    new winston.transports.File({
      filename: '/var/log/reporunner/backend.log'
    })
  ]
});
```

#### Frontend (Browser)
```javascript
// Send logs to backend endpoint
const logToElk = (level, message, metadata) => {
  fetch('/api/logs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      level,
      message,
      service_name: 'reporunner-frontend',
      '@timestamp': new Date().toISOString(),
      ...metadata
    })
  });
};
```

## 🔔 Alerting Configuration

### SMTP Setup
1. **Configure SMTP credentials:**
   ```bash
   cp elastalert/smtp_auth.yaml.example elastalert/smtp_auth.yaml
   # Edit with your SMTP settings
   ```

2. **Test email configuration:**
   ```bash
   docker-compose exec elastalert elastalert-test-rule \
     --config /opt/elastalert/config.yaml \
     rules/reporunner-alerts.yaml
   ```

### Alert Types
- **Error Rate Alerts:** Trigger when error rate exceeds 5%
- **Performance Alerts:** Slow response times (>2 seconds)
- **Security Alerts:** Failed authentication attempts
- **Infrastructure Alerts:** Disk space, memory usage
- **Business Logic Alerts:** Failed workflows, integration errors

## 📈 Monitoring and Dashboards

### Key Metrics Tracked
- **Application Performance:** Response times, throughput, error rates
- **Workflow Execution:** Success/failure rates, execution duration
- **User Activity:** Login patterns, workflow usage
- **System Health:** CPU, memory, disk usage
- **Integration Health:** Third-party service availability

### Pre-built Dashboards
1. **Application Overview:** High-level system health
2. **Error Analysis:** Error trends and root cause analysis
3. **Performance Monitoring:** Response time trends
4. **User Activity:** User engagement and workflow usage
5. **Infrastructure Health:** System resource utilization

## 🔧 Maintenance and Operations

### Log Retention
- **Default:** 30 days of log retention
- **Configuration:** Modify in `elasticsearch/elasticsearch.yml`
- **Cleanup:** Automated via index lifecycle management

### Scaling Considerations
- **Elasticsearch:** Add nodes for horizontal scaling
- **Logstash:** Multiple instances for high throughput
- **Storage:** Monitor disk usage and plan for growth

### Backup Strategy
```bash
# Create snapshot repository
curl -X PUT "localhost:9200/_snapshot/backup" -H 'Content-Type: application/json' -d'
{
  "type": "fs",
  "settings": {
    "location": "/usr/share/elasticsearch/backup"
  }
}'

# Create snapshot
curl -X PUT "localhost:9200/_snapshot/backup/snapshot_1"
```

## 🚨 Troubleshooting

### Common Issues

#### Elasticsearch won't start
```bash
# Check memory settings
docker-compose logs elasticsearch

# Increase virtual memory
sudo sysctl -w vm.max_map_count=262144
```

#### Logstash pipeline errors
```bash
# Check pipeline configuration
docker-compose exec logstash logstash --config.test_and_exit

# View detailed logs
docker-compose logs logstash
```

#### Kibana connection issues
```bash
# Verify Elasticsearch connectivity
curl http://localhost:9200/_cluster/health

# Check Kibana logs
docker-compose logs kibana
```

### Performance Tuning

#### Elasticsearch
```yaml
# elasticsearch.yml
cluster.routing.allocation.disk.watermark.low: 85%
cluster.routing.allocation.disk.watermark.high: 90%
indices.memory.index_buffer_size: 256mb
```

#### Logstash
```yaml
# logstash.yml
pipeline.workers: 4
pipeline.batch.size: 1000
pipeline.batch.delay: 50
```

## 🔗 Integration with Monitoring Stack

This ELK stack integrates seamlessly with the Prometheus + Grafana monitoring stack:

- **Metrics → Logs Correlation:** Link Grafana alerts to Kibana log exploration
- **Distributed Tracing:** Correlate traces from Jaeger with logs in Kibana
- **Unified Alerting:** Combine metric-based and log-based alerting

## 📚 Additional Resources

- [Elasticsearch Documentation](https://www.elastic.co/guide/en/elasticsearch/reference/current/index.html)
- [Logstash Configuration Guide](https://www.elastic.co/guide/en/logstash/current/configuration.html)
- [Kibana User Guide](https://www.elastic.co/guide/en/kibana/current/index.html)
- [ElastAlert Documentation](https://elastalert.readthedocs.io/)