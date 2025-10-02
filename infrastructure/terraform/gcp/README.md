# Reporunner GCP Infrastructure - Terraform Deployment Guide

This directory contains Terraform configurations for deploying Reporunner on Google Cloud Platform using GKE, Cloud SQL, Memorystore, and other managed services.

## Architecture Overview

The infrastructure includes:

- **VPC Network**: Custom VPC with private subnets and Cloud NAT
- **GKE (Google Kubernetes Engine)**: Managed Kubernetes for container orchestration
- **Cloud SQL PostgreSQL**: Fully managed PostgreSQL 15 with pgvector extension
- **Memorystore Redis**: Managed Redis with high availability
- **Cloud Storage**: Object storage for files and assets
- **Cloud Load Balancing**: HTTPS/HTTP global load balancer
- **Cloud Monitoring**: Comprehensive logging and monitoring
- **Secret Manager**: Secure credential storage
- **Workload Identity**: Secure service account access

## Prerequisites

1. **Google Cloud Account** with billing enabled
2. **gcloud CLI** installed and configured ([Install Guide](https://cloud.google.com/sdk/docs/install))
3. **Terraform** >= 1.5.0 ([Install Guide](https://developer.hashicorp.com/terraform/downloads))
4. **kubectl** for Kubernetes management
5. **Domain name** and SSL certificate (for production with HTTPS)

## Quick Start

### 1. Configure gcloud CLI

```bash
# Login to Google Cloud
gcloud auth login
gcloud auth application-default login

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable compute.googleapis.com
gcloud services enable container.googleapis.com
gcloud services enable servicenetworking.googleapis.com
gcloud services enable sqladmin.googleapis.com
gcloud services enable redis.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

### 2. Create GCS Backend for State (First Time Only)

```bash
# Create GCS bucket for Terraform state
gsutil mb -p YOUR_PROJECT_ID -l us-central1 gs://reporunner-terraform-state

# Enable versioning
gsutil versioning set on gs://reporunner-terraform-state
```

### 3. Initialize Terraform

```bash
cd infrastructure/terraform/gcp
terraform init
```

### 4. Build and Push Docker Images to GCR

```bash
# Configure Docker for GCR
gcloud auth configure-docker

# Build and push backend
cd ../../packages/backend
docker build -t gcr.io/YOUR_PROJECT_ID/reporunner-backend:dev .
docker push gcr.io/YOUR_PROJECT_ID/reporunner-backend:dev

# Build and push frontend
cd ../frontend
docker build -t gcr.io/YOUR_PROJECT_ID/reporunner-frontend:dev .
docker push gcr.io/YOUR_PROJECT_ID/reporunner-frontend:dev
```

### 5. Configure Environment Variables

Edit the appropriate `.tfvars` file for your environment:

```bash
# For development
vim environments/dev.tfvars

# Update project_id with your GCP project ID
```

### 6. Plan Deployment

```bash
# Development
terraform plan -var-file=environments/dev.tfvars -var="project_id=YOUR_PROJECT_ID"

# Staging
terraform plan -var-file=environments/staging.tfvars -var="project_id=YOUR_PROJECT_ID"

# Production
terraform plan -var-file=environments/production.tfvars -var="project_id=YOUR_PROJECT_ID"
```

### 7. Deploy Infrastructure

```bash
# Development
terraform apply -var-file=environments/dev.tfvars -var="project_id=YOUR_PROJECT_ID"

# Staging
terraform apply -var-file=environments/staging.tfvars -var="project_id=YOUR_PROJECT_ID"

# Production
terraform apply -var-file=environments/production.tfvars -var="project_id=YOUR_PROJECT_ID"
```

### 8. Configure kubectl

```bash
# Get credentials for your GKE cluster
gcloud container clusters get-credentials reporunner-ENV-cluster \
  --region us-central1 \
  --project YOUR_PROJECT_ID

# Verify connection
kubectl get nodes
```

## Environment Configurations

### Development (`dev.tfvars`)

**Cost-optimized for development:**
- Single-zone GKE with 1 e2-medium node
- Cloud SQL db-f1-micro (shared core)
- Redis Basic tier (1 GB, no replication)
- No SSL/HTTPS
- No deletion protection

**Estimated monthly cost:** ~$100-150

### Staging (`staging.tfvars`)

**Production-like environment:**
- Regional GKE with 2 e2-standard-4 nodes
- Cloud SQL db-custom-2-7680 with HA
- Redis Standard HA tier (5 GB)
- SSL/HTTPS enabled
- Auto-scaling 2-8 nodes
- MongoDB Atlas M10

**Estimated monthly cost:** ~$500-700

### Production (`production.tfvars`)

**High-availability production:**
- Regional GKE with 3 n2-standard-8 nodes
- Cloud SQL db-custom-8-30720 with HA
- Redis Standard HA tier (10 GB)
- SSL/HTTPS with managed certificate
- Auto-scaling 3-20 nodes
- MongoDB Atlas M30
- Enhanced monitoring and alerting

**Estimated monthly cost:** ~$1,500-2,000

## Key Features

### Security

- **Private GKE Control Plane**: Production environments use private endpoints
- **Workload Identity**: Service accounts with least-privilege access
- **VPC Service Controls**: Network isolation
- **Secret Manager**: Encrypted credential storage
- **Cloud Armor**: DDoS protection (optional)
- **Encryption**: Data encrypted at rest and in transit

### High Availability

- **Regional Deployment**: Resources distributed across zones
- **Auto-scaling**: HPA for pods, cluster autoscaler for nodes
- **Cloud SQL HA**: Automatic failover to standby instance
- **Redis HA**: Replication with automatic failover
- **Health Checks**: Liveness and readiness probes

### Monitoring & Alerting

**Cloud Monitoring Alerts:**
- GKE cluster health and node status
- Cloud SQL CPU, memory, and disk usage
- Redis memory and connection count
- HTTP 5xx error rates
- Response time degradation

**Cloud Logging:**
- Application logs centralized
- Audit logs for security
- VPC flow logs for network analysis

### Cost Optimization

- **Preemptible Nodes**: Option to use for cost savings (non-production)
- **Committed Use Discounts**: Available for production workloads
- **Cloud Storage Lifecycle**: Automatic data archival
- **Resource Right-sizing**: Environment-specific instance sizes

## Accessing the Application

After deployment:

1. **Get Application URL:**
   ```bash
   terraform output application_url
   ```

2. **Access the frontend:**
   ```
   https://[load-balancer-ip] (staging/production)
   http://[load-balancer-ip]  (dev)
   ```

3. **API endpoint:**
   ```
   https://[load-balancer-ip]/api
   ```

## Database Connections

### Cloud SQL PostgreSQL

```bash
# Install Cloud SQL Proxy
curl -o cloud-sql-proxy https://storage.googleapis.com/cloud-sql-connectors/cloud-sql-proxy/v2.0.0/cloud-sql-proxy.linux.amd64
chmod +x cloud-sql-proxy

# Get connection name
terraform output postgresql_connection_name

# Start proxy
./cloud-sql-proxy --port 5432 PROJECT:REGION:INSTANCE &

# Connect with psql
psql "host=127.0.0.1 port=5432 dbname=reporunner user=reporunner"
```

### Memorystore Redis

```bash
# Redis is only accessible from within the VPC
# Connect via GKE pod or Compute Engine VM

kubectl run redis-client --rm -it --restart=Never \
  --image=redis:7 -- redis-cli -h REDIS_HOST -a REDIS_AUTH_STRING
```

### MongoDB Atlas

MongoDB Atlas is managed separately. Connect using the Atlas connection string provided in your Atlas console.

## Updating the Infrastructure

### Update Container Images

1. **Build and push new images:**
   ```bash
   docker build -t gcr.io/YOUR_PROJECT_ID/reporunner-backend:v1.1.0 .
   docker push gcr.io/YOUR_PROJECT_ID/reporunner-backend:v1.1.0
   ```

2. **Update Kubernetes deployment:**
   ```bash
   kubectl set image deployment/backend backend=gcr.io/YOUR_PROJECT_ID/reporunner-backend:v1.1.0
   ```

### Scale Services

```bash
# Scale GKE nodes
gcloud container clusters resize reporunner-prod-cluster \
  --num-nodes=5 --region=us-central1

# Scale Kubernetes deployments
kubectl scale deployment backend --replicas=5
```

## Troubleshooting

### GKE Pods Not Starting

1. **Check pod status:**
   ```bash
   kubectl get pods
   kubectl describe pod POD_NAME
   kubectl logs POD_NAME
   ```

2. **Check node resources:**
   ```bash
   kubectl top nodes
   kubectl top pods
   ```

### Database Connection Issues

1. **Verify Cloud SQL is running:**
   ```bash
   gcloud sql instances describe INSTANCE_NAME
   ```

2. **Check VPC peering:**
   ```bash
   gcloud compute networks peerings list
   ```

3. **Test from GKE pod:**
   ```bash
   kubectl run psql-test --rm -it --restart=Never \
     --image=postgres:15 -- psql "host=PRIVATE_IP dbname=reporunner user=reporunner"
   ```

### High Costs

1. **Review resource usage in Cloud Console**
2. **Check for idle resources** (stopped but not deleted)
3. **Review Cloud SQL and GKE node sizes** - can downsize if utilization is low
4. **Enable committed use discounts** for production workloads
5. **Use preemptible nodes** for non-critical workloads

## Backup and Disaster Recovery

### Automated Backups

- **Cloud SQL**: Automated daily backups, 7-day retention
- **Redis**: Daily snapshots (Standard HA tier only)
- **Cloud Storage**: Versioning enabled

### Manual Backups

```bash
# Cloud SQL backup
gcloud sql backups create --instance=INSTANCE_NAME

# Export database
gcloud sql export sql INSTANCE_NAME gs://BUCKET/backup.sql --database=reporunner
```

### Disaster Recovery

1. **Cloud SQL restore:**
   ```bash
   gcloud sql backups restore BACKUP_ID --backup-instance=SOURCE_INSTANCE \
     --backup-location=RESTORE_INSTANCE
   ```

2. **GKE cluster recreation:**
   ```bash
   # Terraform will recreate from state
   terraform apply -var-file=environments/production.tfvars
   ```

## Cleanup

To destroy the infrastructure:

```bash
# WARNING: This will delete all resources and data
terraform destroy -var-file=environments/dev.tfvars -var="project_id=YOUR_PROJECT_ID"

# For production, ensure backups are created first
terraform destroy -var-file=environments/production.tfvars -var="project_id=YOUR_PROJECT_ID"
```

## Security Best Practices

1. **Enable Organization Policy**: Restrict public IPs, require encryption
2. **Use Workload Identity**: Instead of service account keys
3. **Enable VPC Service Controls**: For sensitive data
4. **Regular Security Scanning**: Use Container Analysis
5. **Audit Logs**: Enable and monitor Cloud Audit Logs
6. **Least Privilege**: Grant minimum necessary IAM roles
7. **Network Security**: Use Private Google Access, Cloud Armor

## Cost Estimation

Use Google Cloud Pricing Calculator for accurate estimates:
https://cloud.google.com/products/calculator

**Approximate monthly costs by environment:**

| Component | Dev | Staging | Production |
|-----------|-----|---------|------------|
| GKE | $50-70 | $250-300 | $800-1,000 |
| Cloud SQL | $25-35 | $150-200 | $400-500 |
| Memorystore Redis | $15-20 | $60-80 | $120-150 |
| Cloud Storage | $5-10 | $20-30 | $50-75 |
| Load Balancer | $10-15 | $20-30 | $30-40 |
| MongoDB Atlas | $0 (M0) | $57 (M10) | $350 (M30) |
| Data Transfer | $5-10 | $30-50 | $100-150 |
| **Total** | **~$110-160** | **~$587-747** | **~$1,850-2,265** |

*Actual costs may vary based on usage patterns, data transfer, and auto-scaling.*

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/reporunner/issues
- Documentation: https://docs.reporunner.com
- Google Cloud Support: https://cloud.google.com/support

## License

See the main project LICENSE file.
