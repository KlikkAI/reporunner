# Reporunner GCP Staging Environment Configuration
# Production-like setup for pre-production testing

# Project Configuration
# project_id = "your-gcp-project-id"  # Set this via environment variable or CLI
environment  = "staging"
project_name = "reporunner"
region       = "us-central1"

# Network Configuration
vpc_cidr                = "10.10.0.0/16"
pods_cidr               = "10.11.0.0/16"
services_cidr           = "10.12.0.0/16"
enable_private_endpoint = true  # Private GKE control plane

# GKE Configuration - Medium capacity
gke_node_count       = 2
gke_machine_type     = "e2-standard-4"  # 4 vCPU, 16 GB RAM
gke_disk_size_gb     = 100
gke_min_node_count   = 2
gke_max_node_count   = 8
gke_enable_autopilot = false

# Cloud SQL PostgreSQL - Standard instance
postgresql_version            = "POSTGRES_15"
postgresql_tier               = "db-custom-2-7680"  # 2 vCPU, 7.5 GB RAM
postgresql_disk_size          = 200
postgresql_disk_autoresize    = true
postgresql_backup_enabled     = true
postgresql_backup_start_time  = "03:00"
postgresql_high_availability  = true  # Regional HA

# Memorystore Redis - Standard HA tier
redis_tier               = "STANDARD_HA"  # With replication
redis_memory_size_gb     = 5
redis_version            = "REDIS_7_0"
redis_high_availability  = true

# Cloud Storage
storage_class              = "STANDARD"
storage_versioning_enabled = true
storage_lifecycle_age_days = 30

# Load Balancer
enable_ssl      = true
ssl_certificate = null  # Set to your SSL cert resource name

# Security
deletion_protection = true

# MongoDB Atlas
mongodb_atlas_enabled     = true
mongodb_atlas_project_id  = ""  # Set your Atlas project ID
mongodb_atlas_cluster_tier = "M10"  # Dedicated cluster

# Monitoring
notification_channels = []  # Add your notification channel IDs

# Labels
additional_labels = {
  cost_center = "staging"
  managed_by  = "terraform"
  purpose     = "pre-production"
  compliance  = "sox"
}

# Estimated Monthly Cost: ~$500-700
# - GKE: $250-300 (2x e2-standard-4 nodes)
# - Cloud SQL: $150-200 (db-custom-2-7680 with HA)
# - Redis: $60-80 (5 GB Standard HA)
# - Storage: $20-30
# - Load Balancer: $20-30
# - MongoDB Atlas M10: $57/month
