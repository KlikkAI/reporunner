/**
 * Reporunner AWS Infrastructure
 *
 * This Terraform configuration deploys Reporunner to AWS with:
 * - ECS Fargate for container orchestration
 * - RDS PostgreSQL for vector database
 * - DocumentDB (MongoDB-compatible) for primary database
 * - ElastiCache Redis for caching and queues
 * - Application Load Balancer
 * - VPC with public/private subnets
 * - S3 for file storage
 * - CloudWatch for monitoring
 * - Secrets Manager for credentials
 */

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Backend configuration for state storage
  backend "s3" {
    bucket         = "reporunner-terraform-state"
    key            = "production/terraform.tfstate"
    region         = "us-east-1"
    encrypt        = true
    dynamodb_table = "reporunner-terraform-locks"
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "Reporunner"
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data sources
data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_caller_identity" "current" {}

# Local variables
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  azs         = slice(data.aws_availability_zones.available.names, 0, 3)

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
  }
}

# VPC Module
module "vpc" {
  source = "./modules/vpc"

  name_prefix = local.name_prefix
  vpc_cidr    = var.vpc_cidr
  azs         = local.azs

  public_subnet_cidrs  = var.public_subnet_cidrs
  private_subnet_cidrs = var.private_subnet_cidrs

  enable_nat_gateway = true
  single_nat_gateway = var.environment != "production"

  tags = local.common_tags
}

# Security Groups Module
module "security_groups" {
  source = "./modules/security-groups"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id

  tags = local.common_tags
}

# RDS PostgreSQL (with pgvector for AI)
module "rds_postgresql" {
  source = "./modules/rds"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id

  database_name   = var.postgres_database_name
  master_username = var.postgres_master_username

  instance_class    = var.postgres_instance_class
  allocated_storage = var.postgres_allocated_storage
  engine_version    = "15.4"

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.rds_security_group_id]

  backup_retention_period = var.environment == "production" ? 7 : 1
  multi_az                = var.environment == "production"

  tags = local.common_tags
}

# DocumentDB (MongoDB-compatible)
module "documentdb" {
  source = "./modules/documentdb"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id

  cluster_size       = var.documentdb_cluster_size
  instance_class     = var.documentdb_instance_class
  master_username    = var.documentdb_master_username
  engine_version     = "5.0.0"

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.documentdb_security_group_id]

  backup_retention_period = var.environment == "production" ? 7 : 1

  tags = local.common_tags
}

# ElastiCache Redis
module "elasticache_redis" {
  source = "./modules/elasticache"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id

  node_type          = var.redis_node_type
  num_cache_nodes    = var.redis_num_cache_nodes
  engine_version     = "7.0"

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.redis_security_group_id]

  automatic_failover_enabled = var.environment == "production"

  tags = local.common_tags
}

# S3 Bucket for file storage
module "s3" {
  source = "./modules/s3"

  name_prefix = local.name_prefix

  enable_versioning = var.environment == "production"
  enable_encryption = true

  tags = local.common_tags
}

# ECS Cluster
module "ecs_cluster" {
  source = "./modules/ecs-cluster"

  name_prefix = local.name_prefix

  enable_container_insights = true

  tags = local.common_tags
}

# Application Load Balancer
module "alb" {
  source = "./modules/alb"

  name_prefix = local.name_prefix
  vpc_id      = module.vpc.vpc_id

  subnet_ids         = module.vpc.public_subnet_ids
  security_group_ids = [module.security_groups.alb_security_group_id]

  enable_https      = var.enable_https
  certificate_arn   = var.certificate_arn
  enable_access_logs = var.environment == "production"

  tags = local.common_tags
}

# Backend ECS Service
module "ecs_backend" {
  source = "./modules/ecs-service"

  name_prefix  = "${local.name_prefix}-backend"
  cluster_id   = module.ecs_cluster.cluster_id
  cluster_name = module.ecs_cluster.cluster_name

