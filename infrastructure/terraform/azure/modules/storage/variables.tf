# Azure Storage Module Variables

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

variable "account_tier" {
  description = "Storage account tier (Standard or Premium)"
  type        = string
  default     = "Standard"
}

variable "replication_type" {
  description = "Replication type (LRS, GRS, RAGRS, ZRS, GZRS, RAGZRS)"
  type        = string
  default     = "LRS"
}

variable "account_kind" {
  description = "Account kind (BlobStorage, BlockBlobStorage, FileStorage, Storage, StorageV2)"
  type        = string
  default     = "StorageV2"
}

variable "access_tier" {
  description = "Access tier (Hot or Cool)"
  type        = string
  default     = "Hot"
}

variable "enable_versioning" {
  description = "Enable blob versioning"
  type        = bool
  default     = false
}

variable "enable_change_feed" {
  description = "Enable change feed"
  type        = bool
  default     = false
}

variable "enable_soft_delete" {
  description = "Enable soft delete"
  type        = bool
  default     = false
}

variable "soft_delete_retention_days" {
  description = "Soft delete retention in days"
  type        = number
  default     = 7
}

variable "default_network_action" {
  description = "Default network action (Allow or Deny)"
  type        = string
  default     = "Deny"
}

variable "allowed_ip_ranges" {
  description = "List of allowed IP ranges"
  type        = list(string)
  default     = []
}

variable "allowed_subnet_ids" {
  description = "List of allowed subnet IDs"
  type        = list(string)
  default     = []
}

variable "file_share_quota_gb" {
  description = "File share quota in GB"
  type        = number
  default     = 100
}

variable "enable_lifecycle_management" {
  description = "Enable lifecycle management policies"
  type        = bool
  default     = false
}

variable "artifact_retention_days" {
  description = "Artifact retention in days"
  type        = number
  default     = 90
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
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
  description = "Key Vault ID for storing access key"
  type        = string
  default     = ""
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
