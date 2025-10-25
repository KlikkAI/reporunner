# VPS Deployment Setup Guide

Complete guide for deploying KlikkFlow on your VPS using GitHub Actions self-hosted runner and blue-green deployment.

**Last Updated**: October 25, 2025
**Deployment Strategy**: Blue-Green with Nginx on Host OS
**Estimated Setup Time**: 30-45 minutes

---

## 📋 Prerequisites

### VPS Requirements
- **OS**: Ubuntu 20.04+ or Debian 11+
- **CPU**: 4+ cores recommended
- **RAM**: 8GB+ recommended
- **Storage**: 50GB+ SSD
- **Network**: Static IP address or domain name

### Software Requirements
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Nginx
sudo apt install nginx certbot python3-certbot-nginx -y

# Verify installations
docker --version
docker-compose --version
nginx -v
```

---

## 🚀 Step 1: Initial VPS Setup

### 1.1 Configure DNS

Point your domains to your VPS IP:
```
app.klikk.ai   →  YOUR_VPS_IP
api.klikk.ai   →  YOUR_VPS_IP
```

### 1.2 Configure Firewall

```bash
# Enable UFW
sudo ufw allow 22/tcp comment 'SSH'
sudo ufw allow 80/tcp comment 'HTTP'
sudo ufw allow 443/tcp comment 'HTTPS'
sudo ufw enable

# Verify
sudo ufw status
```

### 1.3 Clone Repository

```bash
# Create deployment directory
sudo mkdir -p /opt/klikkflow
sudo chown $USER:$USER /opt/klikkflow

# Clone repository
cd /opt/klikkflow
git clone https://github.com/KlikkAI/klikkflow.git .
```

---

## 🔐 Step 2: GitHub Secrets Configuration

Go to your repository settings: `https://github.com/KlikkAI/klikkflow/settings/secrets/actions`

Add the following secrets:

### Docker Hub (2 secrets)
```
DOCKERHUB_USERNAME=your_dockerhub_username
DOCKERHUB_TOKEN=your_dockerhub_access_token
```
Get token from: https://hub.docker.com/settings/security

### Database (5 secrets)
```
VPS_MONGODB_URI=mongodb://mongo:27017/klikkflow
VPS_POSTGRES_URL=postgresql://klikkflow:SECURE_PASSWORD@postgres:5432/klikkflow
VPS_POSTGRES_PASSWORD=SECURE_PASSWORD
VPS_REDIS_URL=redis://redis:6379
VPS_MONGO_ROOT_PASSWORD=SECURE_PASSWORD
```

### Security (3 secrets)
Generate strong secrets:
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Encryption Key (64 hex characters)
openssl rand -hex 32

# Session Secret (32+ characters)
openssl rand -base64 32
```

Add to GitHub:
```
VPS_JWT_SECRET=<generated_jwt_secret>
VPS_CREDENTIAL_ENCRYPTION_KEY=<generated_encryption_key>
VPS_SESSION_SECRET=<generated_session_secret>
```

### AI Services (2 secrets)
```
VPS_OPENAI_API_KEY=sk-your-key
VPS_ANTHROPIC_API_KEY=sk-ant-your-key
```

### OAuth (6 secrets)
```
VPS_GOOGLE_CLIENT_ID=your_id
VPS_GOOGLE_CLIENT_SECRET=your_secret
VPS_GITHUB_CLIENT_ID=your_id
VPS_GITHUB_CLIENT_SECRET=your_secret
VPS_SLACK_BOT_TOKEN=xoxb-your-token
VPS_SLACK_SIGNING_SECRET=your_secret
```

### Monitoring (3 secrets)
```
VPS_SENTRY_DSN=https://your-sentry-dsn
VPS_GRAFANA_ADMIN_PASSWORD=secure_password
VPS_SMTP_HOST=smtp.gmail.com
VPS_SMTP_USER=your_email
VPS_SMTP_PASS=your_app_password
```

---

## 🏃 Step 3: Install Self-Hosted Runner

### 3.1 Get Runner Token

1. Go to: `https://github.com/KlikkAI/klikkflow/settings/actions/runners/new`
2. Copy the token (starts with `A...`)

### 3.2 Run Setup Script

