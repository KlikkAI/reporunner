# KlikkFlow Monitoring Stack

A comprehensive monitoring solution for KlikkFlow using Prometheus, Grafana, AlertManager, and various exporters. This stack provides real-time monitoring, alerting, and visualization for your KlikkFlow workflow automation platform.

## 🚀 Quick Start

```bash
# Clone or navigate to the monitoring directory
cd monitoring

# Run the setup script
./scripts/setup.sh setup

# Access the monitoring interfaces
# Prometheus: http://localhost:9090
# Grafana: http://localhost:3000 (admin/admin123)
# AlertManager: http://localhost:9093
```

## 📊 What's Included

### Core Monitoring Services

| Service | Port | Description |
|---------|------|-------------|
| **Prometheus** | 9090 | Metrics collection and alerting engine |
| **Grafana** | 3000 | Visualization and dashboards |
| **AlertManager** | 9093 | Alert routing and management |

### System Monitoring

| Service | Port | Description |
|---------|------|-------------|
| **Node Exporter** | 9100 | System metrics (CPU, memory, disk, network) |
| **cAdvisor** | 8080 | Container metrics and resource usage |
| **Blackbox Exporter** | 9115 | Endpoint monitoring and health checks |

### Application Monitoring

| Service | Port | Description |
|---------|------|-------------|
| **Redis Exporter** | 9121 | Redis performance and health metrics |
| **MongoDB Exporter** | 9216 | MongoDB database metrics |
| **Nginx Exporter** | 9113 | Web server performance metrics |
| **Pushgateway** | 9091 | Metrics from batch jobs and scripts |

## 🎯 Key Features

### 📈 **Comprehensive Metrics Collection**
- **Application Metrics**: Workflow executions, API performance, queue status
- **System Metrics**: CPU, memory, disk, network usage
- **Database Metrics**: MongoDB, PostgreSQL, Redis performance
- **Container Metrics**: Docker container resource usage
- **Custom Metrics**: Business KPIs and application-specific metrics

### 🚨 **Intelligent Alerting**
- **Multi-tier Alerting**: Critical, warning, and info level alerts
- **Smart Routing**: Different notification channels for different teams
- **Alert Inhibition**: Prevents alert spam during outages
- **Time-based Muting**: Maintenance windows and business hours

### 📊 **Rich Visualizations**
- **Pre-built Dashboards**: Application overview, system health, business metrics
- **Custom Dashboards**: Tailored for KlikkFlow workflow monitoring
- **Real-time Updates**: Live monitoring with configurable refresh rates
- **Mobile Responsive**: Access dashboards from any device

### 🔔 **Multiple Notification Channels**
- **Slack Integration**: Team-specific channels for different alert types
- **Email Notifications**: SMTP integration for email alerts
- **PagerDuty**: Critical alert escalation
- **Webhook Support**: Custom notification endpoints

## 🛠️ Setup and Configuration

### Prerequisites

- Docker and Docker Compose
- At least 4GB RAM and 10GB disk space
- Network access for pulling Docker images

### Initial Setup

1. **Run the setup script:**
```bash
./scripts/setup.sh setup
```

2. **Configure environment variables:**
```bash
# Edit the generated .env file
vi .env

# Update Slack webhooks, SMTP settings, etc.
```

3. **Start the monitoring stack:**
```bash
./scripts/setup.sh start
```

### Configuration Files

| File | Purpose |
|------|---------|
| `docker-compose.yml` | Service definitions and networking |
| `prometheus/prometheus.yml` | Scrape targets and alerting rules |
| `prometheus/rules/` | Alert rule definitions |
| `alertmanager/alertmanager.yml` | Alert routing and notifications |
| `grafana/datasources/` | Data source configurations |
| `grafana/dashboards/` | Dashboard provisioning |
| `blackbox/blackbox.yml` | Endpoint monitoring configuration |

## 📊 Dashboards

### KlikkFlow Overview Dashboard
- **Execution Metrics**: Success rate, execution counts, duration trends
- **API Performance**: Request rate, response time, error rate
- **Queue Status**: Backlog size, processing rate
- **System Health**: CPU, memory, disk usage

### System Infrastructure Dashboard
- **Node Metrics**: Detailed system resource monitoring
- **Container Metrics**: Docker container performance
- **Database Metrics**: MongoDB, Redis performance
- **Network Metrics**: Traffic, latency, packet loss

### Business Intelligence Dashboard
- **Workflow Analytics**: Most used workflows, execution patterns
- **User Metrics**: Active users, API usage
- **Integration Health**: Third-party service status
- **Performance Trends**: Historical performance analysis

## 🚨 Alerting Rules

### Critical Alerts
- **Service Down**: Backend, frontend, worker processes offline
- **Database Issues**: MongoDB, Redis connection failures
- **High Error Rate**: >5% API error rate
- **System Resources**: >90% memory usage, disk space low

### Warning Alerts
- **Performance Degradation**: High response times, queue backlog
- **Security Issues**: Failed login attempts, suspicious activity
- **Resource Usage**: High CPU usage, elevated memory consumption

