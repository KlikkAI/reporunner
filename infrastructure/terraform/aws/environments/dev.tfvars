# Development Environment Configuration

environment = "dev"
aws_region  = "us-east-1"

# VPC Configuration
vpc_cidr             = "10.2.0.0/16"
public_subnet_cidrs  = ["10.2.1.0/24", "10.2.2.0/24"]
private_subnet_cidrs = ["10.2.11.0/24", "10.2.12.0/24"]

# Database Configuration - Dev Sizing (Cost-Optimized)
postgres_instance_class     = "db.t3.medium"
postgres_allocated_storage  = 50
documentdb_cluster_size     = 1
documentdb_instance_class   = "db.t3.medium"
redis_node_type             = "cache.t3.small"
redis_num_cache_nodes       = 1

# Container Images
backend_container_image  = "123456789012.dkr.ecr.us-east-1.amazonaws.com/klikkflow/backend:dev"
frontend_container_image = "123456789012.dkr.ecr.us-east-1.amazonaws.com/klikkflow/frontend:dev"

# ECS Task Configuration - Dev Sizing (Cost-Optimized)
backend_cpu            = 512
backend_memory         = 1024
backend_desired_count  = 1

frontend_cpu           = 256
frontend_memory        = 512
frontend_desired_count = 1

worker_cpu             = 512
worker_memory          = 1024
worker_desired_count   = 1

# Auto Scaling Configuration
backend_min_capacity   = 1
backend_max_capacity   = 3
frontend_min_capacity  = 1
frontend_max_capacity  = 3
worker_min_capacity    = 1
worker_max_capacity    = 2

# SSL/TLS
enable_https    = false
certificate_arn = ""

# Monitoring
alarm_sns_topic_arn = ""

# Additional Tags
additional_tags = {
  CostCenter = "Engineering"
  Owner      = "Dev Team"
}
