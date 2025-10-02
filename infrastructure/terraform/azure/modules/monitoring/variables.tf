# Azure Monitoring Module Variables

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

variable "log_analytics_sku" {
  description = "Log Analytics SKU (PerGB2018, Free, PerNode, etc.)"
  type        = string
  default     = "PerGB2018"
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

variable "app_insights_retention_days" {
  description = "Application Insights retention in days"
  type        = number
  default     = 90
}

variable "alert_emails" {
  description = "List of email addresses for alerts"
  type        = list(string)
  default     = []
}

variable "enable_aks_alerts" {
  description = "Enable AKS alerts"
  type        = bool
  default     = false
}

variable "aks_cluster_id" {
  description = "AKS cluster ID for alerts"
  type        = string
  default     = ""
}

variable "enable_postgresql_alerts" {
  description = "Enable PostgreSQL alerts"
  type        = bool
  default     = false
}

variable "postgresql_server_id" {
  description = "PostgreSQL server ID for alerts"
  type        = string
  default     = ""
}

variable "enable_redis_alerts" {
  description = "Enable Redis alerts"
  type        = bool
  default     = false
}

variable "redis_cache_id" {
  description = "Redis cache ID for alerts"
  type        = string
  default     = ""
}

variable "enable_appgw_alerts" {
  description = "Enable Application Gateway alerts"
  type        = bool
  default     = false
}

variable "app_gateway_id" {
  description = "Application Gateway ID for alerts"
  type        = string
  default     = ""
}

variable "create_dashboard" {
  description = "Create Azure Portal dashboard"
  type        = bool
  default     = false
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