```bash
cd /opt/klikkflow
sudo bash scripts/vps/setup-runner.sh \
  --token YOUR_GITHUB_TOKEN \
  --repo KlikkAI/klikkflow
```

### 3.3 Verify Runner

Check runner status:
```bash
klikkflow-runner-status
```

Verify in GitHub: `https://github.com/KlikkAI/klikkflow/settings/actions/runners`

---

## 🌐 Step 4: Configure Nginx

### 4.1 Install Nginx Configuration

```bash
# Copy Nginx config
sudo cp /opt/klikkflow/nginx/nginx-lb.conf /etc/nginx/sites-available/klikkflow

# Enable site
sudo ln -s /etc/nginx/sites-available/klikkflow /etc/nginx/sites-enabled/

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### 4.2 Get SSL Certificates

```bash
# Get certificates for both domains
sudo certbot --nginx \
  -d app.klikk.ai \
  -d api.klikk.ai \
  --non-interactive \
  --agree-tos \
  --email your-email@example.com

# Verify auto-renewal
sudo certbot renew --dry-run
```

---

## 🗄️ Step 5: Deploy Infrastructure Services

Deploy shared database services (MongoDB, PostgreSQL, Redis):

```bash
cd /opt/klikkflow

# Start infrastructure services
docker-compose up -d mongo postgres redis

# Verify services
docker ps
```

---

## 🚢 Step 6: First Deployment

### 6.1 Trigger Deployment

Push to main branch or manually trigger:

```bash
# Option 1: Push to main
git push origin main

# Option 2: Manual trigger via GitHub UI
# Go to: Actions → VPS Deployment → Run workflow
```

### 6.2 Monitor Deployment

```bash
# Watch runner logs
klikkflow-runner-logs

# Check deployment status on GitHub
# https://github.com/KlikkAI/klikkflow/actions
```

### 6.3 Verify Deployment

```bash
# Check containers
docker ps | grep klikkflow

# Test health endpoints
curl https://app.klikk.ai/health
curl https://api.klikk.ai/health

# View logs
docker logs klikkflow-frontend-blue
docker logs klikkflow-backend-blue
```

---

## ✅ Post-Deployment Checklist

- [ ] Runner appears in GitHub Actions runners
- [ ] All GitHub Secrets configured
- [ ] SSL certificates installed and auto-renewing
- [ ] Infrastructure services running (mongo, postgres, redis)
- [ ] Blue environment deployed and healthy
- [ ] Nginx routing traffic to blue environment
- [ ] `https://app.klikk.ai` loads successfully
- [ ] `https://api.klikk.ai/health` returns healthy
- [ ] Can create and execute workflows

---

## 🔍 Troubleshooting

### Runner Not Connecting
```bash
# Check runner service
systemctl status actions.runner.*

# View logs
journalctl -u actions.runner.* -f

# Restart runner
sudo systemctl restart actions.runner.*
```

### Deployment Fails
```bash
# Check runner logs
klikkflow-runner-logs

# Check GitHub Actions logs
# Go to Actions tab → Failed workflow → View logs

# Manual rollback if needed
cd /opt/klikkflow
sudo bash scripts/vps/rollback.sh --environment blue
```

### Nginx Issues
```bash
# Test config
sudo nginx -t

# Check logs
sudo tail -f /var/log/nginx/error.log
sudo tail -f /var/log/nginx/klikkflow-frontend-error.log

# Reload
sudo systemctl reload nginx
```

### Container Issues
```bash
# Check container logs
docker logs klikkflow-frontend-blue
docker logs klikkflow-backend-blue

# Restart containers
docker-compose -f docker-compose.blue.yml restart

# Check health
docker ps | grep klikkflow
```

---

## 📚 Additional Resources

- [Blue-Green Deployment Guide](./BLUE_GREEN_DEPLOYMENT.md)
- [GitHub Actions Self-Hosted Runners](https://docs.github.com/en/actions/hosting-your-own-runners)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Nginx Documentation](https://nginx.org/en/docs/)

---

## 🆘 Getting Help

- **Issues**: https://github.com/KlikkAI/klikkflow/issues
- **Discussions**: https://github.com/KlikkAI/klikkflow/discussions
- **Documentation**: https://docs.klikkflow.com
