# KlikkFlow GCP Production Environment Configuration
# High-availability production setup

# Project Configuration
# project_id = "your-gcp-project-id"  # Set this via environment variable or CLI
environment  = "production"
project_name = "klikkflow"
region       = "us-central1"

# Network Configuration
vpc_cidr                = "10.20.0.0/16"
pods_cidr               = "10.21.0.0/16"
services_cidr           = "10.22.0.0/16"
enable_private_endpoint = true  # Private GKE control plane for security

# GKE Configuration - High capacity with HA
gke_node_count       = 3
gke_machine_type     = "n2-standard-8"  # 8 vCPU, 32 GB RAM
gke_disk_size_gb     = 200
gke_min_node_count   = 3
gke_max_node_count   = 20
gke_enable_autopilot = false

# Cloud SQL PostgreSQL - High performance
postgresql_version            = "POSTGRES_15"
postgresql_tier               = "db-custom-8-30720"  # 8 vCPU, 30 GB RAM
postgresql_disk_size          = 500
postgresql_disk_autoresize    = true
postgresql_backup_enabled     = true
postgresql_backup_start_time  = "03:00"
postgresql_high_availability  = true  # Regional HA with automatic failover

# Memorystore Redis - Standard HA tier
redis_tier               = "STANDARD_HA"  # With replication and automatic failover
redis_memory_size_gb     = 10
redis_version            = "REDIS_7_0"
redis_high_availability  = true

# Cloud Storage
storage_class              = "STANDARD"
storage_versioning_enabled = true
storage_lifecycle_age_days = 90

# Load Balancer
enable_ssl      = true
ssl_certificate = null  # Set to your SSL cert resource name

# Security
deletion_protection = true  # Prevent accidental deletion

# MongoDB Atlas
mongodb_atlas_enabled     = true
mongodb_atlas_project_id  = ""  # Set your Atlas project ID
mongodb_atlas_cluster_tier = "M30"  # Production cluster with 3 replicas

# Monitoring
notification_channels = []  # Add your notification channel IDs for alerts

# Labels
additional_labels = {
  cost_center = "production"
  managed_by  = "terraform"
  purpose     = "production-workload"
  compliance  = "sox,hipaa,gdpr"
  criticality = "high"
  backup      = "required"
}

# Estimated Monthly Cost: ~$1,500-2,000
# - GKE: $800-1,000 (3x n2-standard-8 nodes)
# - Cloud SQL: $400-500 (db-custom-8-30720 with HA)
# - Redis: $120-150 (10 GB Standard HA)
# - Storage: $50-75
# - Load Balancer: $30-40
# - MongoDB Atlas M30: $350/month
# - Data transfer and additional services: $150-200
