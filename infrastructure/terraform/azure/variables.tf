/**
 * Azure Infrastructure Variables
 */

# Project Configuration
variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "klikkflow"
}

variable "environment" {
  description = "Environment name (dev, staging, production)"
  type        = string

  validation {
    condition     = contains(["dev", "staging", "production"], var.environment)
    error_message = "Environment must be dev, staging, or production."
  }
}

variable "location" {
  description = "Azure region"
  type        = string
  default     = "eastus"
}

# Network Configuration
variable "vnet_address_space" {
  description = "VNet address space"
  type        = list(string)
  default     = ["10.0.0.0/16"]
}

variable "subnet_cidrs" {
  description = "Subnet CIDR blocks"
  type = object({
    aks      = list(string)
    database = list(string)
    appgw    = list(string)
  })
  default = {
    aks      = ["10.0.1.0/24"]
    database = ["10.0.2.0/24"]
    appgw    = ["10.0.3.0/24"]
  }
}

# AKS Configuration
variable "kubernetes_version" {
  description = "Kubernetes version"
  type        = string
  default     = "1.28"
}

variable "aks_node_count" {
  description = "Initial number of nodes"
  type        = number
  default     = 3
}

variable "aks_vm_size" {
  description = "VM size for AKS nodes"
  type        = string
  default     = "Standard_D4s_v3"
}

variable "aks_os_disk_size_gb" {
  description = "OS disk size in GB"
  type        = number
  default     = 128
}

variable "aks_enable_auto_scaling" {
  description = "Enable cluster autoscaler"
  type        = bool
  default     = true
}

variable "aks_min_count" {
  description = "Minimum node count"
  type        = number
  default     = 1
}

variable "aks_max_count" {
  description = "Maximum node count"
  type        = number
  default     = 10
}

variable "aks_enable_azure_policy" {
  description = "Enable Azure Policy for AKS"
  type        = bool
  default     = true
}

variable "aks_enable_private_cluster" {
  description = "Enable private cluster"
  type        = bool
  default     = true
}

# PostgreSQL Configuration
variable "postgresql_version" {
  description = "PostgreSQL version"
  type        = string
  default     = "15"
}

variable "postgresql_sku_name" {
  description = "PostgreSQL SKU name"
  type        = string
  default     = "GP_Standard_D2s_v3"
}

variable "postgresql_storage_mb" {
  description = "Storage size in MB"
  type        = number
  default     = 102400
}

variable "postgresql_backup_retention_days" {
  description = "Backup retention in days"
  type        = number
  default     = 7
}

variable "postgresql_geo_redundant_backup" {
  description = "Enable geo-redundant backup"
  type        = bool
  default     = true
}

variable "postgresql_high_availability" {
  description = "Enable high availability"
  type        = bool
  default     = true
}

variable "postgresql_zone" {
  description = "Availability zone"
  type        = string
  default     = "1"
}

# Cosmos DB Configuration
variable "cosmosdb_consistency_level" {
  description = "Cosmos DB consistency level"
  type        = string
  default     = "Session"
}

variable "cosmosdb_max_interval" {
  description = "Max interval in seconds"
  type        = number
  default     = 5
}

variable "cosmosdb_max_staleness" {
  description = "Max staleness prefix"
  type        = number
  default     = 100
}

variable "cosmosdb_enable_failover" {
  description = "Enable automatic failover"
  type        = bool
  default     = true
}

variable "cosmosdb_failover_locations" {
  description = "Failover locations"
  type        = list(string)
  default     = ["westus"]
}

variable "cosmosdb_throughput" {
  description = "Database throughput (RU/s)"
  type        = number
  default     = 400
}

# Redis Configuration
variable "redis_capacity" {
  description = "Redis cache capacity"
  type        = number
  default     = 1
}

variable "redis_family" {
  description = "Redis cache family"
  type        = string
  default     = "C"
}

variable "redis_sku_name" {
  description = "Redis SKU name"
  type        = string
  default     = "Standard"
}

variable "redis_version" {
  description = "Redis version"
  type        = string
  default     = "6"
}

variable "redis_configuration" {
  description = "Redis configuration"
  type        = map(string)
  default     = {}
}

variable "redis_shard_count" {
  description = "Number of shards (Premium only)"
  type        = number
  default     = null
}

variable "redis_zones" {
  description = "Availability zones"
  type        = list(string)
  default     = null
}

# Storage Configuration
variable "storage_account_tier" {
  description = "Storage account tier"
  type        = string
  default     = "Standard"
}

variable "storage_replication_type" {
  description = "Storage replication type"
  type        = string
  default     = "GRS"
}

variable "storage_access_tier" {
  description = "Storage access tier"
  type        = string
  default     = "Hot"
}

variable "storage_enable_versioning" {
  description = "Enable blob versioning"
  type        = bool
  default     = true
}

variable "storage_enable_soft_delete" {
  description = "Enable soft delete"
  type        = bool
  default     = true
}

variable "storage_soft_delete_retention" {
  description = "Soft delete retention days"
  type        = number
  default     = 7
}

# Application Gateway Configuration
variable "appgw_enable_waf" {
  description = "Enable Web Application Firewall"
  type        = bool
  default     = true
}

variable "appgw_sku_name" {
  description = "Application Gateway SKU name"
  type        = string
  default     = "WAF_v2"
}

variable "appgw_sku_tier" {
  description = "Application Gateway SKU tier"
  type        = string
  default     = "WAF_v2"
}

variable "appgw_sku_capacity" {
  description = "Application Gateway capacity"
  type        = number
  default     = 2
}

# Monitoring Configuration
variable "log_analytics_retention_days" {
  description = "Log Analytics retention in days"
  type        = number
  default     = 30
}

variable "alert_email" {
  description = "Email for alerts"
  type        = string
  default     = ""
}

# Security Configuration
variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "key_vault_allowed_ips" {
  description = "Allowed IPs for Key Vault"
  type        = list(string)
  default     = []
}

# Tags
variable "additional_tags" {
  description = "Additional tags"
  type        = map(string)
  default     = {}
}
