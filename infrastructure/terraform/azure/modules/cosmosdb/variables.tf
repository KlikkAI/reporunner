# Azure Cosmos DB Module Variables

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

variable "consistency_level" {
  description = "Consistency level (Eventual, Session, BoundedStaleness, Strong, ConsistentPrefix)"
  type        = string
  default     = "Session"
}

variable "max_interval_in_seconds" {
  description = "Max interval in seconds for BoundedStaleness"
  type        = number
  default     = 5
}

variable "max_staleness_prefix" {
  description = "Max staleness prefix for BoundedStaleness"
  type        = number
  default     = 100
}

variable "failover_locations" {
  description = "List of failover locations"
  type        = list(string)
  default     = []
}

variable "enable_automatic_failover" {
  description = "Enable automatic failover"
  type        = bool
  default     = false
}

variable "enable_multiple_write_locations" {
  description = "Enable multiple write locations"
  type        = bool
  default     = false
}

variable "enable_free_tier" {
  description = "Enable free tier"
  type        = bool
  default     = false
}

variable "backup_type" {
  description = "Backup type (Periodic or Continuous)"
  type        = string
  default     = "Periodic"
}

variable "backup_interval_minutes" {
  description = "Backup interval in minutes"
  type        = number
  default     = 240
}

variable "backup_retention_hours" {
  description = "Backup retention in hours"
  type        = number
  default     = 8
}

variable "backup_storage_redundancy" {
  description = "Backup storage redundancy (Geo, Local, Zone)"
  type        = string
  default     = "Geo"
}

variable "enable_vnet_filter" {
  description = "Enable virtual network filter"
  type        = bool
  default     = false
}

variable "disable_public_access" {
  description = "Disable public network access"
  type        = bool
  default     = false
}

variable "vnet_subnet_ids" {
  description = "List of VNet subnet IDs"
  type        = list(string)
  default     = []
}

variable "ip_range_filter" {
  description = "IP range filter (comma-separated)"
  type        = string
  default     = ""
}

variable "database_name" {
  description = "Database name"
  type        = string
  default     = "reporunner"
}

variable "serverless_mode" {
  description = "Use serverless mode"
  type        = bool
  default     = false
}

variable "database_throughput" {
  description = "Database throughput (RU/s)"
  type        = number
  default     = 400
}

variable "enable_autoscale" {
  description = "Enable autoscale"
  type        = bool
  default     = false
}

variable "max_throughput" {
  description = "Maximum throughput for autoscale"
  type        = number
  default     = 4000
}

variable "default_ttl_seconds" {
  description = "Default TTL in seconds for documents"
  type        = number
  default     = -1
}

variable "execution_ttl_seconds" {
  description = "TTL in seconds for execution documents"
  type        = number
  default     = 2592000
}

variable "shard_key" {
  description = "Shard key for collections"
  type        = string
  default     = "userId"
}

variable "key_vault_id" {
  description = "Key Vault ID for storing connection string"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
