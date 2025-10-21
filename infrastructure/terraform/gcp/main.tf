/**
 * KlikkFlow GCP Infrastructure
 *
 * Complete production-ready infrastructure on Google Cloud Platform
 * - GKE (Google Kubernetes Engine) for container orchestration
 * - Cloud SQL for PostgreSQL with pgvector
 * - MongoDB Atlas integration
 * - Memorystore for Redis
 * - Cloud Load Balancing
 * - Cloud Storage
 * - Cloud Monitoring and Logging
 */

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
    google-beta = {
      source  = "hashicorp/google-beta"
      version = "~> 5.0"
    }
    kubernetes = {
      source  = "hashicorp/kubernetes"
      version = "~> 2.23"
    }
    helm = {
      source  = "hashicorp/helm"
      version = "~> 2.11"
    }
  }

  backend "gcs" {
    bucket = "klikkflow-terraform-state"
    prefix = "gcp"
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

provider "google-beta" {
  project = var.project_id
  region  = var.region
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"

  common_labels = {
    environment = var.environment
    project     = var.project_name
    managed_by  = "terraform"
    platform    = "klikkflow"
  }
}

# VPC Network
module "vpc" {
  source = "./modules/vpc"

  project_id  = var.project_id
  name_prefix = local.name_prefix
  region      = var.region

  vpc_cidr                = var.vpc_cidr
  pods_cidr               = var.pods_cidr
  services_cidr           = var.services_cidr
  enable_private_endpoint = var.enable_private_endpoint

  labels = local.common_labels
}

# GKE Cluster
module "gke" {
  source = "./modules/gke"

  project_id  = var.project_id
  name_prefix = local.name_prefix
  region      = var.region

  network_name    = module.vpc.network_name
  subnet_name     = module.vpc.subnet_name
  pods_cidr_name  = module.vpc.pods_secondary_range_name
  svc_cidr_name   = module.vpc.services_secondary_range_name

  node_count       = var.gke_node_count
  machine_type     = var.gke_machine_type
  disk_size_gb     = var.gke_disk_size_gb
  min_node_count   = var.gke_min_node_count
  max_node_count   = var.gke_max_node_count

  enable_autopilot = var.gke_enable_autopilot

  labels = local.common_labels
}

# Cloud SQL PostgreSQL
module "cloudsql_postgresql" {
  source = "./modules/cloudsql-postgresql"

  project_id  = var.project_id
  name_prefix = local.name_prefix
  region      = var.region

  network_id = module.vpc.network_id

  database_version = var.postgresql_version
  tier             = var.postgresql_tier
  disk_size        = var.postgresql_disk_size
  disk_autoresize  = var.postgresql_disk_autoresize

  backup_enabled           = var.postgresql_backup_enabled
  backup_start_time        = var.postgresql_backup_start_time
  high_availability        = var.postgresql_high_availability
  deletion_protection      = var.deletion_protection

  database_flags = [
    {
      name  = "cloudsql.enable_pgvector"
      value = "on"
    }
  ]

  labels = local.common_labels
}

# Memorystore Redis
module "memorystore_redis" {
  source = "./modules/memorystore-redis"

  project_id  = var.project_id
  name_prefix = local.name_prefix
  region      = var.region

  network_id = module.vpc.network_id

  tier               = var.redis_tier
  memory_size_gb     = var.redis_memory_size_gb
  redis_version      = var.redis_version
  auth_enabled       = true
  transit_encryption = true

  high_availability = var.redis_high_availability

  labels = local.common_labels
}

# Cloud Storage Bucket
module "storage" {
  source = "./modules/storage"

  project_id  = var.project_id
  name_prefix = local.name_prefix
  region      = var.region

  storage_class          = var.storage_class
  versioning_enabled     = var.storage_versioning_enabled
  lifecycle_age_days     = var.storage_lifecycle_age_days
  uniform_bucket_access  = true

  labels = local.common_labels
}

# Load Balancer
module "load_balancer" {
  source = "./modules/load-balancer"

  project_id  = var.project_id
  name_prefix = local.name_prefix

  enable_ssl      = var.enable_ssl
  ssl_certificate = var.ssl_certificate

  backend_services = {
    frontend = {
      port        = 3000
      protocol    = "HTTP"
      timeout_sec = 30
    }
    backend = {
      port        = 4000
      protocol    = "HTTP"
      timeout_sec = 30
    }
  }

  labels = local.common_labels
}

# Cloud Monitoring
module "monitoring" {
  source = "./modules/monitoring"

  project_id  = var.project_id
  name_prefix = local.name_prefix

  notification_channels = var.notification_channels

  gke_cluster_name      = module.gke.cluster_name
  cloudsql_instance_id  = module.cloudsql_postgresql.instance_id
  redis_instance_id     = module.memorystore_redis.instance_id

  labels = local.common_labels
}

# Service Accounts
resource "google_service_account" "gke_workload" {
  account_id   = "${local.name_prefix}-gke-workload"
  display_name = "GKE Workload Identity Service Account"
  project      = var.project_id
}

resource "google_project_iam_member" "gke_workload_storage" {
  project = var.project_id
  role    = "roles/storage.objectAdmin"
  member  = "serviceAccount:${google_service_account.gke_workload.email}"
}

resource "google_project_iam_member" "gke_workload_sql" {
  project = var.project_id
  role    = "roles/cloudsql.client"
  member  = "serviceAccount:${google_service_account.gke_workload.email}"
}

resource "google_project_iam_member" "gke_workload_logging" {
  project = var.project_id
  role    = "roles/logging.logWriter"
  member  = "serviceAccount:${google_service_account.gke_workload.email}"
}

resource "google_project_iam_member" "gke_workload_monitoring" {
  project = var.project_id
  role    = "roles/monitoring.metricWriter"
  member  = "serviceAccount:${google_service_account.gke_workload.email}"
}

# Secret Manager for sensitive data
resource "google_secret_manager_secret" "database_credentials" {
  secret_id = "${local.name_prefix}-database-credentials"
  project   = var.project_id

  replication {
    auto {}
  }

  labels = local.common_labels
}

resource "google_secret_manager_secret_version" "database_credentials" {
  secret = google_secret_manager_secret.database_credentials.id

  secret_data = jsonencode({
    postgresql_host     = module.cloudsql_postgresql.connection_name
    postgresql_user     = module.cloudsql_postgresql.user
    postgresql_password = module.cloudsql_postgresql.password
    postgresql_database = module.cloudsql_postgresql.database_name
    redis_host          = module.memorystore_redis.host
    redis_port          = module.memorystore_redis.port
    redis_auth          = module.memorystore_redis.auth_string
  })
}
