/**
 * ECS Service Module Variables
 */

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "service_name" {
  description = "Name of the ECS service"
  type        = string
}

variable "cluster_id" {
  description = "ECS cluster ID"
  type        = string
}

variable "container_image" {
  description = "Docker container image"
  type        = string
}

variable "cpu" {
  description = "Task CPU units"
  type        = number
}

variable "memory" {
  description = "Task memory in MB"
  type        = number
}

variable "desired_count" {
  description = "Desired number of tasks"
  type        = number
}

variable "port_mappings" {
  description = "Container port mappings"
  type = list(object({
    containerPort = number
    protocol      = string
  }))
  default = []
}

variable "container_port" {
  description = "Container port for load balancer"
  type        = number
  default     = null
}

variable "environment_variables" {
  description = "Environment variables for container"
  type        = map(string)
  default     = {}
}

variable "secrets" {
  description = "Secrets from Secrets Manager"
  type        = map(string)
  default     = {}
}

variable "secrets_arns" {
  description = "ARNs of secrets the task needs access to"
  type        = list(string)
  default     = []
}

variable "subnet_ids" {
  description = "List of subnet IDs for ECS tasks"
  type        = list(string)
}

variable "security_group_id" {
  description = "Security group ID for ECS tasks"
  type        = string
}

variable "target_group_arn" {
  description = "Target group ARN for load balancer"
  type        = string
  default     = null
}

variable "container_health_check" {
  description = "Container health check configuration"
  type = object({
    command     = list(string)
    interval    = number
    timeout     = number
    retries     = number
    startPeriod = number
  })
  default = null
}

variable "additional_task_policy_statements" {
  description = "Additional IAM policy statements for task role"
  type        = list(any)
  default     = []
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 30
}

variable "kms_key_id" {
  description = "KMS key ID for encryption"
  type        = string
  default     = null
}

variable "region" {
  description = "AWS region"
  type        = string
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
