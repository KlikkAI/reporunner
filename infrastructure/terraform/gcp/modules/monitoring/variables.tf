# Monitoring Module Variables

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "alert_email" {
  description = "Email address for alerts"
  type        = string
  default     = ""
}

variable "pagerduty_service_key" {
  description = "PagerDuty service key"
  type        = string
  default     = ""
  sensitive   = true
}

variable "create_uptime_checks" {
  description = "Create uptime checks"
  type        = bool
  default     = true
}

variable "uptime_check_host" {
  description = "Host for uptime check"
  type        = string
  default     = ""
}

variable "uptime_check_path" {
  description = "Path for uptime check"
  type        = string
  default     = "/health"
}

variable "uptime_check_port" {
  description = "Port for uptime check"
  type        = number
  default     = 443
}

variable "uptime_check_use_ssl" {
  description = "Use SSL for uptime check"
  type        = bool
  default     = true
}

variable "uptime_check_validate_ssl" {
  description = "Validate SSL certificate"
  type        = bool
  default     = true
}

variable "create_gke_alerts" {
  description = "Create GKE alerts"
  type        = bool
  default     = true
}

variable "create_cloudsql_alerts" {
  description = "Create Cloud SQL alerts"
  type        = bool
  default     = true
}

variable "create_redis_alerts" {
  description = "Create Redis alerts"
  type        = bool
  default     = true
}

variable "create_lb_alerts" {
  description = "Create load balancer alerts"
  type        = bool
  default     = true
}

variable "lb_5xx_error_threshold" {
  description = "Threshold for 5xx errors per minute"
  type        = number
  default     = 10
}

variable "create_dashboard" {
  description = "Create monitoring dashboard"
  type        = bool
  default     = true
}