  container_image = var.backend_container_image
  container_port  = 3001
  cpu             = var.backend_cpu
  memory          = var.backend_memory
  desired_count   = var.backend_desired_count

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_backend_security_group_id]

  target_group_arn = module.alb.backend_target_group_arn

  environment_variables = {
    NODE_ENV           = var.environment
    PORT               = "3001"
    MONGODB_URI        = module.documentdb.connection_string
    POSTGRES_URI       = module.rds_postgresql.connection_string
    REDIS_URL          = module.elasticache_redis.connection_string
    AWS_REGION         = var.aws_region
    S3_BUCKET          = module.s3.bucket_name
  }

  secrets = {
    JWT_SECRET = aws_secretsmanager_secret.jwt_secret.arn
  }

  tags = local.common_tags
}

# Frontend ECS Service
module "ecs_frontend" {
  source = "./modules/ecs-service"

  name_prefix  = "${local.name_prefix}-frontend"
  cluster_id   = module.ecs_cluster.cluster_id
  cluster_name = module.ecs_cluster.cluster_name

  container_image = var.frontend_container_image
  container_port  = 3000
  cpu             = var.frontend_cpu
  memory          = var.frontend_memory
  desired_count   = var.frontend_desired_count

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_frontend_security_group_id]

  target_group_arn = module.alb.frontend_target_group_arn

  environment_variables = {
    NODE_ENV          = var.environment
    PORT              = "3000"
    API_URL           = "http://${module.alb.dns_name}/api"
  }

  tags = local.common_tags
}

# Worker ECS Service
module "ecs_worker" {
  source = "./modules/ecs-service"

  name_prefix  = "${local.name_prefix}-worker"
  cluster_id   = module.ecs_cluster.cluster_id
  cluster_name = module.ecs_cluster.cluster_name

  container_image = var.backend_container_image
  container_port  = 3002
  cpu             = var.worker_cpu
  memory          = var.worker_memory
  desired_count   = var.worker_desired_count

  subnet_ids         = module.vpc.private_subnet_ids
  security_group_ids = [module.security_groups.ecs_backend_security_group_id]

  target_group_arn = null # Workers don't need ALB

  environment_variables = {
    NODE_ENV     = var.environment
    MONGODB_URI  = module.documentdb.connection_string
    POSTGRES_URI = module.rds_postgresql.connection_string
    REDIS_URL    = module.elasticache_redis.connection_string
    WORKER_MODE  = "true"
  }

  secrets = {
    JWT_SECRET = aws_secretsmanager_secret.jwt_secret.arn
  }

  tags = local.common_tags
}

# Secrets Manager
resource "aws_secretsmanager_secret" "jwt_secret" {
  name        = "${local.name_prefix}-jwt-secret"
  description = "JWT secret for Reporunner"

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = var.jwt_secret
}

# CloudWatch Log Group
resource "aws_cloudwatch_log_group" "application" {
  name              = "/aws/ecs/${local.name_prefix}"
  retention_in_days = var.environment == "production" ? 30 : 7

  tags = local.common_tags
}

# Auto Scaling
module "autoscaling" {
  source = "./modules/autoscaling"

  name_prefix = local.name_prefix

  backend_service_name  = module.ecs_backend.service_name
  frontend_service_name = module.ecs_frontend.service_name
  worker_service_name   = module.ecs_worker.service_name

  cluster_name = module.ecs_cluster.cluster_name

  backend_min_capacity  = var.backend_min_capacity
  backend_max_capacity  = var.backend_max_capacity
  frontend_min_capacity = var.frontend_min_capacity
  frontend_max_capacity = var.frontend_max_capacity
  worker_min_capacity   = var.worker_min_capacity
  worker_max_capacity   = var.worker_max_capacity

  tags = local.common_tags
}

# CloudWatch Alarms
module "cloudwatch_alarms" {
  source = "./modules/cloudwatch-alarms"

  name_prefix = local.name_prefix

  alb_arn                    = module.alb.arn
  backend_target_group_arn   = module.alb.backend_target_group_arn
  frontend_target_group_arn  = module.alb.frontend_target_group_arn

  rds_cluster_id        = module.rds_postgresql.cluster_id
  documentdb_cluster_id = module.documentdb.cluster_id
  redis_cluster_id      = module.elasticache_redis.cluster_id

  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []

  tags = local.common_tags
}
