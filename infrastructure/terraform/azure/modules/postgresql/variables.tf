# Azure PostgreSQL Module Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "location" {
  description = "Azure region"
  type        = string
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
}

variable "sku_name" {
  description = "SKU name (e.g., GP_Standard_D4s_v3)"
  type        = string
  default     = "GP_Standard_D2s_v3"
}

variable "storage_mb" {
  description = "Storage size in MB"
  type        = number
  default     = 131072
}

variable "postgresql_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

variable "administrator_login" {
  description = "Administrator login name"
  type        = string
  default     = "reporunner"
}

variable "delegated_subnet_id" {
  description = "Delegated subnet ID for PostgreSQL"
  type        = string
}

variable "vnet_id" {
  description = "VNet ID for private DNS zone link"
  type        = string
}

variable "high_availability_enabled" {
  description = "Enable high availability"
  type        = bool
  default     = false
}

variable "standby_availability_zone" {
  description = "Standby availability zone for HA"
  type        = string
  default     = "2"
}

variable "backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 7
}

variable "geo_redundant_backup_enabled" {
  description = "Enable geo-redundant backup"
  type        = bool
  default     = false
}

variable "maintenance_window_day" {
  description = "Maintenance window day (0=Sunday)"
  type        = number
  default     = 0
}

variable "maintenance_window_hour" {
  description = "Maintenance window hour (0-23)"
  type        = number
  default     = 3
}

variable "zone" {
  description = "Availability zone"
  type        = string
  default     = "1"
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "reporunner"
}

variable "shared_buffers" {
  description = "Shared buffers size (KB)"
  type        = string
  default     = "262144"
}

variable "effective_cache_size" {
  description = "Effective cache size (KB)"
  type        = string
  default     = "1048576"
}

variable "work_mem" {
  description = "Work memory size (KB)"
  type        = string
  default     = "16384"
}

variable "max_connections" {
  description = "Maximum number of connections"
  type        = number
  default     = 100
}

variable "allow_azure_services" {
  description = "Allow Azure services to access the server"
  type        = bool
  default     = false
}

variable "key_vault_id" {
  description = "Key Vault ID for storing password"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
