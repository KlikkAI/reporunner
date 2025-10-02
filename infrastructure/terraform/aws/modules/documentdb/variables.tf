/**
 * DocumentDB Module Variables
 */

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "master_username" {
  description = "Master username for DocumentDB"
  type        = string
}

variable "cluster_size" {
  description = "Number of DocumentDB instances"
  type        = number
  default     = 2
}

variable "instance_class" {
  description = "DocumentDB instance class"
  type        = string
}

variable "subnet_ids" {
  description = "List of subnet IDs for DocumentDB subnet group"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for DocumentDB"
  type        = string
}

variable "backup_retention_period" {
  description = "Backup retention period in days"
  type        = number
  default     = 7
}

variable "deletion_protection" {
  description = "Enable deletion protection"
  type        = bool
  default     = true
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
