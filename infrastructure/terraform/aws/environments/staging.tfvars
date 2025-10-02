# Staging Environment Configuration

environment = "staging"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.1.0.0/16"
public_subnet_cidrs  = ["10.1.1.0/24", "10.1.2.0/24", "10.1.3.0/24"]
private_subnet_cidrs = ["10.1.11.0/24", "10.1.12.0/24", "10.1.13.0/24"]

# Database Configuration - Staging Sizing
postgres_instance_class     = "db.t3.large"
postgres_allocated_storage  = 200
documentdb_cluster_size     = 2
documentdb_instance_class   = "db.t3.medium"
redis_node_type             = "cache.t3.medium"
redis_num_cache_nodes       = 2

# Container Images
backend_container_image  = "123456789012.dkr.ecr.us-east-1.amazonaws.com/reporunner/backend:staging"
frontend_container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/reporunner/frontend:staging"

# ECS Task Configuration - Staging Sizing
backend_cpu            = 1024
backend_memory         = 2048
backend_desired_count  = 2

frontend_cpu           = 512
frontend_memory        = 1024
frontend_desired_count = 2

worker_cpu             = 1024
worker_memory          = 2048
worker_desired_count   = 2

# Auto Scaling Configuration
backend_min_capacity   = 2
backend_max_capacity   = 10
frontend_min_capacity  = 2
frontend_max_capacity  = 10
worker_min_capacity    = 1
worker_max_capacity    = 5

# SSL/TLS
enable_https    = true
certificate_arn = "arn:aws:acm:us-east-1:123456789012:certificate/staging-cert-id"

# Monitoring
alarm_sns_topic_arn = "arn:aws:sns:us-east-1:123456789012:reporunner-staging-alerts"

# Additional Tags
additional_tags = {
  CostCenter = "Engineering"
  Owner      = "Platform Team"
}
