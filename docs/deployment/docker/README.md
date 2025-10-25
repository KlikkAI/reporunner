# Docker Deployment Documentation

Complete Docker deployment documentation for KlikkFlow workflow automation platform.

**Last Updated**: October 21, 2025

---

## 📚 Docker Documentation Index

### Quick Start
- **[Root DOCKER.md](../../../DOCKER.md)** - One-command installation and quick start guide
  - ⚡ One-command installer (recommended)
  - Manual Docker Compose setup
  - Docker profiles (core, monitoring, HA, full)
  - Common commands and troubleshooting

### Advanced Guides
- **[OPENSOURCE_GUIDE.md](./OPENSOURCE_GUIDE.md)** - Complete guide for open source distribution
  - Security best practices (200+ checklist items)
  - Multi-registry distribution (Docker Hub, GHCR)
  - Multi-architecture builds (amd64, arm64)
  - CI/CD automation
  - Image signing and scanning
  - Size optimization techniques

- **[COMPARISON.md](./COMPARISON.md)** - Docker distribution comparison
  - KlikkFlow vs n8n vs Sim Studio
  - Architecture analysis (22 containers max)
  - Profile-based system benefits
  - Production readiness comparison
  - Resource requirements

### Historical Documentation
- **[docs/history/docker/FIXES.md](../../history/docker/FIXES.md)** - Docker configuration fixes archive
  - Historical bug fixes
  - Package structure updates
  - Build optimization history

---

## 🐳 Quick Start

### One-Command Installation (Recommended)

```bash
curl -fsSL https://raw.githubusercontent.com/KlikkAI/klikkflow/main/scripts/install.sh | sh
```

**What it does:**
- ✅ Checks prerequisites (Docker 24+, Docker Compose v2)
- ✅ Downloads pre-built images from GHCR
- ✅ Generates secure secrets (JWT_SECRET, ENCRYPTION_KEY)
- ✅ Starts 6 core services (Frontend, Backend, Worker, MongoDB, PostgreSQL, Redis)
- ✅ Waits for health checks
- ✅ Opens http://localhost:3000

**Default credentials:** `admin@klikkflow.local` / `admin123`

For more details, see [Root DOCKER.md](../../../DOCKER.md).

---

## 📦 Docker Profiles

KlikkFlow uses Docker Compose profiles for progressive complexity:

### Available Profiles

| Profile | Containers | Use Case | Additional RAM |
|---------|------------|----------|----------------|
| **Core** (default) | 6 | Development, testing | 2GB |
| **monitoring** | +6 | Add Prometheus, Grafana, exporters | +2GB |
| **ha** | +4 | High availability, load balancer | +2GB |
| **logging** | +3 | ELK stack for centralized logs | +2GB |
| **dev** | +3 | Dev tools (Mailhog, Adminer, Redis Commander) | +1GB |
| **full** | 22 total | Enterprise production | 12GB total |

### Usage Examples

```bash
# Core only (6 containers)
docker compose up -d

# Core + monitoring (12 containers)
docker compose --profile monitoring up -d

# Core + HA (10 containers)
docker compose --profile ha up -d

# Full stack (22 containers)
docker compose --profile full up -d

# Custom combination
docker compose --profile monitoring --profile ha up -d
```

---

## 🏗️ Architecture Overview

### Core Services (6 containers)

1. **Frontend** - React 19 web application (Nginx) - Port 3000
2. **Backend** - Express.js API server - Port 3001
3. **Worker** - BullMQ job processor
4. **MongoDB** - Primary database - Port 27017
5. **PostgreSQL + pgvector** - AI/vector database - Port 5432
6. **Redis** - Cache and job queue - Port 6379

### Monitoring Profile (+6 containers)

7. **Prometheus** - Metrics collection - Port 9090
8. **Grafana** - Visualization (7 dashboards) - Port 3030
9. **Alertmanager** - Alert routing - Port 9093
10. **Node Exporter** - System metrics
11. **Redis Exporter** - Redis metrics
12. **MongoDB Exporter** - MongoDB metrics

### HA Profile (+4 containers)

13. **Nginx Load Balancer** - HTTP load balancing - Ports 80/443
14. **Backend-2** - Second backend instance
15. **Worker-2** - Second worker instance
16. **Backup Service** - Automated S3 backups

### Logging Profile (+3 containers)

17. **Elasticsearch** - Log storage - Port 9200
18. **Kibana** - Log visualization - Port 5601
19. **Filebeat** - Log shipping

### Dev Tools Profile (+3 containers)

20. **Mailhog** - Email testing - Port 8025 (UI), 1025 (SMTP)
21. **Adminer** - Database GUI - Port 8080
22. **Redis Commander** - Redis GUI - Port 8081

---

## 🔧 Configuration

### Environment Variables

