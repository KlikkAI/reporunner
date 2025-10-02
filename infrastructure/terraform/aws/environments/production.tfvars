# Production Environment Configuration

environment = "production"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.0.0.0/16"
public_subnet_cidrs  = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24"]
private_subnet_cidrs = ["10.0.11.0/24", "10.0.12.0/24", "10.0.13.0/24"]

# Database Configuration - Production Sizing
postgres_instance_class     = "db.r5.xlarge"
postgres_allocated_storage  = 500
documentdb_cluster_size     = 3
documentdb_instance_class   = "db.r5.large"
redis_node_type             = "cache.r5.large"
redis_num_cache_nodes       = 3

# Container Images
backend_container_image  = "123456789012.dkr.ecr.us-east-1.amazonaws.com/reporunner/backend:latest"
frontend_container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/reporunner/frontend:latest"

# ECS Task Configuration - Production Sizing
backend_cpu            = 2048
backend_memory         = 4096
backend_desired_count  = 3

frontend_cpu           = 1024
frontend_memory        = 2048
frontend_desired_count = 3

worker_cpu             = 2048
worker_memory          = 4096
worker_desired_count   = 3

# Auto Scaling Configuration
backend_min_capacity   = 3
backend_max_capacity   = 20
frontend_min_capacity  = 3
frontend_max_capacity  = 20
worker_min_capacity    = 2
worker_max_capacity    = 10

# SSL/TLS
enable_https    = true
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/12345678-1234-1234-1234-123456789012"

# Monitoring
alarm_sns_topic_arn = "arn:aws:sns:us-east-1:123456789012:reporunner-production-alerts"

# Additional Tags
additional_tags = {
  CostCenter = "Engineering"
  Owner      = "Platform Team"
  Compliance = "SOC2"
}
