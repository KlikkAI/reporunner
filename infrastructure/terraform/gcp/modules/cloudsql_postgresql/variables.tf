# Cloud SQL PostgreSQL Module Variables

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "region" {
  description = "GCP region"
  type        = string
}

variable "database_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "POSTGRES_15"
}

variable "tier" {
  description = "Machine tier"
  type        = string
  default     = "db-custom-2-7680"
}

variable "disk_size_gb" {
  description = "Disk size in GB"
  type        = number
  default     = 100
}

variable "disk_type" {
  description = "Disk type (PD_SSD or PD_HDD)"
  type        = string
  default     = "PD_SSD"
}

variable "disk_autoresize" {
  description = "Enable automatic disk size increase"
  type        = bool
  default     = true
}

variable "high_availability" {
  description = "Enable high availability (regional)"
  type        = bool
  default     = false
}

variable "enable_public_ip" {
  description = "Enable public IP address"
  type        = bool
  default     = false
}

variable "private_network_self_link" {
  description = "VPC network self link for private IP"
  type        = string
}

variable "private_vpc_connection" {
  description = "Private VPC connection dependency"
  type        = any
  default     = null
}

variable "authorized_networks" {
  description = "List of authorized networks"
  type = list(object({
    name = string
    cidr = string
  }))
  default = []
}

variable "backup_start_time" {
  description = "Backup start time (HH:MM format)"
  type        = string
  default     = "03:00"
}

variable "point_in_time_recovery" {
  description = "Enable point-in-time recovery"
  type        = bool
  default     = true
}

variable "transaction_log_retention_days" {
  description = "Transaction log retention in days"
  type        = number
  default     = 7
}

variable "backup_retention_count" {
  description = "Number of backups to retain"
  type        = number
  default     = 7
}

variable "maintenance_window_day" {
  description = "Maintenance window day (1-7, Sunday = 7)"
  type        = number
  default     = 7
}

variable "maintenance_window_hour" {
  description = "Maintenance window hour (0-23)"
  type        = number
  default     = 3
}

variable "maintenance_update_track" {
  description = "Maintenance update track (stable or canary)"
  type        = string
  default     = "stable"
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "reporunner"
}

variable "database_user" {
  description = "Database user"
  type        = string
  default     = "reporunner"
}

variable "max_connections" {
  description = "Maximum number of connections"
  type        = number
  default     = 100
}

variable "shared_buffers" {
  description = "Shared buffers size"
  type        = string
  default     = "256MB"
}

variable "effective_cache_size" {
  description = "Effective cache size"
  type        = string
  default     = "1GB"
}

variable "work_mem" {
  description = "Work memory size"
  type        = string
  default     = "16MB"
}

variable "database_flags" {
  description = "Additional database flags"
  type        = map(string)
  default     = {}
}

variable "enable_query_insights" {
  description = "Enable query insights"
  type        = bool
  default     = true
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "create_read_replica" {
  description = "Create read replica"
  type        = bool
  default     = false
}

variable "replica_region" {
  description = "Region for read replica (defaults to primary region)"
  type        = string
  default     = ""
}

variable "replica_tier" {
  description = "Tier for read replica (defaults to primary tier)"
  type        = string
  default     = ""
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}
