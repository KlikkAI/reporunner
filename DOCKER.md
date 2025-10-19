# 🐳 Reporunner Docker Quick Start Guide

Complete guide for deploying Reporunner using Docker and Docker Compose.

**Last Updated:** October 19, 2025

---

## 📋 Table of Contents

- [Prerequisites](#-prerequisites)
- [Quick Start](#-quick-start)
- [Docker Profiles](#-docker-profiles)
- [Environment Configuration](#-environment-configuration)
- [Service Access URLs](#-service-access-urls)
- [Common Commands](#-common-commands)
- [Troubleshooting](#-troubleshooting)
- [Production Deployment](#-production-deployment)
- [Kubernetes Deployment](#-kubernetes-deployment)

---

## ✅ Prerequisites

### Required Software

- **Docker**: Version 24.0+ ([Install Docker](https://docs.docker.com/get-docker/))
- **Docker Compose**: Version 2.20+ (included with Docker Desktop)
- **Git**: For cloning the repository
- **8GB RAM minimum** (16GB+ recommended for full profile)

### Verify Installation

```bash
docker --version          # Should be 24.0+
docker-compose --version  # Should be 2.20+
```

---

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/reporunner/reporunner.git
cd reporunner
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env and set required values (especially JWT_SECRET)
nano .env
```

**⚠️ IMPORTANT:** Generate a strong JWT_SECRET:

```bash
# Generate a secure random key
openssl rand -base64 32

# Add it to your .env file
JWT_SECRET=<generated-key-here>
```

### 3. Start Core Services (Recommended for First Time)

```bash
# Start core services only (6 containers)
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Access Reporunner

Once services are running:
- **Frontend UI**: http://localhost:3000
- **Backend API**: http://localhost:3001
- **API Health**: http://localhost:3001/health

---

## 🎯 Docker Profiles

Reporunner uses a **profile-based architecture** for flexible deployment:

### Core Services (Default - 6 containers)

```bash
docker-compose up -d
```

**Includes:**
- Frontend (React + Nginx)
- Backend (Express API)
- Worker (BullMQ)
- MongoDB (Primary Database)
- PostgreSQL + pgvector (AI Database)
- Redis (Cache & Queue)

**Resource Requirements:** ~4GB RAM, 2 CPU cores

---

### Monitoring Profile (+6 containers)

```bash
docker-compose --profile monitoring up -d
```

**Adds:**
- Prometheus (Metrics)
- Grafana (Visualization)
- Alertmanager (Alerts)
- Node Exporter (System metrics)
- Redis Exporter
- MongoDB Exporter

**Access:**
- Grafana: http://localhost:3030 (admin/admin123)
- Prometheus: http://localhost:9090
- Alertmanager: http://localhost:9093

**Resource Requirements:** +2GB RAM, +1 CPU core

---

### High Availability Profile (+4 containers)

```bash
docker-compose --profile ha up -d
```

**Adds:**
- Nginx Load Balancer
- Backend Instance #2
- Worker Instance #2
- Backup Service (automated backups)

**Access:**
- Load Balancer: http://localhost:80

**Resource Requirements:** +4GB RAM, +2 CPU cores

---

### Logging Profile (+3 containers)

```bash
docker-compose --profile logging up -d
```

**Adds:**
- Elasticsearch (Log Storage)
- Kibana (Log Visualization)
- Filebeat (Log Shipping)

**Access:**
- Kibana: http://localhost:5601
- Elasticsearch: http://localhost:9200

**Resource Requirements:** +2GB RAM, +1 CPU core

---

### Developer Tools Profile (+3 containers)

```bash
docker-compose --profile dev up -d
```

**Adds:**
- Mailhog (Email Testing)
- Adminer (Database Management)
- Redis Commander (Redis GUI)

**Access:**
- Mailhog: http://localhost:8025
- Adminer: http://localhost:8080
- Redis Commander: http://localhost:8081

**Resource Requirements:** +500MB RAM

---

### Full Stack (All Services - 22 containers)

```bash
docker-compose --profile full up -d
```

**Includes everything** - All services from all profiles.

**Resource Requirements:** ~12GB RAM, 4 CPU cores

---

### Mix & Match Profiles

Combine multiple profiles for custom deployments:

```bash
# Monitoring + High Availability
docker-compose --profile monitoring --profile ha up -d

# Monitoring + Logging + Dev Tools
docker-compose --profile monitoring --profile logging --profile dev up -d
```

---

## ⚙️ Environment Configuration

### Minimal Required Configuration

Edit `.env` and set these required values:

```env
# REQUIRED: Generate with: openssl rand -base64 32
JWT_SECRET=your-super-secret-jwt-key-change-this

# Database passwords (change for production)
MONGO_ROOT_PASSWORD=changeme
POSTGRES_PASSWORD=changeme
REDIS_PASSWORD=changeme
```

### Optional AI Services

```env
# OpenAI (for GPT models)
OPENAI_API_KEY=sk-your-openai-key

# Anthropic (for Claude models)
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key

# Google AI (for Gemini models)
GOOGLE_AI_API_KEY=your-google-ai-key
```

### Optional Email Configuration

```env
# SMTP settings
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@reporunner.com
```

### See Full Configuration

Check `.env.example` for complete list of all available configuration options.

---

## 🌐 Service Access URLs

### Core Services
| Service | URL | Default Credentials |
|---------|-----|---------------------|
| **Frontend** | http://localhost:3000 | Sign up via UI |
| **Backend API** | http://localhost:3001 | - |
| **API Docs** | http://localhost:3001/api-docs | - |

### Databases (Direct Access)
| Service | URL | Credentials |
|---------|-----|-------------|
| **MongoDB** | mongodb://localhost:27017 | admin / changeme |
| **PostgreSQL** | postgresql://localhost:5432 | postgres / changeme |
| **Redis** | redis://localhost:6379 | Password: changeme |

### Monitoring (--profile monitoring)
| Service | URL | Credentials |
|---------|-----|-------------|
| **Grafana** | http://localhost:3030 | admin / admin123 |
| **Prometheus** | http://localhost:9090 | - |
| **Alertmanager** | http://localhost:9093 | - |

### Logging (--profile logging)
| Service | URL | Credentials |
|---------|-----|-------------|
| **Kibana** | http://localhost:5601 | - |
| **Elasticsearch** | http://localhost:9200 | - |

### Dev Tools (--profile dev)
| Service | URL | Credentials |
|---------|-----|-------------|
| **Mailhog** | http://localhost:8025 | - |
| **Adminer** | http://localhost:8080 | See database credentials |
| **Redis Commander** | http://localhost:8081 | - |

---

## 🛠️ Common Commands

### Starting Services

```bash
# Start core services
docker-compose up -d

# Start with monitoring
docker-compose --profile monitoring up -d

# Start with logs visible
docker-compose up

# Start specific service
docker-compose up -d backend
```

### Stopping Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (⚠️ deletes all data)
docker-compose down -v

# Stop specific service
docker-compose stop backend
```

### Viewing Logs

```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend

# Last 100 lines
docker-compose logs --tail=100 -f backend
```

### Restarting Services

```bash
# Restart all services
docker-compose restart

# Restart specific service
docker-compose restart backend

# Rebuild and restart after code changes
docker-compose up -d --build backend
```

### Scaling Services

```bash
# Scale workers to 3 instances
docker-compose up -d --scale worker=3

# Scale backend to 2 instances
docker-compose up -d --scale backend=2
```

### Executing Commands

```bash
# Open shell in backend container
docker-compose exec backend sh

# Run pnpm command in backend
docker-compose exec backend pnpm install

# Access MongoDB shell
docker-compose exec mongo mongosh

# Access PostgreSQL shell
docker-compose exec postgres psql -U postgres -d reporunner
```

### Cleanup

```bash
# Remove stopped containers
docker-compose rm

# Remove all containers, networks, volumes
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Full cleanup (⚠️ removes everything)
docker system prune -a --volumes
```

---

## 🔧 Troubleshooting

### Service Won't Start

**Check service status:**
```bash
docker-compose ps
```

**View detailed logs:**
```bash
docker-compose logs <service-name>
```

**Common issues:**

1. **Port already in use:**
   ```bash
   # Check what's using the port
   lsof -i :3000  # or :3001, :27017, etc.

   # Change port in .env file
   FRONTEND_PORT=3100
   ```

2. **Out of memory:**
   ```bash
   # Check Docker resource limits
   docker stats

   # Increase Docker Desktop memory allocation (Mac/Windows)
   # Settings > Resources > Memory > 8GB+
   ```

3. **Database connection errors:**
   ```bash
   # Ensure databases are healthy
   docker-compose ps

   # Wait for databases to be ready
   docker-compose logs mongo | grep "Waiting for connections"
   docker-compose logs postgres | grep "ready to accept connections"
   ```

### Container Keeps Restarting

```bash
# Check container logs
docker-compose logs -f <service-name>

# Check health status
docker inspect <container-name> | grep -A 10 "Health"

# Restart with fresh state
docker-compose down
docker-compose up -d
```

### Permission Errors

```bash
# Fix volume permissions
docker-compose exec backend chown -R reporunner:nodejs /app

# Run as root temporarily (not recommended for production)
docker-compose exec -u root backend sh
```

### Network Issues

```bash
# Recreate networks
docker-compose down
docker network prune
docker-compose up -d

# Check network connectivity
docker-compose exec backend ping postgres
docker-compose exec backend ping mongo
```

### Rebuilding After Code Changes

```bash
# Rebuild specific service
docker-compose build backend

# Rebuild and restart
docker-compose up -d --build backend

# Rebuild everything (no cache)
docker-compose build --no-cache
docker-compose up -d
```

---

## 🏭 Production Deployment

### Using docker-compose.prod.yml

The production compose file is optimized for production use:

```bash
# Start production stack
docker-compose -f docker-compose.prod.yml up -d

# With monitoring
docker-compose -f docker-compose.prod.yml --profile monitoring up -d
```

### Production Checklist

#### Security

- [ ] Generate strong `JWT_SECRET` (32+ characters)
- [ ] Change all default passwords
- [ ] Enable SSL/TLS for all connections
- [ ] Configure firewall rules (only expose 80/443)
- [ ] Set up secrets management (AWS Secrets Manager, Vault)
- [ ] Enable database encryption at rest
- [ ] Configure regular security scans

#### Databases

- [ ] Use managed database services (AWS RDS, MongoDB Atlas)
- [ ] Enable automated backups (daily minimum)
- [ ] Configure replication for high availability
- [ ] Set up monitoring and alerting
- [ ] Enable SSL/TLS connections
- [ ] Configure proper retention policies

#### Networking

- [ ] Set up reverse proxy (Nginx/Traefik)
- [ ] Configure SSL certificates (Let's Encrypt)
- [ ] Enable DDoS protection (CloudFlare, AWS Shield)
- [ ] Set up load balancing
- [ ] Configure CDN for static assets
- [ ] Enable rate limiting

#### Monitoring

- [ ] Configure Prometheus alerting rules
- [ ] Set up Grafana dashboards
- [ ] Enable ELK stack for logging
- [ ] Configure uptime monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Configure performance monitoring

#### Backup & Recovery

- [ ] Enable automated backups (daily)
- [ ] Test backup restoration procedure
- [ ] Configure backup retention (30+ days)
- [ ] Set up off-site backup storage
- [ ] Document recovery procedures
- [ ] Schedule regular disaster recovery drills

### Environment-Specific Configurations

**Staging:**
```bash
docker-compose -f docker-compose.prod.yml up -d
# Use managed databases
# Enable monitoring
# Smaller instance sizes
```

**Production:**
```bash
docker-compose -f docker-compose.prod.yml --profile full up -d
# Use managed databases (multi-AZ)
# Enable full monitoring + logging
# Enable high availability
# Auto-scaling enabled
```

---

## ☸️ Kubernetes Deployment

For production-grade Kubernetes deployment, see:

- **Helm Charts:** `infrastructure/kubernetes/helm/reporunner/`
- **Kubernetes Manifests:** `infrastructure/kubernetes/manifests/`
- **Deployment Guide:** `docs/deployment/KUBERNETES.md`

**Quick Kubernetes deployment:**

```bash
# Install with Helm
cd infrastructure/kubernetes
helm install reporunner ./helm/reporunner \
  --set ingress.hosts[0].host=your-domain.com \
  --set postgresql.auth.password=your-secure-password

# Check status
kubectl get pods -n reporunner

# View logs
kubectl logs -f -n reporunner deployment/reporunner-backend
```

---

## 📚 Additional Resources

- **Architecture Documentation:** [CLAUDE.md](./CLAUDE.md)
- **Contributing Guide:** [CONTRIBUTING.md](./CONTRIBUTING.md)
- **API Documentation:** [docs/api/](./docs/api/)
- **Deployment Guides:** [docs/deployment/](./docs/deployment/)
- **Cloud Deployments:**
  - [AWS Deployment](./infrastructure/terraform/aws/)
  - [GCP Deployment](./infrastructure/terraform/gcp/)
  - [Azure Deployment](./infrastructure/terraform/azure/)

---

## 🆘 Getting Help

**Issues:**
- GitHub Issues: https://github.com/reporunner/reporunner/issues
- Check [Troubleshooting](#-troubleshooting) section above

**Community:**
- Discord: Join our community server
- Discussions: GitHub Discussions

**Commercial Support:**
- Enterprise support available
- Contact: support@reporunner.com

---

## 📝 License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

---

**Made with ❤️ by the Reporunner Team**
