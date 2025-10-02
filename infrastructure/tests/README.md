# Infrastructure Smoke Tests

This directory contains comprehensive smoke tests for validating Reporunner's infrastructure configurations.

## Overview

The smoke test suite validates:
- **Docker Compose** configurations (dev, prod, monitoring)
- **Kubernetes/Helm** charts and templates
- **Monitoring Stack** (Prometheus, Grafana, Alertmanager)
- **Logging Stack** (ELK: Elasticsearch, Logstash, Kibana, Filebeat, ElastAlert)
- **Observability Stack** (OpenTelemetry, Jaeger, Tempo, Loki)

## Quick Start

### Run All Tests

```bash
cd infrastructure/tests
./run-all-tests.sh
```

### Run Specific Test Suite

```bash
# Docker Compose tests
./run-all-tests.sh --test docker-compose-smoke-test

# Helm chart tests
./run-all-tests.sh --test helm-smoke-test

# Monitoring stack tests
./run-all-tests.sh --test monitoring-smoke-test

# Logging stack tests
./run-all-tests.sh --test logging-smoke-test

# Observability stack tests
./run-all-tests.sh --test observability-smoke-test
```

### Options

```bash
# Show detailed output
./run-all-tests.sh --verbose

# Stop on first failure
./run-all-tests.sh --fail-fast

# Combine options
./run-all-tests.sh --verbose --fail-fast
```

## Test Suites

### 1. Docker Compose Smoke Tests (`docker-compose-smoke-test.sh`)

**What it tests:**
- ✅ Validates all docker-compose.yml files (dev, prod, monitoring)
- ✅ Tests Dockerfile and Dockerfile.dev builds
- ✅ Verifies environment variable documentation
- ✅ Checks health check configurations
- ✅ Validates network isolation
- ✅ Verifies volume persistence

**Configurations tested:**
- `docker-compose.dev.yml`
- `infrastructure/docker/docker-compose.prod.yml`
- `infrastructure/docker/docker-compose.monitoring.yml`
- `infrastructure/docker/docker-compose.yml`
- `Dockerfile` (multi-stage build)
- `Dockerfile.dev`

**Requirements:**
- Docker Engine 20.10+
- Docker Compose V2

### 2. Helm Chart Smoke Tests (`helm-smoke-test.sh`)

**What it tests:**
- ✅ Validates Chart.yaml and values.yaml
- ✅ Runs `helm lint` on the chart
- ✅ Tests template rendering (dry-run)
- ✅ Verifies required templates exist
- ✅ Validates HPA, NetworkPolicy, ServiceMonitor
- ✅ Checks security best practices
- ✅ Tests custom values override

**Templates validated:**
- `deployment-backend.yaml`
- `deployment-frontend.yaml`
- `deployment-worker.yaml`
- `service.yaml`
- `ingress.yaml`
- `configmap.yaml`
- `secret.yaml`
- `hpa.yaml`
- `pvc.yaml`
- `job-migration.yaml`
- `cronjob-backup.yaml`
- `networkpolicy.yaml`
- `servicemonitor.yaml`
- `prometheusrule.yaml`

**Requirements:**
- Helm 3.8+

### 3. Monitoring Stack Smoke Tests (`monitoring-smoke-test.sh`)

**What it tests:**
- ✅ Validates Prometheus configuration
- ✅ Checks Prometheus alert rules
- ✅ Verifies scrape targets (5+ jobs required)
- ✅ Validates Grafana provisioning
- ✅ Tests Grafana dashboard JSON syntax
- ✅ Checks Alertmanager configuration
- ✅ Verifies exporters (node, MongoDB, PostgreSQL, Redis)
- ✅ Validates retention policies
- ✅ Tests monitoring docker-compose

**Configurations tested:**
- `infrastructure/monitoring/prometheus/prometheus.yml`
- `infrastructure/monitoring/prometheus/alerts/reporunner-alerts.yml`
- `infrastructure/monitoring/grafana/provisioning/datasources/`
- `infrastructure/monitoring/grafana/dashboard-configs/*.json`
- `infrastructure/monitoring/alertmanager/alertmanager.yml`

**Requirements:**
- `promtool` (optional, for advanced validation)
- `amtool` (optional, for Alertmanager validation)
- Python 3 (for JSON validation)
- Docker Compose

### 4. Logging Stack Smoke Tests (`logging-smoke-test.sh`)

