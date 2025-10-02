/**
 * CloudWatch Alarms Module Variables
 */

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "service_name" {
  description = "ECS service name"
  type        = string
}

variable "cluster_name" {
  description = "ECS cluster name"
  type        = string
}

variable "alarm_actions" {
  description = "List of ARNs to notify when alarm triggers"
  type        = list(string)
  default     = []
}

# ECS Thresholds
variable "cpu_high_threshold" {
  description = "CPU utilization threshold percentage"
  type        = number
  default     = 80
}

variable "memory_high_threshold" {
  description = "Memory utilization threshold percentage"
  type        = number
  default     = 85
}

variable "min_running_tasks" {
  description = "Minimum number of running tasks"
  type        = number
  default     = 1
}

# ALB Configuration
variable "target_group_arn" {
  description = "Target group ARN"
  type        = string
  default     = null
}

variable "alb_arn_suffix" {
  description = "ALB ARN suffix"
  type        = string
  default     = null
}

variable "response_time_threshold" {
  description = "Response time threshold in seconds"
  type        = number
  default     = 1
}

variable "error_5xx_threshold" {
  description = "Threshold for 5XX errors"
  type        = number
  default     = 10
}

# RDS Configuration
variable "rds_instance_id" {
  description = "RDS instance ID"
  type        = string
  default     = null
}

variable "rds_cpu_threshold" {
  description = "RDS CPU utilization threshold percentage"
  type        = number
  default     = 80
}

variable "rds_storage_threshold" {
  description = "RDS free storage threshold in bytes"
  type        = number
  default     = 10737418240 # 10 GB
}

# DocumentDB Configuration
variable "docdb_cluster_id" {
  description = "DocumentDB cluster ID"
  type        = string
  default     = null
}

variable "docdb_cpu_threshold" {
  description = "DocumentDB CPU utilization threshold percentage"
  type        = number
  default     = 80
}

# ElastiCache Configuration
variable "redis_replication_group_id" {
  description = "Redis replication group ID"
  type        = string
  default     = null
}

variable "redis_cpu_threshold" {
  description = "Redis CPU utilization threshold percentage"
  type        = number
  default     = 75
}

variable "redis_memory_threshold" {
  description = "Redis memory utilization threshold percentage"
  type        = number
  default     = 90
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
