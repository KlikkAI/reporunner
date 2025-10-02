# Reporunner Azure Infrastructure - Terraform Deployment Guide

This directory contains Terraform configurations for deploying Reporunner on Microsoft Azure using AKS, Azure Database for PostgreSQL, Cosmos DB, Azure Cache for Redis, and other managed services.

## Architecture Overview

The infrastructure includes:

- **Virtual Network**: Custom VNet with subnets for AKS, databases, and Application Gateway
- **AKS (Azure Kubernetes Service)**: Managed Kubernetes for container orchestration
- **Azure Database for PostgreSQL**: Fully managed PostgreSQL 15 Flexible Server with pgvector
- **Azure Cosmos DB**: MongoDB API-compatible globally distributed database
- **Azure Cache for Redis**: Managed Redis with high availability
- **Azure Storage Account**: Blob storage for files and assets
- **Application Gateway**: Layer 7 load balancer with WAF protection
- **Azure Monitor**: Comprehensive logging and monitoring with Log Analytics
- **Key Vault**: Secure secrets management
- **Managed Identity**: Workload identity for secure access

## Prerequisites

1. **Azure Account** with an active subscription
2. **Azure CLI** installed and configured ([Install Guide](https://docs.microsoft.com/en-us/cli/azure/install-azure-cli))
3. **Terraform** >= 1.5.0 ([Install Guide](https://developer.hashicorp.com/terraform/downloads))
4. **kubectl** for Kubernetes management
5. **Domain name** and SSL certificate (for production with HTTPS)

## Quick Start

### 1. Configure Azure CLI

```bash
# Login to Azure
az login

# Set your subscription
az account set --subscription "YOUR_SUBSCRIPTION_ID"

# Create service principal for Terraform (if not using Cloud Shell)
az ad sp create-for-rbac --name "terraform-reporunner" --role="Contributor" \
  --scopes="/subscriptions/YOUR_SUBSCRIPTION_ID"

# Set environment variables
export ARM_CLIENT_ID="<appId>"
export ARM_CLIENT_SECRET="<password>"
export ARM_SUBSCRIPTION_ID="<subscription_id>"
export ARM_TENANT_ID="<tenant>"
```

### 2. Create Azure Storage for Terraform State (First Time Only)

```bash
# Create resource group for Terraform state
az group create --name terraform-state-rg --location eastus

# Create storage account
az storage account create \
  --name reporunnerterraformstate \
  --resource-group terraform-state-rg \
  --location eastus \
  --sku Standard_LRS \
  --encryption-services blob

# Create container
az storage container create \
  --name tfstate \
  --account-name reporunnerterraformstate
```

### 3. Initialize Terraform

```bash
cd infrastructure/terraform/azure
terraform init
```

### 4. Build and Push Docker Images to ACR

```bash
# Create Azure Container Registry
az acr create --resource-group YOUR_RG --name reporunneracr --sku Basic

# Login to ACR
az acr login --name reporunneracr

# Build and push backend
cd ../../packages/backend
docker build -t reporunneracr.azurecr.io/reporunner-backend:dev .
docker push reporunneracr.azurecr.io/reporunner-backend:dev

# Build and push frontend
cd ../frontend
docker build -t reporunneracr.azurecr.io/reporunner-frontend:dev .
docker push reporunneracr.azurecr.io/reporunner-frontend:dev
```

### 5. Configure Environment Variables

Edit the appropriate `.tfvars` file for your environment:

```bash
# For development
vim environments/dev.tfvars

# Update values as needed
```

### 6. Plan Deployment

```bash
# Development
terraform plan -var-file=environments/dev.tfvars

# Staging
terraform plan -var-file=environments/staging.tfvars

# Production
terraform plan -var-file=environments/production.tfvars
```

### 7. Deploy Infrastructure

```bash
# Development
terraform apply -var-file=environments/dev.tfvars

# Staging
terraform apply -var-file=environments/staging.tfvars

# Production
terraform apply -var-file=environments/production.tfvars
```

### 8. Configure kubectl

```bash
# Get AKS credentials
az aks get-credentials \
  --resource-group reporunner-ENV-rg \
  --name reporunner-ENV-aks

# Verify connection
kubectl get nodes
```

## Environment Configurations

### Development (`dev.tfvars`)

**Cost-optimized for development:**
- 1 AKS node (Standard_B2s)
- PostgreSQL Burstable tier (B_Standard_B1ms)
- Cosmos DB minimal throughput (400 RU/s)
- Redis Basic tier (250 MB)
- Standard Application Gateway (no WAF)
- Locally redundant storage

**Estimated monthly cost:** ~$200-250

### Staging (`staging.tfvars`)

**Production-like environment:**
- 2 AKS nodes (Standard_D4s_v3), auto-scale to 8
- PostgreSQL General Purpose (GP_Standard_D2s_v3) with HA
- Cosmos DB with geo-replication (1000 RU/s)
- Redis Standard tier (1 GB)
- Application Gateway with WAF
- Geo-redundant storage
- Private cluster enabled

**Estimated monthly cost:** ~$800-1,000

### Production (`production.tfvars`)

**High-availability production:**
- 3 AKS nodes (Standard_D8s_v3), auto-scale to 20
- PostgreSQL General Purpose (GP_Standard_D8s_v3) with HA
- Cosmos DB multi-region (4000 RU/s)
- Redis Premium tier with sharding (6 GB)
- Application Gateway with WAF, capacity 3
- Premium geo-zone redundant storage
- Private cluster with Azure Policy

**Estimated monthly cost:** ~$2,500-3,000

## Key Features

### Security

- **Private AKS Cluster**: Production uses private API server endpoint
- **Managed Identity**: Workload identity for secure resource access
- **Key Vault**: Encrypted secret storage with RBAC
- **Network Security Groups**: Traffic filtering and segmentation
- **Azure Policy**: Governance and compliance enforcement
- **WAF Protection**: Application Gateway Web Application Firewall
- **Encryption**: Data encrypted at rest and in transit

### High Availability

- **Availability Zones**: Resources distributed across zones
- **Auto-scaling**: HPA for pods, cluster autoscaler for nodes
- **PostgreSQL HA**: Zone-redundant with automatic failover
- **Cosmos DB Multi-region**: Automatic failover to secondary regions
- **Redis HA**: Standard/Premium tiers with replication
- **Health Probes**: Liveness and readiness checks

### Monitoring & Alerting

**Azure Monitor Alerts:**
- AKS cluster and node health
- PostgreSQL CPU, memory, storage, and connections
- Cosmos DB RU/s consumption and throttling
- Redis memory and connection count
- Application Gateway 5xx errors and response time

**Log Analytics:**
- Centralized application logs
- AKS container logs and metrics
- Resource diagnostic logs
- Query and analysis with KQL

### Cost Optimization

- **Azure Reservations**: Save up to 72% with 1-3 year commitments
- **Spot VMs**: Use for dev/test workloads
- **Storage Tiers**: Automatic tiering for blob storage
- **Right-sizing**: Environment-specific instance sizes
- **Auto-shutdown**: Schedule for dev environments

## Accessing the Application

After deployment:

1. **Get Application URL:**
   ```bash
   terraform output application_url
   ```

2. **Access the frontend:**
   ```
   https://[app-gateway-ip]
   ```

3. **API endpoint:**
   ```
   https://[app-gateway-ip]/api
   ```

## Database Connections

### Azure Database for PostgreSQL

```bash
# Get connection string
terraform output postgresql_connection_string

# Or retrieve from Key Vault
az keyvault secret show \
  --vault-name reporunner-ENV-kv \
  --name postgresql-connection-string

# Connect with psql
psql "host=SERVER.postgres.database.azure.com port=5432 dbname=reporunner user=reporunner password=PASSWORD sslmode=require"
```

### Azure Cosmos DB (MongoDB API)

```bash
# Get connection string from Key Vault
az keyvault secret show \
  --vault-name reporunner-ENV-kv \
  --name cosmosdb-connection-string

# Connect with mongosh
mongosh "CONNECTION_STRING"
```

### Azure Cache for Redis

```bash
# Redis is only accessible from within the VNet
# Connect via AKS pod

kubectl run redis-client --rm -it --restart=Never \
  --image=redis:7 -- redis-cli -h HOSTNAME -p 6380 -a ACCESS_KEY --tls
```

## Updating the Infrastructure

### Update Container Images

1. **Build and push new images:**
   ```bash
   docker build -t reporunneracr.azurecr.io/reporunner-backend:v1.1.0 .
   docker push reporunneracr.azurecr.io/reporunner-backend:v1.1.0
   ```

2. **Update Kubernetes deployment:**
   ```bash
   kubectl set image deployment/backend backend=reporunneracr.azurecr.io/reporunner-backend:v1.1.0
   ```

### Scale Services

```bash
# Scale AKS nodes
az aks scale --resource-group RG_NAME --name CLUSTER_NAME --node-count 5

# Scale Kubernetes deployments
kubectl scale deployment backend --replicas=5
```

## Troubleshooting

### AKS Pods Not Starting

1. **Check pod status:**
   ```bash
   kubectl get pods -A
   kubectl describe pod POD_NAME
   kubectl logs POD_NAME
   ```

2. **Check node resources:**
   ```bash
   kubectl top nodes
   kubectl top pods
   ```

### Database Connection Issues

1. **Verify PostgreSQL is running:**
   ```bash
   az postgres flexible-server show --resource-group RG_NAME --name SERVER_NAME
   ```

2. **Check firewall rules:**
   ```bash
   az postgres flexible-server firewall-rule list --resource-group RG_NAME --name SERVER_NAME
   ```

3. **Test from AKS pod:**
   ```bash
   kubectl run psql-test --rm -it --restart=Never \
     --image=postgres:15 -- psql "host=SERVER_NAME port=5432 dbname=reporunner user=reporunner"
   ```

### High Costs

1. **Review Azure Cost Management** in the portal
2. **Check for idle resources** (stopped VMs, unused disks)
3. **Review database and AKS sizing** - downsize if utilization is low
4. **Enable Azure Advisor** recommendations
5. **Use Azure Reservations** for production workloads

## Backup and Disaster Recovery

### Automated Backups

- **PostgreSQL**: Automated backups, configurable retention (7-35 days)
- **Cosmos DB**: Continuous backup with point-in-time restore
- **Redis**: Persistence enabled for Standard/Premium tiers
- **Storage**: Soft delete and versioning enabled

### Manual Backups

```bash
# PostgreSQL backup
az postgres flexible-server backup create \
  --resource-group RG_NAME \
  --name SERVER_NAME \
  --backup-name manual-backup-$(date +%Y%m%d)

# Export to storage
az postgres flexible-server export \
  --resource-group RG_NAME \
  --name SERVER_NAME \
  --output-folder gs://BUCKET/backup
```

### Disaster Recovery

1. **PostgreSQL restore:**
   ```bash
   az postgres flexible-server restore \
     --resource-group RG_NAME \
     --name RESTORED_SERVER \
     --source-server SOURCE_SERVER \
     --restore-time "2024-01-01T00:00:00Z"
   ```

2. **AKS cluster recreation:**
   ```bash
   # Terraform will recreate from state
   terraform apply -var-file=environments/production.tfvars
   ```

## Cleanup

To destroy the infrastructure:

```bash
# WARNING: This will delete all resources and data
terraform destroy -var-file=environments/dev.tfvars

# For production, ensure backups are created first
terraform destroy -var-file=environments/production.tfvars
```

## Security Best Practices

1. **Enable Microsoft Defender for Cloud**: Security posture management
2. **Use Managed Identities**: Avoid service principal credentials
3. **Enable Azure Policy**: Enforce governance standards
4. **Network Isolation**: Use private endpoints and service endpoints
5. **Audit Logging**: Enable Activity Log and resource diagnostic settings
6. **Least Privilege**: Assign minimum necessary RBAC roles
7. **Key Vault Access Policies**: Restrict secret access to specific identities

## Cost Estimation

Use Azure Pricing Calculator for accurate estimates:
https://azure.microsoft.com/en-us/pricing/calculator/

**Approximate monthly costs by environment:**

| Component | Dev | Staging | Production |
|-----------|-----|---------|------------|
| AKS | $70-90 | $350-400 | $1,000-1,200 |
| PostgreSQL | $25-35 | $200-250 | $600-700 |
| Cosmos DB | $25-30 | $75-100 | $300-400 |
| Redis | $15-20 | $75-90 | $250-300 |
| Storage | $10-15 | $30-40 | $100-150 |
| App Gateway | $30-40 | $150-180 | $250-300 |
| Log Analytics | $10-15 | $20-30 | $50-75 |
| Data Transfer | $5-10 | $20-30 | $100-150 |
| **Total** | **~$190-255** | **~$920-1,120** | **~$2,650-3,275** |

*Actual costs may vary based on usage, reservations, and data transfer.*

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/reporunner/issues
- Documentation: https://docs.reporunner.com
- Azure Support: https://azure.microsoft.com/en-us/support/

## License

See the main project LICENSE file.