### Business Alerts
- **Low Activity**: Decreased workflow creation rate
- **Integration Failures**: Third-party service issues
- **Credential Problems**: OAuth token expiration, test failures

## 🔧 Operations

### Management Commands

```bash
# Start monitoring stack
./scripts/setup.sh start

# Stop monitoring stack
./scripts/setup.sh stop

# Restart services
./scripts/setup.sh restart

# View service status
./scripts/setup.sh status

# View logs
./scripts/setup.sh logs [service_name]

# Validate configuration
./scripts/setup.sh validate

# Clean up (remove all data)
./scripts/setup.sh cleanup
```

### Manual Service Management

```bash
# Start specific services
docker-compose up -d prometheus grafana

# Scale workers
docker-compose up -d --scale node-exporter=3

# View logs for specific service
docker-compose logs -f prometheus

# Execute commands in containers
docker-compose exec prometheus promtool query instant 'up'
```

## 📋 Monitoring Checklist

### Application Metrics to Implement

- [ ] **HTTP Metrics**: Request count, duration, status codes
- [ ] **Workflow Metrics**: Execution count, success rate, duration
- [ ] **Queue Metrics**: Size, processing rate, wait time
- [ ] **Database Metrics**: Query count, duration, connection pool
- [ ] **Cache Metrics**: Hit rate, eviction rate, memory usage
- [ ] **Business Metrics**: User count, workflow creation rate

### Recommended Application Code Changes

```javascript
// Example: Add Prometheus metrics to your Node.js application
const prometheus = require('prom-client');

// Create custom metrics
const httpRequestDuration = new prometheus.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code']
});

const workflowExecutions = new prometheus.Counter({
  name: 'klikkflow_workflow_executions_total',
  help: 'Total number of workflow executions',
  labelNames: ['workflow_id', 'status']
});

// Instrument your code
app.use((req, res, next) => {
  const startTime = Date.now();

  res.on('finish', () => {
    const duration = (Date.now() - startTime) / 1000;
    httpRequestDuration
      .labels(req.method, req.route?.path || req.path, res.statusCode)
      .observe(duration);
  });

  next();
});

// Expose metrics endpoint
app.get('/metrics', (req, res) => {
  res.set('Content-Type', prometheus.register.contentType);
  res.end(prometheus.register.metrics());
});
```

## 🔍 Troubleshooting

### Common Issues

#### Services Not Starting
```bash
# Check Docker daemon
systemctl status docker

# Check available ports
netstat -tulpn | grep :9090

# Check logs
docker-compose logs prometheus
```

#### High Memory Usage
```bash
# Reduce Prometheus retention
# Edit prometheus.yml:
# storage:
#   tsdb:
#     retention.time: 7d
#     retention.size: 5GB

# Restart Prometheus
docker-compose restart prometheus
```

#### AlertManager Not Sending Alerts
```bash
# Test AlertManager config
docker-compose exec alertmanager amtool check-config /etc/alertmanager/alertmanager.yml

# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify SMTP settings
docker-compose logs alertmanager
```

#### Missing Metrics
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets

# Verify service discovery
curl http://localhost:9090/api/v1/label/__name__/values

# Check application /metrics endpoint
curl http://your-app:port/metrics
```

### Performance Tuning

#### Prometheus Optimization
```yaml
# prometheus.yml
global:
  scrape_interval: 15s     # Increase for lower resource usage
  evaluation_interval: 30s # Reduce evaluation frequency

storage:
  tsdb:
    retention.time: 7d     # Reduce retention period
    retention.size: 5GB    # Set maximum storage size
```

#### Grafana Optimization
```bash
# Reduce dashboard refresh rate
# Set default refresh to 1m instead of 5s

# Limit query time range
# Use relative time ranges like "Last 1 hour"

# Optimize queries
# Use recording rules for complex queries
```

## 🔐 Security Considerations

### Network Security
- All services run in isolated Docker network
- No external access to monitoring ports by default
- Use reverse proxy for external access

### Authentication
- Change default Grafana password
- Configure LDAP/OAuth for Grafana if needed
- Secure AlertManager with basic auth

### Data Protection
- Encrypt metrics in transit with TLS
- Regular backup of Grafana dashboards
- Secure storage of alert notification credentials

## 📚 Additional Resources

- [Prometheus Documentation](https://prometheus.io/docs/)
- [Grafana Documentation](https://grafana.com/docs/)
- [AlertManager Documentation](https://prometheus.io/docs/alerting/latest/alertmanager/)
- [Node Exporter Metrics](https://github.com/prometheus/node_exporter)
- [Best Practices for Monitoring](https://prometheus.io/docs/practices/)

## 🤝 Contributing

To extend the monitoring stack:

1. Add new exporters to `docker-compose.yml`
2. Update Prometheus scrape configuration
3. Create relevant alerting rules
4. Build custom Grafana dashboards
5. Update documentation

## 📄 License

This monitoring configuration is part of the KlikkFlow project and follows the same licensing terms.