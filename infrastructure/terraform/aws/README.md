# KlikkFlow AWS Infrastructure - Terraform Deployment Guide

This directory contains Terraform configurations for deploying KlikkFlow on AWS using ECS Fargate, RDS PostgreSQL, DocumentDB, and ElastiCache Redis.

## Architecture Overview

The infrastructure includes:

- **VPC**: Multi-AZ VPC with public and private subnets
- **ECS Fargate**: Serverless container orchestration for backend, frontend, and worker services
- **Application Load Balancer**: HTTPS/HTTP traffic distribution
- **RDS PostgreSQL 15**: Relational database with pgvector extension for AI/vector operations
- **DocumentDB**: MongoDB-compatible document database
- **ElastiCache Redis**: In-memory caching and session storage
- **S3**: Object storage for files and assets
- **CloudWatch**: Comprehensive monitoring and logging
- **Secrets Manager**: Secure credential storage
- **Auto Scaling**: Dynamic scaling based on CPU, memory, and request metrics

## Prerequisites

1. **AWS Account** with appropriate permissions
2. **Terraform** >= 1.5.0 ([Install Guide](https://developer.hashicorp.com/terraform/downloads))
3. **AWS CLI** configured with credentials ([Install Guide](https://aws.amazon.com/cli/))
4. **Docker images** built and pushed to ECR:
   - Backend image
   - Frontend image
5. **Domain name** and SSL certificate (for production with HTTPS)

## Directory Structure

```
infrastructure/terraform/aws/
├── main.tf                      # Root infrastructure configuration
├── variables.tf                 # Input variables
├── outputs.tf                   # Output values
├── environments/                # Environment-specific configurations
│   ├── dev.tfvars
│   ├── staging.tfvars
│   └── production.tfvars
└── modules/                     # Reusable Terraform modules
    ├── vpc/                     # VPC and networking
    ├── security-groups/         # Security group definitions
    ├── rds/                     # PostgreSQL with pgvector
    ├── documentdb/              # MongoDB-compatible database
    ├── elasticache/             # Redis cluster
    ├── s3/                      # S3 bucket for storage
    ├── ecs-cluster/             # ECS Fargate cluster
    ├── ecs-service/             # ECS service (reusable)
    ├── alb/                     # Application Load Balancer
    ├── autoscaling/             # Auto scaling policies
    └── cloudwatch-alarms/       # Monitoring alarms
```

## Quick Start

### 1. Configure AWS Credentials

```bash
aws configure
# Enter your AWS Access Key ID, Secret Access Key, and region
```

### 2. Initialize Terraform

```bash
cd infrastructure/terraform/aws
terraform init
```

### 3. Create S3 Backend for State (First Time Only)

```bash
# Create S3 bucket for Terraform state
aws s3 mb s3://klikkflow-terraform-state --region us-east-1

# Enable versioning
aws s3api put-bucket-versioning \
  --bucket klikkflow-terraform-state \
  --versioning-configuration Status=Enabled

# Create DynamoDB table for state locking
aws dynamodb create-table \
  --table-name klikkflow-terraform-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region us-east-1
```

### 4. Build and Push Docker Images to ECR

```bash
# Login to ECR
aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin 123456789012.dkr.ecr.us-east-1.amazonaws.com

# Create ECR repositories (first time only)
aws ecr create-repository --repository-name klikkflow/backend --region us-east-1
aws ecr create-repository --repository-name klikkflow/frontend --region us-east-1

# Build and push backend
cd ../../packages/backend
docker build -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/klikkflow/backend:dev .
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/klikkflow/backend:dev

# Build and push frontend
cd ../frontend
docker build -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/klikkflow/frontend:dev .
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/klikkflow/frontend:dev
```

### 5. Configure Environment Variables

Edit the appropriate `.tfvars` file for your environment:

```bash
# For development
vim environments/dev.tfvars

# Update these values:
# - backend_container_image (use your ECR repository URL)
# - frontend_container_image (use your ECR repository URL)
# - certificate_arn (if using HTTPS)
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

### 8. Get Deployment Information

```bash
# Get application URL
terraform output application_url

# Get complete deployment summary
terraform output deployment_summary

# Get database connection strings (sensitive)
terraform output -json | jq '.rds_connection_string.value'
terraform output -json | jq '.documentdb_connection_string.value'
terraform output -json | jq '.redis_connection_string.value'
```

## Environment Configurations

### Development (`dev.tfvars`)

**Cost-optimized for development:**
- Single-AZ deployment
- Minimal instance sizes (db.t3.medium, cache.t3.small)
- 1 task per service
- No HTTPS (HTTP only)
- 50GB PostgreSQL storage

**Estimated monthly cost:** ~$200-300

### Staging (`staging.tfvars`)

**Production-like environment:**
- Multi-AZ deployment (3 AZs)
- Medium instance sizes (db.t3.large, cache.t3.medium)
- 2 tasks per service
- HTTPS enabled with ACM certificate
- 200GB PostgreSQL storage
- Auto-scaling up to 10 tasks

**Estimated monthly cost:** ~$600-800

### Production (`production.tfvars`)

**High-availability production:**
- Multi-AZ deployment (3 AZs)
- Production instance sizes (db.r5.xlarge, cache.r5.large)
- 3 tasks per service minimum
- HTTPS with ACM certificate
- 500GB PostgreSQL storage
- Auto-scaling up to 20 tasks
- Enhanced monitoring and alarms
- SOC2 compliance tags

**Estimated monthly cost:** ~$1,500-2,500

## Key Features

### Security

- **Private Subnets**: Databases and application servers run in private subnets
- **Security Groups**: Least-privilege network access
- **Encryption**:
  - Data at rest (RDS, DocumentDB, Redis, S3)
  - Data in transit (TLS/HTTPS)
- **Secrets Management**: AWS Secrets Manager for credentials
- **IAM Roles**: Task-specific permissions with least privilege

### High Availability

- **Multi-AZ Deployment**: Services distributed across availability zones
- **Auto Scaling**: Dynamic scaling based on:
  - CPU utilization (70% target)
  - Memory utilization (80% target)
  - Request count per target
- **Health Checks**: Container and load balancer health monitoring
- **Automatic Failover**: Database and cache failover capabilities

### Monitoring & Alerting

**CloudWatch Alarms for:**
- ECS service CPU/memory utilization
- Running task count
- ALB unhealthy targets
- ALB response time
- 5XX error rates
- RDS CPU and storage
- DocumentDB CPU
- Redis CPU and memory

**Logs:**
- Application logs: CloudWatch Logs
- ALB access logs: S3
- Database audit logs: CloudWatch Logs

### Cost Optimization

- **Intelligent Tiering**: S3 automatic cost optimization
- **Lifecycle Policies**: Automated data archival
- **Spot Capacity**: Option to use Fargate Spot for cost savings
- **Right-sizing**: Environment-specific instance sizing

## Accessing the Application

After deployment:

1. **Get Application URL:**
   ```bash
   terraform output application_url
   ```

2. **Access the frontend:**
   ```
   http://[alb-dns-name]  (dev)
   https://[alb-dns-name] (staging/production)
   ```

3. **API endpoint:**
   ```
   http://[alb-dns-name]/api  (dev)
   https://[alb-dns-name]/api (staging/production)
   ```

## Database Connections

### PostgreSQL

```bash
# Get connection string
terraform output -json | jq -r '.rds_connection_string.value'

# Connect with psql
psql "postgresql://klikkflow_admin:[password]@[endpoint]/klikkflow?sslmode=require"
```

### DocumentDB (MongoDB)

```bash
# Download AWS DocumentDB certificate
wget https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem

# Get connection string
terraform output -json | jq -r '.documentdb_connection_string.value'

# Connect with mongosh
mongosh "mongodb://klikkflow_admin:[password]@[endpoint]:27017/?tls=true&tlsCAFile=global-bundle.pem&replicaSet=rs0&readPreference=secondaryPreferred&retryWrites=false"
```

### Redis

```bash
# Get connection string
terraform output -json | jq -r '.redis_connection_string.value'

# Connection format
rediss://:[auth-token]@[endpoint]:6379
```

## Updating the Infrastructure

### Update Container Images

1. **Build and push new images:**
   ```bash
   docker build -t 123456789012.dkr.ecr.us-east-1.amazonaws.com/klikkflow/backend:v1.1.0 .
   docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/klikkflow/backend:v1.1.0
   ```

2. **Update tfvars file:**
   ```hcl
   backend_container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/klikkflow/backend:v1.1.0"
   ```

3. **Apply changes:**
   ```bash
   terraform apply -var-file=environments/production.tfvars
   ```

### Scale Services

Edit the `.tfvars` file and update:
- `backend_desired_count`
- `frontend_desired_count`
- `worker_desired_count`

Then apply:
```bash
terraform apply -var-file=environments/production.tfvars
```

## Troubleshooting

### ECS Tasks Not Starting

1. **Check CloudWatch logs:**
   ```bash
   aws logs tail /ecs/klikkflow-production/backend --follow
   ```

2. **Check ECS task events:**
   ```bash
   aws ecs describe-services --cluster klikkflow-production-cluster --services klikkflow-production-backend
   ```

3. **Verify secrets:**
   ```bash
   aws secretsmanager get-secret-value --secret-id [secret-arn]
   ```

### Database Connection Issues

1. **Check security groups:**
   ```bash
   aws ec2 describe-security-groups --group-ids [sg-id]
   ```

2. **Test from ECS task:**
   ```bash
   aws ecs execute-command --cluster [cluster] --task [task-id] --container backend --interactive --command "/bin/bash"
   # Then: nc -zv [db-endpoint] 5432
   ```

### High Costs

1. **Review CloudWatch metrics** for over-provisioned resources
2. **Check auto-scaling policies** - may be scaling too aggressively
3. **Review RDS/DocumentDB instance sizes** - can downsize if utilization is low
4. **Enable S3 Intelligent Tiering** if not already enabled

## Backup and Disaster Recovery

### Automated Backups

- **RDS**: 7-day automated backups (configurable)
- **DocumentDB**: 7-day automated backups
- **Redis**: Daily snapshots retained for 7 days

### Manual Backups

```bash
# RDS snapshot
aws rds create-db-snapshot --db-instance-identifier klikkflow-production-postgres --db-snapshot-identifier klikkflow-backup-$(date +%Y%m%d)

# DocumentDB snapshot
aws docdb create-db-cluster-snapshot --db-cluster-identifier klikkflow-production-docdb --db-cluster-snapshot-identifier klikkflow-backup-$(date +%Y%m%d)
```

### Disaster Recovery

1. **RDS restore from snapshot:**
   ```bash
   aws rds restore-db-instance-from-db-snapshot \
     --db-instance-identifier klikkflow-restored \
     --db-snapshot-identifier [snapshot-id]
   ```

2. **DocumentDB restore:**
   ```bash
   aws docdb restore-db-cluster-from-snapshot \
     --db-cluster-identifier klikkflow-restored \
     --snapshot-identifier [snapshot-id]
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

1. **Enable MFA** for AWS root account
2. **Use IAM roles** instead of access keys where possible
3. **Rotate credentials** regularly
4. **Enable CloudTrail** for audit logging
5. **Review security groups** periodically
6. **Keep Terraform state secure** (encrypted S3 bucket)
7. **Use separate AWS accounts** for dev/staging/production
8. **Enable AWS Config** for compliance monitoring

## Cost Estimation

Use AWS Pricing Calculator for accurate estimates:
https://calculator.aws/#/

**Approximate monthly costs by environment:**

| Component | Dev | Staging | Production |
|-----------|-----|---------|------------|
| ECS Fargate | $50 | $150 | $400 |
| RDS PostgreSQL | $60 | $200 | $600 |
| DocumentDB | $50 | $150 | $400 |
| ElastiCache Redis | $20 | $80 | $200 |
| ALB | $20 | $30 | $50 |
| Data Transfer | $10 | $50 | $200 |
| CloudWatch | $10 | $30 | $100 |
| **Total** | **~$220** | **~$690** | **~$1,950** |

*Actual costs may vary based on usage patterns, data transfer, and auto-scaling.*

## Support

For issues or questions:
- GitHub Issues: https://github.com/your-org/klikkflow/issues
- Documentation: https://docs.klikkflow.com
- AWS Support: https://console.aws.amazon.com/support/

## License

See the main project LICENSE file.
