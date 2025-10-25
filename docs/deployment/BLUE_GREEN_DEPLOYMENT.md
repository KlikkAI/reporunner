# Blue-Green Deployment Strategy

Understanding how KlikkFlow achieves zero-downtime deployments on VPS using blue-green deployment.

**Last Updated**: October 25, 2025
**Strategy**: Blue-Green with Nginx Traffic Switching
**Downtime**: < 5 seconds (Nginx reload only)

---

## 🎯 What is Blue-Green Deployment?

Blue-green deployment is a release strategy that runs two identical production environments (Blue and Green). At any time, only one environment serves live production traffic, while the other is idle or being updated.

### Key Benefits

✅ **Zero Downtime**: Traffic switch happens instantly via Nginx reload (1-5 seconds)
✅ **Instant Rollback**: Switch back to previous environment if issues occur
✅ **Safe Testing**: Test new version in production environment before switching traffic
✅ **Database Safety**: Both environments share the same databases (no data sync needed)
✅ **Resource Efficient**: Application tier is duplicated, infrastructure is shared

---

## 🏗️ Architecture Overview

```
                                    ┌─────────────────┐
                                    │   Nginx (Host)  │
                                    │  Load Balancer  │
                                    └────────┬────────┘
                                             │
                        ┌────────────────────┼────────────────────┐
                        │                                         │
                 [Active/Inactive Switch]                         │
                        │                                         │
        ┌───────────────▼──────────┐              ┌──────────────▼─────────────┐
        │  Blue Environment        │              │  Green Environment         │
        │  Port: 3010 (Frontend)   │              │  Port: 3020 (Frontend)     │
        │  Port: 3011 (Backend)    │              │  Port: 3021 (Backend)      │
        │  ┌─────────────────────┐ │              │  ┌─────────────────────┐  │
        │  │ Frontend Container  │ │              │  │ Frontend Container  │  │
        │  │ Backend Container   │ │              │  │ Backend Container   │  │
        │  │ Worker Container    │ │              │  │ Worker Container    │  │
        │  └─────────────────────┘ │              │  └─────────────────────┘  │
        └──────────┬────────────────┘              └────────────┬──────────────┘
                   │                                            │
                   └────────────────┬───────────────────────────┘
                                    │
                        ┌───────────▼───────────┐
                        │  Shared Infrastructure │
                        │  - MongoDB             │
                        │  - PostgreSQL          │
                        │  - Redis               │
                        │  - Volumes             │
                        └────────────────────────┘
```

---

## 🔄 Deployment Flow

### Step 1: Current State
- **Blue** is serving production traffic (ports 3010/3011)
- **Green** is idle or stopped
- Nginx routes to `localhost:3010`

### Step 2: Deploy to Inactive Environment
```bash
# GitHub Actions workflow determines inactive environment (green)
# Pulls latest Docker images from Docker Hub
# Starts green environment (ports 3020/3021)
docker-compose -f docker-compose.green.yml up -d
```

### Step 3: Health Checks
```bash
# Automated health checks for 30 seconds
curl http://localhost:3020/health  # Frontend
curl http://localhost:3021/health  # Backend API

# Test database connectivity
# Test workflow execution
# Verify all services healthy
```

### Step 4: Traffic Switch
```bash
# Update Nginx configuration
# Comment out blue upstream, enable green upstream
sudo sed -i 's/server localhost:3010/# server localhost:3010/' /etc/nginx/sites-available/klikkflow
sudo sed -i 's/# server localhost:3020/server localhost:3020/' /etc/nginx/sites-available/klikkflow

# Test and reload Nginx (< 5 seconds downtime)
sudo nginx -t && sudo systemctl reload nginx
```

### Step 5: Verify Production
```bash
# Verify public endpoints
curl https://app.klikk.ai/health
curl https://api.klikk.ai/health

# Monitor for errors (30 seconds)
# Check logs for any issues
```

### Step 6: Cleanup Old Environment
```bash
# Wait 30 seconds for stability
sleep 30

# Stop blue environment
docker-compose -f docker-compose.blue.yml down

# Green is now the active environment
# Blue becomes the idle environment for next deployment
```

---

## 🔙 Rollback Process

If deployment fails at any step, automatic rollback occurs:

```bash
# Switch traffic back to blue
sudo sed -i 's/server localhost:3020/# server localhost:3020/' /etc/nginx/sites-available/klikkflow
sudo sed -i 's/# server localhost:3010/server localhost:3010/' /etc/nginx/sites-available/klikkflow
sudo systemctl reload nginx

# Stop failed green environment
docker-compose -f docker-compose.green.yml down

# System is back to previous stable state
```

**Rollback Time**: < 10 seconds

---

## 📊 Port Allocation

| Environment | Frontend | Backend | API Port |
|------------|----------|---------|----------|
| **Blue**   | 3010     | 3011    | 3011     |
| **Green**  | 3020     | 3021    | 3021     |
| **Public** | 443 (HTTPS) | 443 (HTTPS) | via Nginx |

### Nginx Routing
- `app.klikk.ai` → Active Frontend (3010 or 3020)
- `api.klikk.ai` → Active Backend (3011 or 3021)

---

## 🗄️ Database Strategy