Key environment variables (see `.env.example` for complete list):

```bash
# Core
NODE_ENV=production
JWT_SECRET=<generated-secret>
ENCRYPTION_KEY=<32-char-key>

# Databases
MONGODB_URI=mongodb://mongo:27017/klikkflow
POSTGRES_URI=postgresql://postgres:password@postgres:5432/klikkflow
REDIS_URL=redis://redis:6379

# AI Services (optional)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_AI_API_KEY=...

# OAuth (optional)
GMAIL_CLIENT_ID=...
GMAIL_CLIENT_SECRET=...
```

### Secrets Generation

```bash
# Generate JWT secret
echo "JWT_SECRET=$(openssl rand -base64 32)" >> .env

# Generate encryption key (32 characters)
echo "ENCRYPTION_KEY=$(openssl rand -hex 16)" >> .env
```

---

## 📊 Monitoring & Observability

When using the **monitoring profile**, access:

- **Grafana**: http://localhost:3030 (admin/admin)
  - 7 pre-configured dashboards
  - API Performance Dashboard
  - Workflow Execution Dashboard
  - System Health Dashboard
  - Database Performance Dashboard
  - Queue Metrics Dashboard
  - Security Dashboard
  - Business Metrics Dashboard

- **Prometheus**: http://localhost:9090
  - Metrics exploration
  - Query interface

- **Alertmanager**: http://localhost:9093
  - Alert management
  - Alert routing

---

## 🔒 Security Best Practices

### Production Checklist

- [ ] Generate strong JWT_SECRET and ENCRYPTION_KEY
- [ ] Use non-root users in containers (already configured)
- [ ] Enable security_opt: no-new-privileges (already configured)
- [ ] Set resource limits on all containers (already configured)
- [ ] Use SSL/TLS for external access
- [ ] Rotate secrets regularly
- [ ] Enable Docker Content Trust for image signing
- [ ] Run security scans (Trivy, Snyk)
- [ ] Configure firewall rules
- [ ] Enable audit logging

For complete security guide, see [OPENSOURCE_GUIDE.md](./OPENSOURCE_GUIDE.md).

---

## 📈 Scaling

### Horizontal Scaling

```bash
# Scale workers
docker compose up -d --scale worker=3

# Scale backends (with HA profile)
docker compose --profile ha up -d --scale backend=3
```

### Vertical Scaling

Edit `docker-compose.yml` to adjust resource limits:

```yaml
services:
  backend:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 2G
        reservations:
          cpus: '1'
          memory: 1G
```

---

## 🚨 Troubleshooting

### Common Issues

**Services won't start:**
```bash
# Check logs
docker compose logs -f

# Check specific service
docker compose logs -f backend
```

**Port already in use:**
```bash
# Find process using port
lsof -i :3000

# Use custom ports
FRONTEND_PORT=8080 BACKEND_PORT=8081 docker compose up -d
```

**Out of memory:**
```bash
# Check resource usage
docker stats

# Prune unused resources
docker system prune -a
```

**Health check failures:**
```bash
# Verify health endpoints
curl http://localhost:3001/api/health
curl http://localhost:3000/health
```

For more troubleshooting, see [Root DOCKER.md](../../../DOCKER.md#-troubleshooting).

---

## 📚 Additional Resources

### Official Documentation
- [Deployment Overview](../README.md) - Complete deployment guide
- [Kubernetes Deployment](../kubernetes/README.md) - K8s + Helm deployment
- [Cloud Provider Guides](../cloud-providers/README.md) - AWS, GCP, Azure

### Docker-Specific Resources
- [Docker Official Docs](https://docs.docker.com/)
- [Docker Compose Specification](https://docs.docker.com/compose/compose-file/)
- [Multi-stage Builds](https://docs.docker.com/build/building/multi-stage/)
- [Health Checks](https://docs.docker.com/engine/reference/builder/#healthcheck)

### KlikkFlow Resources
- [Contributing Guide](../../../CONTRIBUTING.md)
- [Main README](../../../README.md)
- [Architecture Documentation](../../project-planning/architecture/ENTERPRISE_ARCHITECTURE.md)

---

## 🎯 Next Steps

1. **Start with Quick Start** - Use the one-command installer
2. **Explore Profiles** - Test different deployment configurations
3. **Configure AI Services** - Add your API keys for LLM integration
4. **Set Up Monitoring** - Enable Grafana dashboards
5. **Plan for Production** - Review security and HA requirements
6. **Read Advanced Guides** - Explore OPENSOURCE_GUIDE.md and COMPARISON.md

---

**Last Updated**: October 21, 2025
**Maintained By**: KlikkFlow DevOps Team
**Questions?** Open an issue at [GitHub Issues](https://github.com/KlikkAI/klikkflow/issues)
