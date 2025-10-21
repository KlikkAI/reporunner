# KlikkFlow GCP Development Environment Configuration
# Cost-optimized setup for development and testing

# Project Configuration
# project_id = "your-gcp-project-id"  # Set this via environment variable or CLI
environment  = "dev"
project_name = "klikkflow"
region       = "us-central1"

# Network Configuration
vpc_cidr                = "10.0.0.0/16"
pods_cidr               = "10.1.0.0/16"
services_cidr           = "10.2.0.0/16"
enable_private_endpoint = false  # Public endpoint for easier access in dev

# GKE Configuration - Minimal for cost savings
gke_node_count       = 1
gke_machine_type     = "e2-medium"  # 2 vCPU, 4 GB RAM
gke_disk_size_gb     = 50
gke_min_node_count   = 1
gke_max_node_count   = 3
gke_enable_autopilot = false

# Cloud SQL PostgreSQL - Small instance
postgresql_version            = "POSTGRES_15"
postgresql_tier               = "db-f1-micro"  # Shared-core, 0.6 GB RAM
postgresql_disk_size          = 50
postgresql_disk_autoresize    = true
postgresql_backup_enabled     = true
postgresql_backup_start_time  = "03:00"
postgresql_high_availability  = false  # No HA in dev

# Memorystore Redis - Basic tier
redis_tier               = "BASIC"  # No replication
redis_memory_size_gb     = 1
redis_version            = "REDIS_7_0"
redis_high_availability  = false

# Cloud Storage
storage_class              = "STANDARD"
storage_versioning_enabled = false  # No versioning in dev
storage_lifecycle_age_days = 7

# Load Balancer
enable_ssl      = false  # HTTP only in dev
ssl_certificate = null

# Security
deletion_protection = false  # Allow easy teardown in dev

# MongoDB Atlas (optional)
mongodb_atlas_enabled     = false
mongodb_atlas_project_id  = ""
mongodb_atlas_cluster_tier = "M0"  # Free tier

# Labels
additional_labels = {
  cost_center = "development"
  managed_by  = "terraform"
  purpose     = "dev-testing"
}

# Estimated Monthly Cost: ~$100-150
# - GKE: $50-70 (e2-medium node)
# - Cloud SQL: $25-35 (db-f1-micro)
# - Redis: $15-20 (1 GB Basic)
# - Storage: $5-10
# - Load Balancer: $10-15