### Shared Infrastructure

Both blue and green environments **share the same databases**:
- MongoDB (port 27017)
- PostgreSQL (port 5432)
- Redis (port 6379)

**Why?**
- No data synchronization needed
- Instant rollback without data loss
- Resource efficient (databases are resource-intensive)
- Consistent data across deployments

### Migration Strategy

Database migrations run **before** traffic switch:

```yaml
1. Deploy new environment (blue or green)
2. Run migrations on shared database
3. Health checks verify migrations succeeded
4. Switch traffic to new environment
5. Old environment still works with migrated schema
```

**Important**: Migrations must be backward-compatible for one deployment cycle.

---

## 🔍 Monitoring During Deployment

### Pre-Deployment Checks
- ✅ All GitHub secrets configured
- ✅ Docker images published successfully
- ✅ Self-hosted runner is online
- ✅ Sufficient disk space on VPS

### During Deployment
- 📊 Container health status
- 📊 Database connection tests
- 📊 API response times
- 📊 Frontend loading time
- 📊 Worker queue processing

### Post-Deployment Verification
- ✅ All containers running and healthy
- ✅ Public endpoints responding (< 500ms)
- ✅ No error spikes in logs
- ✅ Workflow execution works
- ✅ WebSocket connections stable

---

## ⚡ Performance Impact

### Resource Usage

**During Deployment** (both environments running):
- CPU: 2x application tier
- RAM: 2x application tier
- Disk: Shared (minimal impact)

**After Cleanup** (one environment):
- Normal production resource usage
- Old environment stopped and removed

### Deployment Timeline

| Phase | Duration |
|-------|----------|
| Pull images | 30-60s |
| Start containers | 15-30s |
| Health checks | 30s |
| Traffic switch | 2-5s ⚡ |
| Verification | 30s |
| Cleanup | 10s |
| **Total** | **~2-3 minutes** |

**Actual Downtime**: 2-5 seconds (Nginx reload only)

---

## 🎓 Best Practices

### 1. Always Test Health Checks
```bash
# Don't skip health checks in production
# Set skip_health_check: false in workflow
```

### 2. Monitor After Deployment
```bash
# Watch logs for 5-10 minutes after deployment
docker logs -f klikkflow-backend-green
sudo tail -f /var/log/nginx/klikkflow-api-error.log
```

### 3. Database Migration Safety
- Make migrations backward-compatible
- Test migrations on staging first
- Have rollback SQL scripts ready

### 4. Keep Both Environments Ready
- Don't delete old environment immediately
- Useful for quick comparison if issues arise
- Acts as instant rollback mechanism

### 5. Version Tracking
```bash
# Tag deployments with version
# Check current version
curl https://api.klikk.ai/version
```

---

## 🐛 Common Issues & Solutions

### Issue: Health Check Timeout

**Symptom**: Deployment fails at health check step

**Solution**:
```bash
# Check container logs
docker logs klikkflow-backend-green

# Common causes:
# 1. Database connection timeout (check credentials)
# 2. Slow container startup (increase timeout)
# 3. Port conflict (check port availability)
```

### Issue: Nginx Switch Fails

**Symptom**: `nginx -t` fails after traffic switch

**Solution**:
```bash
# Check Nginx config syntax
sudo nginx -t

# View detailed error
sudo tail -f /var/log/nginx/error.log

# Restore from backup
sudo cp /etc/nginx/sites-available/klikkflow.backup /etc/nginx/sites-available/klikkflow
sudo nginx -t && sudo systemctl reload nginx
```

### Issue: Both Environments Running

**Symptom**: High resource usage, both blue and green active

**Solution**:
```bash
# Check which is active in Nginx
grep -v "^#" /etc/nginx/sites-available/klikkflow | grep "server localhost"

# Manually stop inactive environment
docker-compose -f docker-compose.blue.yml down
# OR
docker-compose -f docker-compose.green.yml down
```

---

## 📚 Additional Resources

- [VPS Setup Guide](./VPS_SETUP.md)
- [Docker Compose Blue/Green](../../docker-compose.blue.yml)
- [Nginx Configuration](../../nginx/nginx-lb.conf)
- [Deployment Scripts](../../scripts/vps/)

---

## 🆘 Emergency Procedures

### Complete Rollback
```bash
cd /opt/klikkflow
sudo bash scripts/vps/rollback.sh --environment blue
```

### Manual Traffic Switch
```bash
# Switch to blue
sudo sed -i 's/server localhost:3020/# server localhost:3020/' /etc/nginx/sites-available/klikkflow
sudo sed -i 's/# server localhost:3010/server localhost:3010/' /etc/nginx/sites-available/klikkflow
sudo sed -i 's/set \$backend_port 3021;/set \$backend_port 3011;/' /etc/nginx/sites-available/klikkflow
sudo nginx -t && sudo systemctl reload nginx
```

### Check Current Environment
```bash
# What's active in Nginx?
grep "server localhost:" /etc/nginx/sites-available/klikkflow | grep -v "^#"

# What containers are running?
docker ps | grep klikkflow | grep -E "blue|green"
```

---

**Questions or issues?** Open an issue: https://github.com/KlikkAI/klikkflow/issues
