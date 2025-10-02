# Load Balancer Module Variables

variable "project_id" {
  description = "GCP project ID"
  type        = string
}

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "enable_https" {
  description = "Enable HTTPS"
  type        = bool
  default     = true
}

variable "ssl_certificate_domains" {
  description = "Domains for managed SSL certificate"
  type        = list(string)
  default     = null
}

variable "ssl_certificate_self_links" {
  description = "Self links of existing SSL certificates"
  type        = list(string)
  default     = []
}

variable "enable_http_to_https_redirect" {
  description = "Redirect HTTP to HTTPS"
  type        = bool
  default     = true
}

variable "backend_timeout_sec" {
  description = "Backend timeout in seconds"
  type        = number
  default     = 30
}

variable "connection_draining_timeout_sec" {
  description = "Connection draining timeout in seconds"
  type        = number
  default     = 300
}

variable "session_affinity" {
  description = "Session affinity type"
  type        = string
  default     = "NONE"
}

variable "enable_cdn" {
  description = "Enable Cloud CDN"
  type        = bool
  default     = false
}

variable "enable_iap" {
  description = "Enable Identity-Aware Proxy"
  type        = bool
  default     = false
}

variable "iap_oauth2_client_id" {
  description = "IAP OAuth2 client ID"
  type        = string
  default     = ""
}

variable "iap_oauth2_client_secret" {
  description = "IAP OAuth2 client secret"
  type        = string
  default     = ""
  sensitive   = true
}

variable "backend_groups" {
  description = "Backend instance groups"
  type = list(object({
    group                 = string
    max_rate_per_instance = number
    capacity_scaler       = number
  }))
  default = []
}

variable "health_check_port" {
  description = "Health check port"
  type        = number
  default     = 8080
}

variable "health_check_path" {
  description = "Health check path"
  type        = string
  default     = "/health"
}

variable "health_check_timeout" {
  description = "Health check timeout in seconds"
  type        = number
  default     = 5
}

variable "health_check_interval" {
  description = "Health check interval in seconds"
  type        = number
  default     = 10
}

variable "health_check_healthy_threshold" {
  description = "Healthy threshold"
  type        = number
  default     = 2
}

variable "health_check_unhealthy_threshold" {
  description = "Unhealthy threshold"
  type        = number
  default     = 3
}

variable "host_rules" {
  description = "Host rules for URL map"
  type = list(object({
    hosts        = list(string)
    path_matcher = string
  }))
  default = []
}

variable "path_matchers" {
  description = "Path matchers for URL map"
  type = list(object({
    name            = string
    default_service = string
    path_rules = list(object({
      paths   = list(string)
      service = string
    }))
  }))
  default = []
}

variable "create_cloud_armor_policy" {
  description = "Create Cloud Armor security policy"
  type        = bool
  default     = false
}

variable "cloud_armor_security_policy" {
  description = "Existing Cloud Armor security policy self link"
  type        = string
  default     = ""
}

variable "rate_limit_threshold" {
  description = "Rate limit threshold (requests per interval, 0 to disable)"
  type        = number
  default     = 0
}

variable "rate_limit_interval_sec" {
  description = "Rate limit interval in seconds"
  type        = number
  default     = 60
}

variable "rate_limit_ban_duration_sec" {
  description = "Rate limit ban duration in seconds"
  type        = number
  default     = 600
}

variable "cloud_armor_rules" {
  description = "Custom Cloud Armor rules"
  type = list(object({
    action          = string
    priority        = number
    description     = string
    versioned_expr  = string
    src_ip_ranges   = list(string)
  }))
  default = []
}
