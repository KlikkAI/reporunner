/**
 * Terraform Outputs for Reporunner AWS Infrastructure
 */

# VPC Outputs
output "vpc_id" {
  description = "VPC ID"
  value       = module.vpc.vpc_id
}

output "public_subnet_ids" {
  description = "Public subnet IDs"
  value       = module.vpc.public_subnet_ids
}

output "private_subnet_ids" {
  description = "Private subnet IDs"
  value       = module.vpc.private_subnet_ids
}

# Load Balancer Outputs
output "alb_dns_name" {
  description = "Application Load Balancer DNS name"
  value       = module.alb.dns_name
}

output "alb_zone_id" {
  description = "Application Load Balancer zone ID"
  value       = module.alb.zone_id
}

output "application_url" {
  description = "Application URL"
  value       = var.enable_https ? "https://${module.alb.dns_name}" : "http://${module.alb.dns_name}"
}

# Database Outputs
output "rds_endpoint" {
  description = "RDS PostgreSQL endpoint"
  value       = module.rds_postgresql.endpoint
  sensitive   = true
}

output "rds_connection_string" {
  description = "RDS PostgreSQL connection string"
  value       = module.rds_postgresql.connection_string
  sensitive   = true
}

output "documentdb_endpoint" {
  description = "DocumentDB cluster endpoint"
  value       = module.documentdb.endpoint
  sensitive   = true
}

output "documentdb_connection_string" {
  description = "DocumentDB connection string"
  value       = module.documentdb.connection_string
  sensitive   = true
}

output "redis_endpoint" {
  description = "ElastiCache Redis endpoint"
  value       = module.elasticache_redis.endpoint
  sensitive   = true
}

output "redis_connection_string" {
  description = "ElastiCache Redis connection string"
  value       = module.elasticache_redis.connection_string
  sensitive   = true
}

# ECS Outputs
output "ecs_cluster_name" {
  description = "ECS cluster name"
  value       = module.ecs_cluster.cluster_name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN"
  value       = module.ecs_cluster.cluster_arn
}

output "backend_service_name" {
  description = "Backend ECS service name"
  value       = module.ecs_backend.service_name
}

output "frontend_service_name" {
  description = "Frontend ECS service name"
  value       = module.ecs_frontend.service_name
}

output "worker_service_name" {
  description = "Worker ECS service name"
  value       = module.ecs_worker.service_name
}

# S3 Outputs
output "s3_bucket_name" {
  description = "S3 bucket name for file storage"
  value       = module.s3.bucket_name
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN"
  value       = module.s3.bucket_arn
}

# CloudWatch Outputs
output "cloudwatch_log_group" {
  description = "CloudWatch log group name"
  value       = aws_cloudwatch_log_group.application.name
}

# Secrets Manager Outputs
output "jwt_secret_arn" {
  description = "JWT secret ARN in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
}

# Summary Output
output "deployment_summary" {
  description = "Deployment summary"
  value = {
    environment   = var.environment
    region        = var.aws_region
    vpc_id        = module.vpc.vpc_id
    cluster_name  = module.ecs_cluster.cluster_name
    application_url = var.enable_https ? "https://${module.alb.dns_name}" : "http://${module.alb.dns_name}"
    backend_tasks = var.backend_desired_count
    frontend_tasks = var.frontend_desired_count
    worker_tasks   = var.worker_desired_count
  }
}
