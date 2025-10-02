# Cloud Storage Module Variables

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

variable "location_type" {
  description = "Location type (REGION or MULTI_REGION)"
  type        = string
  default     = "REGION"

  validation {
    condition     = contains(["REGION", "MULTI_REGION"], var.location_type)
    error_message = "Location type must be REGION or MULTI_REGION."
  }
}

variable "multi_region" {
  description = "Multi-region location (US, EU, ASIA)"
  type        = string
  default     = "US"
}

variable "storage_class" {
  description = "Storage class (STANDARD, NEARLINE, COLDLINE, ARCHIVE)"
  type        = string
  default     = "STANDARD"
}

variable "force_destroy" {
  description = "Allow bucket deletion with objects inside"
  type        = bool
  default     = false
}

variable "enable_versioning" {
  description = "Enable object versioning"
  type        = bool
  default     = false
}

variable "lifecycle_rules" {
  description = "Lifecycle rules for bucket"
  type = list(object({
    action = object({
      type          = string
      storage_class = optional(string)
    })
    condition = object({
      age                   = optional(number)
      created_before        = optional(string)
      with_state            = optional(string)
      matches_storage_class = optional(list(string))
      num_newer_versions    = optional(number)
    })
  }))
  default = []
}

variable "cors_rules" {
  description = "CORS rules for bucket"
  type = list(object({
    origin          = list(string)
    method          = list(string)
    response_header = list(string)
    max_age_seconds = number
  }))
  default = []
}

variable "encryption_key" {
  description = "KMS encryption key name"
  type        = string
  default     = ""
}

variable "enable_logging" {
  description = "Enable access logging"
  type        = bool
  default     = false
}

variable "log_bucket" {
  description = "Existing bucket for logs (creates new if empty)"
  type        = string
  default     = ""
}

variable "log_retention_days" {
  description = "Log retention in days"
  type        = number
  default     = 30
}

variable "artifact_retention_days" {
  description = "Artifact retention in days"
  type        = number
  default     = 90
}

variable "public_access_prevention" {
  description = "Public access prevention (enforced or inherited)"
  type        = string
  default     = "enforced"
}

variable "enable_cdn" {
  description = "Enable Cloud CDN for static assets"
  type        = bool
  default     = false
}

variable "labels" {
  description = "Labels to apply to resources"
  type        = map(string)
  default     = {}
}
