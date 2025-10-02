# Memorystore Redis Module Variables

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

variable "tier" {
  description = "Redis tier (BASIC or STANDARD_HA)"
  type        = string
  default     = "BASIC"

  validation {
    condition     = contains(["BASIC", "STANDARD_HA"], var.tier)
    error_message = "Tier must be BASIC or STANDARD_HA."
  }
}

variable "memory_size_gb" {
  description = "Redis memory size in GB"
  type        = number
  default     = 1
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "REDIS_6_X"
}

variable "reserved_ip_range" {
  description = "Reserved IP range for Redis instance"
  type        = string
  default     = null
}

variable "connect_mode" {
  description = "Connection mode (DIRECT_PEERING or PRIVATE_SERVICE_ACCESS)"
  type        = string
  default     = "DIRECT_PEERING"
}

variable "authorized_network" {
  description = "VPC network authorized to access Redis"
  type        = string
}

variable "replica_count" {
  description = "Number of replicas (STANDARD_HA only, 1-5)"
  type        = number
  default     = 1

  validation {
    condition     = var.replica_count >= 1 && var.replica_count <= 5
    error_message = "Replica count must be between 1 and 5."
  }
}

variable "read_replicas_mode" {
  description = "Read replicas mode (READ_REPLICAS_ENABLED or READ_REPLICAS_DISABLED)"
  type        = string
  default     = "READ_REPLICAS_DISABLED"
}

variable "maxmemory_policy" {
  description = "Maxmemory policy"
  type        = string
  default     = "allkeys-lru"
}

variable "notify_keyspace_events" {
  description = "Keyspace notifications"
  type        = string
  default     = ""
}

variable "redis_configs" {
  description = "Additional Redis configurations"
  type        = map(string)
  default     = {}
}

variable "maintenance_window_day" {
  description = "Maintenance window day (MONDAY, TUESDAY, etc.)"
  type        = string
  default     = "SUNDAY"
}

variable "maintenance_window_hour" {
  description = "Maintenance window hour (0-23)"
  type        = number
  default     = 3
}

variable "transit_encryption_mode" {
  description = "Transit encryption mode (SERVER_AUTHENTICATION or DISABLED)"
  type        = string
  default     = "DISABLED"
}

variable "auth_enabled" {
  description = "Enable Redis AUTH"
  type        = bool
  default     = false
}

variable "prevent_destroy" {
  description = "Prevent accidental deletion"
  type        = bool
  default     = false
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}