**What it tests:**
- ✅ Validates Elasticsearch configuration
- ✅ Checks Kibana configuration
- ✅ Verifies Logstash pipeline syntax
- ✅ Validates Filebeat configuration
- ✅ Tests ElastAlert configuration and rules
- ✅ Checks SMTP configuration for alerts
- ✅ Verifies setup scripts
- ✅ Tests logging docker-compose

**Configurations tested:**
- `infrastructure/logging/elasticsearch.yml`
- `infrastructure/logging/kibana.yml`
- `infrastructure/logging/logstash/pipeline/*.conf`
- `infrastructure/logging/filebeat.yml`
- `infrastructure/logging/elastalert/config.yaml`
- `infrastructure/logging/elastalert/rules/*.yaml`
- `infrastructure/logging/elastalert/smtp_auth.yaml`

**Requirements:**
- `filebeat` (optional, for config validation)
- Docker Compose

### 5. Observability Stack Smoke Tests (`observability-smoke-test.sh`)

**What it tests:**
- ✅ Validates OpenTelemetry Collector configuration
- ✅ Checks OTLP receiver (gRPC and HTTP)
- ✅ Verifies multiple receiver protocols (Jaeger, Zipkin, Prometheus)
- ✅ Tests exporters (Jaeger, Tempo, Loki, Prometheus)
- ✅ Validates processors configuration
- ✅ Checks Jaeger, Tempo, Loki configurations
- ✅ Validates Promtail configuration
- ✅ Tests instrumentation libraries
- ✅ Verifies service pipelines (traces, metrics, logs)
- ✅ Checks port configurations

**Configurations tested:**
- `infrastructure/observability/otel-collector-config.yaml`
- `infrastructure/observability/jaeger-config.yaml`
- `infrastructure/observability/tempo-config.yaml`
- `infrastructure/observability/loki-config.yaml`
- `infrastructure/observability/promtail-config.yaml`
- `infrastructure/observability/instrumentation/`

**Requirements:**
- Docker Compose

## CI/CD Integration

### GitHub Actions

Add to `.github/workflows/infrastructure-tests.yml`:

```yaml
name: Infrastructure Tests

on:
  pull_request:
    paths:
      - 'infrastructure/**'
      - 'docker-compose*.yml'
      - 'Dockerfile*'
  push:
    branches:
      - main

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Install Helm
        uses: azure/setup-helm@v3
        with:
          version: 'v3.12.0'

      - name: Run Infrastructure Tests
        run: |
          cd infrastructure/tests
          chmod +x *.sh
          ./run-all-tests.sh --verbose
```

### GitLab CI

Add to `.gitlab-ci.yml`:

```yaml
infrastructure-tests:
  stage: test
  image: docker:latest
  services:
    - docker:dind
  before_script:
    - apk add --no-cache bash curl
    - curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
  script:
    - cd infrastructure/tests
    - chmod +x *.sh
    - ./run-all-tests.sh --verbose
  only:
    changes:
      - infrastructure/**
      - docker-compose*.yml
      - Dockerfile*
```

## Best Practices

1. **Run Before Deployment**: Always run these tests before deploying infrastructure changes

2. **CI/CD Integration**: Include in your CI/CD pipeline to catch issues early

3. **Regular Validation**: Run weekly to ensure configurations remain valid

4. **Update Tests**: When adding new infrastructure, add corresponding tests

5. **Fix Failures Immediately**: Don't ignore test failures - they indicate real issues

## Troubleshooting

### "Command not found" errors

Some tests require optional tools for advanced validation:
- `promtool` - Install from Prometheus releases
- `amtool` - Install from Alertmanager releases
- `filebeat` - Install from Elastic downloads

Tests will still run with basic validation if these tools are missing.

### Docker Compose validation fails

Ensure you have Docker Compose V2:
```bash
docker compose version
# Should show: Docker Compose version v2.x.x
```

### Helm tests fail

Install Helm 3.8 or later:
```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

## Adding New Tests

To add a new test suite:

1. Create a new test script in `infrastructure/tests/`:
   ```bash
   touch infrastructure/tests/my-new-test.sh
   chmod +x infrastructure/tests/my-new-test.sh
   ```

2. Follow the existing test script structure:
   - Use consistent output formatting
   - Track passed/failed tests
   - Print summary at the end
   - Exit with appropriate code (0 = success, 1 = failure)

3. Add to the `TESTS` array in `run-all-tests.sh`

4. Document in this README

## Support

For issues or questions:
- Open an issue on GitHub
- Check existing infrastructure documentation
- Review test output with `--verbose` flag

## License

Same as Reporunner project license.
