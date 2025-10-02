# Azure Application Gateway Module Variables

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

variable "subnet_id" {
  description = "Subnet ID for Application Gateway"
  type        = string
}

variable "zones" {
  description = "Availability zones"
  type        = list(string)
  default     = []
}

variable "sku_name" {
  description = "SKU name (Standard_v2 or WAF_v2)"
  type        = string
  default     = "Standard_v2"
}

variable "sku_tier" {
  description = "SKU tier (Standard_v2 or WAF_v2)"
  type        = string
  default     = "Standard_v2"
}

variable "sku_capacity" {
  description = "SKU capacity (if not using autoscale)"
  type        = number
  default     = 2
}

variable "enable_autoscale" {
  description = "Enable autoscaling"
  type        = bool
  default     = false
}

variable "autoscale_min_capacity" {
  description = "Minimum autoscale capacity"
  type        = number
  default     = 1
}

variable "autoscale_max_capacity" {
  description = "Maximum autoscale capacity"
  type        = number
  default     = 10
}

variable "request_timeout" {
  description = "Request timeout in seconds"
  type        = number
  default     = 30
}

variable "health_probe_path" {
  description = "Health probe path"
  type        = string
  default     = "/health"
}

variable "health_probe_host" {
  description = "Health probe host"
  type        = string
  default     = ""
}

variable "health_probe_interval" {
  description = "Health probe interval in seconds"
  type        = number
  default     = 30
}

variable "health_probe_timeout" {
  description = "Health probe timeout in seconds"
  type        = number
  default     = 30
}

variable "health_probe_unhealthy_threshold" {
  description = "Health probe unhealthy threshold"
  type        = number
  default     = 3
}

variable "enable_waf" {
  description = "Enable Web Application Firewall"
  type        = bool
  default     = false
}

variable "waf_mode" {
  description = "WAF mode (Detection or Prevention)"
  type        = string
  default     = "Prevention"
}

variable "waf_rule_set_version" {
  description = "WAF rule set version"
  type        = string
  default     = "3.2"
}

variable "waf_disabled_rule_groups" {
  description = "List of disabled WAF rule groups"
  type = list(object({
    rule_group_name = string
    rules           = list(string)
  }))
  default = []
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
