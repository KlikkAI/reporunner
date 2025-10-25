# VPS Production Deployment - October 25, 2025

## Summary

Successfully deployed KlikkFlow to production VPS using blue-green deployment strategy with GitHub Actions self-hosted runner and Docker Hub for public image distribution.

## Deployment Details

**Date**: October 25, 2025
**Environment**: Production VPS (194.140.199.62)
**Strategy**: Blue-Green Deployment
**Registry**: Docker Hub (public) + GitHub Container Registry (backup)

### Production URLs
- **Frontend**: https://app.klikk.ai ✅
- **Backend API**: https://api.klikk.ai ✅

### Active Environment
- **Environment**: Green
- **Ports**:
  - Frontend: 3020 → 80
  - Backend: 3021 → 3001
  - Worker: (internal only)

### Container Status
```
klikkflow-frontend-green    Up (healthy)    klikkai/frontend:latest
klikkflow-backend-green     Up (healthy)    klikkai/backend:latest
klikkflow-worker-green      Up (healthy)    klikkai/worker:latest
```

### Infrastructure Services
```
klikkflow-mongo             Up 21 hours (healthy)    mongo:7.0
klikkflow-postgres          Up 21 hours (healthy)    pgvector/pgvector:pg16
klikkflow-redis             Up 21 hours (healthy)    redis:7-alpine
```

## Issues Resolved

### 1. Docker Hub Registry Name Mismatch
**Problem**: Workflows used `klikkflow/*` but Docker Hub username was `klikkai`
**Solution**: Updated `DOCKERHUB_IMAGE_PREFIX` in workflows to `klikkai`
**Files Changed**:
- `.github/workflows/docker-publish.yml`
- `.github/workflows/vps-deploy.yml`
- `docker-compose.green.yml`
- `docker-compose.blue.yml`

### 2. Docker Compose v2 Compatibility
**Problem**: VPS uses Docker Compose v2 (`docker compose`) but scripts used v1 (`docker-compose`)
**Solution**: Updated `scripts/vps/deploy.sh` to use `docker compose` command
**Impact**: Deployment script now compatible with modern Docker installations

### 3. Docker Network Isolation
**Problem**: Backend/worker couldn't connect to MongoDB, PostgreSQL, Redis
**Cause**: Infrastructure services not connected to `klikkflow-network`
**Solution**: Connected infrastructure services to network:
```bash
docker network connect klikkflow-network klikkflow-mongo
docker network connect klikkflow-network klikkflow-postgres
docker network connect klikkflow-network klikkflow-redis
```

### 4. Nginx Variable Resolution
**Problem**: API returning 502 Bad Gateway with error "no resolver defined to resolve localhost"
**Cause**: Nginx can't resolve variables in `proxy_pass` without a DNS resolver
**Solution**: Changed from variable-based to direct port configuration:
```nginx
# Before:
set $backend_port 3021;
proxy_pass http://localhost:$backend_port;

# After:
proxy_pass http://localhost:3021;
```

## Configuration Changes

### GitHub Secrets (10 total)
All secrets successfully configured via GitHub web UI:
- `VPS_JWT_SECRET`
- `VPS_CREDENTIAL_ENCRYPTION_KEY`
- `VPS_SESSION_SECRET`
- `VPS_MONGO_ROOT_PASSWORD`
- `VPS_POSTGRES_PASSWORD`
- `VPS_MONGODB_URI`
- `VPS_POSTGRES_URL`
- `VPS_REDIS_URL`
- `DOCKERHUB_USERNAME` (klikkai)
- `DOCKERHUB_TOKEN`

### Nginx Configuration
**File**: `/etc/nginx/sites-available/klikkflow`

**Frontend (app.klikk.ai)**:
- Upstream: `localhost:3020` (green)
- SSL: Let's Encrypt managed
- Features: Gzip, security headers, caching

**Backend (api.klikk.ai)**:
- Proxy: `localhost:3021` (green)
- SSL: Let's Encrypt managed
- Features: CORS, WebSocket support, rate limiting zones

## Docker Images

### Published to Docker Hub (Public)
```
klikkai/frontend:latest (linux/amd64, linux/arm64)
klikkai/backend:latest  (linux/amd64, linux/arm64)
klikkai/worker:latest   (linux/amd64, linux/arm64)
```

### Backup on GitHub Container Registry
```
ghcr.io/klikkai/frontend:latest
ghcr.io/klikkai/backend:latest
ghcr.io/klikkai/worker:latest
```

## Deployment Process

