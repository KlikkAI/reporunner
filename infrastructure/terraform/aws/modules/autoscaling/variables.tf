/**
 * Auto Scaling Module Variables
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

variable "min_capacity" {
  description = "Minimum number of tasks"
  type        = number
}

variable "max_capacity" {
  description = "Maximum number of tasks"
  type        = number
}

variable "cpu_target_value" {
  description = "Target CPU utilization percentage"
  type        = number
  default     = 70
}

variable "memory_target_value" {
  description = "Target memory utilization percentage"
  type        = number
  default     = 80
}

variable "request_count_target_value" {
  description = "Target request count per target"
  type        = number
  default     = 1000
}

variable "target_group_arn" {
  description = "Target group ARN (for request count scaling)"
  type        = string
  default     = null
}

variable "alb_arn" {
  description = "ALB ARN (for request count scaling)"
  type        = string
  default     = null
}

variable "enable_scheduled_scaling" {
  description = "Enable scheduled scaling"
  type        = bool
  default     = false
}

variable "scale_up_schedule" {
  description = "Cron expression for scaling up"
  type        = string
  default     = "cron(0 8 * * ? *)" # 8 AM UTC
}

variable "scale_down_schedule" {
  description = "Cron expression for scaling down"
  type        = string
  default     = "cron(0 20 * * ? *)" # 8 PM UTC
}

variable "scheduled_min_capacity" {
  description = "Minimum capacity during scheduled scale-up"
  type        = number
  default     = null
}

variable "tags" {
  description = "Tags to apply to resources"
  type        = map(string)
  default     = {}
}
