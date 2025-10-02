# Azure Redis Module Variables

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

variable "capacity" {
  description = "Redis cache capacity"
  type        = number
  default     = 1
}

variable "family" {
  description = "Redis family (C for Basic/Standard, P for Premium)"
  type        = string
  default     = "C"
}

variable "sku_name" {
  description = "SKU name (Basic, Standard, Premium)"
  type        = string
  default     = "Standard"
}

variable "enable_non_ssl_port" {
  description = "Enable non-SSL port"
  type        = bool
  default     = false
}

variable "minimum_tls_version" {
  description = "Minimum TLS version"
  type        = string
  default     = "1.2"
}

variable "subnet_id" {
  description = "Subnet ID (Premium SKU only)"
  type        = string
  default     = ""
}

variable "public_network_access_enabled" {
  description = "Enable public network access"
  type        = bool
  default     = true
}

variable "shard_count" {
  description = "Number of shards (Premium SKU only, 1-10)"
  type        = number
  default     = 1
}

variable "zones" {
  description = "Availability zones"
  type        = list(string)
  default     = []
}

variable "maxmemory_reserved" {
  description = "Maxmemory reserved (MB)"
  type        = number
  default     = 50
}

variable "maxmemory_delta" {
  description = "Maxmemory delta (MB)"
  type        = number
  default     = 50
}

variable "maxmemory_policy" {
  description = "Maxmemory policy"
  type        = string
  default     = "allkeys-lru"
}

variable "maxfragmentationmemory_reserved" {
  description = "Max fragmentation memory reserved (MB)"
  type        = number
  default     = 50
}

variable "rdb_backup_enabled" {
  description = "Enable RDB backup (Premium SKU only)"
  type        = bool
  default     = false
}

variable "rdb_backup_frequency" {
  description = "RDB backup frequency in minutes (15, 30, 60, 360, 720, 1440)"
  type        = number
  default     = 60
}

variable "rdb_backup_max_snapshot_count" {
  description = "Maximum number of RDB snapshots"
  type        = number
  default     = 1
}

variable "rdb_storage_connection_string" {
  description = "Storage account connection string for RDB backups"
  type        = string
  default     = ""
  sensitive   = true
}

variable "patch_schedule_day" {
  description = "Patch schedule day (Monday, Tuesday, etc.)"
  type        = string
  default     = ""
}

variable "patch_schedule_hour" {
  description = "Patch schedule start hour (0-23)"
  type        = number
  default     = 3
}

variable "enable_private_endpoint" {
  description = "Enable private endpoint"
  type        = bool
  default     = false
}

variable "private_endpoint_subnet_id" {
  description = "Subnet ID for private endpoint"
  type        = string
  default     = ""
}

variable "key_vault_id" {
  description = "Key Vault ID for storing access keys"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