### Manual Deployment Steps
1. ✅ Configure GitHub Secrets (10 secrets)
2. ✅ Verify self-hosted runner active
3. ✅ Fix Docker Hub username in workflows
4. ✅ Build and push images to both registries
5. ✅ Copy updated compose files to VPS
6. ✅ Pull correct images (`klikkai/*`)
7. ✅ Start green environment
8. ✅ Connect infrastructure to Docker network
9. ✅ Verify container health
10. ✅ Update Nginx configuration
11. ✅ Test and reload Nginx
12. ✅ Verify production URLs

### Future Automated Deployments
GitHub Actions workflow will handle:
1. Build and push Docker images on push to `main`
2. Deploy to VPS via self-hosted runner
3. Health checks and traffic switching
4. Automatic rollback on failure

## Health Verification

### Local Health Checks (Passed ✅)
```bash
curl http://localhost:3020/health  # Frontend: "healthy"
curl http://localhost:3021/health  # Backend: {"status":"ok",...}
```

### Production Health Checks (Passed ✅)
```bash
curl https://app.klikk.ai/health   # Frontend: "healthy"
curl https://api.klikk.ai/health   # Backend: {"status":"ok",...}
```

## Network Architecture

```
Internet
  ↓
Nginx (Port 443 - SSL)
  ├─ app.klikk.ai → localhost:3020 (Green Frontend)
  └─ api.klikk.ai → localhost:3021 (Green Backend)
                         ↓
              klikkflow-network
                         ↓
        ┌────────────────┴────────────────┐
        ↓                ↓                ↓
   MongoDB:27017   PostgreSQL:5432   Redis:6379
```

## Key Insights

`★ Insight ─────────────────────────────────────`
**Docker Compose v2 Migration**: The transition from `docker-compose` to `docker compose` is becoming standard. Always check Docker version compatibility when deploying to new environments.

**Network Isolation**: Docker networks provide excellent isolation but require explicit connection. Infrastructure services shared across blue-green environments must be manually connected to each environment's network.

**Nginx Variable Resolution**: When using variables in `proxy_pass` directives, Nginx requires a DNS resolver. For localhost connections, direct port numbers are more reliable.

**Multi-Registry Strategy**: Publishing to both Docker Hub (public) and GHCR (backup) provides redundancy and flexibility for public/private use cases.
`─────────────────────────────────────────────────`

## Next Steps

### Immediate
- [x] Application deployed and accessible
- [x] All containers healthy
- [x] Production URLs verified

### Future Enhancements
- [ ] Automate blue environment cleanup after successful green deployment
- [ ] Add monitoring alerts via Grafana
- [ ] Implement automated rollback on health check failures
- [ ] Set up log aggregation for centralized monitoring
- [ ] Configure automatic SSL certificate renewal verification

## Monitoring

### Container Monitoring
```bash
# Check container health
docker ps --filter 'name=green'

# View logs
docker logs klikkflow-frontend-green
docker logs klikkflow-backend-green
docker logs klikkflow-worker-green
```

### Nginx Monitoring
```bash
# Access logs
tail -f /var/log/nginx/klikkflow-frontend-access.log
tail -f /var/log/nginx/klikkflow-api-access.log

# Error logs
tail -f /var/log/nginx/klikkflow-frontend-error.log
tail -f /var/log/nginx/klikkflow-api-error.log
```

## Rollback Procedure

If issues are detected, rollback to blue environment:

```bash
# 1. Switch Nginx to blue (port 3010/3011)
sudo sed -i 's|server localhost:3020;|# server localhost:3020;|' /etc/nginx/sites-available/klikkflow
sudo sed -i 's|# server localhost:3010;|server localhost:3010;|' /etc/nginx/sites-available/klikkflow
sudo sed -i 's|proxy_pass http://localhost:3021;|proxy_pass http://localhost:3011;|g' /etc/nginx/sites-available/klikkflow

# 2. Test and reload
sudo nginx -t && sudo systemctl reload nginx

# 3. Verify
curl https://app.klikk.ai/health
curl https://api.klikk.ai/health
```

## Documentation References

- [Blue-Green Deployment Strategy](../sessions/SESSION_2025-10-25_VPS_DEPLOYMENT.md)
- [GitHub Actions Workflows](../../.github/workflows/)
- [Docker Compose Configurations](../../docker-compose.*.yml)
- [Nginx Configuration](../../nginx/nginx-lb.conf)

---

**Status**: ✅ Production Deployment Successful
**Deployed By**: Claude Code (Automated)
**Verified By**: Health check endpoints
**Deployment Duration**: ~2 hours (including troubleshooting)
