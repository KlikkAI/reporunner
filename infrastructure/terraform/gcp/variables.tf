/**
 * GCP Infrastructure Variables
 */

# Project Configuration
variable "project_id" {
  description = "GCP Project ID"
  type        = string
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "reporunner"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "region" {
  description = "GCP region"
  type        = string
  default     = "us-central1"
}

# Network Configuration
variable "vpc_cidr" {
  description = "VPC CIDR block"
  type        = string
  default     = "10.0.0.0/16"
}

variable "pods_cidr" {
  description = "Pods secondary CIDR range"
  type        = string
  default     = "10.1.0.0/16"
}

variable "services_cidr" {
  description = "Services secondary CIDR range"
  type        = string
  default     = "10.2.0.0/16"
}

variable "enable_private_endpoint" {
  description = "Enable private endpoint for GKE control plane"
  type        = bool
  default     = true
}

# GKE Configuration
variable "gke_node_count" {
  description = "Initial number of nodes in the GKE cluster"
  type        = number
  default     = 3
}

variable "gke_machine_type" {
  description = "GKE node machine type"
  type        = string
  default     = "e2-standard-4"
}

variable "gke_disk_size_gb" {
  description = "GKE node disk size in GB"
  type        = number
  default     = 100
}

variable "gke_min_node_count" {
  description = "Minimum number of nodes for autoscaling"
  type        = number
  default     = 1
}

variable "gke_max_node_count" {
  description = "Maximum number of nodes for autoscaling"
  type        = number
  default     = 10
}

variable "gke_enable_autopilot" {
  description = "Enable GKE Autopilot mode"
  type        = bool
  default     = false
}

# Cloud SQL PostgreSQL Configuration
variable "postgresql_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "postgresql_tier" {
  description = "Cloud SQL tier"
  type        = string
  default     = "db-custom-2-7680" # 2 vCPU, 7.5 GB RAM
}

variable "postgresql_disk_size" {
  description = "PostgreSQL disk size in GB"
  type        = number
  default     = 100
}

variable "postgresql_disk_autoresize" {
  description = "Enable automatic disk resize"
  type        = bool
  default     = true
}

variable "postgresql_backup_enabled" {
  description = "Enable automated backups"
  type        = bool
  default     = true
}

variable "postgresql_backup_start_time" {
  description = "Backup start time (HH:MM format)"
  type        = string
  default     = "03:00"
}

variable "postgresql_high_availability" {
  description = "Enable high availability"
  type        = bool
  default     = true
}

# Memorystore Redis Configuration
variable "redis_tier" {
  description = "Redis tier (BASIC or STANDARD_HA)"
  type        = string
  default     = "STANDARD_HA"
}

variable "redis_memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 5
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "REDIS_7_0"
}

variable "redis_high_availability" {
  description = "Enable Redis high availability"
  type        = bool
  default     = true
}

# Cloud Storage Configuration
variable "storage_class" {
  description = "Storage class (STANDARD, NEARLINE, COLDLINE, ARCHIVE)"
  type        = string
  default     = "STANDARD"
}

variable "storage_versioning_enabled" {
  description = "Enable object versioning"
  type        = bool
  default     = true
}

variable "storage_lifecycle_age_days" {
  description = "Days before lifecycle transition"
  type        = number
  default     = 30
}

# Load Balancer Configuration
variable "enable_ssl" {
  description = "Enable SSL/TLS"
  type        = bool
  default     = true
}

variable "ssl_certificate" {
  description = "SSL certificate resource name"
  type        = string
  default     = null
}

# Monitoring Configuration
variable "notification_channels" {
  description = "List of notification channel IDs for alerts"
  type        = list(string)
  default     = []
}

# Security Configuration
variable "deletion_protection" {
  description = "Enable deletion protection on resources"
  type        = bool
  default     = true
}

# MongoDB Configuration (Atlas)
variable "mongodb_atlas_enabled" {
  description = "Enable MongoDB Atlas integration"
  type        = bool
  default     = true
}

variable "mongodb_atlas_project_id" {
  description = "MongoDB Atlas Project ID"
  type        = string
  default     = ""
}

variable "mongodb_atlas_cluster_tier" {
  description = "MongoDB Atlas cluster tier"
  type        = string
  default     = "M10"
}

# Tags/Labels
variable "additional_labels" {
  description = "Additional labels to apply to all resources"
  type        = map(string)
  default     = {}
}
