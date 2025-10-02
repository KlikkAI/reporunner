/**
 * GCP Infrastructure Outputs
 */

# Network Outputs
output "vpc_name" {
  description = "VPC network name"
  value       = module.vpc.network_name
}

output "subnet_name" {
  description = "Subnet name"
  value       = module.vpc.subnet_name
}

# GKE Outputs
output "gke_cluster_name" {
  description = "GKE cluster name"
  value       = module.gke.cluster_name
}

output "gke_cluster_endpoint" {
  description = "GKE cluster endpoint"
  value       = module.gke.cluster_endpoint
  sensitive   = true
}

output "gke_cluster_ca_certificate" {
  description = "GKE cluster CA certificate"
  value       = module.gke.cluster_ca_certificate
  sensitive   = true
}

output "gke_get_credentials_command" {
  description = "Command to configure kubectl"
  value       = "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region} --project ${var.project_id}"
}

# Cloud SQL Outputs
output "postgresql_connection_name" {
  description = "Cloud SQL connection name"
  value       = module.cloudsql_postgresql.connection_name
}

output "postgresql_private_ip" {
  description = "Cloud SQL private IP address"
  value       = module.cloudsql_postgresql.private_ip_address
  sensitive   = true
}

output "postgresql_connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${module.cloudsql_postgresql.user}:${module.cloudsql_postgresql.password}@${module.cloudsql_postgresql.private_ip_address}:5432/${module.cloudsql_postgresql.database_name}"
  sensitive   = true
}

# Redis Outputs
output "redis_host" {
  description = "Redis host address"
  value       = module.memorystore_redis.host
}

output "redis_port" {
  description = "Redis port"
  value       = module.memorystore_redis.port
}

output "redis_connection_string" {
  description = "Redis connection string"
  value       = "rediss://:${module.memorystore_redis.auth_string}@${module.memorystore_redis.host}:${module.memorystore_redis.port}"
  sensitive   = true
}

# Storage Outputs
output "storage_bucket_name" {
  description = "Cloud Storage bucket name"
  value       = module.storage.bucket_name
}

output "storage_bucket_url" {
  description = "Cloud Storage bucket URL"
  value       = module.storage.bucket_url
}

# Load Balancer Outputs
output "load_balancer_ip" {
  description = "Load balancer external IP address"
  value       = module.load_balancer.external_ip
}

output "application_url" {
  description = "Application URL"
  value       = var.enable_ssl ? "https://${module.load_balancer.external_ip}" : "http://${module.load_balancer.external_ip}"
}

# Service Account Outputs
output "workload_identity_email" {
  description = "Workload Identity service account email"
  value       = google_service_account.gke_workload.email
}

# Secret Manager Outputs
output "secret_id" {
  description = "Secret Manager secret ID"
  value       = google_secret_manager_secret.database_credentials.secret_id
}

# Deployment Summary
output "deployment_summary" {
  description = "Deployment summary with all key information"
  value = {
    environment         = var.environment
    region              = var.region
    project_id          = var.project_id
    gke_cluster         = module.gke.cluster_name
    postgresql_instance = module.cloudsql_postgresql.instance_name
    redis_instance      = module.memorystore_redis.instance_id
    storage_bucket      = module.storage.bucket_name
    application_url     = var.enable_ssl ? "https://${module.load_balancer.external_ip}" : "http://${module.load_balancer.external_ip}"
  }
}

# Connection Instructions
output "connection_instructions" {
  description = "Instructions for connecting to infrastructure"
  value = <<-EOT
    # Configure kubectl
    ${module.gke.cluster_name != null ? "gcloud container clusters get-credentials ${module.gke.cluster_name} --region ${var.region} --project ${var.project_id}" : "N/A"}

    # Connect to PostgreSQL (via Cloud SQL Proxy)
    cloud-sql-proxy ${module.cloudsql_postgresql.connection_name} &
    psql "host=127.0.0.1 port=5432 dbname=${module.cloudsql_postgresql.database_name} user=${module.cloudsql_postgresql.user}"

    # View application
    Application URL: ${var.enable_ssl ? "https://${module.load_balancer.external_ip}" : "http://${module.load_balancer.external_ip}"}

    # Access secrets
    gcloud secrets versions access latest --secret="${google_secret_manager_secret.database_credentials.secret_id}"
  EOT
}
