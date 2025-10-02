# VPC Module Variables

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

variable "network_cidr" {
  description = "CIDR block for VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "subnet_cidrs" {
  description = "CIDR blocks for subnets"
  type = object({
    gke     = string
    data    = string
    private = string
  })
  default = {
    gke     = "10.0.1.0/24"
    data    = "10.0.2.0/24"
    private = "10.0.3.0/24"
  }
}

variable "enable_flow_logs" {
  description = "Enable VPC flow logs"
  type        = bool
  default     = true
}

variable "enable_private_google_access" {
  description = "Enable private Google access"
  type        = bool
  default     = true
}
